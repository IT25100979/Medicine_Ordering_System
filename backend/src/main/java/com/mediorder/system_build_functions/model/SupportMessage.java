package com.mediorder.system_build_functions.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "support_messages", indexes = {
    @Index(name = "idx_support_user", columnList = "user_id"),
    @Index(name = "idx_support_status", columnList = "status")
})
public class SupportMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 200)
    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(nullable = false, length = 30)
    private String status = "OPEN"; // OPEN, REPLIED, CLOSED

    @Column(length = 50)
    private String category = "GENERAL"; // ORDER, PRESCRIPTION, DELIVERY, BILLING, GENERAL

    @OneToMany(mappedBy = "supportMessage", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<SupportReply> replies = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public SupportMessage() {}

    public SupportMessage(Long id, User user, String subject, String body, String status,
                          String category, List<SupportReply> replies, LocalDateTime createdAt,
                          LocalDateTime updatedAt) {
        this.id = id;
        this.user = user;
        this.subject = subject;
        this.body = body;
        this.status = status != null ? status : "OPEN";
        this.category = category != null ? category : "GENERAL";
        this.replies = replies != null ? replies : new ArrayList<>();
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "OPEN";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public List<SupportReply> getReplies() { return replies; }
    public void setReplies(List<SupportReply> replies) { this.replies = replies; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static SupportMessageBuilder builder() {
        return new SupportMessageBuilder();
    }

    public static class SupportMessageBuilder {
        private Long id;
        private User user;
        private String subject;
        private String body;
        private String status = "OPEN";
        private String category = "GENERAL";
        private List<SupportReply> replies = new ArrayList<>();
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public SupportMessageBuilder id(Long id) { this.id = id; return this; }
        public SupportMessageBuilder user(User user) { this.user = user; return this; }
        public SupportMessageBuilder subject(String subject) { this.subject = subject; return this; }
        public SupportMessageBuilder body(String body) { this.body = body; return this; }
        public SupportMessageBuilder status(String status) { this.status = status; return this; }
        public SupportMessageBuilder category(String category) { this.category = category; return this; }
        public SupportMessageBuilder replies(List<SupportReply> replies) { this.replies = replies; return this; }
        public SupportMessageBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public SupportMessageBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public SupportMessage build() {
            return new SupportMessage(id, user, subject, body, status, category, replies, createdAt, updatedAt);
        }
    }
}
