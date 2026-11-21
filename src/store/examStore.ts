import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────
export type QuestionStatus = 'NOT_VISITED' | 'ANSWERED' | 'MARKED_FOR_REVIEW';

export interface QuestionState {
  id: string;
  status: QuestionStatus;
  selectedOptionIndex: number | null;
}

interface ExamStore {
  examId: string | null;
  currentQuestionIndex: number;
  timeRemaining: number; // seconds
  questionStatuses: QuestionState[];

  // Actions
  hydrateExam: (examId: string, questionIds: string[], durationSeconds: number) => void;
  setCurrentQuestion: (index: number) => void;
  answerQuestion: (questionId: string, optionIndex: number) => void;
  markForReview: (questionId: string) => void;
  clearResponse: (questionId: string) => void;
  decrementTimer: () => void;
  resetExam: () => void;
}

// ─── Store ────────────────────────────────────────────────
export const useExamStore = create<ExamStore>()(
  persist(
    (set, get) => ({
      examId: null,
      currentQuestionIndex: 0,
      timeRemaining: 0,
      questionStatuses: [],

      hydrateExam: (examId, questionIds, durationSeconds) => {
        const existing = get();
        // Resume from localStorage if same exam is in-progress
        if (existing.examId === examId && existing.questionStatuses.length > 0) return;

        set({
          examId,
          currentQuestionIndex: 0,
          timeRemaining: durationSeconds,
          questionStatuses: questionIds.map((id) => ({
            id,
            status: 'NOT_VISITED',
            selectedOptionIndex: null,
          })),
        });
      },

      setCurrentQuestion: (index) => {
        set((state) => {
          const statuses = [...state.questionStatuses];
          if (statuses[index]?.status === 'NOT_VISITED') {
            statuses[index] = { ...statuses[index], status: 'NOT_VISITED' };
          }
          return { currentQuestionIndex: index, questionStatuses: statuses };
        });
      },

      answerQuestion: (questionId, optionIndex) => {
        set((state) => ({
          questionStatuses: state.questionStatuses.map((q) =>
            q.id === questionId
              ? { ...q, status: 'ANSWERED', selectedOptionIndex: optionIndex }
              : q
          ),
        }));
      },

      markForReview: (questionId) => {
        set((state) => ({
          questionStatuses: state.questionStatuses.map((q) =>
            q.id === questionId ? { ...q, status: 'MARKED_FOR_REVIEW' } : q
          ),
        }));
      },

      clearResponse: (questionId) => {
        set((state) => ({
          questionStatuses: state.questionStatuses.map((q) =>
            q.id === questionId
              ? { ...q, status: 'NOT_VISITED', selectedOptionIndex: null }
              : q
          ),
        }));
      },

      decrementTimer: () => {
        set((state) => ({
          timeRemaining: Math.max(0, state.timeRemaining - 1),
        }));
      },

      resetExam: () => {
        set({
          examId: null,
          currentQuestionIndex: 0,
          timeRemaining: 0,
          questionStatuses: [],
        });
      },
    }),
    {
      name: 'exam-state',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ─── Selectors ────────────────────────────────────────────
export const selectAnsweredCount = (s: ExamStore) =>
  s.questionStatuses.filter((q) => q.status === 'ANSWERED').length;

export const selectMarkedCount = (s: ExamStore) =>
  s.questionStatuses.filter((q) => q.status === 'MARKED_FOR_REVIEW').length;

export const selectNotVisitedCount = (s: ExamStore) =>
  s.questionStatuses.filter((q) => q.status === 'NOT_VISITED').length;

