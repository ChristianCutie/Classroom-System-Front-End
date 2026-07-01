import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api-lms.slarenasitsolutions.com/public/api/',
  headers: { 'Content-Type': 'application/json' },
});

// Add token to every request if it exists
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Discussion API methods
export const discussionAPI = {
  createDiscussion: (data) =>
    apiClient.post('/discussions', {
      class_id: data.classId,
      user_id: data.userId,
      title: data.title,
      description: data.description,
      send_to_all: data.sendToAll,
      student_ids: data.sendToAll ? null : data.studentIds,
      attachments: data.attachments,
    }),
};

export default apiClient;