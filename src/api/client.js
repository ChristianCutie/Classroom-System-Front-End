import axios from "axios";

const getApiBaseUrl = () => {
  const configured =
    import.meta.env.VITE_API_URL ||
    "https://api-lms.slarenasitsolutions.com/public/api/";
  return configured.endsWith("/") ? configured : `${configured}/`;
};

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { "Content-Type": "application/json" },
});

// Add token to every request if it exists
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const resolveAttachmentUrl = (filePath) => {
  if (!filePath) return null;
  if (/^https?:\/\//i.test(filePath)) return filePath;

  const normalizedPath = String(filePath).replace(/\\/g, "/");
  const baseUrl = new URL(getApiBaseUrl(), window.location.origin);

  if (normalizedPath.startsWith("/")) {
    return new URL(normalizedPath, baseUrl).toString();
  }

  return new URL(normalizedPath.replace(/^\/+/, ""), baseUrl).toString();
};

// Discussion API methods
export const discussionAPI = {
  createDiscussion: (data) => {
    // If data is FormData, send with multipart/form-data
    if (data instanceof FormData) {
      return apiClient.post("/discussions", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    // Otherwise, send as JSON (only links, no files)
    return apiClient.post("/discussions", {
      class_id: data.classId,
      user_id: data.userId,
      title: data.title,
      description: data.description,
      send_to_all: data.sendToAll,
      student_ids: data.sendToAll ? null : data.studentIds,
      attachments: data.attachments, // only contains link objects (files are sent via FormData)
    });
  },
};

export const assignmentAPI = {
  getAssignments: (classId) => apiClient.get(`/classes/${classId}/assignments`),
  getAssignment: (assignmentId) => apiClient.get(`/assignments/${assignmentId}`),
  getAssignmentDetails: (assignmentId) => apiClient.get(`/assignments/${assignmentId}/details`),
  submitAssignment: (assignmentId, formData) => apiClient.post(`/assignments/${assignmentId}/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAllSubmissions: (assignmentId) => apiClient.get(`/assignments/${assignmentId}/submissions`),
  gradeSubmission: (submissionId, payload) => apiClient.post(`/submissions/${submissionId}/grade`, payload),
};

export default apiClient;