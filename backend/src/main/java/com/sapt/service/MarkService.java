package com.sapt.service;

import com.sapt.model.Assessment;
import com.sapt.model.Mark;
import com.sapt.model.Subject;
import com.sapt.model.User;
import com.sapt.repository.MarkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class MarkService {

    @Autowired
    private MarkRepository markRepository;

    @Autowired
    private com.sapt.repository.AssessmentRepository assessmentRepository;

    @Autowired
    private com.sapt.repository.UserRepository userRepository;

    @Autowired
    private com.sapt.repository.SubjectRepository subjectRepository;

    @Autowired
    private NotificationService notificationService;

    public Mark saveMark(Mark mark) {
        // Fetch full entities to ensure we have all data (totalMarks, etc.)
        Assessment assessment = assessmentRepository.findById(mark.getAssessment().getId()).orElse(null);
        User student = userRepository.findById(mark.getStudent().getId()).orElse(null);
        Subject subject = subjectRepository.findById(mark.getSubject().getId()).orElse(null);

        if (assessment == null || student == null || subject == null) {
            throw new RuntimeException("Invalid Assessment, Student, or Subject ID");
        }

        mark.setAssessment(assessment);
        mark.setStudent(student);
        mark.setSubject(subject);

        // 1. Calculate Grade automatically
        mark.setGrade(calculateGrade(mark.getObtainedMarks(), assessment.getTotalMarks()));

        // 2. Calculate Performance Status automatically (using percentages)
        mark.setStatus(
                calculateStatus(student, subject, mark.getObtainedMarks(), assessment.getTotalMarks(), mark.getId()));

        Mark savedMark = markRepository.save(mark);

        // 3. Send Notifications (Async)
        notificationService.sendPerformanceNotifications(savedMark);

        return savedMark;
    }

    public List<Mark> getMarksByStudent(User student) {
        return markRepository.findByStudent(student);
    }

    public List<Mark> getMarksByFaculty(User faculty) {
        return markRepository.findBySubjectFaculty(faculty);
    }
}
