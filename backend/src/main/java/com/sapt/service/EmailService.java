package com.sapt.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @org.springframework.beans.factory.annotation.Value("${resend.api.key}")
    private String resendApiKey;

    @org.springframework.beans.factory.annotation.Value("${resend.from.email}")
    private String fromEmail;

    private final java.net.http.HttpClient httpClient = java.net.http.HttpClient.newHttpClient();

    public void sendEmail(String to, String subject, String body) {
        try {
            System.out.println("INFO: Sending Firewall-Proof email to " + to + " via Resend API");

            String jsonPayload = String.format(
                "{\"from\": \"%s\", \"to\": \"%s\", \"subject\": \"%s\", \"html\": \"<p>%s</p>\"}",
                fromEmail, to, subject, body.replace("\n", "<br>")
            );

            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://api.resend.com/emails"))
                .header("Authorization", "Bearer " + resendApiKey)
                .header("Content-Type", "application/json")
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

            java.net.http.HttpResponse<String> response = httpClient.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                System.out.println("SUCCESS: Email delivered to Resend API. Status: " + response.statusCode());
            } else {
                System.err.println("API ERROR: Resend returned status " + response.statusCode() + " - " + response.body());
            }

        } catch (Exception e) {
            System.err.println("CRITICAL ERROR: Failed to send email via API. " + e.getMessage());
        }
    }
}
