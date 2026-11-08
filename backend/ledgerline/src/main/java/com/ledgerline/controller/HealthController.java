package com.ledgerline.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@Tag(name = "Health Check", description = "Endpoints for application monitoring and health status")
public class HealthController {

    @GetMapping
    @Operation(summary = "Check API health status", description = "Returns the operational status of the LedgerLine service")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "LedgerLine Financial Core",
                "timestamp", LocalDateTime.now().toString(),
                "version", "1.0.0"
        ));
    }
}

