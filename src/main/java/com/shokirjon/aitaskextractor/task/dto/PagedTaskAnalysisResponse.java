package com.shokirjon.aitaskextractor.task.dto;

import java.util.List;

public record PagedTaskAnalysisResponse(
        List<TaskAnalysisResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last
) {
}
