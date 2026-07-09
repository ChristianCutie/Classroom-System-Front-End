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

export const discussionAPI = {
  createDiscussion: (data) => {
    if (data instanceof FormData) {
      return apiClient.post("/discussions", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }

    return apiClient.post("/discussions", {
      class_id: data.classId,
      user_id: data.userId,
      title: data.title,
      description: data.description,
      send_to_all: data.sendToAll,
      student_ids: data.sendToAll ? null : data.studentIds,
      attachments: data.attachments,
    });
  },
};

export const assignmentAPI = {
  getAssignments: (classId) => apiClient.get(`/classes/${classId}/assignments`),
  getAssignment: (assignmentId) =>
    apiClient.get(`/assignments/${assignmentId}`),
  getAssignmentDetails: (assignmentId) =>
    apiClient.get(`/assignments/${assignmentId}/details`),
  submitAssignment: (assignmentId, formData) =>
    apiClient.post(`/assignments/${assignmentId}/submit`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getAllSubmissions: (assignmentId) =>
    apiClient.get(`/assignments/${assignmentId}/submissions`),
  gradeSubmission: (submissionId, payload) =>
    apiClient.post(`/submissions/${submissionId}/grade`, payload),
  getStudentAssignmentSubmission: (assignmentId, studentId) =>
    apiClient.get(`/assignments/${assignmentId}/students/${studentId}/details`),
  sendPrivateComment: (submissionId, data) =>
    apiClient.post(`/submissions/${submissionId}/private-comment`, data),
  sendComment: (submissionId, data) =>
    apiClient.post(`/submissions/${submissionId}/comments`, data),
  getSubmissionComments: (submissionId) =>
    apiClient.get(`/getsubmissions/${submissionId}/comments`),
};

export const classAPI = {
  getClasses: () => apiClient.get("/classes"),
  getClass: (classId) => apiClient.get(`/classes/${classId}`),
  createClass: (data) => apiClient.post("/classes", data),
  joinClass: (code) => apiClient.post("/classes/join", { code }),
  archiveClass: (classId) => apiClient.patch(`/classes/${classId}/archive`),
  restoreClass: (classId) => apiClient.patch(`/classes/${classId}/restore`),
  deleteClass: (classId) => apiClient.delete(`/classes/${classId}`),
  unenrollClass: (classId) => apiClient.delete(`/classes/${classId}/unenroll`),
  createAnnouncement: (classId, payload) =>
    apiClient.post(`/classes/${classId}/announcements`, payload),
  addComment: (classId, annId, text) =>
    apiClient.post(`/classes/${classId}/announcements/${annId}/comments`, {
      text,
    }),
  createTopic: (topicName) =>
    apiClient.post("/create/topics", { topic_name: topicName }),
  createAssignment: (formData) =>
    apiClient.post("/create/assignments", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  createCoursework: (classId, payload) =>
    apiClient.post(`/classes/${classId}/coursework`, payload),
  submitCoursework: (courseworkId, formData) =>
    apiClient.post(`/assignments/${courseworkId}/submit`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getSubmissionDetails: (courseworkId) =>
    apiClient.get(`/assignments/${courseworkId}`),
  getSubmissionDetailsLegacy: (courseworkId) =>
    apiClient.get(`/assignments/${courseworkId}/details`),
  gradeSubmission: (submissionId, payload) =>
    apiClient.post(`/submissions/${submissionId}/grade`, payload),
  updateClassBanner: (classId, bannerCss, themeColor) =>
    apiClient.patch(`/classes/${classId}`, {
      banner: bannerCss,
      theme_color: themeColor,
    }),
  refreshClass: (classId) => apiClient.get(`/classes/${classId}`),
};

export const userAPI = {
  toggleRole: (userId, roleId, roleName) =>
    apiClient.post(`/update/users/${userId}`, {
      role_id: roleId,
      role: roleName,
    }),
};

export default apiClient;
