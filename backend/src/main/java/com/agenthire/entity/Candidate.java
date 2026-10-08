package com.agenthire.entity;

import com.agenthire.entity.enums.CandidateStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "candidates", indexes = {
        @Index(name = "idx_candidate_email", columnList = "email"),
        @Index(name = "idx_candidate_status", columnList = "status"),
        @Index(name = "idx_candidate_applied_role", columnList = "applied_role"),
        @Index(name = "idx_candidate_application_id", columnList = "application_id", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "user")
public class Candidate extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @NotBlank(message = "Candidate full name is required")
    @Size(max = 100)
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    @Size(max = 150)
    @Column(name = "email", nullable = false, length = 150)
    private String email;

    @Size(max = 30)
    @Column(name = "phone", length = 30)
    private String phone;

    @Size(max = 100)
    @Column(name = "location", length = 100)
    private String location;

    @Size(max = 150)
    @Column(name = "college", length = 150)
    private String college;

    @Size(max = 100)
    @Column(name = "degree", length = 100)
    private String degree;

    @Size(max = 100)
    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "graduation_year")
    private Integer graduationYear;

    @DecimalMin(value = "0.0", message = "CGPA cannot be negative")
    @DecimalMax(value = "10.0", message = "CGPA maximum is 10.0")
    @Column(name = "cgpa")
    private Double cgpa;

    @Size(max = 50)
    @Column(name = "experience_level", length = 50)
    private String experienceLevel;

    @NotBlank(message = "Applied role is required")
    @Size(max = 100)
    @Column(name = "applied_role", nullable = false, length = 100)
    private String appliedRole;

    @Size(max = 100)
    @Column(name = "application_id", unique = true, length = 100)
    private String applicationId;

    @Size(max = 50)
    @Column(name = "source", length = 50)
    private String source;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    @Builder.Default
    private CandidateStatus status = CandidateStatus.PENDING_VERIFICATION;

    @Column(name = "engineer_notes", columnDefinition = "TEXT")
    private String engineerNotes;
}
