package com.agenthire.entity;

import com.agenthire.entity.enums.Difficulty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
@Table(name = "coding_tasks", indexes = {
        @Index(name = "idx_coding_task_difficulty", columnList = "difficulty"),
        @Index(name = "idx_coding_task_language", columnList = "language")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "createdBy")
public class CodingTask extends BaseEntity {

    @NotBlank(message = "Task title is required")
    @Size(max = 150)
    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @NotBlank(message = "Task description is required")
    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Difficulty is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", nullable = false, length = 30)
    @Builder.Default
    private Difficulty difficulty = Difficulty.MEDIUM;

    @Size(max = 50)
    @Column(name = "language", length = 50)
    private String language;

    @Column(name = "starter_code", columnDefinition = "TEXT")
    private String starterCode;

    @Column(name = "constraints_text", columnDefinition = "TEXT")
    private String constraints;

    @Column(name = "examples_json", columnDefinition = "TEXT")
    private String examplesJson;

    @Column(name = "time_limit_seconds")
    private Integer timeLimitSeconds;

    @Column(name = "test_configuration_json", columnDefinition = "TEXT")
    private String testConfigurationJson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
}
