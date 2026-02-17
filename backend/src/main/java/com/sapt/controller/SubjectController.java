package com.sapt.controller;

import com.sapt.model.Subject;
import com.sapt.model.User;
import com.sapt.repository.SubjectRepository;
import com.sapt.repository.UserRepository;
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
import java.util.Optional;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@CrossOrigin(origins = "*")
public class SubjectController {

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.sapt.service.ActivityService activityService;

    private void logActivity(String title, String desc, String status) {
        activityService.logActivity(title, desc, status);
    }

    @GetMapping
    public List<Subject> getAllSubjects() {
        return subjectRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Subject> getSubjectById(@PathVariable Long id) {
        return subjectRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Subject createSubject(@RequestBody Subject subject) {
        Subject savedSubject = subjectRepository.save(subject);
        logActivity("New Subject Added", savedSubject.getName() + " (" + savedSubject.getCode() + ") added", "success");
        return savedSubject;
    }

    @PutMapping("/{id}")
    public ResponseEntity<Subject> updateSubject(@PathVariable Long id, @RequestBody Subject subjectDetails) {
        Subject subject = subjectRepository.findById(id).orElse(null);
        if (subject == null)
            return ResponseEntity.notFound().build();

        subject.setName(subjectDetails.getName());
        subject.setCode(subjectDetails.getCode());
        subject.setYear(subjectDetails.getYear());
        subject.setFaculty(subjectDetails.getFaculty());

        Subject saved = subjectRepository.save(subject);
        logActivity("Subject Updated", saved.getName() + " modified", "success");
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubject(@PathVariable Long id) {
        Subject subject = subjectRepository.findById(id).orElse(null);
        if (subject == null)
            return ResponseEntity.notFound().build();

        subjectRepository.delete(subject);
        logActivity("Subject Deleted", subject.getName() + " removed", "warning");
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/faculty/{facultyId}")
    public ResponseEntity<List<Subject>> getSubjectsByFaculty(@PathVariable Long facultyId) {
        User faculty = userRepository.findById(facultyId).orElse(null);
        if (faculty == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(subjectRepository.findByFaculty(faculty));
    }

    @PostMapping("/{id}/students/{studentId}")
    public ResponseEntity<Subject> enrollStudent(@PathVariable Long id, @PathVariable Long studentId) {
        Subject subject = subjectRepository.findById(id).orElse(null);
        User student = userRepository.findById(studentId).orElse(null);

        if (subject == null || student == null) {
            return ResponseEntity.notFound().build();
        }

        subject.getStudents().add(student);
        return ResponseEntity.ok(subjectRepository.save(subject));
    }

    @DeleteMapping("/{id}/students/{studentId}")
    public ResponseEntity<Subject> unenrollStudent(@PathVariable Long id, @PathVariable Long studentId) {
        Subject subject = subjectRepository.findById(id).orElse(null);
        User student = userRepository.findById(studentId).orElse(null);

        if (subject == null || student == null) {
            return ResponseEntity.notFound().build();
        }

        subject.getStudents().remove(student);
        return ResponseEntity.ok(subjectRepository.save(subject));
    }

    @GetMapping("/{id}/students")
    public ResponseEntity<java.util.Set<User>> getSubjectStudents(@PathVariable Long id) {
        Subject subject = subjectRepository.findById(id).orElse(null);
        if (subject == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(subject.getStudents());
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Subject>> getSubjectsByStudent(@PathVariable Long studentId) {
        User student = userRepository.findById(studentId).orElse(null);
        if (student == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(subjectRepository.findByStudentsContains(student));
    }

    @PostMapping("/{id}/enroll-bulk")
    public ResponseEntity<Map<String, Object>> enrollBulk(@PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        int successCount = 0;
        int failureCount = 0;
        List<String> errors = new ArrayList<>();

        Subject subject = subjectRepository.findById(id).orElse(null);
        if (subject == null) {
            response.put("success", false);
            response.put("message", "Subject not found");
            return ResponseEntity.notFound().build();
        }

        try (BufferedReader fileReader = new BufferedReader(new InputStreamReader(file.getInputStream(), "UTF-8"));
                CSVParser csvParser = new CSVParser(fileReader,
                        CSVFormat.DEFAULT.withFirstRecordAsHeader().withIgnoreHeaderCase().withTrim())) {

            Iterable<CSVRecord> csvRecords = csvParser.getRecords();

            for (CSVRecord csvRecord : csvRecords) {
                try {
                    String username = csvRecord.get("username");
                    Optional<User> studentOpt = userRepository.findByUsername(username);

                    if (studentOpt.isPresent()) {
                        User student = studentOpt.get();
                        if ("Student".equalsIgnoreCase(student.getRole())) {
                            subject.getStudents().add(student);
                            successCount++;
                        } else {
                            errors.add("User " + username + " is not a student");
                            failureCount++;
                        }
                    } else {
                        errors.add("Student not found: " + username);
                        failureCount++;
                    }
                } catch (Exception e) {
                    errors.add("Error processing row " + csvRecord.getRecordNumber() + ": " + e.getMessage());
                    failureCount++;
                }
            }

            subjectRepository.save(subject);

            response.put("success", true);
            response.put("successCount", successCount);
            response.put("failureCount", failureCount);
            response.put("errors", errors);
            logActivity("Bulk Student Enrollment", "Enrolled " + successCount + " students in " + subject.getName(), "success");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to parse CSV file: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
