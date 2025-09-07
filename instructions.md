# RAG PDF Frontend Development Instructions

## Overview
Create a modern, eye-catching Next.js frontend with TypeScript for the RAG PDF API backend. The frontend should allow users to upload PDF files and ask questions about their content using a clean, intuitive interface.

## Backend API Endpoints Available
- `POST /upload-pdf` - Upload PDF file (max 5MB)
- `POST /ask-question` - Ask questions about uploaded PDF
- `GET /health` - Health check
- `DELETE /reset` - Reset system
- Backend runs on `http://localhost:8000`

## Step-by-Step Implementation

### 1. Install Required Dependencies

First, install additional dependencies for the frontend:

```bash
npm install lucide-react @types/node
npm install -D @types/react @types/react-dom
```

### 2. Update Tailwind Configuration

Create or update `tailwind.config.js` to include custom animations and styles:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
}
```

### 3. Create API Service Layer

Create `src/lib/api.ts` for backend communication:

```typescript
const API_BASE_URL = 'http://localhost:8000';

export interface UploadResponse {
  message: string;
  filename: string;
  chunks_created: number;
  file_size_mb: number;
}

export interface QuestionResponse {
  answer: string;
  source_documents: string[];
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = {
  async uploadPdf(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload-pdf`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(response.status, error.detail || 'Upload failed');
    }

    return response.json();
  },

  async askQuestion(question: string): Promise<QuestionResponse> {
    const response = await fetch(`${API_BASE_URL}/ask-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(response.status, error.detail || 'Question failed');
    }

    return response.json();
  },

