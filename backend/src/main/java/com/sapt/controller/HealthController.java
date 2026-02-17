package com.sapt.controller;

import com.sapt.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class HealthController {

    // Using Autowired(required=false) to prevent startup crash if DB beans fail
    @Autowired(required = false)
    private UserRepository userRepository;

    @GetMapping("/")
    public ResponseEntity<?> root() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("application", "Student Assessment and Performance Tracker");
        response.put("message", "Backend is running successfully on Railway!");
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("apiEndpoints", new String[]{
            "/api/auth/login",
            "/api/users",
            "/api/subjects",
            "/api/assessments",
            "/api/marks"
        });
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("note", "Basic health check passed. Checking database...");
        
        if (userRepository != null) {
            try {
                long userCount = userRepository.count();
                response.put("database", "CONNECTED");
                response.put("userCount", userCount);
            } catch (Exception e) {
                response.put("database", "DOWN");
                response.put("warning", "Database connection failed. Please check Aiven Console.");
                response.put("errorDetails", e.getMessage());
            }
        } else {
            response.put("database", "UNKNOWN");
            response.put("warning", "UserRepository bean not found. This usually happens if the DB connection failed during startup.");
        }
        
        return ResponseEntity.ok(response);
    }
}
