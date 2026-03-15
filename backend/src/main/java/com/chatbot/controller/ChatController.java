package com.chatbot.controller;

import com.chatbot.service.ChatService;
import com.chatbot.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final ConversationRepository conversationRepository;

    @PostMapping("/message")
    public ResponseEntity<?> sendMessage(Authentication auth, @RequestBody Map<String, String> body) {
        String userId = (String) auth.getPrincipal();
        String message = body.get("message");
        String conversationId = body.get("conversationId");
        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message cannot be empty"));
        }
        return ResponseEntity.ok(chatService.processMessage(userId, conversationId, message));
    }

    @GetMapping("/conversations")
    public ResponseEntity<?> getConversations(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId));
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<?> getConversation(Authentication auth, @PathVariable String id) {
        String userId = (String) auth.getPrincipal();
        return conversationRepository.findById(id)
            .filter(c -> c.getUserId().equals(userId))
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<?> deleteConversation(Authentication auth, @PathVariable String id) {
        String userId = (String) auth.getPrincipal();
        return conversationRepository.findById(id)
            .filter(c -> c.getUserId().equals(userId))
            .map(c -> {
                conversationRepository.delete(c);
                return ResponseEntity.ok(Map.of("message", "Deleted"));
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
