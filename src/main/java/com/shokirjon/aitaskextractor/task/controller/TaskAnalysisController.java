package com.shokirjon.aitaskextractor.task.controller;

import com.shokirjon.aitaskextractor.task.dto.AnalyzeTaskRequest;
import com.shokirjon.aitaskextractor.task.dto.PagedTaskAnalysisResponse;
import com.shokirjon.aitaskextractor.task.dto.TaskAnalysisResponse;
import com.shokirjon.aitaskextractor.task.service.TaskAnalysisService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@Validated
@RestController
@RequestMapping("/api/v1/task-analyses")
public class TaskAnalysisController {

    private final TaskAnalysisService service;

    public TaskAnalysisController(TaskAnalysisService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<TaskAnalysisResponse> analyze(@Valid @RequestBody AnalyzeTaskRequest request) {
        TaskAnalysisResponse response = service.analyze(request.text());
        return ResponseEntity.created(URI.create("/api/v1/task-analyses/" + response.id())).body(response);
    }

    @GetMapping("/{id}")
    public TaskAnalysisResponse findById(@PathVariable @Min(1) long id) {
        return service.findById(id);
    }

    @GetMapping
    public PagedTaskAnalysisResponse findAll(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return service.findAll(page, size);
    }
}
