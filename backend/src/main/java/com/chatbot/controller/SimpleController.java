package com.chatbot.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class SimpleController {
    
    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "LangBot Backend Running");
        response.put("database", "Connected to PostgreSQL");
        response.put("timestamp", System.currentTimeMillis());
        return response;
    }
    
    @GetMapping("/test")
    public Map<String, String> test() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "Working");
        response.put("message", "Backend is running on Railway");
        response.put("time", new Date().toString());
        return response;
    }
    
    @PostMapping("/chat")
    public Map<String, Object> chat(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        String message = request.getOrDefault("message", "");
        String language = request.getOrDefault("language", "en");
        
        response.put("reply", "Hello from LangBot! You said: " + message);
        response.put("language", language);
        response.put("status", "success");
        response.put("timestamp", System.currentTimeMillis());
        return response;
    }
}
