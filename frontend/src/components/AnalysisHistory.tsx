import { LoadingState } from './LoadingState';
import { PriorityBadge } from './PriorityBadge';
import type { PagedTaskAnalysisResponse } from '../types/taskAnalysis';
import { displayValue, formatDeadline, formatTimestamp } from '../utils/date';

interface AnalysisHistoryProps {
  pageData: PagedTaskAnalysisResponse | null;
  isLoading: boolean;
  selectedId: number | null;
  detailLoadingId: number | null;
  onSelect: (id: number) => void;
  onPageChange: (page: number) => void;
}

export function AnalysisHistory({
  pageData,
  isLoading,
  selectedId,
  detailLoadingId,
  onSelect,
  onPageChange,
}: AnalysisHistoryProps) {
  const totalPages = Math.max(pageData?.totalPages ?? 0, 1);
  const currentPage = pageData?.page ?? 0;

  return (
    <section className="history-section" aria-labelledby="history-title">
      <div className="history-heading">
        <div>
          <span className="section-eyebrow">Saved in MySQL</span>
          <h2 id="history-title">Recent Analyses</h2>
          <p>Select a record to load its full details from the backend.</p>
        </div>
        {pageData ? <span className="record-count">{pageData.totalElements} total</span> : null}
      </div>

      <div className="history-surface">
        {isLoading ? <LoadingState label="Loading recent analyses" /> : null}

        {!isLoading && pageData?.content.length === 0 ? (
          <div className="empty-history">
            <div aria-hidden="true">01</div>
            <h3>No analyses yet.</h3>
            <p>Analyze your first task above.</p>
          </div>
        ) : null}

        {!isLoading && pageData && pageData.content.length > 0 ? (
          <ul className="history-list">
            {pageData.content.map((analysis) => {
              const isSelected = analysis.id === selectedId;
              const isDetailLoading = analysis.id === detailLoadingId;

              return (
                <li key={analysis.id}>
                  <button
                    type="button"
                    className={`history-item${isSelected ? ' history-item-selected' : ''}`}
                    onClick={() => onSelect(analysis.id)}
                    aria-pressed={isSelected}
                  >
                    <span className="history-main">
                      <span className="history-title-row">
                        <span className="history-title-text">{analysis.task.title}</span>
                        <PriorityBadge priority={analysis.task.priority} />
                      </span>
                      <span className="history-metadata">
                        <span>{displayValue(analysis.task.category)}</span>
                        <span>Assignee: {displayValue(analysis.task.assignee)}</span>
                        <span>Due: {formatDeadline(analysis.task.deadline)}</span>
                      </span>
                    </span>
                    <span className="history-side">
                      <time dateTime={analysis.createdAt}>{formatTimestamp(analysis.createdAt)}</time>
                      <span className="history-open">
                        {isDetailLoading ? 'Loading...' : 'View details'}
                        {!isDetailLoading ? <span aria-hidden="true">→</span> : null}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        {!isLoading && pageData && pageData.totalElements > 0 ? (
          <nav className="pagination" aria-label="Analysis history pages">
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
            >
              ← Previous
            </button>
            <span>
              Page <strong>{currentPage + 1}</strong> of <strong>{totalPages}</strong>
            </span>
            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={pageData.last || currentPage + 1 >= totalPages}
            >
              Next →
            </button>
          </nav>
        ) : null}
      </div>
    </section>
  );
}
