CREATE TABLE task_analysis (
    id BIGINT NOT NULL AUTO_INCREMENT,
    original_text TEXT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) NULL,
    assignee VARCHAR(255) NULL,
    deadline DATETIME(6) NULL,
    category VARCHAR(50) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_task_analysis_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
