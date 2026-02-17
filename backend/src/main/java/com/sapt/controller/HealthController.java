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

    @Autowired
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
        try {
            // Perform a lightweight DB query to keep Aiven active
            long userCount = userRepository.count();
            response.put("status", "UP");
            response.put("database", "CONNECTED");
            response.put("details", "Database reachable with " + userCount + " users.");
        } catch (Exception e) {
            response.put("status", "DOWN");
            response.put("database", "DISCONNECTED");
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
        }
        response.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }
}
