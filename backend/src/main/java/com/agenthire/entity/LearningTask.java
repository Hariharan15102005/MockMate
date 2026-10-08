package com.agenthire.entity;

import com.agenthire.entity.enums.Difficulty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "learning_tasks", indexes = {
        @Index(name = "idx_lt_difficulty", columnList = "difficulty")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearningTask extends BaseEntity {

    @NotBlank(message = "Title is required")
    @Size(max = 150)
    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @NotBlank(message = "Concept name is required")
    @Size(max = 150)
    @Column(name = "concept", nullable = false, length = 150)
    private String concept;

    @NotBlank(message = "Learning material is required")
    @Column(name = "learning_material", nullable = false, columnDefinition = "TEXT")
    private String learningMaterial;

    @NotNull(message = "Learning time is required")
    @Column(name = "learning_time_seconds", nullable = false)
    @Builder.Default
    private Integer learningTimeSeconds = 180;

    @NotNull(message = "Difficulty is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", nullable = false, length = 30)
    @Builder.Default
    private Difficulty difficulty = Difficulty.MEDIUM;
}
