'use client';

import { useState } from 'react';
import { Send, MessageCircle, User, Bot, Copy, RotateCcw } from 'lucide-react';
import { useQuestions } from '@/hooks/useQuestions';

interface QuestionInterfaceProps {
  disabled?: boolean;
}

export default function QuestionInterface({ disabled = false }: QuestionInterfaceProps) {
  const [question, setQuestion] = useState('');
  const { loading, history, error, askQuestion, clearHistory } = useQuestions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading || disabled) return;

    try {
      await askQuestion(question.trim());
      setQuestion('');
    } catch {
      // Error handled by hook
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Question Input */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2 mb-3">
            <MessageCircle className="h-5 w-5 text-primary-700" />
            <h3 className="font-semibold text-gray-800">Ask a Question</h3>
          </div>
          
          <div className="flex space-x-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about your PDF..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading || disabled}
            />
            <button
              type="submit"
              disabled={!question.trim() || loading || disabled}
              className="px-6 py-3 bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Question History */}
      {history.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Conversation History</h3>
            <button
              onClick={clearHistory}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Clear History</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Question */}
                <div className="bg-blue-50 p-4 border-b border-gray-100">
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-gray-800">{item.question}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Answer */}
                <div className="p-4">
                  <div className="flex items-start space-x-3">
                    <Bot className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-800 whitespace-pre-wrap">{item.answer}</p>
                      </div>
                      
                      {item.source_documents.length > 0 && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Source Documents:</h4>
                          <div className="space-y-2">
                            {item.source_documents.map((doc, index) => (
                              <div key={index} className="text-xs text-gray-600 bg-white p-2 rounded border">
                                {doc}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={() => copyToClipboard(item.answer)}
                        className="mt-3 flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                        <span className="text-sm">Copy Answer</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
