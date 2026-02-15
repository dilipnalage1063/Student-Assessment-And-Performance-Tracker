package com.sapt.service;

import com.sapt.model.ActivityLog;
import com.sapt.repository.ActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class ActivityService {

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void logActivity(String title, String description, String status) {
        try {
            ActivityLog log = new ActivityLog(title, description, status);
            ActivityLog savedLog = activityLogRepository.save(log);
            
            // Broadcast to all subscribers on /topic/activities
            messagingTemplate.convertAndSend("/topic/activities", savedLog);
            
            System.out.println("Activity logged and broadcasted: " + title);
        } catch (Exception e) {
            System.err.println("Failed to log activity: " + e.getMessage());
        }
    }
}
