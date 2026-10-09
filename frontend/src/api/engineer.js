import client from './client';

/**
 * Interview Engineer Candidate Management, Verification & Resume API Client
 */

export const createCandidateApi = async (candidateData) => {
  const response = await client.post('/api/engineer/candidates', candidateData);
  return response.data;
};

export const getCandidatesApi = async ({
  page = 0,
  size = 10,
  sortBy = 'createdAt',
  direction = 'desc',
  search = '',
  status = '',
  experienceLevel = '',
  appliedRole = ''
} = {}) => {
  const params = { page, size, sortBy, direction };
  if (search && search.trim()) params.search = search.trim();
  if (status && status.trim()) params.status = status.trim();
  if (experienceLevel && experienceLevel.trim()) params.experienceLevel = experienceLevel.trim();
  if (appliedRole && appliedRole.trim()) params.appliedRole = appliedRole.trim();

  const response = await client.get('/api/engineer/candidates', { params });
  return response.data;
};

export const getPendingVerificationCandidatesApi = async ({
  page = 0,
  size = 10,
  sortBy = 'createdAt',
  direction = 'desc',
  search = '',
  experienceLevel = '',
  appliedRole = ''
} = {}) => {
  const params = { page, size, sortBy, direction };
  if (search && search.trim()) params.search = search.trim();
  if (experienceLevel && experienceLevel.trim()) params.experienceLevel = experienceLevel.trim();
  if (appliedRole && appliedRole.trim()) params.appliedRole = appliedRole.trim();

  const response = await client.get('/api/engineer/candidates/pending-verification', { params });
  return response.data;
};

export const getCandidateByIdApi = async (candidateId) => {
  const response = await client.get(`/api/engineer/candidates/${candidateId}`);
  return response.data;
};

export const updateCandidateApi = async (candidateId, candidateData) => {
  const response = await client.put(`/api/engineer/candidates/${candidateId}`, candidateData);
  return response.data;
};

export const verifyCandidateApi = async (candidateId) => {
  const response = await client.post(`/api/engineer/candidates/${candidateId}/verify`);
  return response.data;
};

export const rejectCandidateApi = async (candidateId, reason) => {
  const response = await client.post(`/api/engineer/candidates/${candidateId}/reject`, { reason });
  return response.data;
};

export const getCandidateAuditApi = async (candidateId) => {
  const response = await client.get(`/api/engineer/candidates/${candidateId}/audit`);
  return response.data;
};

export const getEngineerDashboardStatsApi = async () => {
  const response = await client.get('/api/engineer/dashboard/stats');
  return response.data;
};

// ==========================================
// RESUME MANAGEMENT & AI ANALYSIS APIS
// ==========================================

export const uploadCandidateResumeApi = async (candidateId, file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await client.post(`/api/engineer/candidates/${candidateId}/resume`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress
  });
  return response.data;
};

export const getCandidateResumesApi = async (candidateId) => {
  const response = await client.get(`/api/engineer/candidates/${candidateId}/resumes`);
  return response.data;
};

export const getCurrentCandidateResumeApi = async (candidateId) => {
  const response = await client.get(`/api/engineer/candidates/${candidateId}/resume/current`);
  return response.data;
};

export const getResumeByIdApi = async (resumeId) => {
  const response = await client.get(`/api/engineer/resumes/${resumeId}`);
  return response.data;
};

export const getResumeAnalysisApi = async (resumeId) => {
  const response = await client.get(`/api/engineer/resumes/${resumeId}/analysis`);
  return response.data;
};

export const downloadResumeApi = async (resumeId, fileName = 'resume.pdf') => {
  const response = await client.get(`/api/engineer/resumes/${resumeId}/download`, {
    responseType: 'blob'
  });

  const blob = new Blob([response.data], { type: response.headers['content-type'] });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

export default {
  createCandidateApi,
  getCandidatesApi,
  getPendingVerificationCandidatesApi,
  getCandidateByIdApi,
  updateCandidateApi,
  verifyCandidateApi,
  rejectCandidateApi,
  getCandidateAuditApi,
  getEngineerDashboardStatsApi,
  uploadCandidateResumeApi,
  getCandidateResumesApi,
  getCurrentCandidateResumeApi,
  getResumeByIdApi,
  getResumeAnalysisApi,
  downloadResumeApi
};
