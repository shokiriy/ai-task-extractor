package com.shokirjon.aitaskextractor.task.dto;

import java.time.Instant;

public record TaskAnalysisResponse(
        Long id,
        String originalText,
        ExtractedTask task,
        Instant createdAt
) {
}
