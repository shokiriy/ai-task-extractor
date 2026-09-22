import { PriorityBadge } from './PriorityBadge';
import type { TaskAnalysisResponse } from '../types/taskAnalysis';
import { displayValue, formatDeadline, formatTimestamp } from '../utils/date';

interface TaskAnalysisCardProps {
  analysis: TaskAnalysisResponse | null;
  isLoadingDetails: boolean;
}

export function TaskAnalysisCard({ analysis, isLoadingDetails }: TaskAnalysisCardProps) {
  if (!analysis) {
    return (
      <section className="surface-card analysis-card analysis-empty" aria-labelledby="analysis-title">
        <div className="empty-result-icon" aria-hidden="true">
          {`{ }`}
        </div>
        <span className="section-eyebrow">Structured data out</span>
        <h2 id="analysis-title">AI Analysis</h2>
        <p>Your structured task will appear here after the AI finishes analyzing the text.</p>
      </section>
    );
  }

  return (
    <section className="surface-card analysis-card" aria-labelledby="analysis-title" aria-busy={isLoadingDetails}>
      <div className="analysis-header">
        <div>
          <span className="section-eyebrow">Structured data out</span>
          <h2 id="analysis-title">AI Analysis</h2>
        </div>
        <span className="record-id">ID #{analysis.id}</span>
      </div>

      {isLoadingDetails ? (
        <div className="detail-loading" role="status">
          <span className="button-spinner" aria-hidden="true" />
          Loading saved analysis...
        </div>
      ) : null}

      <div className="analysis-title-block">
        <h3>{analysis.task.title}</h3>
        <p>{displayValue(analysis.task.description)}</p>
      </div>

      <dl className="analysis-grid">
        <div>
          <dt>Priority</dt>
          <dd>
            <PriorityBadge priority={analysis.task.priority} />
          </dd>
        </div>
        <div>
          <dt>Category</dt>
          <dd>{displayValue(analysis.task.category)}</dd>
        </div>
        <div>
          <dt>Assignee</dt>
          <dd>{displayValue(analysis.task.assignee)}</dd>
        </div>
        <div>
          <dt>Deadline</dt>
          <dd>{formatDeadline(analysis.task.deadline)}</dd>
        </div>
      </dl>

      <div className="source-block">
        <span>Original task</span>
        <p>{analysis.originalText}</p>
      </div>

      <div className="analysis-footer">
        <span>Created {formatTimestamp(analysis.createdAt)}</span>
        <span className="schema-status">
          <span aria-hidden="true">✓</span>
          Structured output
        </span>
      </div>
    </section>
  );
}
