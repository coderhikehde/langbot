package com.chatbot.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "https://langbot-six.vercel.app", allowCredentials = "true", allowedHeaders = "*")
public class SimpleController {
    
    @GetMapping("/health")
    public Map<String, String> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "LangBot Running");
        return response;
    }
    
    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody Map<String, String> user) {
        Map<String, Object> response = new HashMap<>();
        response.put("token", "fake-jwt-token-123");
        response.put("userId", 1);
        response.put("username", user.get("username"));
        response.put("status", "success");
        return response;
    }
    
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> creds) {
        Map<String, Object> response = new HashMap<>();
        response.put("token", "fake-jwt-token-123");
        response.put("userId", 1);
        response.put("username", creds.get("username"));
        response.put("status", "success");
        return response;
    }
}
