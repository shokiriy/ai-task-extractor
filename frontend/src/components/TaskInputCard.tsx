import type { FormEvent } from 'react';

const MAX_LENGTH = 5_000;

const sampleTasks = [
  'Tomorrow at 14:00 check the production deployment with Hikmatullo. This is critical.',
  'Prepare the API documentation by Friday. Medium priority.',
  'Fix the payment validation bug today before 17:00. This is high priority.',
];

interface TaskInputCardProps {
  text: string;
  isAnalyzing: boolean;
  onTextChange: (text: string) => void;
  onAnalyze: () => void;
}

export function TaskInputCard({
  text,
  isAnalyzing,
  onTextChange,
  onAnalyze,
}: TaskInputCardProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAnalyze();
  };

  return (
    <section className="surface-card input-card" aria-labelledby="task-input-title">
      <div className="section-heading">
        <span className="section-eyebrow">Natural language in</span>
        <h2 id="task-input-title">Analyze a Task</h2>
        <p>
          Write a task naturally. The AI will extract structured information such as priority,
          assignee, deadline, and category.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="field-header">
          <label htmlFor="task-text">Task text</label>
          <span className="character-count" aria-live="polite">
            {text.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
          </span>
        </div>
        <textarea
          id="task-text"
          name="taskText"
          value={text}
          maxLength={MAX_LENGTH}
          rows={8}
          placeholder="Tomorrow at 14:00 check the production deployment with Hikmatullo. This is critical."
          onChange={(event) => onTextChange(event.target.value)}
          disabled={isAnalyzing}
        />

        <div className="samples" aria-label="Sample tasks">
          <span className="samples-label">Try an example</span>
          <div className="sample-list">
            {sampleTasks.map((sample, index) => (
              <button
                className="sample-button"
                type="button"
                key={sample}
                onClick={() => onTextChange(sample)}
                disabled={isAnalyzing}
              >
                <span>{index + 1}</span>
                {sample}
              </button>
            ))}
          </div>
        </div>

        <button
          className="primary-button"
          type="submit"
          disabled={isAnalyzing || text.trim().length === 0}
        >
          {isAnalyzing ? (
            <>
              <span className="button-spinner" aria-hidden="true" />
              Analyzing...
            </>
          ) : (
            <>
              Analyze Task
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </form>
    </section>
  );
}
