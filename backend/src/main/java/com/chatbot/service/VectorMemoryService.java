package com.chatbot.service;

import com.chatbot.model.Message;
import com.chatbot.repository.MessageRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.allminilml6v2.AllMiniLmL6V2EmbeddingModel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
@Slf4j
public class VectorMemoryService {

    private final MessageRepository messageRepository;
    private final ObjectMapper objectMapper;
    private final EmbeddingModel embeddingModel;

    public VectorMemoryService(MessageRepository messageRepository, ObjectMapper objectMapper) {
        this.messageRepository = messageRepository;
        this.objectMapper = objectMapper;
        this.embeddingModel = new AllMiniLmL6V2EmbeddingModel();
        log.info("Vector embedding model initialized (AllMiniLmL6V2, 384 dimensions)");
    }

    public void embedAndStore(Message message) {
        try {
            Embedding embedding = embeddingModel.embed(message.getContent()).content();
            float[] vector = embedding.vector();
            String embeddingJson = objectMapper.writeValueAsString(vector);
            message.setEmbeddingJson(embeddingJson);
            messageRepository.save(message);
        } catch (Exception e) {
            log.error("Failed to embed message {}: {}", message.getId(), e.getMessage());
        }
    }

    public List<SimilarMessage> findSimilarMessages(
            String query, String conversationId, int topK, double threshold) {

        Embedding queryEmbedding = embeddingModel.embed(query).content();
        float[] queryVector = queryEmbedding.vector();

        List<Message> candidates = messageRepository.findByEmbeddingJsonNotNull();

        if (conversationId != null) {
            candidates = candidates.stream()
                .filter(m -> m.getConversation().getId().equals(conversationId))
                .toList();
        }

        List<SimilarMessage> results = new ArrayList<>();
        for (Message candidate : candidates) {
            try {
                float[] candidateVector = deserializeVector(candidate.getEmbeddingJson());
                double similarity = cosineSimilarity(queryVector, candidateVector);
                if (similarity >= threshold) {
                    results.add(new SimilarMessage(candidate, similarity));
                }
            } catch (Exception e) {
                log.warn("Could not score message {}: {}", candidate.getId(), e.getMessage());
            }
        }

        results.sort(Comparator.comparingDouble(SimilarMessage::similarity).reversed());
        return results.stream().limit(topK).toList();
    }

    private double cosineSimilarity(float[] a, float[] b) {
        double dot = 0, normA = 0, normB = 0;
        for (int i = 0; i < a.length; i++) {
            dot   += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        if (normA == 0 || normB == 0) return 0.0;
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    private float[] deserializeVector(String json) throws Exception {
        List<Double> list = objectMapper.readValue(json, new TypeReference<>() {});
        float[] arr = new float[list.size()];
        for (int i = 0; i < list.size(); i++) arr[i] = list.get(i).floatValue();
        return arr;
    }

    public record SimilarMessage(Message message, double similarity) {}
}
