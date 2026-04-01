package com.chatbot.service;

import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;

@Service
public class GroqService {
    
    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    private String apiKey;
    
    public GroqService() {
        // Get API key from environment variable
        this.apiKey = System.getenv("GROQ_API_KEY");
        if (this.apiKey == null) {
            System.out.println("⚠️ GROQ_API_KEY not set. Using mock responses.");
        }
    }
    
    public String getAIResponse(String message, String language) throws Exception {
        // If no API key, return mock multilingual response
        if (apiKey == null || apiKey.isEmpty()) {
            return getMockResponse(message, language);
        }
        
        try {
            HttpClient client = HttpClient.newHttpClient();
            ObjectMapper mapper = new ObjectMapper();
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "llama3-70b-8192");
            requestBody.put("messages", List.of(
                Map.of("role", "system", "content", "You are LangBot, a multilingual AI assistant. Respond in the same language as the user's message."),
                Map.of("role", "user", "content", message)
            ));
            requestBody.put("temperature", 0.7);
            
            String jsonBody = mapper.writeValueAsString(requestBody);
            
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GROQ_API_URL))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();
            
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            Map<String, Object> responseMap = mapper.readValue(response.body(), Map.class);
            
            Map<String, Object> choice = ((List<Map<String, Object>>) responseMap.get("choices")).get(0);
            Map<String, Object> messageObj = (Map<String, Object>) choice.get("message");
            return (String) messageObj.get("content");
            
        } catch (Exception e) {
            return getMockResponse(message, language);
        }
    }
    
    private String getMockResponse(String message, String language) {
        // Detect language from message
        String detectedLang = detectLanguage(message);
        
        Map<String, String> responses = new HashMap<>();
        responses.put("en", "🌍 Hello! I'm LangBot, a language-agnostic AI. I can understand and respond in any language!");
        responses.put("es", "🌍 ¡Hola! Soy LangBot, una IA independiente del idioma. ¡Puedo entender y responder en cualquier idioma!");
        responses.put("fr", "🌍 Bonjour! Je suis LangBot, une IA indépendante de la langue. Je peux comprendre et répondre dans n'importe quelle langue!");
        responses.put("de", "🌍 Hallo! Ich bin LangBot, eine sprachunabhängige KI. Ich kann in jeder Sprache verstehen und antworten!");
        responses.put("hi", "🌍 नमस्ते! मैं LangBot हूं, एक भाषा-अज्ञेय AI। मैं किसी भी भाषा में समझ और जवाब दे सकता हूं!");
        responses.put("zh", "🌍 你好！我是LangBot，一个语言无关的AI。我可以理解并用任何语言回应！");
        responses.put("ar", "🌍 مرحبا! أنا LangBot، ذكاء اصطناعي مستقل عن اللغة. يمكنني الفهم والرد بأي لغة!");
        responses.put("ja", "🌍 こんにちは！私はLangBot、言語に依存しないAIです。どんな言語でも理解し応答できます！");
        
        return responses.getOrDefault(detectedLang, responses.get("en")) + " Your message: \"" + message + "\"";
    }
    
    private String detectLanguage(String text) {
        // Simple language detection based on Unicode ranges
        for (char c : text.toCharArray()) {
            if (c >= 0x4E00 && c <= 0x9FFF) return "zh"; // Chinese
            if (c >= 0x0900 && c <= 0x097F) return "hi"; // Hindi
            if (c >= 0x0600 && c <= 0x06FF) return "ar"; // Arabic
            if (c >= 0x3040 && c <= 0x309F) return "ja"; // Japanese
        }
        
        // Simple word detection
        String lower = text.toLowerCase();
        if (lower.contains("hola") || lower.contains("como")) return "es";
        if (lower.contains("bonjour") || lower.contains("merci")) return "fr";
        if (lower.contains("hallo") || lower.contains("guten")) return "de";
        
        return "en"; // Default to English
    }
}
