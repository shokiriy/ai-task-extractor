package com.shokirjon.aitaskextractor.task.entity;

import com.shokirjon.aitaskextractor.task.dto.ExtractedTask;
import com.shokirjon.aitaskextractor.task.model.TaskPriority;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "task_analysis")
public class TaskAnalysisEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "original_text", nullable = false, columnDefinition = "TEXT")
    private String originalText;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private TaskPriority priority;

    private String assignee;

    private LocalDateTime deadline;

    @Column(length = 50)
    private String category;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected TaskAnalysisEntity() {
    }

    private TaskAnalysisEntity(String originalText, ExtractedTask task) {
        this.originalText = originalText;
        this.title = task.title();
        this.description = task.description();
        this.priority = task.priority();
        this.assignee = task.assignee();
        this.deadline = task.deadline();
        this.category = task.category();
    }

    public static TaskAnalysisEntity from(String originalText, ExtractedTask task) {
        return new TaskAnalysisEntity(originalText, task);
    }

    @PrePersist
    void setCreationTime() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public String getOriginalText() {
        return originalText;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public TaskPriority getPriority() {
        return priority;
    }

    public String getAssignee() {
        return assignee;
    }

    public LocalDateTime getDeadline() {
        return deadline;
    }

    public String getCategory() {
        return category;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
