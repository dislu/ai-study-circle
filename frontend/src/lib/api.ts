import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.warn('Unauthorized access detected');
    } else if (error.response?.status >= 500) {
      // Handle server errors
      console.error('Server error occurred');
    }
    
    return Promise.reject(error);
  }
);

// File upload API
export const uploadFile = async (file: File, onProgress?: (progress: number) => void) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });

  return response.data;
};

// Text upload API
export const uploadText = async (text: string, title?: string) => {
  const response = await api.post('/upload/text', { text, title });
  return response.data;
};

// Summary generation APIs
export const generateSummary = async (options: {
  jobId?: string;
  text?: string;
  length?: 'brief' | 'medium' | 'detailed';
  style?: 'academic' | 'casual' | 'professional' | 'technical';
  targetAudience?: 'students' | 'professionals' | 'general' | 'experts';
  focusAreas?: string[];
  includeKeyPoints?: boolean;
  includeConcepts?: boolean;
  analyzeContent?: boolean;
}) => {
  const response = await api.post('/summary/generate', options);
  return response.data;
};

export const generateMultipleSummaries = async (options: {
  jobId?: string;
  text?: string;
  lengths?: ('brief' | 'medium' | 'detailed')[];
  style?: string;
  targetAudience?: string;
}) => {
  const response = await api.post('/summary/generate-multiple', options);
  return response.data;
};

// Exam generation APIs
export const generateExam = async (options: {
  jobId?: string;
  text?: string;
  questionCount?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionTypes?: string[];
  examTitle?: string;
  timeLimit?: number;
  topics?: string[];
  includeAnswers?: boolean;
  analyzeContent?: boolean;
}) => {
  const response = await api.post('/exam/generate', options);
  return response.data;
};

export const generateQuestionsByType = async (options: {
  jobId?: string;
  text?: string;
  questionType: string;
  count?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}) => {
  const response = await api.post('/exam/generate-by-type', options);
  return response.data;
};

// Status and configuration APIs
export const getJobStatus = async (jobId: string) => {
  const response = await api.get(`/status/${jobId}`);
  return response.data;
};

export const getBatchJobStatus = async (jobIds: string[]) => {
  const response = await api.post('/status/batch', { jobIds });
  return response.data;
};

export const getSummaryOptions = async () => {
  const response = await api.get('/summary/options');
  return response.data;
};

export const getExamOptions = async () => {
  const response = await api.get('/exam/options');
  return response.data;
};

export const getExamTemplates = async () => {
  const response = await api.get('/exam/templates');
  return response.data;
};

export const getSupportedFormats = async () => {
  const response = await api.get('/upload/formats');
  return response.data;
};

export const getSystemStats = async () => {
  const response = await api.get('/status/system/stats');
  return response.data;
};

export const cancelJob = async (jobId: string) => {
  const response = await api.delete(`/status/${jobId}`);
  return response.data;
};

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;