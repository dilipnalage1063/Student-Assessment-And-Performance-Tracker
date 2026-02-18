package com.sapt.service;

import com.sapt.model.Mark;
import com.sapt.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    @Autowired
    private EmailService emailService;

    @Autowired
    private SMSService smsService;

    @Async("taskExecutor")
    public void sendPerformanceNotifications(com.sapt.dto.NotificationDTO dto) {
        long startTime = System.currentTimeMillis();
        try {
            System.out.println("Async Notification Task Started for: " + dto.getStudentName() + " at " + java.time.LocalDateTime.now());
            
            String subject = "Performance Update: " + dto.getSubjectName() + " - " + dto.getAssessmentName();

            // 1. Send Email to Student
            if (dto.getStudentEmail() != null && !dto.getStudentEmail().isEmpty()) {
                String studentHtml = generateHtmlTemplate(dto.getStudentName(), dto.getAssessmentName(), dto.getSubjectName(), dto.getObtainedMarks(), dto.getTotalMarks(), dto.getGrade(), dto.getTrend(), "Student");
                emailService.sendEmail(dto.getStudentEmail(), subject, studentHtml);
            }

            // 2. Send Email to Parent
            if (dto.getParentEmail() != null && !dto.getParentEmail().isEmpty()) {
                String parentHtml = generateHtmlTemplate(dto.getStudentName(), dto.getAssessmentName(), dto.getSubjectName(), dto.getObtainedMarks(), dto.getTotalMarks(), dto.getGrade(), dto.getTrend(), "Parent");
                emailService.sendEmail(dto.getParentEmail(), subject, parentHtml);
            }

            // 3. Send SMS to Parent
            String parentMobile = dto.getParentMobile();
            if (parentMobile != null && !parentMobile.trim().isEmpty()) {
                String smsContent = String.format(
                        "Tracker Alert: %s scored %.1f/%.1f in %s. Grade: %s. Trend: %s.",
                        dto.getStudentName(), dto.getObtainedMarks(), dto.getTotalMarks(), dto.getAssessmentName(), dto.getGrade(), dto.getTrend());
                smsService.sendSMS(parentMobile, smsContent);
            }
            
            long duration = System.currentTimeMillis() - startTime;
            System.out.println("Async Notification Task Completed in " + duration + "ms.");

        } catch (Exception e) {
            System.err.println("CRITICAL: Error in NotificationService: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String generateHtmlTemplate(String name, String assessment, String subject, double obtained, double total, String grade, String trend, String role) {
        String greeting = role.equals("Parent") ? "Dear Parent," : "Dear " + name + ",";
        String trendColor = trend.equalsIgnoreCase("Improved") ? "#22c55e" : (trend.equalsIgnoreCase("Declined") ? "#ef4444" : "#3b82f6");
        
        return "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;'>" +
               "  <div style='background: #1e293b; color: white; padding: 20px; text-align: center;'>" +
               "    <h1 style='margin: 0; font-size: 24px;'>Performance Update</h1>" +
               "  </div>" +
               "  <div style='padding: 30px; color: #334155; line-height: 1.6;'>" +
               "    <p style='font-size: 18px;'>" + greeting + "</p>" +
               "    <p>This is a formal update regarding the performance in <strong>" + subject + "</strong>.</p>" +
               "    <div style='background: #f8fafc; border-radius: 6px; padding: 20px; margin: 25px 0; border-left: 4px solid #3b82f6;'>" +
               "      <table style='width: 100%; border-collapse: collapse;'>" +
               "        <tr><td style='padding: 8px 0; color: #64748b;'>Assessment</td><td style='text-align: right; font-weight: bold;'>" + assessment + "</td></tr>" +
               "        <tr><td style='padding: 8px 0; color: #64748b;'>Score</td><td style='text-align: right; font-weight: bold; font-size: 20px; color: #1e293b;'>" + obtained + " / " + total + "</td></tr>" +
               "        <tr><td style='padding: 8px 0; color: #64748b;'>Grade</td><td style='text-align: right; font-weight: bold; color: #3b82f6;'>" + grade + "</td></tr>" +
               "        <tr><td style='padding: 8px 0; color: #64748b;'>Trend</td><td style='text-align: right; font-weight: bold; color: " + trendColor + ";'>" + trend + "</td></tr>" +
               "      </table>" +
               "    </div>" +
               "    <p>" + (trend.equalsIgnoreCase("Improved") ? "Exceptional progress! Keep up the great work." : "Consistency is key. Focus on the upcoming topics for further growth.") + "</p>" +
               "    <hr style='border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;'>" +
               "    <p style='font-size: 12px; color: #94a3b8; text-align: center;'>Sent via Student Assessment & Performance Tracker System</p>" +
               "  </div>" +
               "</div>";
    }
}
