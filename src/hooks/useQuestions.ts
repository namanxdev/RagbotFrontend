import { useState } from 'react';
import { api, ApiError } from '@/lib/api';

export interface QuestionHistory {
  id: string;
  question: string;
  answer: string;
  source_documents: string[];
  timestamp: Date;
}

export const useQuestions = () => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<QuestionHistory[]>([]);
  const [error, setError] = useState<string | null>(null);

  const askQuestion = async (question: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.askQuestion(question);
      const newEntry: QuestionHistory = {
        id: Date.now().toString(),
        question,
        answer: result.answer,
        source_documents: result.source_documents,
        timestamp: new Date(),
      };
      
      setHistory(prev => [newEntry, ...prev]);
      return result;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Question failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return {
    loading,
    history,
    error,
    askQuestion,
    clearHistory,
  };
};
