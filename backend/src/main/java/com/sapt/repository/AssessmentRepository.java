package com.sapt.repository;

import com.sapt.model.Assessment;
import com.sapt.model.Subject;
import com.sapt.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, Long> {
    List<Assessment> findBySubject(Subject subject);

    List<Assessment> findByFaculty(User faculty);
}
