package com.shokirjon.aitaskextractor.task.repository;

import com.shokirjon.aitaskextractor.task.entity.TaskAnalysisEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskAnalysisRepository extends JpaRepository<TaskAnalysisEntity, Long> {
}
