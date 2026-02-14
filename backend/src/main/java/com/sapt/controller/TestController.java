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
        try {
            System.out.println("Test Email Request received for: " + to);
            emailService.sendEmail(to, "SAPT Test Email", "This is a test email from SAPT System.");
            return ResponseEntity.ok("Email Sent Successfully to " + to);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Email Failed: " + e.getMessage());
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
