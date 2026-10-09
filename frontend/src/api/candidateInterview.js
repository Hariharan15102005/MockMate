import client from './client';

/**
 * Candidate Interview Execution & Results API
 */

export const getCandidateInterviewsApi = async () => {
  const response = await client.get('/api/candidate/interviews');
  return response.data;
};

export const getCandidateInterviewDetailsApi = async (interviewId) => {
  const response = await client.get(`/api/candidate/interviews/${interviewId}`);
  return response.data;
};

export const uploadCandidateResumeApi = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await client.post('/api/candidate/interviews/resume/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const startOrResumeSessionApi = async (interviewId) => {
  const response = await client.post(`/api/candidate/interviews/${interviewId}/start-session`);
  return response.data;
};

export const startSelfServiceInterviewApi = async () => {
  const response = await client.post('/api/candidate/interviews/self-service/start');
  return response.data;
};

export const createSelfServiceSessionApi = async () => {
  const response = await client.post('/api/candidate/interviews/self-service/session');
  return response.data;
};

export const getSessionDetailsApi = async (sessionId) => {
  const response = await client.get(`/api/candidate/interviews/sessions/${sessionId}`);
  return response.data;
};

export const getCurrentQuestionApi = async (sessionId) => {
  const response = await client.get(`/api/candidate/interviews/sessions/${sessionId}/current-question`);
  return response.data;
};

export const submitAnswerApi = async (sessionId, data) => {
  const response = await client.post(`/api/candidate/interviews/sessions/${sessionId}/answers`, data);
  return response.data;
};

export const recordQuestionTimeoutApi = async (sessionId, questionId) => {
  const response = await client.post(`/api/candidate/interviews/sessions/${sessionId}/timeout${questionId ? `?questionId=${questionId}` : ''}`);
  return response.data;
};

export const recordMediaEventApi = async (sessionId, data) => {
  const response = await client.post(`/api/candidate/interviews/sessions/${sessionId}/events`, data);
  return response.data;
};

export const completeInterviewApi = async (sessionId) => {
  const response = await client.post(`/api/candidate/interviews/sessions/${sessionId}/complete`);
  return response.data;
};

export const getCandidateResultApi = async (sessionId) => {
  const response = await client.get(`/api/candidate/interviews/sessions/${sessionId}/result`);
  return response.data;
};

export const getInstructorReportApi = async (sessionId) => {
  const response = await client.get(`/api/instructor/interviews/sessions/${sessionId}/report`);
  return response.data;
};

export default {
  getCandidateInterviewsApi,
  getCandidateInterviewDetailsApi,
  startOrResumeSessionApi,
  getCurrentQuestionApi,
  submitAnswerApi,
  recordMediaEventApi,
  completeInterviewApi,
  getCandidateResultApi,
  getInstructorReportApi
};
