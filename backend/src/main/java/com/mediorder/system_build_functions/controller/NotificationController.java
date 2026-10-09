package com.mediorder.system_build_functions.controller;

import com.mediorder.system_build_functions.dto.ApiResponse;
import com.mediorder.system_build_functions.model.Notification;
import com.mediorder.system_build_functions.model.User;
import com.mediorder.system_build_functions.repository.NotificationRepository;
import com.mediorder.system_build_functions.security.CurrentUserProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * In-app notification centre for every logged-in user (customers and staff).
 * Notifications are written by the modules (deliveries, prescriptions...); this only reads them.
 */
@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private static final int MAX_ITEMS = 50;

    private final NotificationRepository notificationRepository;
    private final CurrentUserProvider currentUserProvider;

    public NotificationController(NotificationRepository notificationRepository, CurrentUserProvider currentUserProvider) {
        this.notificationRepository = notificationRepository;
        this.currentUserProvider = currentUserProvider;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Map<String, Object>>> myNotifications() {
        User me = currentUserProvider.requireCurrentUser();
        List<Map<String, Object>> items = notificationRepository.findByRecipientIdOrderBySentAtDesc(me.getId()).stream()
                .limit(MAX_ITEMS)
                .map(NotificationController::toView)
                .toList();
        long unread = notificationRepository.countByRecipientIdAndIsReadFalse(me.getId());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("unreadCount", unread);
        body.put("items", items);
        return ResponseEntity.ok(ApiResponse.success("Notifications", body));
    }

    @GetMapping("/unread-count")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Long>> unreadCount() {
        User me = currentUserProvider.requireCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("Unread notifications",
                notificationRepository.countByRecipientIdAndIsReadFalse(me.getId())));
    }

    @PutMapping("/{id}/read")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> markRead(@PathVariable Long id) {
        User me = currentUserProvider.requireCurrentUser();
        Notification notification = notificationRepository.findById(id)
                .filter(n -> n.getRecipient() != null && me.getId().equals(n.getRecipient().getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        notification.setIsRead(true);
        notificationRepository.save(notification);
        return ResponseEntity.ok(ApiResponse.success("Marked as read", null));
    }

    @PutMapping("/read-all")
    @Transactional
    public ResponseEntity<ApiResponse<Integer>> markAllRead() {
        User me = currentUserProvider.requireCurrentUser();
        List<Notification> unread = notificationRepository.findByRecipientIdAndIsReadFalse(me.getId());
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", unread.size()));
    }

    private static Map<String, Object> toView(Notification n) {
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("id", n.getId());
        view.put("title", n.getTitle());
        view.put("message", n.getMessage());
        view.put("channel", n.getChannel() != null ? n.getChannel().name() : null);
        view.put("read", Boolean.TRUE.equals(n.getIsRead()));
        view.put("sentAt", n.getSentAt());
        return view;
    }
}
