package com.sapt.controller;

import com.sapt.model.Assessment;
import com.sapt.model.User;
import com.sapt.repository.AssessmentRepository;
import com.sapt.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assessments")
@CrossOrigin(origins = "*")
public class AssessmentController {

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.sapt.repository.SubjectRepository subjectRepository;

    @GetMapping
    public List<Assessment> getAllAssessments() {
        return assessmentRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> createAssessment(@RequestBody Assessment assessment) {
        if (assessment.getSubject() != null && assessment.getSubject().getId() != null) {
            com.sapt.model.Subject s = subjectRepository.findById(assessment.getSubject().getId()).orElse(null);
            if (s != null) assessment.setSubject(s);
        }
        if (assessment.getFaculty() != null && assessment.getFaculty().getId() != null) {
            User f = userRepository.findById(assessment.getFaculty().getId()).orElse(null);
            if (f != null) assessment.setFaculty(f);
        }
        Assessment saved = assessmentRepository.save(assessment);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/faculty/{facultyId}")
    public ResponseEntity<List<Assessment>> getAssessmentsByFaculty(@PathVariable Long facultyId) {
        User faculty = userRepository.findById(facultyId).orElse(null);
        if (faculty == null) {
            System.out.println("Faculty not found with ID: " + facultyId);
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(assessmentRepository.findByFaculty(faculty));
    }

    @GetMapping("/subject/{subjectId}")
    public ResponseEntity<List<Assessment>> getAssessmentsBySubject(@PathVariable Long subjectId) {
        com.sapt.model.Subject subject = subjectRepository.findById(subjectId).orElse(null);
        if (subject == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(assessmentRepository.findBySubject(subject));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAssessment(@PathVariable Long id) {
        return assessmentRepository.findById(id)
                .map(assessment -> {
                    assessmentRepository.delete(assessment);
                    return ResponseEntity.ok().build();
                }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Assessment> updateAssessment(@PathVariable Long id, @RequestBody Assessment assessmentDetails) {
        return assessmentRepository.findById(id)
                .map(assessment -> {
                    assessment.setName(assessmentDetails.getName());
                    assessment.setTotalMarks(assessmentDetails.getTotalMarks());
                    assessment.setDate(assessmentDetails.getDate());
                    assessment.setType(assessmentDetails.getType());
                    Assessment updatedAssessment = assessmentRepository.save(assessment);
                    return ResponseEntity.ok(updatedAssessment);
                }).orElse(ResponseEntity.notFound().build());
    }
}
