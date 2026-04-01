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
        response.put("message", "LangBot AI Ready");
        return response;
    }
    
    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody Map<String, String> user) {
        Map<String, Object> response = new HashMap<>();
        response.put("token", UUID.randomUUID().toString());
        response.put("userId", 1);
        response.put("username", user.get("username"));
        response.put("status", "success");
        return response;
    }
    
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> creds) {
        Map<String, Object> response = new HashMap<>();
        response.put("token", UUID.randomUUID().toString());
        response.put("userId", 1);
        response.put("username", creds.get("username"));
        response.put("status", "success");
        return response;
    }
    
    @PostMapping("/chat")
    public Map<String, Object> chat(@RequestBody Map<String, String> request) {
        String message = request.getOrDefault("message", "");
        Map<String, Object> response = new HashMap<>();
        
        try {
            String aiResponse = groqService.getAIResponse(message, "auto");
            response.put("reply", aiResponse);
            response.put("status", "success");
        } catch (Exception e) {
            response.put("reply", getSmartResponse(message));
            response.put("status", "success");
        }
        
        return response;
    }
    
    private String getSmartResponse(String message) {
        String msg = message.toLowerCase();
        if (msg.contains("hello") || msg.contains("hi")) return "👋 Hello! I'm LangBot, your multilingual AI assistant. How can I help you today?";
        if (msg.contains("how are you")) return "🤖 I'm doing great! Thanks for asking. Ready to help you in any language!";
        if (msg.contains("what can you do")) return "🌍 I can understand and respond in 100+ languages, help with questions, have conversations, and assist with tasks!";
        if (msg.contains("thank")) return "🎉 You're welcome! Happy to help!";
        return "💬 " + message + " - I understand! What else would you like to know?";
    }
    
    @GetMapping("/chat/conversations")
    public List<Map<String, Object>> getConversations() {
        List<Map<String, Object>> conversations = new ArrayList<>();
        Map<String, Object> conv = new HashMap<>();
        conv.put("id", 1);
        conv.put("title", "Current Chat");
        conv.put("updatedAt", new Date());
        conversations.add(conv);
        return conversations;
    }
    
    @GetMapping("/user/profile")
    public Map<String, Object> getProfile() {
        Map<String, Object> profile = new HashMap<>();
        profile.put("username", "LangBot User");
        profile.put("email", "user@langbot.ai");
        profile.put("joined", new Date());
        profile.put("languages_supported", 100);
        return profile;
    }
}
