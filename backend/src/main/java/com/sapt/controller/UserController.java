package com.sapt.controller;

import com.sapt.model.User;
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
import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*") // Adjust port if Vite is running elsewhere
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.sapt.repository.SubjectRepository subjectRepository;

    @Autowired
    private com.sapt.repository.MarkRepository markRepository;

    @Autowired
    private com.sapt.service.ActivityService activityService;

    private void logActivity(String title, String desc, String status) {
        activityService.logActivity(title, desc, status);
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/role/{role}")
    public List<User> getUsersByRole(@PathVariable String role) {
        return userRepository.findByRole(role);
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        User savedUser = userRepository.save(user);
        logActivity("New User Created", savedUser.getName() + " (" + savedUser.getRole() + ") added", "success");
        return savedUser;
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        User user = userRepository.findById(id)
                .orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        user.setName(userDetails.getName());
        user.setRole(userDetails.getRole());
        user.setDepartment(userDetails.getDepartment());
        user.setEmail(userDetails.getEmail());
        user.setUsername(userDetails.getUsername());
        user.setParentsEmail(userDetails.getParentsEmail());
        user.setParentsMobile(userDetails.getParentsMobile());

        if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
            user.setPassword(userDetails.getPassword());
        }

        User updatedUser = userRepository.save(user);
        logActivity("User Updated", updatedUser.getName() + " modified", "success");
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        // 1. Unassign as Faculty from Subjects
        List<com.sapt.model.Subject> facultySubjects = subjectRepository.findByFaculty(user);
        for (com.sapt.model.Subject sub : facultySubjects) {
            sub.setFaculty(null);
            subjectRepository.save(sub);
        }

        // 2. Remove as Student from Subjects
        List<com.sapt.model.Subject> studentSubjects = subjectRepository.findByStudentsContains(user);
        for (com.sapt.model.Subject sub : studentSubjects) {
            sub.getStudents().remove(user);
            subjectRepository.save(sub);
        }

        // 3. Delete Marks
        List<com.sapt.model.Mark> studentMarks = markRepository.findByStudent(user);
        markRepository.deleteAll(studentMarks);

        userRepository.delete(user);
        logActivity("User Deleted", user.getName() + " removed", "warning");
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bulk-upload")
    public ResponseEntity<Map<String, Object>> bulkUpload(@RequestParam("file") MultipartFile file) {
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
                    User user = new User();
                    user.setName(csvRecord.get("name"));
                    user.setRole(csvRecord.get("role"));
                    user.setDepartment(csvRecord.get("department"));
                    user.setEmail(csvRecord.get("email"));
                    user.setParentsEmail(csvRecord.get("parentsEmail"));
                    user.setParentsMobile(csvRecord.get("parentsMobile"));
                    user.setUsername(csvRecord.get("username"));
                    user.setPassword(csvRecord.get("password"));

                    userRepository.save(user);
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
            logActivity("Bulk User Upload", "Imported " + successCount + " users", "success");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to parse CSV file: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
