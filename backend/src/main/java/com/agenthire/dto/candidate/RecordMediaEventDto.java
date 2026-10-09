package com.agenthire.dto.candidate;

import com.agenthire.entity.enums.MediaEventType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecordMediaEventDto {
    @NotNull(message = "Event type is required")
    private MediaEventType eventType;
    private Integer durationSeconds;
    private Map<String, Object> metadata;
}
