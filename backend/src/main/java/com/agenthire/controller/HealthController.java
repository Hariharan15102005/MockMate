package com.agenthire.controller;

import com.agenthire.dto.HealthResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@Tag(name = "Health", description = "System health check and diagnostic endpoints")
public class HealthController {

    @Value("${spring.application.name:agenthire-backend}")
    private String appName;

    @GetMapping("/health")
    @Operation(summary = "Backend health check", description = "Returns the operational status of the Spring Boot backend service")
    public ResponseEntity<HealthResponse> getHealth() {
        Map<String, Object> details = new HashMap<>();
        details.put("jvmVersion", System.getProperty("java.version"));
        details.put("os", System.getProperty("os.name"));
        details.put("memoryFreeBytes", Runtime.getRuntime().freeMemory());
        details.put("memoryTotalBytes", Runtime.getRuntime().totalMemory());

        HealthResponse response = HealthResponse.builder()
                .status("ONLINE")
                .service("AgentHire Backend")
                .version("1.0.0-PROD-READY")
                .environment("development")
                .timestamp(Instant.now())
                .details(details)
                .build();

        return ResponseEntity.ok(response);
    }
}
