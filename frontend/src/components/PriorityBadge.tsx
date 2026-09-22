import type { TaskPriority } from '../types/taskAnalysis';

interface PriorityBadgeProps {
  priority: TaskPriority | null;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  if (!priority) {
    return <span className="value-empty">Not specified</span>;
  }

  return <span className={`priority-badge priority-${priority.toLowerCase()}`}>{priority}</span>;
}
