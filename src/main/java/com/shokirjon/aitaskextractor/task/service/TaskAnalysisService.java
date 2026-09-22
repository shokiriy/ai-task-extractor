package com.shokirjon.aitaskextractor.task.service;

import com.shokirjon.aitaskextractor.common.exception.ResourceNotFoundException;
import com.shokirjon.aitaskextractor.task.dto.ExtractedTask;
import com.shokirjon.aitaskextractor.task.dto.PagedTaskAnalysisResponse;
import com.shokirjon.aitaskextractor.task.dto.TaskAnalysisResponse;
import com.shokirjon.aitaskextractor.task.entity.TaskAnalysisEntity;
import com.shokirjon.aitaskextractor.task.repository.TaskAnalysisRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class TaskAnalysisService {

    private final AiTaskExtractorService aiTaskExtractorService;
    private final TaskAnalysisRepository repository;

    public TaskAnalysisService(AiTaskExtractorService aiTaskExtractorService, TaskAnalysisRepository repository) {
        this.aiTaskExtractorService = aiTaskExtractorService;
        this.repository = repository;
    }

    public TaskAnalysisResponse analyze(String originalText) {
        ExtractedTask extractedTask = aiTaskExtractorService.extract(originalText);
        TaskAnalysisEntity saved = repository.save(TaskAnalysisEntity.from(originalText, extractedTask));
        return toResponse(saved);
    }

    public TaskAnalysisResponse findById(long id) {
        return repository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Task analysis %d was not found".formatted(id)));
    }

    public PagedTaskAnalysisResponse findAll(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<TaskAnalysisResponse> result = repository.findAll(pageRequest).map(this::toResponse);

        return new PagedTaskAnalysisResponse(
                result.getContent(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.isLast()
        );
    }

    private TaskAnalysisResponse toResponse(TaskAnalysisEntity entity) {
        ExtractedTask task = new ExtractedTask(
                entity.getTitle(),
                entity.getDescription(),
                entity.getPriority(),
                entity.getAssignee(),
                entity.getDeadline(),
                entity.getCategory()
        );

        return new TaskAnalysisResponse(entity.getId(), entity.getOriginalText(), task, entity.getCreatedAt());
    }
}
