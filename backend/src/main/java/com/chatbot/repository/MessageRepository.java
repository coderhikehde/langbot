package com.chatbot.repository;

import com.chatbot.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, String> {
    List<Message> findByConversationIdOrderByCreatedAtAsc(String conversationId);

    @Query("SELECT m FROM Message m WHERE m.conversation.id = :convId ORDER BY m.createdAt DESC LIMIT :limit")
    List<Message> findRecentMessages(@Param("convId") String conversationId, @Param("limit") int limit);

    List<Message> findByEmbeddingJsonNotNull();
}
