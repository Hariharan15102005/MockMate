import { backendApi } from './client';

export const registerCandidateApi = async ({ fullName, email, password }) => {
  const response = await backendApi.post('/auth/register', {
    fullName,
    email,
    password
  });
  return response.data;
};

export const loginUserApi = async ({ email, password }) => {
  const response = await backendApi.post('/auth/login', {
    email,
    password
  });
  return response.data;
};

export const getCurrentUserApi = async () => {
  const response = await backendApi.get('/auth/me');
  return response.data;
};
