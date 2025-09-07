'use client';

import { useState } from 'react';
import { FileText, Brain, Zap } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import QuestionInterface from '@/components/QuestionInterface';
import { UploadResponse } from '@/lib/api';

export default function Home() {
  const [hasUploadedFile, setHasUploadedFile] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);

  const handleUploadSuccess = (result: UploadResponse) => {
    setUploadResult(result);
    setHasUploadedFile(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <Brain className="h-8 w-8 text-primary-700" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RAG PDF Chat</h1>
              <p className="text-gray-600">Upload your PDF and ask questions about its content</p>
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
                <FileText className="h-6 w-6 text-primary-700" />
                <h2 className="text-xl font-semibold text-gray-800">Step 1: Upload PDF</h2>
              </div>
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </div>

            {/* Feature highlights */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Features</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span className="text-gray-700">Fast PDF processing with AI chunking</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Brain className="h-5 w-5 text-purple-500" />
                  <span className="text-gray-700">Intelligent question answering</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <span className="text-gray-700">Source document references</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Questions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="h-6 w-6 text-primary-700" />
                <h2 className="text-xl font-semibold text-gray-800">Step 2: Ask Questions</h2>
              </div>
              {!hasUploadedFile && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Upload a PDF first to start asking questions</p>
                </div>
              )}
              {hasUploadedFile && <QuestionInterface disabled={!hasUploadedFile} />}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${hasUploadedFile ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm text-gray-600">PDF Status: {hasUploadedFile ? 'Ready' : 'No PDF uploaded'}</span>
              </div>
              {uploadResult && (
                <div className="text-sm text-gray-600">
                  Chunks: {uploadResult.chunks_created} | Size: {uploadResult.file_size_mb}MB
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              Powered by RAG + AI
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center text-gray-600">
            <p>RAG PDF Chat - Upload documents and get intelligent answers</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
