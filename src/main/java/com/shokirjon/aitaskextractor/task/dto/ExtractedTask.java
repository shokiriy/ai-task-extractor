package com.shokirjon.aitaskextractor.task.dto;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import com.shokirjon.aitaskextractor.task.model.TaskPriority;

import java.time.LocalDateTime;

public record ExtractedTask(
        @JsonPropertyDescription("A concise action-oriented task title")
        String title,

        @JsonPropertyDescription("A clear description preserving useful details from the input")
        String description,

        @JsonPropertyDescription("LOW, MEDIUM, HIGH, CRITICAL, or null when no priority signal exists")
        TaskPriority priority,

        @JsonPropertyDescription("The explicitly named assignee, or null when absent")
        String assignee,

        @JsonPropertyDescription("Resolved deadline as an ISO-8601 local date-time, or null when absent")
        LocalDateTime deadline,

        @JsonPropertyDescription("DEVELOPMENT, DEVOPS, MEETING, PERSONAL, BUG, DOCUMENTATION, OTHER, or null")
        String category
) {
}
