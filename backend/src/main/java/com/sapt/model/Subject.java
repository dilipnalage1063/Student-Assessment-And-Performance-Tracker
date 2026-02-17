package com.sapt.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "subjects")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Subject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String code;
    private String year;

    @ManyToOne
    @JoinColumn(name = "faculty_id")
    private User faculty; // The teacher assigned to this subject

    @ManyToMany
    @JoinTable(name = "subject_students", joinColumns = @JoinColumn(name = "subject_id"), inverseJoinColumns = @JoinColumn(name = "student_id"))
    private java.util.Set<User> students = new java.util.HashSet<>();
}
