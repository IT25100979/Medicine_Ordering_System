package com.mediorder.system_build_functions.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "support_replies")
public class SupportReply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "support_message_id", nullable = false)
    @JsonIgnore
    private SupportMessage supportMessage;

    @Column(name = "sender_id")
    private Long senderId;

    @Column(name = "sender_email", length = 150)
    private String senderEmail;

    @Column(name = "sender_role", length = 50)
    private String senderRole; // CUSTOMER, ADMIN, SUPPORT

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public SupportReply() {}

    public SupportReply(Long id, SupportMessage supportMessage, Long senderId, String senderEmail,
                        String senderRole, String message, LocalDateTime createdAt) {
        this.id = id;
        this.supportMessage = supportMessage;
        this.senderId = senderId;
        this.senderEmail = senderEmail;
        this.senderRole = senderRole;
        this.message = message;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public SupportMessage getSupportMessage() { return supportMessage; }
    public void setSupportMessage(SupportMessage supportMessage) { this.supportMessage = supportMessage; }
    public Long getSenderId() { return senderId; }
    public void setSenderId(Long senderId) { this.senderId = senderId; }
    public String getSenderEmail() { return senderEmail; }
    public void setSenderEmail(String senderEmail) { this.senderEmail = senderEmail; }
    public String getSenderRole() { return senderRole; }
    public void setSenderRole(String senderRole) { this.senderRole = senderRole; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static SupportReplyBuilder builder() {
        return new SupportReplyBuilder();
    }

    public static class SupportReplyBuilder {
        private Long id;
        private SupportMessage supportMessage;
        private Long senderId;
        private String senderEmail;
        private String senderRole;
        private String message;
        private LocalDateTime createdAt;

        public SupportReplyBuilder id(Long id) { this.id = id; return this; }
        public SupportReplyBuilder supportMessage(SupportMessage supportMessage) { this.supportMessage = supportMessage; return this; }
        public SupportReplyBuilder senderId(Long senderId) { this.senderId = senderId; return this; }
        public SupportReplyBuilder senderEmail(String senderEmail) { this.senderEmail = senderEmail; return this; }
        public SupportReplyBuilder senderRole(String senderRole) { this.senderRole = senderRole; return this; }
        public SupportReplyBuilder message(String message) { this.message = message; return this; }
        public SupportReplyBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public SupportReply build() {
            return new SupportReply(id, supportMessage, senderId, senderEmail, senderRole, message, createdAt);
        }
    }
}
