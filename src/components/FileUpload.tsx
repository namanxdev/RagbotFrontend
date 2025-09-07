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
            <CheckCircle className="h-6 w-6 text-green-500" />
            <h3 className="font-semibold text-green-800">PDF Uploaded Successfully!</h3>
          </div>
          <button
            onClick={resetUpload}
            className="text-green-600 hover:text-green-800 transition-colors"
            title="Reset upload"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-2 text-sm text-green-700">
          <p><strong>File:</strong> {uploadResult.filename}</p>
          <p><strong>Chunks Created:</strong> {uploadResult.chunks_created}</p>
          <p><strong>File Size:</strong> {uploadResult.file_size_mb} MB</p>
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
            <Upload className="h-12 w-12 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Upload PDF Document</h3>
            <p className="text-gray-500 mb-4">Drag and drop your PDF file here, or click to browse</p>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-6 py-3 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileText className="h-5 w-5 mr-2" />
              Choose PDF File
            </label>
            <p className="text-xs text-gray-400 mt-2">Maximum file size: 5MB</p>
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
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
