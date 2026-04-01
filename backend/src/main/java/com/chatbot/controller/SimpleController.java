package com.chatbot.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import com.chatbot.service.GroqService;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "https://langbot-six.vercel.app")
public class SimpleController {
    
    @Autowired
    private GroqService groqService;
    
    @GetMapping("/health")
    public Map<String, String> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "LangBot Running with Groq AI");
        return response;
    }
    
    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody Map<String, String> user) {
        Map<String, Object> response = new HashMap<>();
        response.put("token", "fake-token-123");
        response.put("userId", 1);
        response.put("username", user.get("username"));
        response.put("status", "success");
        return response;
    }
    
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> creds) {
        Map<String, Object> response = new HashMap<>();
        response.put("token", "fake-token-123");
        response.put("userId", 1);
        response.put("username", creds.get("username"));
        response.put("status", "success");
        return response;
    }
    
    @PostMapping("/chat")
    public Map<String, Object> sendMessage(@RequestBody Map<String, String> request) {
        String message = request.getOrDefault("message", "");
        String language = request.getOrDefault("language", "auto");
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String aiResponse = groqService.getAIResponse(message, language);
            response.put("reply", aiResponse);
            response.put("status", "success");
            response.put("language", detectLanguage(message));
        } catch (Exception e) {
            response.put("reply", "🤖 I'm here to help! What would you like to know?");
            response.put("status", "success");
        }
        
        return response;
    }
    
    private String detectLanguage(String text) {
        for (char c : text.toCharArray()) {
            if (c >= 0x4E00 && c <= 0x9FFF) return "Chinese";
            if (c >= 0x0900 && c <= 0x097F) return "Hindi";
            if (c >= 0x0600 && c <= 0x06FF) return "Arabic";
        }
        return "English";
    }
    
    @GetMapping("/chat/conversations")
    public List<Map<String, Object>> getConversations() {
        List<Map<String, Object>> list = new ArrayList<>();
        Map<String, Object> conv = new HashMap<>();
        conv.put("id", 1);
        conv.put("title", "Chat with LangBot");
        list.add(conv);
        return list;
    }
}
