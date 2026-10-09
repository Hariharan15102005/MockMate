import client from './client';

/**
 * Notification API Client
 */

export const getNotificationsApi = async () => {
  const response = await client.get('/api/notifications');
  return response.data;
};

export const getUnreadNotificationsCountApi = async () => {
  const response = await client.get('/api/notifications/unread-count');
  return response.data;
};

export const markNotificationReadApi = async (notificationId) => {
  const response = await client.put(`/api/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsReadApi = async () => {
  const response = await client.put('/api/notifications/read-all');
  return response.data;
};

export default {
  getNotificationsApi,
  getUnreadNotificationsCountApi,
  markNotificationReadApi,
  markAllNotificationsReadApi
};
