package com.agenthire.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
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
@Table(name = "interview_engineers", indexes = {
        @Index(name = "idx_ie_employee_code", columnList = "employee_code", unique = true),
        @Index(name = "idx_ie_user_id", columnList = "user_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "user")
public class InterviewEngineer extends BaseEntity {

    @NotNull(message = "Associated user is required")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @NotBlank(message = "Employee code is required")
    @Size(max = 50)
    @Column(name = "employee_code", nullable = false, unique = true, length = 50)
    private String employeeCode;

    @Size(max = 100)
    @Column(name = "department", length = 100)
    private String department;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private Boolean active = true;
}
