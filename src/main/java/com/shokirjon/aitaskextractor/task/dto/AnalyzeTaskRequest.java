package com.shokirjon.aitaskextractor.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AnalyzeTaskRequest(
        @NotNull(message = "text is required")
        @NotBlank(message = "text must not be blank")
        @Size(max = 5_000, message = "text must not exceed 5000 characters")
        String text
) {
}
