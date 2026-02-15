package com.sapt.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "activity_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;
    private String status; // success, warning, error
    private LocalDateTime timestamp;

    public ActivityLog(String title, String description, String status) {
        this.title = title;
        this.description = description;
        this.status = status;
        this.timestamp = LocalDateTime.now();
    }
}
