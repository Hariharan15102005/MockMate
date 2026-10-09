import client from './client';

/**
 * Instructor Candidate Review & Assignment API Client
 */

export const getAssignedCandidatesApi = async ({
  page = 0,
  size = 15,
  search = '',
  status = ''
} = {}) => {
  const params = { page, size };
  if (search && search.trim()) params.search = search.trim();
  if (status && status.trim()) params.status = status.trim();

  const response = await client.get('/api/instructor/candidates', { params });
  return response.data;
};

export const getAssignedCandidateDetailApi = async (candidateId) => {
  const response = await client.get(`/api/instructor/candidates/${candidateId}`);
  return response.data;
};

export const getInstructorAssignmentsApi = async ({
  page = 0,
  size = 15,
  search = '',
  status = ''
} = {}) => {
  const params = { page, size };
  if (search && search.trim()) params.search = search.trim();
  if (status && status.trim()) params.status = status.trim();

  const response = await client.get('/api/instructor/assignments', { params });
  return response.data;
};

export const getInstructorAssignmentByIdApi = async (assignmentId) => {
  const response = await client.get(`/api/instructor/assignments/${assignmentId}`);
  return response.data;
};

export const acceptAssignmentApi = async (assignmentId) => {
  const response = await client.post(`/api/instructor/assignments/${assignmentId}/accept`);
  return response.data;
};

export const declineAssignmentApi = async (assignmentId, { reason }) => {
  const response = await client.post(`/api/instructor/assignments/${assignmentId}/decline`, { reason });
  return response.data;
};

export const getInstructorStatsApi = async () => {
  const response = await client.get('/api/instructor/dashboard/stats');
  return response.data;
};

export default {
  getAssignedCandidatesApi,
  getAssignedCandidateDetailApi,
  getInstructorAssignmentsApi,
  getInstructorAssignmentByIdApi,
  acceptAssignmentApi,
  declineAssignmentApi,
  getInstructorStatsApi
};
