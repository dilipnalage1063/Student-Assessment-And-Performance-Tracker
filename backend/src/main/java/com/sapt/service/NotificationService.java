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

            String messageBody = String.format(
                    "Dear %s,\n\n" +
                            "You have scored %.1f / %.1f in %s (%s).\n" +
                            "Grade: %s\n" +
                            "Performance Trend: %s\n\n",
                    student.getName(), obtained, total, assessmentName, subjectName, grade, trend);

            if ("Improved".equalsIgnoreCase(trend)) {
                messageBody += "Great job! Your performance has improved compared to the last assessment. Keep it up!\n";
            } else if ("Declined".equalsIgnoreCase(trend)) {
                messageBody += "Your performance has slightly declined. We encourage you to focus more on this subject.\n";
            } else {
                messageBody += "Your performance is consistent. Try to push for an improvement in the next assessment!\n";
            }

            messageBody += "\nBest Regards,\nStudent Performance Tracker System";

            // 1. Send Email to Student
            if (student.getEmail() != null && !student.getEmail().isEmpty()) {
                try {
                    System.out.println("Sending student email to: " + student.getEmail());
                    emailService.sendEmail(student.getEmail(), subject, messageBody);
                } catch (Exception e) {
                    System.err.println("Failed to send Student Email: " + e.getMessage());
                }
            }

            // 2. Send Email to Parent
            if (student.getParentsEmail() != null && !student.getParentsEmail().isEmpty()
                    && !student.getParentsEmail().equalsIgnoreCase(student.getEmail())) {
                try {
                    System.out.println("Sending parent email to: " + student.getParentsEmail());
                    String parentBody = String.format(
                            "Dear Parent,\n\n" +
                                    "This is an update regarding your child %s's performance.\n\n" +
                                    "Assessment: %s (%s)\n" +
                                    "Score: %.1f / %.1f\n" +
                                    "Grade: %s\n" +
                                    "Performance Trend: %s\n\n",
                            student.getName(), assessmentName, subjectName, obtained, total, grade, trend);

                    if ("Improved".equalsIgnoreCase(trend)) {
                        parentBody += "Your child's performance has improved. Keep encouraging them!\n";
                    } else if ("Declined".equalsIgnoreCase(trend)) {
                        parentBody += "There has been a slight decline in performance. A little extra focus might help.\n";
                    }

                    parentBody += "\nBest Regards,\nStudent Performance Tracker System";
                    emailService.sendEmail(student.getParentsEmail(), subject, parentBody);
                } catch (Exception e) {
                    System.err.println("Failed to send Parent Email: " + e.getMessage());
                }
            }

            // 3. Send SMS to Parent
            String parentMobile = student.getParentsMobile();
            if (parentMobile != null && !parentMobile.trim().isEmpty()) {
                try {
                    System.out.println("Processing SMS for parent: " + parentMobile);
                    String smsContent = String.format(
                            "Tracker Alert: %s scored %.1f/%.1f in %s. Grade: %s. Trend: %s.",
                            student.getName(), obtained, total, assessmentName, grade, trend);
                    smsService.sendSMS(parentMobile, smsContent);
                } catch (Exception e) {
                    System.err.println("Failed to send SMS: " + e.getMessage());
                }
            } else {
                System.out.println("No parent mobile found for student: " + student.getName());
            }

        } catch (Exception e) {
            System.err.println("CRITICAL: Error in NotificationService: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
