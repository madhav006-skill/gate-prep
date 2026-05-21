import { create } from 'zustand';
import api from '../api/client';

export const useExamStore = create((set, get) => ({
  attemptId: null,
  testMeta: null,
  questions: [],
  answers: {}, // Key: questionId, Value: { answer: '', status: 'Not Visited', timeSpent: 0 }
  currentQuestionIndex: 0,
  timeLeft: 0, // in seconds
  isSubmitted: false,
  isLoading: false,
  error: null,

  startTest: async (testId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post(`/tests/${testId}/start`);
      const { attemptId, test } = res.data.data;
      
      const initialAnswers = {};
      test.questions.forEach((q, idx) => {
        initialAnswers[q.question._id] = {
          answer: null,
          status: idx === 0 ? 'Not Answered' : 'Not Visited',
          timeSpent: 0
        };
      });

      set({
        attemptId,
        testMeta: test,
        questions: test.questions.map(q => q.question),
        answers: initialAnswers,
        currentQuestionIndex: 0,
        timeLeft: test.duration * 60,
        isSubmitted: false,
        isLoading: false
      });
    } catch (error) {
      set({ error: error.response?.data?.error || 'Failed to start test', isLoading: false });
    }
  },

  setAnswer: (questionId, answer) => {
    const { answers } = get();
    const current = answers[questionId];
    
    set({
      answers: {
        ...answers,
        [questionId]: {
          ...current,
          answer,
          status: answer !== null && answer !== '' ? 
            (current.status === 'Marked for Review' || current.status === 'Answered and Marked for Review' ? 'Answered and Marked for Review' : 'Answered') 
            : 'Not Answered'
        }
      }
    });
  },

  markForReview: (questionId) => {
    const { answers } = get();
    const current = answers[questionId];
    const hasAnswer = current.answer !== null && current.answer !== '';
    
    set({
      answers: {
        ...answers,
        [questionId]: {
          ...current,
          status: hasAnswer ? 'Answered and Marked for Review' : 'Marked for Review'
        }
      }
    });
  },

  clearResponse: (questionId) => {
    const { answers } = get();
    const current = answers[questionId];
    
    set({
      answers: {
        ...answers,
        [questionId]: {
          ...current,
          answer: null,
          status: 'Not Answered'
        }
      }
    });
  },

  navigateQuestion: (index) => {
    const { questions, currentQuestionIndex, answers } = get();
    if (index < 0 || index >= questions.length) return;
    
    // Update status of previous question if it was just visited
    const prevQId = questions[currentQuestionIndex]._id;
    const prevStatus = answers[prevQId].status;
    if (prevStatus === 'Not Visited') {
       get().updateQuestionStatus(prevQId, 'Not Answered');
    }
    
    // Update status of new question
    const nextQId = questions[index]._id;
    if (answers[nextQId].status === 'Not Visited') {
       get().updateQuestionStatus(nextQId, 'Not Answered');
    }

    set({ currentQuestionIndex: index });
  },

  updateQuestionStatus: (questionId, status) => {
    const { answers } = get();
    set({
      answers: {
        ...answers,
        [questionId]: {
          ...answers[questionId],
          status
        }
      }
    });
  },

  tickTime: () => {
    const { timeLeft, questions, currentQuestionIndex, answers } = get();
    if (timeLeft <= 0) {
      get().submitTest();
      return;
    }
    
    const currentQId = questions[currentQuestionIndex]._id;
    
    set({
      timeLeft: timeLeft - 1,
      answers: {
        ...answers,
        [currentQId]: {
          ...answers[currentQId],
          timeSpent: (answers[currentQId].timeSpent || 0) + 1
        }
      }
    });
  },

  saveAnswerToBackend: async (questionId) => {
    const { attemptId, answers } = get();
    const data = answers[questionId];
    
    try {
      await api.post(`/tests/attempts/${attemptId}/save-answer`, {
        questionId,
        answer: data.answer,
        status: data.status,
        timeSpent: data.timeSpent
      });
    } catch (error) {
      console.error('Auto-save failed', error);
    }
  },

  submitTest: async () => {
    const { attemptId } = get();
    set({ isLoading: true });
    try {
      await api.post(`/tests/attempts/${attemptId}/submit`);
      set({ isSubmitted: true, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to submit test', isLoading: false });
    }
  }
}));
