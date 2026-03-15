package com.chatbot.controller;

import com.chatbot.model.User;
import com.chatbot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return userRepository.findById(userId)
            .map(user -> {
                Map<String, Object> profile = new HashMap<>();
                profile.put("id", user.getId());
                profile.put("username", user.getUsername());
                profile.put("email", user.getEmail());
                profile.put("bio", user.getBio());
                profile.put("avatarUrl", user.getAvatarUrl());
                profile.put("preferredLanguage", user.getPreferredLanguage());
                profile.put("createdAt", user.getCreatedAt());
                return ResponseEntity.ok(profile);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(Authentication auth, @RequestBody Map<String, String> body) {
        String userId = (String) auth.getPrincipal();
        return userRepository.findById(userId)
            .map(user -> {
                if (body.containsKey("bio")) user.setBio(body.get("bio"));
                if (body.containsKey("avatarUrl")) user.setAvatarUrl(body.get("avatarUrl"));
                if (body.containsKey("preferredLanguage")) user.setPreferredLanguage(body.get("preferredLanguage"));
                userRepository.save(user);
                return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        long totalConversations = userRepository.countConversationsByUserId(userId);
        long totalMessages = userRepository.countMessagesByUserId(userId);
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalConversations", totalConversations);
        stats.put("totalMessages", totalMessages);
        return ResponseEntity.ok(stats);
    }
}
