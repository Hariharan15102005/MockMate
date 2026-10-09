import client from './client';

/**
 * Interview Engineer Candidate Management & Verification API Client
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

export default {
  createCandidateApi,
  getCandidatesApi,
  getPendingVerificationCandidatesApi,
  getCandidateByIdApi,
  updateCandidateApi,
  verifyCandidateApi,
  rejectCandidateApi,
  getCandidateAuditApi,
  getEngineerDashboardStatsApi
};
