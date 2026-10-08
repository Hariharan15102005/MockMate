package com.agenthire.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.Instant;

@Entity
@Table(name = "report_deliveries", indexes = {
        @Index(name = "idx_rd_report", columnList = "report_id"),
        @Index(name = "idx_rd_sent_by", columnList = "sent_by_engineer_id"),
        @Index(name = "idx_rd_sent_to", columnList = "sent_to_instructor_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"report", "sentBy", "sentTo"})
public class ReportDelivery extends BaseEntity {

    @NotNull(message = "Report is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    private InterviewReport report;

    @NotNull(message = "Sender Interview Engineer is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sent_by_engineer_id", nullable = false)
    private InterviewEngineer sentBy;

    @NotNull(message = "Recipient Instructor is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sent_to_instructor_id", nullable = false)
    private Instructor sentTo;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Size(max = 30)
    @Column(name = "status", length = 30)
    @Builder.Default
    private String status = "DELIVERED";

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;
}
