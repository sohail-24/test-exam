'use client';

import { useEffect, useRef, useState } from 'react';
import { Clock, LayoutGrid, Flag, Eraser, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  useExamStore,
  selectAnsweredCount,
  selectMarkedCount,
  selectNotVisitedCount,
  QuestionStatus,
} from '@/store/examStore';

// ─── Types ─────────────────────────────────────────────────
interface Question {
  id: string;
  text: string;
  options: string[];
}

interface ExamUIProps {
  examId: string;
  examTitle: string;
  studentName: string;
  durationMinutes: number;
  questions: Question[];
  onSubmit: (answers: { questionId: string; selectedIndex: number | null }[], timeTakenSeconds: number) => void;
}

// ─── Helpers ──────────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const STATUS_STYLES: Record<QuestionStatus, string> = {
  ANSWERED: 'bg-green-600 text-white',
  MARKED_FOR_REVIEW: 'bg-purple-600 text-white',
  NOT_VISITED: 'bg-slate-200 text-slate-600',
};

// ─── Question Palette ─────────────────────────────────────
function QuestionPalette({
  onClose,
  onNavigate,
  onSubmit,
}: {
  onClose?: () => void;
  onNavigate: (index: number) => void;
  onSubmit: () => void;
}) {
  const questionStatuses = useExamStore((s) => s.questionStatuses);
  const currentQuestionIndex = useExamStore((s) => s.currentQuestionIndex);
  const answered = useExamStore(selectAnsweredCount);
  const marked = useExamStore(selectMarkedCount);
  const notVisited = useExamStore(selectNotVisitedCount);

  return (
    <div className="flex flex-col h-full">
      {/* Close (mobile only) */}
      {onClose && (
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <span className="font-semibold text-slate-800">Question Palette</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* Legend */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-sm bg-green-600 inline-block" />
            <span className="text-slate-600">Answered ({answered})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-sm bg-slate-200 inline-block" />
            <span className="text-slate-600">Not Visited ({notVisited})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-sm bg-purple-600 inline-block" />
            <span className="text-slate-600">Review ({marked})</span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-5 gap-2">
          {questionStatuses.map((q, i) => (
            <button
              key={q.id}
              onClick={() => {
                onNavigate(i);
                onClose?.();
              }}
              className={`w-10 h-10 rounded-lg text-xs font-semibold border-2 transition-all ${STATUS_STYLES[q.status]} ${
                currentQuestionIndex === i ? 'ring-2 ring-offset-1 ring-green-400' : 'border-transparent'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={onSubmit}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          Submit Test
        </button>
      </div>
    </div>
  );
}

// ─── Main Exam UI ─────────────────────────────────────────
export default function ExamUI({
  examId,
  examTitle,
  studentName,
  durationMinutes,
  questions,
  onSubmit,
}: ExamUIProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    hydrateExam,
    currentQuestionIndex,
    timeRemaining,
    questionStatuses,
    setCurrentQuestion,
    answerQuestion,
    markForReview,
    clearResponse,
    decrementTimer,
  } = useExamStore();

  // Hydrate once
  useEffect(() => {
    hydrateExam(
      examId,
      questions.map((q) => q.id),
      durationMinutes * 60
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  // Timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    timerRef.current = setInterval(() => {
      decrementTimer();
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining === 0) handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining]);

  const currentQuestion = questions[currentQuestionIndex];
  const currentStatus = questionStatuses[currentQuestionIndex];
  const isTimeCritical = timeRemaining <= 300; // 5 min

  const handleSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const answers = questionStatuses.map((q) => ({
      questionId: q.id,
      selectedIndex: q.selectedOptionIndex,
    }));
    const totalDurationSeconds = durationMinutes * 60;
    const timeTaken = Math.max(0, totalDurationSeconds - timeRemaining);
    onSubmit(answers, timeTaken);
  };

  const goNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestion(currentQuestionIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestion(currentQuestionIndex - 1);
    }
  };

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Sticky Header ─────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <span className="font-semibold text-slate-800 truncate max-w-[40%]">{studentName}</span>

          {/* Timer */}
          <div
            className={`flex items-center gap-1.5 font-mono font-bold text-sm px-3 py-1.5 rounded-lg ${
              isTimeCritical ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-red-500' : 'text-slate-500'}`} />
            {formatTime(timeRemaining)}
          </div>

          {/* Mobile palette trigger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
          >
            <LayoutGrid className="w-5 h-5 text-slate-600" />
          </button>

          {/* Desktop exam title */}
          <span className="hidden md:block text-sm text-slate-500 truncate">{examTitle}</span>
        </div>

        {/* Sub-header */}
        <div className="max-w-7xl mx-auto px-4 py-1.5 text-xs text-slate-500 border-t border-slate-100">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {/* Desktop: 70/30 grid */}
        <div className="md:grid md:grid-cols-[70%_30%] md:gap-6">
          {/* Left: Question */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <p className="text-slate-900 font-medium leading-relaxed">{currentQuestion.text}</p>
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((opt, i) => {
                const selected = currentStatus?.selectedOptionIndex === i;
                return (
                  <label
                    key={i}
                    className={`flex items-center gap-4 min-h-[48px] px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selected
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${currentQuestion.id}`}
                      checked={selected}
                      onChange={() => answerQuestion(currentQuestion.id, i)}
                      className="accent-green-600 w-4 h-4 shrink-0"
                    />
                    <span className="text-sm text-slate-800">{opt}</span>
                  </label>
                );
              })}
            </div>

            {/* Desktop action buttons */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => clearResponse(currentQuestion.id)}
                className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm px-4 py-2 rounded-lg hover:bg-slate-50"
              >
                <Eraser className="w-4 h-4" /> Clear
              </button>
              <button
                onClick={() => markForReview(currentQuestion.id)}
                className="flex items-center gap-2 border border-purple-200 text-purple-600 text-sm px-4 py-2 rounded-lg hover:bg-purple-50"
              >
                <Flag className="w-4 h-4" /> Mark for Review
              </button>
              <div className="flex-1" />
              <button
                onClick={goPrev}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-1 border border-slate-200 text-slate-600 text-sm px-4 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={goNext}
                disabled={currentQuestionIndex === questions.length - 1}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm px-5 py-2 rounded-lg disabled:opacity-40"
              >
                Save & Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: Palette (desktop only) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm h-fit sticky top-24">
            <QuestionPalette onNavigate={setCurrentQuestion} onSubmit={handleSubmit} />
          </div>
        </div>
      </main>

      {/* ── Mobile: Sticky Bottom Action Bar ──────────────── */}
      <div className="md:hidden sticky bottom-0 bg-white border-t border-slate-200 z-20">
        {/* Row 1: Utility */}
        <div className="flex gap-2 px-4 pt-2">
          <button
            onClick={() => clearResponse(currentQuestion.id)}
            className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 text-slate-600 text-sm py-2 rounded-lg"
          >
            <Eraser className="w-4 h-4" /> Clear
          </button>
          <button
            onClick={() => markForReview(currentQuestion.id)}
            className="flex-1 flex items-center justify-center gap-1.5 border border-purple-200 text-purple-600 text-sm py-2 rounded-lg"
          >
            <Flag className="w-4 h-4" /> Review
          </button>
        </div>
        {/* Row 2: Navigation */}
        <div className="flex gap-2 px-4 pt-2 pb-3">
          <button
            onClick={goPrev}
            disabled={currentQuestionIndex === 0}
            style={{ width: '40%' }}
            className="flex items-center justify-center gap-1 border border-slate-200 text-slate-600 text-sm py-2.5 rounded-xl disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <button
            onClick={goNext}
            disabled={currentQuestionIndex === questions.length - 1}
            style={{ width: '60%' }}
            className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white font-medium text-sm py-2.5 rounded-xl disabled:opacity-40"
          >
            Save & Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ──────────────────────────────────── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="relative bg-white rounded-t-2xl max-h-[75vh] flex flex-col z-50">
            <QuestionPalette
              onClose={() => setDrawerOpen(false)}
              onNavigate={setCurrentQuestion}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      )}
    </div>
  );
}

