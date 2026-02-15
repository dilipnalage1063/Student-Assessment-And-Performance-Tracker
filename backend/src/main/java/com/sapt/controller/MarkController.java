package com.sapt.controller;

import com.sapt.model.Mark;
import com.sapt.model.User;
import com.sapt.repository.UserRepository;
import com.sapt.service.MarkService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

import java.util.List;

@RestController
@RequestMapping("/api/marks")
@CrossOrigin(origins = "*")
public class MarkController {

    @Autowired
    private MarkService markService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.sapt.repository.ActivityLogRepository activityLogRepository;

    private void logActivity(String title, String desc, String status) {
        try {
            activityLogRepository.save(new com.sapt.model.ActivityLog(title, desc, status));
        } catch (Exception e) {
            System.err.println("Failed to log activity: " + e.getMessage());
        }
    }

    @PostMapping
    public Mark enterMark(@RequestBody Mark mark) {
        Mark savedMark = markService.saveMark(mark);
        logActivity("Marks Entered", "Marks for " + savedMark.getStudent().getName() + " added", "success");
        return savedMark;
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Mark>> getMarksByStudent(@PathVariable Long studentId) {
        User student = userRepository.findById(studentId).orElse(null);
        if (student == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(markService.getMarksByStudent(student));
    }

    @GetMapping("/faculty/{facultyId}")
    public ResponseEntity<List<Mark>> getMarksByFaculty(@PathVariable Long facultyId) {
        User faculty = userRepository.findById(facultyId).orElse(null);
        if (faculty == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(markService.getMarksByFaculty(faculty));
    }

    @PostMapping("/bulk-upload")
    public ResponseEntity<Map<String, Object>> bulkUpload(@RequestParam("file") MultipartFile file,
            @RequestParam("assessmentId") Long assessmentId,
            @RequestParam("subjectId") Long subjectId) {
        Map<String, Object> response = new HashMap<>();
        int successCount = 0;
        int failureCount = 0;
        List<String> errors = new ArrayList<>();

        try (BufferedReader fileReader = new BufferedReader(new InputStreamReader(file.getInputStream(), "UTF-8"));
                CSVParser csvParser = new CSVParser(fileReader,
                        CSVFormat.DEFAULT.withFirstRecordAsHeader().withIgnoreHeaderCase().withTrim())) {

            Iterable<CSVRecord> csvRecords = csvParser.getRecords();

            for (CSVRecord csvRecord : csvRecords) {
                try {
                    String username = csvRecord.get("username");
                    Double obtainedMarks = Double.parseDouble(csvRecord.get("obtainedMarks"));

                    User student = userRepository.findByUsername(username).orElse(null);
                    if (student == null) {
                        errors.add("Student not found for username: " + username);
                        failureCount++;
                        continue;
                    }

                    Mark mark = new Mark();
                    mark.setObtainedMarks(obtainedMarks);
                    mark.setStudent(student);

                    com.sapt.model.Subject subject = new com.sapt.model.Subject();
                    subject.setId(subjectId);
                    mark.setSubject(subject);

                    com.sapt.model.Assessment assessment = new com.sapt.model.Assessment();
                    assessment.setId(assessmentId);
                    mark.setAssessment(assessment);

                    markService.saveMark(mark);
                    successCount++;
                } catch (Exception e) {
                    errors.add("Error processing row " + csvRecord.getRecordNumber() + ": " + e.getMessage());
                    failureCount++;
                }
            }

            response.put("success", true);
            response.put("successCount", successCount);
            response.put("failureCount", failureCount);
            response.put("errors", errors);
            logActivity("Bulk Marks Upload", "Imported " + successCount + " mark records", "success");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to parse CSV file: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
