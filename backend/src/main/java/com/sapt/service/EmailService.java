package com.sapt.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender javaMailSender;

    @Value("${spring.mail.username:}")
    private String gmailUsername;

    @Value("${spring.mail.password:}")
    private String gmailPassword;

    @Value("${resend.api.key:}")
    private String resendApiKey;

    @Value("${resend.from.email:onboarding@resend.dev}")
    private String resendFromEmail;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    public void sendEmail(String to, String subject, String body) {
        // 1. Try Gmail (Local / SMTP) - Priority if configured
        if (gmailPassword != null && !gmailPassword.isEmpty() && !"YOUR_GMAIL_APP_PASSWORD_HERE".equals(gmailPassword)) {
            sendViaGmail(to, subject, body);
            return;
        }

        // 2. Try Resend (Production / HTTP) - Fallback or Primary if Gmail missing
        if (resendApiKey != null && !resendApiKey.isEmpty() && resendApiKey.startsWith("re_")) {
            sendViaResend(to, subject, body);
            return;
        }

        // 3. Mock Mode (Fallback)
        sendViaMock(to, subject, body);
    }

    private void sendViaGmail(String to, String subject, String body) {
        try {
            System.out.println("INFO: Sending email via Gmail SMTP to " + to);
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setFrom(gmailUsername);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true); // true = HTML
            javaMailSender.send(message);
            System.out.println("SUCCESS: Email sent via Gmail.");
        } catch (Exception e) {
            System.err.println("ERROR: Gmail send failed. " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void sendViaResend(String to, String subject, String body) {
        try {
            System.out.println("INFO: Sending email via Resend API to " + to);
            
            String jsonPayload = String.format(
                "{\"from\": \"%s\", \"to\": \"%s\", \"subject\": \"%s\", \"html\": \"%s\"}",
                resendFromEmail, to, subject, body.replace("\"", "\\\"").replace("\n", "")
            );

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.resend.com/emails"))
                .header("Authorization", "Bearer " + resendApiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                 System.out.println("SUCCESS: Email sent via Resend API.");
            } else {
                 System.err.println("ERROR: Resend API failed: " + response.body());
            }

        } catch (Exception e) {
            System.err.println("ERROR: Resend send failed. " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void sendViaMock(String to, String subject, String body) {
         System.out.println("==================== [MOCK EMAIL SERVICE] ====================");
         System.out.println("To: " + to);
         System.out.println("Subject: " + subject);
         System.out.println("Body: " + body);
         System.out.println("NOTE: No valid email credentials found (Gmail or Resend).");
         System.out.println("==============================================================");
    }
}
