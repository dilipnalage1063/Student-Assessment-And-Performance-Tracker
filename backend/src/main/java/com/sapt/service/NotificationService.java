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

    @Async
    public void sendPerformanceNotifications(Mark mark) {
        try {
            User student = mark.getStudent();
            String subjectName = mark.getSubject().getName();
            String assessmentName = mark.getAssessment().getName();
            String grade = mark.getGrade();
            String trend = mark.getStatus();
            double obtained = mark.getObtainedMarks();
            double total = mark.getAssessment().getTotalMarks();

            String subject = "Performance Update: " + subjectName + " - " + assessmentName;

            // 1. Send Email to Student
            if (student.getEmail() != null && !student.getEmail().isEmpty()) {
                String studentHtml = generateHtmlTemplate(student.getName(), assessmentName, subjectName, obtained, total, grade, trend, "Student");
                emailService.sendEmail(student.getEmail(), subject, studentHtml);
            }

            // 2. Send Email to Parent
            if (student.getParentsEmail() != null && !student.getParentsEmail().isEmpty()) {
                String parentHtml = generateHtmlTemplate(student.getName(), assessmentName, subjectName, obtained, total, grade, trend, "Parent");
                emailService.sendEmail(student.getParentsEmail(), subject, parentHtml);
            }

            // 3. Send SMS to Parent
            String parentMobile = student.getParentsMobile();
            if (parentMobile != null && !parentMobile.trim().isEmpty()) {
                String smsContent = String.format(
                        "Tracker Alert: %s scored %.1f/%.1f in %s. Grade: %s. Trend: %s.",
                        student.getName(), obtained, total, assessmentName, grade, trend);
                smsService.sendSMS(parentMobile, smsContent);
            }

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