  async resetSystem(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/reset`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new ApiError(response.status, 'Reset failed');
    }

    return response.json();
  },

  async healthCheck(): Promise<{ status: string; rag_system_loaded: boolean }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },
};
```

### 4. Create Custom Hooks

Create `src/hooks/useFileUpload.ts`:

```typescript
import { useState } from 'react';
import { api, UploadResponse, ApiError } from '@/lib/api';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    
    try {
      const result = await api.uploadPdf(file);
      setUploadResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setUploadResult(null);
    setError(null);
  };

  return {
    uploading,
    uploadResult,
    error,
    uploadFile,
    reset,
  };
};
```

Create `src/hooks/useQuestions.ts`:

```typescript
import { useState } from 'react';
import { api, QuestionResponse, ApiError } from '@/lib/api';

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
```

### 5. Create UI Components

Create `src/components/FileUpload.tsx`:

```typescript
'use client';

import { useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';

interface FileUploadProps {
  onUploadSuccess: (result: any) => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const { uploading, uploadResult, error, uploadFile, reset } = useFileUpload();

  const handleFileSelect = useCallback(async (file: File) => {
    try {
      const result = await uploadFile(file);
      onUploadSuccess(result);
    } catch (err) {
      // Error is handled by the hook
    }
  }, [uploadFile, onUploadSuccess]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      handleFileSelect(pdfFile);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const resetUpload = () => {
    reset();
  };

  if (uploadResult) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="text-green-500" size={24} />
            <h3 className="text-lg font-semibold text-green-800">Upload Successful!</h3>
          </div>
          <button
            onClick={resetUpload}
            className="text-green-600 hover:text-green-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-2 text-sm text-green-700">
          <p><strong>File:</strong> {uploadResult.filename}</p>
          <p><strong>Size:</strong> {uploadResult.file_size_mb} MB</p>
          <p><strong>Chunks Created:</strong> {uploadResult.chunks_created}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-500 transition-colors duration-200 bg-gradient-to-br from-blue-50 to-indigo-50"
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <Upload className="text-primary-500 animate-bounce-slow" size={48} />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Upload Your PDF Document
            </h3>
            <p className="text-gray-600 mb-4">
              Drop your PDF here or click to browse (Max 5MB)
            </p>
            
            <label className="inline-flex items-center px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors cursor-pointer font-medium">
              <FileText size={20} className="mr-2" />
              Choose PDF File
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileInput}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        </div>
      </div>

      {uploading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <p className="mt-2 text-gray-600">Processing your PDF...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-slide-up">
          <div className="flex items-center space-x-2">
            <AlertCircle className="text-red-500" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

Create `src/components/QuestionInterface.tsx`:

```typescript
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
    } catch (err) {
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
            <MessageCircle className="text-primary-500" size={24} />
            <h3 className="text-lg font-semibold text-gray-800">Ask a Question</h3>
          </div>
          
          <div className="relative">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={disabled ? "Please upload a PDF first..." : "What would you like to know about the document?"}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
              disabled={disabled || loading}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={clearHistory}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={history.length === 0}
            >
              <RotateCcw size={16} />
              <span>Clear History</span>
            </button>
            
            <button
              type="submit"
              disabled={!question.trim() || loading || disabled}
              className="flex items-center space-x-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
              <span>{loading ? 'Asking...' : 'Ask Question'}</span>
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
          <h3 className="text-lg font-semibold text-gray-800">Conversation History</h3>
          
          {history.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-slide-up">
              {/* Question */}
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary-500 rounded-full p-2">
                    <User size={16} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium">{item.question}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(item.question)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              
              {/* Answer */}
              <div className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-green-500 rounded-full p-2">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-800 whitespace-pre-wrap">{item.answer}</p>
                    </div>
                    
                    {item.source_documents.length > 0 && (
                      <details className="mt-3">
                        <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                          View Source Documents ({item.source_documents.length})
                        </summary>
                        <div className="mt-2 space-y-2">
                          {item.source_documents.map((doc, idx) => (
                            <div key={idx} className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
                              {doc}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                  <button
                    onClick={() => copyToClipboard(item.answer)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 6. Create Main Page Component

Replace `src/app/page.tsx` with:

```typescript
'use client';

import { useState } from 'react';
import { FileText, Brain, Zap } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import QuestionInterface from '@/components/QuestionInterface';

export default function Home() {
  const [hasUploadedFile, setHasUploadedFile] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleUploadSuccess = (result: any) => {
    setUploadResult(result);
    setHasUploadedFile(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-500 rounded-lg p-2">
              <Brain className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RAG PDF Assistant</h1>
              <p className="text-gray-600">Upload PDFs and ask intelligent questions</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="text-primary-500" size={24} />
                <h2 className="text-xl font-semibold text-gray-800">Document Upload</h2>
              </div>
              
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </div>

            {/* Features */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Features</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Zap className="text-yellow-500" size={20} />
                  <span className="text-gray-700">AI-powered document analysis</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FileText className="text-blue-500" size={20} />
                  <span className="text-gray-700">Support for PDF documents up to 5MB</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Brain className="text-purple-500" size={20} />
                  <span className="text-gray-700">Intelligent question answering</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Questions */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <QuestionInterface disabled={!hasUploadedFile} />
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${hasUploadedFile ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm text-gray-600">
                {hasUploadedFile ? 'Document ready for questions' : 'No document uploaded'}
              </span>
            </div>
            
            {uploadResult && (
              <div className="text-sm text-gray-500">
                {uploadResult.chunks_created} chunks • {uploadResult.file_size_mb}MB
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <p className="text-center text-gray-600 text-sm">
            Powered by FastAPI, LangChain, and Next.js
          </p>
        </div>
      </footer>
    </div>
  );
}
```

### 7. Update Global Styles

Update `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    @apply scroll-smooth;
  }
  
  body {
    @apply bg-gray-50 text-gray-900;
  }
}

@layer components {
  .prose {
    @apply text-gray-800;
  }
  
  .prose p {
    @apply mb-3;
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-in-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

### 8. Add Environment Configuration

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 9. Testing and Development

1. **Start the backend server:**
   ```bash
   cd Backend
   python main.py
   ```

2. **Start the frontend development server:**
   ```bash
   cd Frontend
   npm run dev
   ```

3. **Test the application:**
   - Navigate to `http://localhost:3000`
   - Upload a PDF file
   - Ask questions about the content
   - Verify responses and source documents

### 10. Production Considerations

1. **Environment Variables:**
   - Update API URLs for production
   - Add proper error boundaries

2. **Security:**
   - Implement proper CORS settings
   - Add request validation
   - Consider rate limiting

3. **Performance:**
   - Add loading states
   - Implement proper error handling
   - Consider caching strategies

4. **Accessibility:**
   - Add proper ARIA labels
   - Ensure keyboard navigation
   - Test with screen readers

## File Structure After Implementation

```
Frontend/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── FileUpload.tsx
│   │   └── QuestionInterface.tsx
│   ├── hooks/
│   │   ├── useFileUpload.ts
│   │   └── useQuestions.ts
│   └── lib/
│       └── api.ts
├── .env.local
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

This implementation provides a modern, responsive, and eye-catching interface for your RAG PDF system with proper TypeScript integration, error handling, and user experience considerations.