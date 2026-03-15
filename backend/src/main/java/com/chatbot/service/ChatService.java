package com.chatbot.service;

import com.chatbot.model.Conversation;
import com.chatbot.model.Message;
import com.chatbot.nlp.NlpService;
import com.chatbot.repository.ConversationRepository;
import com.chatbot.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final NlpService nlpService;
    private final LlmService llmService;
    private final VectorMemoryService vectorMemoryService;

    @Value("${vector.similarity-threshold:0.75}")
    private double similarityThreshold;

    @Value("${vector.max-results:5}")
    private int maxMemoryResults;

    private static final int RECENT_HISTORY_LIMIT = 10;

    public ChatResponse processMessage(String userId, String conversationId, String userInput) {
        log.info("Processing message from user {} (conv={})", userId, conversationId);

        Conversation conversation = getOrCreateConversation(userId, conversationId, userInput);

        NlpService.LanguageDetectionResult langResult = nlpService.detectLanguage(userInput);
        String languageCode = langResult.languageCode();

        String intent = nlpService.classifyIntent(userInput, languageCode);

        NlpService.ExtractedEntities entities = nlpService.extractEntities(userInput);

        Message userMessage = saveMessage(conversation, Message.Role.USER, userInput, languageCode, intent);

        vectorMemoryService.embedAndStore(userMessage);

        List<VectorMemoryService.SimilarMessage> memoryContext = vectorMemoryService.findSimilarMessages(
            userInput, conversation.getId(), maxMemoryResults, similarityThreshold
        );

        List<Message> recentHistory = messageRepository
            .findRecentMessages(conversation.getId(), RECENT_HISTORY_LIMIT)
            .stream()
            .filter(m -> !m.getId().equals(userMessage.getId()))
            .sorted((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()))
            .toList();

        String responseText = llmService.generateResponse(
            userInput, languageCode, intent, entities, memoryContext, recentHistory
        );

        Message botMessage = saveMessage(conversation, Message.Role.ASSISTANT, responseText, languageCode, "response");
        vectorMemoryService.embedAndStore(botMessage);

        return new ChatResponse(
            conversation.getId(), responseText, languageCode, intent, memoryContext.size()
        );
    }

    private Conversation getOrCreateConversation(String userId, String conversationId, String firstMessage) {
        if (conversationId != null) {
            return conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found: " + conversationId));
        }
        Conversation newConv = new Conversation();
        newConv.setUserId(userId);
        newConv.setTitle(firstMessage.length() > 60 ? firstMessage.substring(0, 60) + "..." : firstMessage);
        return conversationRepository.save(newConv);
    }

    private Message saveMessage(Conversation conversation, Message.Role role,
                                 String content, String language, String intent) {
        Message message = new Message();
        message.setConversation(conversation);
        message.setRole(role);
        message.setContent(content);
        message.setDetectedLanguage(language);
        message.setDetectedIntent(intent);
        return messageRepository.save(message);
    }

    public record ChatResponse(
        String conversationId,
        String responseText,
        String detectedLanguage,
        String detectedIntent,
        int memoriesUsed
    ) {}
}
