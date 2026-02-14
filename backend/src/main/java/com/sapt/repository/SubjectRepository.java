package com.sapt.repository;

import com.sapt.model.Subject;
import com.sapt.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {
    List<Subject> findByFaculty(User faculty);

    List<Subject> findByStudentsContains(User student);
}
