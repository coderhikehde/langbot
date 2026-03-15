package com.chatbot.service;

import com.chatbot.nlp.NlpService;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.data.message.ChatMessage;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class LlmService {

    @Value("${llm.base-url}")
    private String baseUrl;

    @Value("${llm.api-key}")
    private String apiKey;

    @Value("${llm.model}")
    private String model;

    @Value("${llm.max-tokens:1024}")
    private int maxTokens;

    @Value("${llm.temperature:0.7}")
    private double temperature;

    private ChatLanguageModel chatModel;

    @PostConstruct
    public void init() {
        chatModel = OpenAiChatModel.builder()
            .baseUrl(baseUrl)
            .apiKey(apiKey)
            .modelName(model)
            .maxTokens(maxTokens)
            .temperature(temperature)
            .build();
        log.info("LLM initialized: {} via {}", model, baseUrl);
    }

    public String generateResponse(
            String userMessage,
            String languageCode,
            String intent,
            NlpService.ExtractedEntities entities,
            List<VectorMemoryService.SimilarMessage> memoryContext,
            List<com.chatbot.model.Message> recentHistory
    ) {
        try {
            List<ChatMessage> chatMessages = new ArrayList<>();
            chatMessages.add(SystemMessage.from(buildSystemPrompt(languageCode, intent, entities, memoryContext)));
            for (com.chatbot.model.Message msg : recentHistory) {
                if (msg.getRole() == com.chatbot.model.Message.Role.USER) {
                    chatMessages.add(UserMessage.from(msg.getContent()));
                } else {
                    chatMessages.add(dev.langchain4j.data.message.AiMessage.from(msg.getContent()));
                }
            }
            chatMessages.add(UserMessage.from(userMessage));
            var response = chatModel.generate(chatMessages);
            return response.content().text();
        } catch (Exception e) {
            log.error("LLM error: {}", e.getMessage());
            return getFallbackResponse(languageCode);
        }
    }

    private String buildSystemPrompt(
            String languageCode,
            String intent,
            NlpService.ExtractedEntities entities,
            List<VectorMemoryService.SimilarMessage> memoryContext
    ) {
        StringBuilder prompt = new StringBuilder();
        prompt.append(String.format("""
            You are a helpful, multilingual AI assistant.
            CRITICAL RULE: You MUST respond in the SAME language the user wrote in.
            Detected language: %s
            Detected intent: %s
            If the user writes in French, respond in French.
            If the user writes in Japanese, respond in Japanese.
            Never switch languages unless the user explicitly requests it.

            STRICT RULES ABOUT USER INFORMATION:
            - NEVER invent or assume the user's name, age, or any personal details.
            - NEVER greet the user by name unless their name appears in RELEVANT CONTEXT below.
            - NEVER say "you mentioned" unless it appears in RELEVANT CONTEXT below.
            - ONLY use personal info if it appears in RELEVANT CONTEXT FROM PAST CONVERSATIONS.
            - If you do not know something about the user, say so honestly.
            """, languageCode, intent));

        if (!entities.getDates().isEmpty() || !entities.getNumbers().isEmpty()) {
            prompt.append("VERIFIED ENTITIES FROM THIS MESSAGE:\n");
            if (!entities.getDates().isEmpty())
                prompt.append("  Dates: ").append(entities.getDates()).append("\n");
            if (!entities.getNumbers().isEmpty())
                prompt.append("  Numbers: ").append(entities.getNumbers()).append("\n");
            prompt.append("Use EXACTLY these values. Do not invent alternatives.\n\n");
        }

        if (!memoryContext.isEmpty()) {
            prompt.append("RELEVANT CONTEXT FROM PAST CONVERSATIONS:\n");
            for (VectorMemoryService.SimilarMessage similar : memoryContext) {
                prompt.append(String.format("  [%.0f%% match] %s: %s\n",
                    similar.similarity() * 100,
                    similar.message().getRole(),
                    similar.message().getContent()
                ));
            }
            prompt.append("\n");
        }

        prompt.append("Be concise, helpful, and accurate.");
        return prompt.toString();
    }

    private String getFallbackResponse(String languageCode) {
        return switch (languageCode) {
            case "fr" -> "Je suis desole, je rencontre des difficultes techniques. Veuillez reessayer.";
            case "es" -> "Lo siento, estoy experimentando dificultades tecnicas. Por favor, intentelo de nuevo.";
            case "de" -> "Es tut mir leid, ich habe technische Schwierigkeiten. Bitte versuchen Sie es erneut.";
            case "ja" -> "申し訳ありません、技術的な問題が発生しています。もう一度お試しください。";
            default  -> "I'm experiencing technical difficulties. Please try again.";
        };
    }
}
