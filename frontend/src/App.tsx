export { default } from './ChatApp';

import { useEffect, useRef, useState } from 'react';
import { getTaskAnalyses, getTaskAnalysis, analyzeTask } from './api/taskAnalysisApi';
import { isAbortError, normalizeApiError, type UiError } from './api/apiError';
import { AnalysisHistory } from './components/AnalysisHistory';
import { ErrorBanner } from './components/ErrorBanner';
import { Header } from './components/Header';
import { TaskAnalysisCard } from './components/TaskAnalysisCard';
import { TaskInputCard } from './components/TaskInputCard';
import type { PagedTaskAnalysisResponse, TaskAnalysisResponse } from './types/taskAnalysis';

const HISTORY_PAGE_SIZE = 10;

export function LegacyTaskApp() {
  const [taskText, setTaskText] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<TaskAnalysisResponse | null>(null);
  const [history, setHistory] = useState<PagedTaskAnalysisResponse | null>(null);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  const [analysisError, setAnalysisError] = useState<UiError | null>(null);
  const [historyError, setHistoryError] = useState<UiError | null>(null);
  const [detailError, setDetailError] = useState<UiError | null>(null);
  const detailController = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsHistoryLoading(true);
    setHistoryError(null);

    getTaskAnalyses(historyPage, HISTORY_PAGE_SIZE, controller.signal)
      .then(setHistory)
      .catch((error: unknown) => {
        if (!isAbortError(error)) {
          setHistoryError(normalizeApiError(error, 'history'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsHistoryLoading(false);
        }
      });

    return () => controller.abort();
  }, [historyPage, historyRefresh]);

  useEffect(() => {
    return () => detailController.current?.abort();
  }, []);

  const handleAnalyze = async () => {
    const normalizedText = taskText.trim();
    if (!normalizedText || isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setDetailError(null);

    try {
      const analysis = await analyzeTask(normalizedText);
      setSelectedAnalysis(analysis);
      setHistoryPage(0);
      setHistoryRefresh((version) => version + 1);
    } catch (error: unknown) {
      setAnalysisError(normalizeApiError(error, 'analysis'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectAnalysis = async (id: number) => {
    detailController.current?.abort();
    const controller = new AbortController();
    detailController.current = controller;

    setDetailLoadingId(id);
    setDetailError(null);

    try {
      const analysis = await getTaskAnalysis(id, controller.signal);
      setSelectedAnalysis(analysis);
    } catch (error: unknown) {
      if (!isAbortError(error)) {
        setDetailError(normalizeApiError(error, 'detail'));
      }
    } finally {
      if (!controller.signal.aborted) {
        setDetailLoadingId(null);
      }
    }
  };

  return (
    <div className="app-shell">
      <Header />

      <main>
        {analysisError ? (
          <ErrorBanner error={analysisError} onDismiss={() => setAnalysisError(null)} />
        ) : null}
        {detailError ? <ErrorBanner error={detailError} onDismiss={() => setDetailError(null)} /> : null}

        <div className="primary-grid">
          <TaskInputCard
            text={taskText}
            isAnalyzing={isAnalyzing}
            onTextChange={setTaskText}
            onAnalyze={handleAnalyze}
          />
          <TaskAnalysisCard
            analysis={selectedAnalysis}
            isLoadingDetails={detailLoadingId !== null}
          />
        </div>

        {historyError ? (
          <ErrorBanner error={historyError} onDismiss={() => setHistoryError(null)} />
        ) : null}

        <AnalysisHistory
          pageData={history}
          isLoading={isHistoryLoading}
          selectedId={selectedAnalysis?.id ?? null}
          detailLoadingId={detailLoadingId}
          onSelect={handleSelectAnalysis}
          onPageChange={setHistoryPage}
        />
      </main>

      <footer>
        <span>AI Task Extractor</span>
        <span>React UI · Spring Boot API · Structured AI output</span>
      </footer>
    </div>
  );
}
