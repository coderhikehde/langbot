package com.chatbot.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api")
public class SimpleController {
    
    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "LangBot Running");
        return response;
    }
    
    @PostMapping("/chat")
    public Map<String, Object> chat(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        response.put("reply", "Hello! You said: " + request.get("message"));
        return response;
    }
    
    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody Map<String, String> user) {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "User registered: " + user.get("username"));
        response.put("status", "success");
        return response;
    }
    
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> creds) {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Login successful");
        response.put("token", "dummy-token");
        response.put("status", "success");
        return response;
    }
}
