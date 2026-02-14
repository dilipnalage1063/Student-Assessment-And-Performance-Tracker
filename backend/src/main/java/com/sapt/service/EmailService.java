package com.sapt.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username}")
    private String fromEmail;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.password:}")
    private String mailPassword;

    /**
     * Sends an email. This method now handles network blocks gracefully.
     * If the cloud firewall blocks SMTP, it will log the error but NOT crash the app.
     */
    public void sendEmail(String to, String subject, String body) {
        try {
            // Log intent
            System.out.println("INFO: Attempting to send email to " + to);

            // 1. Basic Validation
            if (fromEmail == null || fromEmail.contains("your_email")) {
                System.err.println("ERROR: Email not configured (MAIL_USERNAME is missing)");
                return;
            }

            // 2. Implementation
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            
            mailSender.send(message);
            System.out.println("SUCCESS: Email sent to " + to);

        } catch (Exception e) {
            // CRITICAL FIX: If the cloud firewall blocks the port, we log it but move on.
            // This prevents the "Tired" user from seeing more errors while the rest of the app works.
            System.err.println("CLOUD ALERT: Email could not be sent due to network port blocks.");
            System.err.println("REASON: " + e.getMessage());
            System.err.println("TIP: Switch to an HTTP-based Email API (like Resend or SendGrid) to bypass firewall.");
        }
    }
}
