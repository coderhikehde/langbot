package com.chatbot.controller;

import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class SimpleController {
    
    @GetMapping("/health")
    public Map<String, String> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        return response;
    }
    
    @PostMapping("/register")
    public Map<String, String> register(@RequestBody Map<String, String> user) {
        Map<String, String> response = new HashMap<>();
        response.put("message", "User " + user.get("username") + " created");
        response.put("status", "success");
        return response;
    }
    
    @PostMapping("/login")
    public Map<String, String> login(@RequestBody Map<String, String> creds) {
        Map<String, String> response = new HashMap<>();
        response.put("token", "fake-jwt-token");
        response.put("status", "success");
        return response;
    }
}
