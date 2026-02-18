package com.sapt.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SMSService {

    @Value("${twilio.account.sid}")
    private String accountSid;

    @Value("${twilio.auth.token}")
    private String authToken;

    @Value("${twilio.phone.number}")
    private String fromNumber;

    @PostConstruct
    public void init() {
        try {
            if (accountSid != null && !accountSid.isEmpty() && !"ACxxxx".equals(accountSid) && !"your_sid".equals(accountSid)) {
                Twilio.init(accountSid, authToken);
                System.out.println("Twilio initialized with Account SID: " + accountSid);
            } else {
                System.out.println("Twilio not initialized. Please provide real credentials in environment variables.");
            }
        } catch (Exception e) {
            System.err.println("Error initializing Twilio: " + e.getMessage());
        }
    }

    public void sendSMS(String mobileNumber, String messageText) {
        try {
            if ("ACxxxx".equals(accountSid) || "your_sid".equals(accountSid) || accountSid == null || accountSid.isEmpty()) {
                System.out.println("[MOCK SMS] To: " + mobileNumber + ", Msg: " + messageText);
                return;
            }

            // Twilio requires E.164 format (+CountryCodePhoneNumber)
            String formattedTo = mobileNumber.trim();
            if (!formattedTo.startsWith("+")) {
                formattedTo = "+91" + formattedTo; // Assuming Indian numbers by default as per user previous input
                System.out.println("Auto-formatted number to: " + formattedTo);
            }

            System.out.println("Attempting Twilio SMS: From=[" + fromNumber + "] To=[" + formattedTo + "]");
            System.out.println("Message: " + messageText);

            Message message = Message.creator(
                    new PhoneNumber(formattedTo),
                    new PhoneNumber(fromNumber),
                    messageText).create();

            System.out.println("Twilio SMS sent successfully to " + formattedTo + "! SID: " + message.getSid());
            System.out.println("Status: " + message.getStatus());
        } catch (Exception e) {
            System.err.println("CRITICAL: Failed to send Twilio SMS to " + mobileNumber);
            System.err.println("Error details: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
