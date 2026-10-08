package com.mediorder.system_build_functions.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class RealtimeService {

    private static final Logger log = LoggerFactory.getLogger(RealtimeService.class);
    private static final Long SSE_TIMEOUT = 30 * 60 * 1000L; // 30 minutes

    // Channel Name -> List of Emitters
    private final Map<String, CopyOnWriteArrayList<SseEmitter>> channels = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String channel) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        channels.computeIfAbsent(channel, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(channel, emitter));
        emitter.onTimeout(() -> {
            emitter.complete();
            removeEmitter(channel, emitter);
        });
        emitter.onError(e -> removeEmitter(channel, emitter));

        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data(Map.of("status", "connected", "channel", channel)));
        } catch (IOException e) {
            removeEmitter(channel, emitter);
        }

        return emitter;
    }

    public void publish(String channel, String eventName, Object data) {
        CopyOnWriteArrayList<SseEmitter> emitters = channels.get(channel);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
            } catch (Exception ex) {
                removeEmitter(channel, emitter);
            }
        }
    }

    private void removeEmitter(String channel, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> list = channels.get(channel);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) {
                channels.remove(channel);
            }
        }
    }
}
