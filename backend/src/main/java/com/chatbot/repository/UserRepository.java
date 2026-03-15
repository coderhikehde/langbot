package com.chatbot.repository;

import com.chatbot.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    @Query("SELECT COUNT(c) FROM Conversation c WHERE c.userId = :userId")
    long countConversationsByUserId(@Param("userId") String userId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.userId = :userId")
    long countMessagesByUserId(@Param("userId") String userId);
}
