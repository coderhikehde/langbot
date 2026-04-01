package com.chatbot.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "https://langbot-six.vercel.app")
public class SimpleController {
    
    // Health check
    @GetMapping("/health")
    public Map<String, String> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "LangBot Running");
        return response;
    }
    
    // Register
    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody Map<String, String> user) {
        Map<String, Object> response = new HashMap<>();
        response.put("token", "fake-token-123");
        response.put("userId", 1);
        response.put("username", user.get("username"));
        response.put("status", "success");
        return response;
    }
    
    // Login
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> creds) {
        Map<String, Object> response = new HashMap<>();
        response.put("token", "fake-token-123");
        response.put("userId", 1);
        response.put("username", creds.get("username"));
        response.put("status", "success");
        return response;
    }
    
    // Send message
    @PostMapping("/chat")
    public Map<String, Object> sendMessage(@RequestBody Map<String, String> request) {
        String message = request.getOrDefault("message", "");
        Map<String, Object> response = new HashMap<>();
        response.put("reply", "🤖 " + message);
        response.put("status", "success");
        return response;
    }
    
    // Get conversations
    @GetMapping("/chat/conversations")
    public List<Map<String, Object>> getConversations() {
        List<Map<String, Object>> list = new ArrayList<>();
        Map<String, Object> conv = new HashMap<>();
        conv.put("id", 1);
        conv.put("title", "Chat");
        list.add(conv);
        return list;
    }
    
    // Get single conversation
    @GetMapping("/chat/conversations/{id}")
    public Map<String, Object> getConversation(@PathVariable Long id) {
        Map<String, Object> conv = new HashMap<>();
        conv.put("id", id);
        conv.put("title", "Chat");
        
        List<Map<String, Object>> messages = new ArrayList<>();
        Map<String, Object> msg = new HashMap<>();
        msg.put("role", "assistant");
        msg.put("content", "Hello! I'm LangBot. How can I help?");
        messages.add(msg);
        
        conv.put("messages", messages);
        return conv;
    }
    
    // Delete conversation
    @DeleteMapping("/chat/conversations/{id}")
    public Map<String, String> deleteConversation(@PathVariable Long id) {
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        return response;
    }
    
    // User profile
    @GetMapping("/user/profile")
    public Map<String, Object> getProfile() {
        Map<String, Object> profile = new HashMap<>();
        profile.put("username", "user");
        profile.put("email", "user@email.com");
        profile.put("stats", Map.of("messages", 0, "languages", 0));
        return profile;
    }
}
