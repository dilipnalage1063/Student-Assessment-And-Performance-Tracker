package com.sapt.controller;

import com.sapt.model.ActivityLog;
import com.sapt.repository.ActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/activities")
@CrossOrigin(origins = "*")
public class ActivityLogController {

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @GetMapping
    public List<ActivityLog> getRecentActivities() {
        return activityLogRepository.findRecentActivities(PageRequest.of(0, 10));
    }
}
