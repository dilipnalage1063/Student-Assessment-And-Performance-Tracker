package com.sapt.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NotificationDTO {
    private String studentName;
    private String studentEmail;
    private String parentEmail;
    private String parentMobile;
    private String subjectName;
    private String assessmentName;
    private String grade;
    private String trend;
    private double obtainedMarks;
    private double totalMarks;
}
