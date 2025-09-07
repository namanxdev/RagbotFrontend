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
