import apiClient from './client';

// Get all users with optional filters
export const getUsers = async (filters = {}) => {
  try {
    const response = await apiClient.get('/admin/users', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get pending users
export const getPendingUsers = async () => {
  try {
    const response = await apiClient.get('/admin/users/pending');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get approved users
export const getApprovedUsers = async () => {
  try {
    const response = await apiClient.get('/admin/users/approved');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get rejected users
export const getRejectedUsers = async () => {
  try {
    const response = await apiClient.get('/admin/users/rejected');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get blocked users
export const getBlockedUsers = async () => {
  try {
    const response = await apiClient.get('/admin/users/blocked');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Approve user
export const approveUser = async (userId) => {
  try {
    const response = await apiClient.post(`/admin/users/${userId}/approve`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Reject user
export const rejectUser = async (userId, reason = null) => {
  try {
    const response = await apiClient.post(`/admin/users/${userId}/reject`, {
      reason,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Block user
export const blockUser = async (userId, reason = null) => {
  try {
    const response = await apiClient.post(`/admin/users/${userId}/block`, {
      reason,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Unblock user
export const unblockUser = async (userId) => {
  try {
    const response = await apiClient.post(`/admin/users/${userId}/unblock`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
