package com.sapt.controller;

import com.sapt.service.EmailService;
import com.sapt.service.SMSService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@RequestMapping("/api/test")
@CrossOrigin(origins = "*")
public class TestController {

    @Autowired
    private EmailService emailService;

    @Autowired
    private SMSService smsService;

    @GetMapping("/email")
    public ResponseEntity<String> testEmail(@RequestParam String to) {
        StringBuilder status = new StringBuilder();
        try {
            status.append("Checking DNS for smtp.gmail.com...\n");
            java.net.InetAddress address = java.net.InetAddress.getByName("smtp.gmail.com");
            status.append("Resolved to: ").append(address.getHostAddress()).append("\n");
            
            status.append("Testing TCP Connection to port 587...\n");
            try (java.net.Socket socket = new java.net.Socket()) {
                socket.connect(new java.net.InetSocketAddress("smtp.gmail.com", 587), 10000);
                status.append("TCP Connection Successful!\n");
            } catch (Exception e) {
                status.append("TCP Connection FAILED: ").append(e.getMessage()).append("\n");
            }

            System.out.println("Test Email Request received for: " + to);
            emailService.sendEmail(to, "SAPT Test Email", "This is a test email from SAPT System.");
            return ResponseEntity.ok(status.toString() + "Email Sent Successfully to " + to);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(status.toString() + "Email Failed: " + e.getMessage() + "\n\nStack Trace:\n" + e.toString());
        }
    }

    @GetMapping("/sms")
    public ResponseEntity<String> testSMS(@RequestParam String to) {
        try {
            System.out.println("Test SMS Request received for: " + to);
            smsService.sendSMS(to, "This is a test SMS from SAPT System.");
            return ResponseEntity.ok("SMS Sent Successfully to " + to);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("SMS Failed: " + e.getMessage() + "\n\nStack Trace:\n" + e.toString());
        }
    }
}
