import React, { useState, useEffect, useRef, memo } from "react";
import { renderAsync } from "docx-preview";
import DocViewer, { DocViewerRenderers } from "@iamjariwala/react-doc-viewer";
import "@iamjariwala/react-doc-viewer/dist/index.css";
import Avatar from "../../components/Common/Avatar.jsx";
import apiClient, {
  assignmentAPI,
  resolveAttachmentUrl,
} from "@/api/client.js";
import { useToast } from "@/context/ToastContext.jsx";

// ---------- helpers ----------
const getFileExtension = (file) => {
  const name = file?.name || file?.fileName || file?.filename || "";
  const fromName = (name.split(".").pop() || "").toLowerCase();
  if (fromName) return fromName;
  const url = file?.url || "";
  const fromUrl = (url.match(/\.([a-z0-9]+)(?:[?#].*)?$/i) || [])[1];
  return fromUrl ? fromUrl.toLowerCase() : "";
};

const getPreviewMode = (file) => {
  const type = String(file?.type || "").toLowerCase();
  const ext = getFileExtension(file);
  if (
    ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"].includes(ext) ||
    type.includes("image")
  )
    return "image";
  if (ext === "pdf" || type === "pdf") return "pdf";
  if (ext === "docx" || type === "docx") return "docx";
  if (
    [
      "doc",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "odt",
      "ods",
      "odp",
      "txt",
      "csv",
      "rtf",
    ].includes(ext) ||
    [
      "word",
      "excel",
      "sheet",
      "spreadsheet",
      "powerpoint",
      "presentation",
      "document",
      "text",
      "csv",
    ].includes(type)
  )
    return "document";
  return "unsupported";
};

const getPreviewUrl = (file) => {
  const rawUrl =
    file?.url || file?.file_url || file?.fileUrl || file?.file_path || null;
  if (!rawUrl || rawUrl === "#") return null;

  let url = String(rawUrl);
  url = url.replace(/\/storage\//, "/");
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return resolveAttachmentUrl(url);
  return resolveAttachmentUrl(url);
};

const getPreviewIcon = (file) => {
  const ext = getFileExtension(file) || (file?.type || "").toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"].includes(ext) ||
      (file?.type || "").includes("image"))
    return "bi-image-fill text-success";
  if (ext === "pdf") return "bi-file-earmark-pdf-fill text-danger";
  if (ext === "docx") return "bi-file-earmark-word-fill text-primary";
  if (["doc", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp"].includes(ext) ||
      (file?.type || "").includes("document") || (file?.type || "").includes("word") || (file?.type || "").includes("excel") || (file?.type || "").includes("powerpoint"))
    return "bi-file-earmark-text-fill text-secondary";
  if (ext === "zip" || ext === "rar" || ext === "7z")
    return "bi-file-earmark-zip-fill text-muted";
  if (ext === "mp4" || ext === "mov" || ext === "avi" || ext === "mkv")
    return "bi-file-earmark-play-fill text-primary";
  if (ext === "mp3" || ext === "wav" || ext === "flac")
    return "bi-file-earmark-music-fill text-secondary";
  return "bi-file-earmark-text-fill text-secondary";
};

// ---------- Normalize attachments from API ----------
const normalizeAttachments = (attachments) => {
  if (!Array.isArray(attachments)) return [];
  return attachments.map((att) => ({
    id: att.id,
    name: att.file_name || att.name || "Unnamed",
    url: att.file_path ? resolveAttachmentUrl(att.file_path) : att.url || "#",
    type: att.file_type || att.type || getFileExtension(att) || "file",
    file_path: att.file_path,
    file_name: att.file_name,
    file_type: att.file_type,
  }));
};

// ---------- SubmissionFilePreview (memoized) ----------
const SubmissionFilePreview = memo(
  ({ file }) => {
    const [viewerError, setViewerError] = useState("");
    const [docViewerDocs, setDocViewerDocs] = useState([]);
    const [isPreparingPreview, setIsPreparingPreview] = useState(false);
    const previewMode = getPreviewMode(file);
    const previewUrl = getPreviewUrl(file);
    const previewIdentity = `${file?.id ?? ""}-${file?.name ?? ""}-${file?.url ?? ""}-${file?.file_url ?? ""}-${file?.file_path ?? ""}-${file?.type ?? ""}`;

    const [docxContent, setDocxContent] = useState(null);
    const [docxError, setDocxError] = useState("");
    const docxContainerRef = useRef(null);

    useEffect(() => {
      setViewerError("");
      setDocViewerDocs([]);
      setIsPreparingPreview(false);
      setDocxContent(null);
      setDocxError("");
      if (docxContainerRef.current) {
        docxContainerRef.current.innerHTML = "";
      }
    }, [previewIdentity]);

    useEffect(() => {
      if (previewMode !== "docx") {
        setDocxContent(null);
        setDocxError("");
        if (docxContainerRef.current) {
          docxContainerRef.current.innerHTML = "";
        }
      }
    }, [previewMode]);

    useEffect(() => {
      if (previewMode !== "docx" || !previewUrl) return;
      let cancelled = false;
      const loadDocx = async () => {
        setDocxError("");
        setDocxContent(null);
        try {
          const response = await fetch(previewUrl, { credentials: "omit" });
          if (!response.ok)
            throw new Error(`Failed to fetch DOCX (${response.status})`);
          const blob = await response.blob();
          if (!cancelled) setDocxContent(blob);
        } catch (err) {
          if (!cancelled) setDocxError(err.message);
        }
      };
      loadDocx();
      return () => {
        cancelled = true;
      };
    }, [previewUrl, previewMode]);

    useEffect(() => {
      if (!docxContent || !docxContainerRef.current) return;
      let cancelled = false;
      renderAsync(docxContent, docxContainerRef.current).catch((err) => {
        if (!cancelled) setDocxError("Failed to render DOCX preview");
      });
      return () => {
        cancelled = true;
      };
    }, [docxContent]);

    useEffect(() => {
      let cancelled = false;
      const preparePreview = () => {
        if (!previewUrl) {
          setDocViewerDocs([]);
          setViewerError("No file URL available.");
          setIsPreparingPreview(false);
          return;
        }
        if (previewMode === "image") {
          setDocViewerDocs([]);
          setViewerError("");
          setIsPreparingPreview(false);
          return;
        }
        if (previewMode === "docx") {
          setDocViewerDocs([]);
          setViewerError("");
          setIsPreparingPreview(false);
          return;
        }
        if (!["pdf", "document"].includes(previewMode)) {
          setDocViewerDocs([]);
          setViewerError("Unsupported file type.");
          setIsPreparingPreview(false);
          return;
        }
        setIsPreparingPreview(true);
        setViewerError("");
        try {
          setDocViewerDocs([
            {
              uri: previewUrl,
              fileName: file?.name || "attachment",
            },
          ]);
        } catch (err) {
          console.error("Failed to prepare preview:", err);
          setViewerError("Could not load the file for preview.");
          setDocViewerDocs([]);
        } finally {
          if (!cancelled) setIsPreparingPreview(false);
        }
      };
      preparePreview();
      return () => {
        cancelled = true;
      };
    }, [
      file?.id,
      file?.name,
      file?.url,
      file?.file_url,
      file?.file_path,
      previewMode,
      previewUrl,
    ]);

    if (previewMode === "image" && previewUrl) {
      return (
        <div
          className="d-flex justify-content-center align-items-center p-3 bg-white"
          style={{ minHeight: "100vh" }}
        >
          <img
            src={previewUrl}
            alt={file?.name || "Preview"}
            style={{ maxWidth: "100%", maxHeight: "400px", objectFit: "contain" }}
          />
        </div>
      );
    }

    if (["pdf", "document"].includes(previewMode) && previewUrl) {
      return (
        <div className="w-100" style={{ minHeight: "100vh" }}>
          {viewerError ? (
            <div className="d-flex flex-column justify-content-center align-items-center text-center p-5 h-100">
              <i className="bi bi-exclamation-triangle-fill fs-1 text-warning mb-3"></i>
              <h6 className="fw-semibold text-dark">Preview unavailable</h6>
              <p className="text-muted small mb-3">{viewerError}</p>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline-primary btn-sm"
              >
                Open file directly
              </a>
            </div>
          ) : (
            <div style={{ height: "100vh", width: "100%" }}>
              {isPreparingPreview ? (
                <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                  <div className="text-center">
                    <div className="spinner-border mb-2" role="status" />
                    <div>Preparing preview...</div>
                  </div>
                </div>
              ) : (
                <DocViewer
                  documents={docViewerDocs}
                  pluginRenderers={DocViewerRenderers}
                  config={{
                    header: { disableHeader: false },
                    pdfVerticalScrollByDefault: true,
                  }}
                  style={{ height: "100%", width: "100%" }}
                />
              )}
            </div>
          )}
        </div>
      );
    }

    if (previewMode === "docx" && previewUrl) {
      return (
        <div className="p-3 bg-white" style={{ minHeight: "100vh" }}>
          {docxError ? (
            <div className="d-flex flex-column justify-content-center align-items-center text-center p-5 h-100">
              <i className="bi bi-exclamation-triangle-fill fs-1 text-warning mb-3"></i>
              <h6 className="fw-semibold text-dark">Preview unavailable</h6>
              <p className="text-muted small mb-3">{docxError}</p>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline-primary btn-sm"
              >
                Open file directly
              </a>
            </div>
          ) : docxContent ? (
            <div
              ref={docxContainerRef}
              style={{ height: "100vh", overflow: "auto" }}
            />
          ) : (
            <div
              className="d-flex justify-content-center align-items-center h-100"
              style={{ minHeight: "100vh" }}
            >
              <div className="spinner-border" role="status" />
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center text-center p-5"
        style={{ minHeight: "100vh" }}
      >
        <i className="bi bi-file-earmark-text fs-1 text-muted mb-3"></i>
        <h6 className="fw-semibold text-dark">Preview unavailable</h6>
        <p className="text-muted small mb-0">
          This file type cannot be previewed directly in the browser.
        </p>
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline-primary btn-sm mt-3"
          >
            Open file
          </a>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    const prev = prevProps.file;
    const next = nextProps.file;
    if (prev === next) return true;
    if (!prev || !next) return false;
    return (
      prev.id === next.id &&
      prev.name === next.name &&
      prev.url === next.url &&
      prev.file_url === next.file_url &&
      prev.file_path === next.file_path &&
      prev.type === next.type
    );
  }
);

// ---------- MAIN COMPONENT ----------
const ViewInstructionPage = ({
  cls,
  coursework: initialCoursework,
  user,
  students,
  gradeMatrix,
  onBack,
  onSubmitWork,
  onUpdateGrade,
  onReturnWork,
  defaultActiveTab = "instructions",
  onAssignmentUpdated,
}) => {
  const { addToast } = useToast();

  // Local copy of coursework – this is the source of truth for the view
  const [localCoursework, setLocalCoursework] = useState(initialCoursework);

  // Sync only when the assignment ID changes (i.e., navigating to a different assignment)
  useEffect(() => {
    if (initialCoursework?.id && initialCoursework.id !== localCoursework?.id) {
      setLocalCoursework(initialCoursework);
    }
  }, [initialCoursework, localCoursework?.id]);

  // ... all other state variables (unchanged) ...
  const [activeTab, setActiveTab] = useState(defaultActiveTab || "instructions");
  const [studentComment, setStudentComment] = useState("");
  const [privateComments, setPrivateComments] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [submissionState, setSubmissionState] = useState({ submitted: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSubmissionFiles, setSelectedSubmissionFiles] = useState([]);
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [selectedAttachmentByStudent, setSelectedAttachmentByStudent] = useState({});
  const [privateFeedbackByStudent, setPrivateFeedbackByStudent] = useState({});
  const [draftGradesByStudent, setDraftGradesByStudent] = useState({});
  const [savingStudentId, setSavingStudentId] = useState(null);
  const [returningStudentId, setReturningStudentId] = useState(null);
  const [showMarkAsDoneModal, setShowMarkAsDoneModal] = useState(false);
  const [markAsDoneFiles, setMarkAsDoneFiles] = useState([]);
  const [isMarkingAsDone, setIsMarkingAsDone] = useState(false);
  const autoOpenReviewRef = useRef(false);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [submissionsMap, setSubmissionsMap] = useState({});
  const [isLoadingAllSubmissions, setIsLoadingAllSubmissions] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [studentSubmission, setStudentSubmission] = useState(null);
  const [isLoadingStudentSubmission, setIsLoadingStudentSubmission] = useState(false);
  const [teacherCommentInput, setTeacherCommentInput] = useState({});
  const [sendingTeacherComment, setSendingTeacherComment] = useState({});
  const [studentCommentInput, setStudentCommentInput] = useState("");
  const [isSendingStudentComment, setIsSendingStudentComment] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [resubmitFiles, setResubmitFiles] = useState([]);
  const [resubmitComment, setResubmitComment] = useState("");
  const [commentsMap, setCommentsMap] = useState({});
  const [loadingCommentsMap, setLoadingCommentsMap] = useState({});

  // ---------- Edit Assignment State ----------
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    instructions: '',
    maxPoints: '',
    dueDate: '',
    topicId: '',
  });
  const [editAttachments, setEditAttachments] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [attachmentsToRemove, setAttachmentsToRemove] = useState([]);
  const [topics, setTopics] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // ---------- Scroll helper ----------
  const scrollToBottom = (submissionId) => {
    setTimeout(() => {
      const container = document.getElementById(`comment-container-${submissionId}`);
      if (container) container.scrollTop = container.scrollHeight;
    }, 150);
  };

  const fetchComments = async (submissionId, force = false) => {
    if (!submissionId) return;
    if (!force && (commentsMap[submissionId] || loadingCommentsMap[submissionId])) return;
    setLoadingCommentsMap((prev) => ({ ...prev, [submissionId]: true }));
    try {
      const res = await assignmentAPI.getSubmissionComments(submissionId);
      const comments = res.data?.data || [];
      setCommentsMap((prev) => ({ ...prev, [submissionId]: comments }));
      scrollToBottom(submissionId);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
      setCommentsMap((prev) => ({ ...prev, [submissionId]: [] }));
    } finally {
      setLoadingCommentsMap((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  const refreshComments = async (submissionId) => {
    if (!submissionId) return;
    setLoadingCommentsMap((prev) => ({ ...prev, [submissionId]: false }));
    await fetchComments(submissionId, true);
  };

  const normalizeTopicValue = (value) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed || "";
    }
    if (!value || typeof value !== "object") return "";
    const derivedName =
      value.topic_name ||
      value.name ||
      value.topicName ||
      value.label ||
      value.title ||
      value.topic;
    if (typeof derivedName === "string") {
      const trimmed = derivedName.trim();
      return trimmed || "";
    }
    return "";
  };

  const getRoleString = (u) => {
    if (!u) return "";
    if (typeof u.role === "string") return u.role;
    if (u.role && typeof u.role === "object") {
      const nested = u.role.role_name || u.role.name || u.role.value || "";
      if (typeof nested === "string" && nested.trim()) return nested;
    }
    if (typeof u.role_name === "string") return u.role_name;
    if (typeof u.type === "string") return u.type;
    return "";
  };

  const roleStr = (getRoleString(user) || "").toString().toLowerCase();
  const isTeacher =
    ["teacher", "instructor", "teacher/instructor"].includes(roleStr) ||
    Boolean(user?.is_teacher || user?.isTeacher);

  const displayTopic =
    typeof localCoursework.topic === "string"
      ? localCoursework.topic.trim() || "No topic"
      : normalizeTopicValue(localCoursework.topic) || "No topic";

  // ---------- Existing useEffect hooks ----------
  useEffect(() => {
  if (!isTeacher || !localCoursework?.id || !students?.length) {
    setSubmissionsMap({});
    return;
  }

  const fetchAllSubmissions = async () => {
    setIsLoadingAllSubmissions(true);
    setFetchError(null);
    const map = {};
    try {
      const promises = students.map(async (st) => {
        try {
          const res = await assignmentAPI.getStudentAssignmentSubmission(
            localCoursework.id,
            st.id,
          );
          const data = res.data?.data || res.data;
          map[st.id] = data;
        } catch (err) {
          console.error(`Failed to fetch submission for student ${st.id}:`, err);
          map[st.id] = null;
        }
      });
      await Promise.all(promises);
      setSubmissionsMap(map);
    } catch (err) {
      console.error("Error fetching all submissions:", err);
      setFetchError("Failed to load submissions. Please try again.");
    } finally {
      setIsLoadingAllSubmissions(false);
    }
  };

  fetchAllSubmissions();
}, [localCoursework?.id, isTeacher, students]);

  useEffect(() => {
    if (isTeacher || activeTab !== "yourWork" || !localCoursework?.id || !user?.id) {
      if (activeTab !== "yourWork") setStudentSubmission(null);
      return;
    }

    const fetchMySubmission = async () => {
      setIsLoadingStudentSubmission(true);
      try {
        const res = await assignmentAPI.getStudentAssignmentSubmission(
          localCoursework.id,
          user.id,
        );
        const data = res.data?.data || res.data;
        setStudentSubmission(data);
      } catch (err) {
        console.error("Failed to fetch your submission:", err);
        setStudentSubmission(null);
      } finally {
        setIsLoadingStudentSubmission(false);
      }
    };

    fetchMySubmission();
  }, [activeTab, localCoursework?.id, isTeacher, user?.id]);

  useEffect(() => {
    if (!isTeacher || activeTab !== "studentWork" || !selectedStudentId) return;
    const subData = submissionsMap[selectedStudentId];
    const submissionId = subData?.submission?.id;
    if (submissionId) fetchComments(submissionId);
  }, [selectedStudentId, isTeacher, activeTab, submissionsMap]);

  useEffect(() => {
    if (isTeacher || activeTab !== "yourWork" || !studentSubmission?.submission?.id) return;
    fetchComments(studentSubmission.submission.id);
  }, [activeTab, studentSubmission?.submission?.id, isTeacher]);

  // ---------- Edit Modal: Fetch topics & populate form ----------
  useEffect(() => {
    if (showEditModal) {
      setEditFormData({
        title: localCoursework.title || '',
        instructions: localCoursework.instructions || '',
        maxPoints: localCoursework.points ?? '',
        dueDate: localCoursework.dueDate ? new Date(localCoursework.dueDate).toISOString().split('T')[0] : '',
        topicId: localCoursework.topic_id || '',
      });
      // Ensure existing attachments are normalized
      setExistingAttachments(normalizeAttachments(localCoursework.attachments || []));
      setEditAttachments([]);
      setAttachmentsToRemove([]);

      apiClient.get('/topics')
        .then(res => setTopics(res.data.data || []))
        .catch(() => setTopics([]));
    }
  }, [showEditModal, localCoursework]);

  // ---------- Handle removing an existing attachment ----------
  const handleRemoveAttachment = (attId) => {
    setAttachmentsToRemove(prev => [...prev, attId]);
    setExistingAttachments(prev => prev.filter(att => att.id !== attId));
  };

  // ---------- Handle Edit Submission ----------
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append('class_id', cls.id);
      formData.append('title', editFormData.title);
      formData.append('instructions', editFormData.instructions);
      formData.append('max_points', editFormData.maxPoints);
      if (editFormData.dueDate) formData.append('due_date', editFormData.dueDate);
      if (editFormData.topicId) formData.append('topic_id', editFormData.topicId);

      if (attachmentsToRemove.length > 0) {
        formData.append('remove_attachments', JSON.stringify(attachmentsToRemove));
      }

      if (editAttachments.length > 0) {
        editAttachments.forEach((file) => {
          formData.append('attachments[]', file);
          formData.append('file_names[]', file.name);
        });
      }

      const response = await apiClient.post(`/update/assignments/${localCoursework.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        addToast('Assignment updated successfully!', 'success');

        // ------------------------------------------------------------
        // FIX: Use the class‑wide assignment list to fetch the updated data
        // ------------------------------------------------------------
        const assignmentsRes = await assignmentAPI.getAssignments(cls.id);
        const assignmentsList = assignmentsRes.data?.data || assignmentsRes.data || [];
        const updatedAssignment = assignmentsList.find(a => a.id === localCoursework.id);

        if (updatedAssignment) {
          // Map fields to match the component's expected shape
          const mapped = {
            ...localCoursework, // keep existing fields (postedDate, type, etc.)
            ...updatedAssignment,
            points: updatedAssignment.max_points ?? updatedAssignment.points,
            dueDate: updatedAssignment.due_date ?? updatedAssignment.dueDate,
            // Normalize attachments
            attachments: normalizeAttachments(updatedAssignment.attachments ?? localCoursework.attachments),
          };
          setLocalCoursework(mapped);
        } else {
          // Fallback: just merge the raw response (unlikely)
          const apiData = response.data.data || {};
          setLocalCoursework(prev => ({
            ...prev,
            ...apiData,
            points: apiData.max_points ?? apiData.points ?? prev.points,
            dueDate: apiData.due_date ?? apiData.dueDate ?? prev.dueDate,
            attachments: normalizeAttachments(apiData.attachments ?? prev.attachments),
          }));
        }

        // Notify parent if needed
        if (onAssignmentUpdated) onAssignmentUpdated();

        setShowEditModal(false);
      } else {
        addToast(response.data.message || 'Update failed.', 'error');
      }
    } catch (error) {
      console.error(error);
      addToast('Error updating assignment.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // ---------- Remaining handlers (unchanged) ----------
  const studentsWithWork = isTeacher
    ? students.filter((st) => {
        const data = submissionsMap[st.id];
        return data && data.submission_status !== "not_submitted";
      })
    : [];

  const studentsWithoutWork = isTeacher
    ? students.filter((st) => {
        const data = submissionsMap[st.id];
        return !data || data.submission_status === "not_submitted";
      })
    : [];

  const turnedInCount = studentsWithWork.length;
  const gradedCount = studentsWithWork.filter((st) => {
    const data = submissionsMap[st.id];
    return data?.submission?.grade !== null && data?.submission?.grade !== undefined;
  }).length;
  const totalStudents = students.length;
  const assignedCount = totalStudents;

  useEffect(() => {
    if (!isTeacher || activeTab !== "studentWork" || isLoadingAllSubmissions) return;
    if (autoOpenReviewRef.current) return;
    if (studentsWithWork.length > 0) {
      autoOpenReviewRef.current = true;
      setSelectedStudentId(studentsWithWork[0].id);
    }
  }, [activeTab, isTeacher, isLoadingAllSubmissions, studentsWithWork]);

  useEffect(() => {
    setActiveTab(defaultActiveTab || "instructions");
  }, [defaultActiveTab]);

  useEffect(() => {
    autoOpenReviewRef.current = false;
  }, [localCoursework?.id]);

  useEffect(() => {
    const submitted = Boolean(
      localCoursework?.submitted ||
      localCoursework?.userSubmission?.status === "submitted" ||
      localCoursework?.userSubmission?.status === "turned_in" ||
      localCoursework?.userSubmission?.status === "graded" ||
      localCoursework?.status === "submitted" ||
      localCoursework?.submissions?.some((sub) =>
        ["submitted", "turned_in", "graded"].includes(sub?.status),
      ),
    );
    setSubmissionState({ submitted });
  }, [
    localCoursework?.id,
    localCoursework?.submitted,
    localCoursework?.status,
    localCoursework?.userSubmission?.status,
    localCoursework?.submissions?.length,
  ]);

  useEffect(() => {
    const nextDrafts = {};
    students.forEach((st) => {
      nextDrafts[st.id] = gradeMatrix?.[st.id]?.[localCoursework.id] ?? null;
    });
    setDraftGradesByStudent(nextDrafts);
  }, [students, localCoursework?.id, gradeMatrix]);

  const handleAddComment = () => {
    if (!studentComment.trim()) return;
    const newComment = {
      id: `pc_${Date.now()}`,
      author: user.name,
      avatar: user.avatar || "U",
      text: studentComment.trim(),
      date: "Just now",
      isPrivate: true,
    };
    setPrivateComments([...privateComments, newComment]);
    setStudentComment("");
  };

  const handleGradeInputChange = (studentId, score) => {
    setDraftGradesByStudent((prev) => ({ ...prev, [studentId]: score }));
  };

  const saveGrade = async (studentId, score, feedback) => {
    if (score === null || score === undefined || score === "") return;
    setSavingStudentId(studentId);
    try {
      if (onUpdateGrade) {
        await onUpdateGrade(cls.id, studentId, localCoursework.id, score, feedback);
      }
    } finally {
      setSavingStudentId(null);
    }
  };

  const handleReturnToStudent = async (studentId) => {
    const score = draftGradesByStudent[studentId];
    const feedback = privateFeedbackByStudent[studentId] || "";
    if (score === null || score === undefined || score === "") return;

    setReturningStudentId(studentId);
    try {
      const savedGrade = gradeMatrix?.[studentId]?.[localCoursework.id];
      if (String(score) !== String(savedGrade ?? "")) {
        await saveGrade(studentId, score, feedback);
        setDraftGradesByStudent((prev) => ({ ...prev, [studentId]: score }));
      }
      if (onReturnWork) {
        await onReturnWork(cls.id, localCoursework.id, studentId, score, feedback);
        alert(`Returned work to ${students.find((s) => s.id === studentId)?.name || "student"}`);
      }
    } catch (err) {
      console.error("Error returning work:", err);
      alert("Could not return work. Please try again.");
    } finally {
      setReturningStudentId(null);
    }
  };

  const handleSendTeacherComment = async (submissionId, studentId) => {
    const comment = teacherCommentInput[studentId]?.trim();
    if (!comment) return;

    setSendingTeacherComment((prev) => ({ ...prev, [studentId]: true }));
    try {
      await assignmentAPI.sendComment(submissionId, { comment });
      setTeacherCommentInput((prev) => ({ ...prev, [studentId]: "" }));
      await refreshComments(submissionId);
    } catch (err) {
      console.error("Error sending comment:", err);
      alert("Could not send comment. Please try again.");
    } finally {
      setSendingTeacherComment((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  const handleSendStudentComment = async () => {
    const submissionId = studentSubmission?.submission?.id;
    const comment = studentCommentInput.trim();
    if (!submissionId || !comment) return;

    setIsSendingStudentComment(true);
    try {
      await assignmentAPI.sendComment(submissionId, { comment });
      setStudentCommentInput("");
      await refreshComments(submissionId);
    } catch (err) {
      console.error("Error sending comment:", err);
      alert("Could not send comment. Please try again.");
    } finally {
      setIsSendingStudentComment(false);
    }
  };

  const handleUploadAndTurnIn = async () => {
    const isResubmission = Boolean(
      studentSubmission?.submission?.id &&
      studentSubmission?.submission_status !== "not_submitted",
    );
    if (isResubmission) {
      await handleResubmit(uploadFiles, submissionMessage);
    } else {
      await handleTurnInWork(uploadFiles, submissionMessage);
    }
    setShowFileUploadModal(false);
    setUploadFiles([]);
  };

  const handleTurnInWork = async (files = [], comment = "") => {
    if (!onSubmitWork || isSubmitting) return;
    const hasExistingSubmission = Boolean(studentSubmission?.submission?.id);
    if (submissionState.submitted && !hasExistingSubmission) return;

    const submissionFiles = files.length > 0 ? files : selectedSubmissionFiles;
    const submissionComment = comment || submissionMessage;

    setIsSubmitting(true);
    try {
      const result = await onSubmitWork(
        cls.id,
        localCoursework.id,
        submissionFiles,
        {
          private_comment: submissionComment.trim(),
          studentId: user?.id,
          studentName: user?.name,
          studentEmail: user?.email,
          className: cls?.name,
          assignmentTitle: localCoursework?.title,
          submittedAt: new Date().toISOString(),
          status: "submitted",
        },
      );

      const isSuccess = result !== false && result !== undefined;
      if (isSuccess) {
        setSubmissionState({ submitted: true });
        setSelectedSubmissionFiles([]);
        setSubmissionMessage("");

        if (result?.data) {
          const submissionData = result.data;
          setStudentSubmission((prev) => ({
            ...prev,
            submission: {
              ...prev?.submission,
              id: submissionData.id,
              files: submissionData.files || [],
              submitted_at: submissionData.submitted_at,
              status: submissionData.status,
              private_comment: submissionData.private_comment,
            },
            submission_status: "submitted",
          }));
        } else {
          const res = await assignmentAPI.getStudentAssignmentSubmission(
            localCoursework.id,
            user.id,
          );
          setStudentSubmission(res.data?.data || res.data);
        }
      } else {
        console.warn("Submission failed or returned false:", result);
      }
    } catch (err) {
      console.error("Error in handleTurnInWork:", err);
      alert("Could not submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsDone = async () => {
    if (!onSubmitWork || submissionState.submitted || isMarkingAsDone) return;
    setIsMarkingAsDone(true);
    try {
      const ok = await onSubmitWork(cls.id, localCoursework.id, markAsDoneFiles, {
        private_comment: submissionMessage.trim(),
        studentId: user?.id,
        studentName: user?.name,
        studentEmail: user?.email,
        className: cls?.name,
        assignmentTitle: localCoursework?.title,
        submittedAt: new Date().toISOString(),
        status: "done",
      });
      if (ok !== false) {
        setSubmissionState({ submitted: true });
        setMarkAsDoneFiles([]);
        setSubmissionMessage("");
        setShowMarkAsDoneModal(false);
        if (!isTeacher && activeTab === "yourWork") {
          const res = await assignmentAPI.getStudentAssignmentSubmission(
            localCoursework.id,
            user.id,
          );
          setStudentSubmission(res.data?.data || res.data);
        }
      }
    } finally {
      setIsMarkingAsDone(false);
    }
  };

  const handleResubmit = async (files = [], comment = "") => {
    if (!onSubmitWork || isResubmitting) return;
    const submissionFiles = files.length > 0 ? files : resubmitFiles;
    const submissionComment =
      comment ||
      resubmitComment.trim() ||
      studentSubmission?.submission?.private_comment ||
      "";

    setIsResubmitting(true);
    try {
      const ok = await onSubmitWork(cls.id, localCoursework.id, submissionFiles, {
        private_comment: submissionComment,
        studentId: user?.id,
        studentName: user?.name,
        studentEmail: user?.email,
        className: cls?.name,
        assignmentTitle: localCoursework?.title,
        submittedAt: new Date().toISOString(),
        status: "submitted",
      });
      if (ok !== false) {
        setSubmissionState({ submitted: true });
        setResubmitFiles([]);
        setResubmitComment("");
        const res = await assignmentAPI.getStudentAssignmentSubmission(
          localCoursework.id,
          user.id,
        );
        setStudentSubmission(res.data?.data || res.data);
        alert("Submission updated successfully.");
      }
    } catch (err) {
      console.error("Error resubmitting:", err);
      alert("Could not resubmit. Please try again.");
    } finally {
      setIsResubmitting(false);
    }
  };

  // ---------- Render ----------
  return (
    <div className="container-fluid px-2 px-md-4 py-3">
      <button
        className="btn btn-link text-decoration-none text-primary fw-medium mb-3 d-flex align-items-center gap-2 p-0"
        onClick={onBack}
      >
        <i className="bi bi-arrow-left"></i> Back to Classwork
      </button>

      <div className="card border shadow-sm rounded-3 mb-4 bg-white overflow-hidden">
        <div
          className="p-4 d-flex align-items-center justify-content-between"
          style={{
            backgroundColor: cls.themeColor || "#1a73e8",
            minHeight: "80px",
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm"
              style={{
                width: "56px",
                height: "56px",
                backgroundColor: "rgba(255,255,255,0.2)",
              }}
            >
              <i
                className={`bi ${localCoursework.type === "quiz" ? "bi-card-checklist" : "bi-clipboard-check"} fs-3`}
              ></i>
            </div>
            <div className="text-white">
              <div className="d-flex align-items-center gap-2 mb-1">
                <h3
                  className="font-google fw-bold mb-0"
                  style={{ fontSize: "1.5rem" }}
                >
                  {localCoursework.title}
                </h3>

                {isTeacher && (
                  <button
                    className="btn btn-md fw-medium text-white"
                    onClick={() => setShowEditModal(true)}
                  >
                    <i className="bi bi-pencil me-1"></i>
                  </button>
                )}
              </div>
              <div className="small text-white text-opacity-90">
                {cls.name} • {displayTopic}
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            {isTeacher && (
              <div className="d-none d-md-flex gap-4 text-white text-center">
                <div>
                  <div className="fs-3 fw-bold">{turnedInCount}</div>
                  <div className="small text-white text-opacity-90">Turned in</div>
                </div>
                <div className="border-start border-white border-opacity-50"></div>
                <div>
                  <div className="fs-3 fw-bold">{assignedCount}</div>
                  <div className="small text-white text-opacity-90">Assigned</div>
                </div>
                {gradedCount > 0 && (
                  <>
                    <div className="border-start border-white border-opacity-50"></div>
                    <div>
                      <div className="fs-3 fw-bold">{gradedCount}</div>
                      <div className="small text-white text-opacity-90">Graded</div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-bottom bg-white">
          <ul className="nav gc-nav-tabs px-3">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "instructions" ? "active" : ""}`}
                onClick={() => setActiveTab("instructions")}
              >
                Instructions
              </button>
            </li>
            {isTeacher ? (
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "studentWork" ? "active" : ""}`}
                  onClick={() => setActiveTab("studentWork")}
                >
                  Student Work
                </button>
              </li>
            ) : (
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "yourWork" ? "active" : ""}`}
                  onClick={() => setActiveTab("yourWork")}
                >
                  Your Work
                </button>
              </li>
            )}
          </ul>
        </div>

        <div className="card-body p-4">
          {activeTab === "instructions" && (
            <div>
              <div className="row g-3 mb-4 pb-4 border-bottom">
                <div className="col-6 col-md-3">
                  <div
                    className="text-muted small fw-semibold text-uppercase mb-1"
                    style={{ fontSize: "0.72rem" }}
                  >
                    Points
                  </div>
                  <div className="fw-bold text-dark">
                    {localCoursework.points !== null && localCoursework.points !== undefined
                      ? localCoursework.points
                      : "Ungraded"}
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div
                    className="text-muted small fw-semibold text-uppercase mb-1"
                    style={{ fontSize: "0.72rem" }}
                  >
                    Due Date
                  </div>
                  <div className="fw-bold text-dark">
                    {localCoursework.dueDate || "No due date"}
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div
                    className="text-muted small fw-semibold text-uppercase mb-1"
                    style={{ fontSize: "0.72rem" }}
                  >
                    Topic
                  </div>
                  <div className="fw-bold text-dark text-truncate">
                    {displayTopic}
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div
                    className="text-muted small fw-semibold text-uppercase mb-1"
                    style={{ fontSize: "0.72rem" }}
                  >
                    Posted
                  </div>
                  <div className="fw-bold text-dark">
                    {localCoursework.postedDate || "Recently"}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h6 className="fw-bold text-muted small text-uppercase mb-3">
                  Instructions
                </h6>
                <div
                  className="bg-light rounded-3 p-4 border"
                  style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}
                >
                  {localCoursework.instructions || "No instructions provided."}
                </div>
              </div>

              {localCoursework.attachments && localCoursework.attachments.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-bold text-muted small text-uppercase mb-3">
                    Attachments
                  </h6>
                  <div className="row g-2">
                    {localCoursework.attachments.map((att, idx) => {
                      const iconClass = getPreviewIcon(att);
                      return (
                        <div key={idx} className="col-12 col-md-6">
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="border rounded p-3 d-flex align-items-center gap-3 text-decoration-none text-dark bg-white shadow-sm hover-shadow"
                          >
                            <div
                              className="rounded d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{
                                width: "48px",
                                height: "48px",
                                backgroundColor: "#f8f9fa",
                              }}
                            >
                              <i className={`bi ${iconClass} fs-4`}></i>
                            </div>
                            <div className="overflow-hidden">
                              <div className="fw-semibold small text-truncate">
                                {att.name}
                              </div>
                              <div
                                className="text-muted text-xs text-uppercase"
                                style={{ fontSize: "0.72rem" }}
                              >
                                {att.type || 'file'}
                              </div>
                            </div>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "studentWork" && isTeacher && (
            <div>
              {isLoadingAllSubmissions ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading submissions...</span>
                  </div>
                  <p className="text-muted mt-2">Loading student submissions...</p>
                </div>
              ) : fetchError ? (
                <div className="alert alert-danger">{fetchError}</div>
              ) : (
                <>
                  <div className="row g-3 mb-4 pb-4 border-bottom">
                    <div className="col-6 col-md-3">
                      <div className="border rounded-3 p-3 bg-white text-center shadow-sm">
                        <div className="fs-2 fw-bold text-primary">{turnedInCount}</div>
                        <div className="text-muted small">Turned in</div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="border rounded-3 p-3 bg-white text-center shadow-sm">
                        <div className="fs-2 fw-bold text-warning">{assignedCount}</div>
                        <div className="text-muted small">Assigned</div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="border rounded-3 p-3 bg-white text-center shadow-sm">
                        <div className="fs-2 fw-bold text-success">{gradedCount}</div>
                        <div className="text-muted small">Graded</div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="border rounded-3 p-3 bg-white text-center shadow-sm">
                        <div className="fs-2 fw-bold text-dark">{totalStudents}</div>
                        <div className="text-muted small">Total students</div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-clipboard-check-fill text-primary"></i> Submission Review
                    </h6>
                    {studentsWithWork.length > 0 ? (
                      <div className="d-flex flex-column gap-3">
                        {studentsWithWork.map((st) => {
                          const subData = submissionsMap[st.id];
                          const savedGrade = gradeMatrix?.[st.id]?.[localCoursework.id];
                          const currentGrade = draftGradesByStudent[st.id] ?? savedGrade ?? "";
                          const gradeFromApi = subData?.submission?.grade;
                          const gradeToShow =
                            gradeFromApi !== null && gradeFromApi !== undefined
                              ? gradeFromApi
                              : currentGrade;
                          const isGraded =
                            gradeToShow !== null && gradeToShow !== undefined && gradeToShow !== "";
                          const studentName =
                            st?.first_name && st?.last_name
                              ? `${st.first_name} ${st.last_name}`
                              : st?.full_name || st?.email || "Student";
                          const studentFirstName = (studentName || "").split(" ")[0] || "Submission";

                          const isSelected = selectedStudentId === st.id;
                          const normalizeName = (value) => {
                            if (!value) return null;
                            const text = String(value).trim();
                            if (!text) return null;
                            const parts = text.replace(/\\/g, "/").split("/");
                            return parts[parts.length - 1] || null;
                          };

                          const submissionFiles = subData?.submission?.files || [];
                          const previewFiles =
                            submissionFiles.length > 0
                              ? submissionFiles.map((f, idx) => ({
                                  id: `${st.id}-${idx}`,
                                  name:
                                    normalizeName(f.file_name) ||
                                    normalizeName(f.filename) ||
                                    normalizeName(f.name) ||
                                    (f.file_path ? normalizeName(f.file_path) : `file_${idx}`),
                                  type: f.file_type || f.type || "pdf",
                                  url: f.file_path ? f.file_path : f.file_url || f.url || "#",
                                  file_path: f.file_path || null,
                                  file_url: f.file_url || f.url || null,
                                }))
                              : [
                                  {
                                    id: `${st.id}-sample`,
                                    name: `${studentFirstName}_work.pdf`,
                                    type: "pdf",
                                    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                                  },
                                ];
                          const selectedAttachment =
                            selectedAttachmentByStudent[st.id] || previewFiles[0];
                          const privateFeedback = privateFeedbackByStudent[st.id] || "";
                          const hasGrade = gradeToShow !== null && gradeToShow !== undefined && gradeToShow !== "";
                          const submissionId = subData?.submission?.id;
                          const comments = commentsMap[submissionId] || [];

                          return (
                            <div key={st.id} className="border rounded-4 p-4 bg-white shadow-sm">
                              <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                                <div className="d-flex align-items-center gap-3">
                                  <Avatar name={studentName} size={44} color="#1a73e8" />
                                  <div>
                                    <div className="fw-semibold text-dark">{studentName}</div>
                                    <div className="text-muted small">{st.email || "No email provided"}</div>
                                  </div>
                                </div>
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                  {isGraded ? (
                                    <span className="badge bg-success fs-6 font-monospace">
                                      {gradeToShow} / {localCoursework.points}
                                    </span>
                                  ) : (
                                    <span className="badge bg-warning text-dark border">Not graded</span>
                                  )}
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => setSelectedStudentId(isSelected ? null : st.id)}
                                  >
                                    {isSelected ? "Hide review" : "Review submission"}
                                  </button>
                                </div>
                              </div>

                              {isSelected && (
                                <div className="border-top mt-3 pt-3">
                                  {subData?.submission ? (
                                    <div className="row g-4">
                                      <div className="col-12 col-lg-8">
                                        <div className="border rounded-3 overflow-hidden bg-light">
                                          <div className="px-3 py-2 border-bottom bg-white d-flex justify-content-between align-items-center">
                                            <div>
                                              <div className="fw-semibold text-dark">Preview</div>
                                              <div className="small text-muted">
                                                Current file: {selectedAttachment.name}
                                              </div>
                                            </div>
                                            <span className="badge bg-light text-muted border">
                                              {selectedAttachment.type}
                                            </span>
                                          </div>
                                          <SubmissionFilePreview
                                            key={selectedAttachment?.id || selectedAttachment?.name || selectedAttachment?.url || selectedAttachment?.file_path || selectedAttachment?.file_url || "attachment"}
                                            file={selectedAttachment}
                                          />
                                        </div>
                                      </div>

                                      <div className="col-12 col-lg-4">
                                        <div className="border rounded-3 p-3 bg-white shadow-sm mb-3">
                                          <div className="mt-0">
                                            <h6 className="fw-bold text-muted small text-uppercase mb-3">
                                              <i className="bi bi-chat-left-text me-1"></i> Private Comments
                                            </h6>
                                            <div
                                              id={`comment-container-${submissionId}`}
                                              style={{ maxHeight: "370px", height: "370px", overflowY: "auto" }}
                                              className="mb-3"
                                            >
                                              {comments.length > 0 ? (
                                                comments.map((cm) => {
                                                  const senderName =
                                                    cm.user?.first_name && cm.user?.last_name
                                                      ? `${cm.user.first_name} ${cm.user.last_name}`
                                                      : cm.user?.name || "Unknown";
                                                  const date = cm.created_at
                                                    ? new Date(cm.created_at).toLocaleString()
                                                    : "Just now";
                                                  const isTeacherComment = cm.user_id !== st.id;
                                                  return (
                                                    <div key={`comment-${cm.id}-${cm.user_id || "0"}`} className="d-flex gap-3 mb-3">
                                                      <Avatar
                                                        name={senderName}
                                                        size={36}
                                                        color={isTeacherComment ? "#1a73e8" : "#00897b"}
                                                      />
                                                      <div className="flex-grow-1">
                                                        <div className="d-flex align-items-center gap-2">
                                                          <span className="fw-semibold text-dark">
                                                            {senderName}
                                                            {isTeacherComment}
                                                          </span>
                                                          <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                                                            {date}
                                                          </span>
                                                        </div>
                                                        <p
                                                          className="mb-0 text-dark"
                                                          style={{
                                                            fontSize: "0.95rem",
                                                            lineHeight: "1.5",
                                                            borderBottom: "1px solid #e9ecef",
                                                            marginRight: "20px",
                                                            paddingBottom: "0.5rem",
                                                          }}
                                                        >
                                                          {cm.comment}
                                                        </p>
                                                      </div>
                                                    </div>
                                                  );
                                                })
                                              ) : (
                                                <p className="text-muted small fst-italic">No private comments yet.</p>
                                              )}
                                            </div>

                                            <div className="d-flex gap-2 align-items-start">
                                              <Avatar
                                                name={user.first_name + " " + user.last_name}
                                                size={36}
                                                color={user.color}
                                              />
                                              <div className="flex-grow-1 d-flex gap-2">
                                                <input
                                                  type="text"
                                                  className="form-control rounded-pill px-3 py-2 shadow-none"
                                                  style={{ border: "1px solid #dadce0", backgroundColor: "#f1f3f4" }}
                                                  placeholder="Write a private comment to this student..."
                                                  value={teacherCommentInput[st.id] || ""}
                                                  onChange={(e) =>
                                                    setTeacherCommentInput((prev) => ({
                                                      ...prev,
                                                      [st.id]: e.target.value,
                                                    }))
                                                  }
                                                  onKeyDown={(e) => {
                                                    if (e.key === "Enter" && teacherCommentInput[st.id]?.trim()) {
                                                      handleSendTeacherComment(submissionId, st.id);
                                                    }
                                                  }}
                                                />
                                                <button
                                                  className="btn btn-lg border-0 px-1"
                                                  onClick={() => handleSendTeacherComment(submissionId, st.id)}
                                                  disabled={sendingTeacherComment[st.id] || !teacherCommentInput[st.id]?.trim()}
                                                >
                                                  {sendingTeacherComment[st.id] ? (
                                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                  ) : (
                                                    <i className="bi bi-send-fill"></i>
                                                  )}
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="border rounded-3 p-3 bg-white shadow-sm">
                                          <div className="mb-3">
                                            <div className="fw-semibold text-dark mb-2">Current file</div>
                                            <div className="text-muted small">{selectedAttachment.name}</div>
                                          </div>

                                          <label className="form-label small fw-bold text-muted mb-1">Grade</label>
                                          <div className="d-flex align-items-center gap-2 mb-3">
                                            <input
                                              type="number"
                                              className="form-control w-50"
                                              placeholder="--"
                                              min="0"
                                              max={localCoursework.points || 100}
                                              value={gradeToShow ?? ""}
                                              onChange={(e) => {
                                                const val = e.target.value === "" ? null : Number(e.target.value);
                                                handleGradeInputChange(st.id, val);
                                              }}
                                            />
                                            <span className="text-muted small">/ {localCoursework.points ?? 100}</span>
                                          </div>

                                          <label className="form-label small fw-bold text-muted mb-1">Feedback (for grading)</label>
                                          <textarea
                                            className="form-control mb-3"
                                            rows="4"
                                            placeholder="Add feedback for this student..."
                                            value={privateFeedback}
                                            onChange={(e) =>
                                              setPrivateFeedbackByStudent({
                                                ...privateFeedbackByStudent,
                                                [st.id]: e.target.value,
                                              })
                                            }
                                          />

                                          <div className="mb-3">
                                            <h6 className="fw-semibold text-muted small text-uppercase mb-2">Attached files</h6>
                                            <div className="d-flex flex-wrap gap-2">
                                              {previewFiles.map((file) => (
                                                <button
                                                  key={file.id}
                                                  type="button"
                                                  className={`border rounded p-2 px-3 d-flex align-items-center gap-2 text-decoration-none text-dark bg-white shadow-sm ${selectedAttachment.id === file.id ? "border-primary" : ""}`}
                                                  onClick={() =>
                                                    setSelectedAttachmentByStudent({
                                                      ...selectedAttachmentByStudent,
                                                      [st.id]: file,
                                                    })
                                                  }
                                                >
                                                  <i className={`bi ${getPreviewIcon(file)} fs-5`}></i>
                                                  <span className="small fw-medium">{file.name}</span>
                                                </button>
                                              ))}
                                            </div>
                                          </div>

                                          <div className="d-grid gap-2">
                                            <button
                                              className="btn btn-primary"
                                              onClick={() => handleReturnToStudent(st.id)}
                                              disabled={!hasGrade || returningStudentId === st.id}
                                            >
                                              {returningStudentId === st.id ? (
                                                <>
                                                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                  Returning...
                                                </>
                                              ) : (
                                                <>
                                                  <i className="bi bi-reply me-2"></i> Return to student
                                                </>
                                              )}
                                            </button>
                                            <button className="btn btn-outline-secondary">
                                              <i className="bi bi-download me-2"></i> Download all files
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center py-4 text-muted">
                                      <i className="bi bi-inbox fs-2"></i>
                                      <p>No submission data available for this student.</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-light border rounded-3">
                        <i className="bi bi-inbox text-muted fs-1 mb-2"></i>
                        <p className="text-muted small mb-0">No students have turned in work yet.</p>
                      </div>
                    )}
                  </div>
                  {studentsWithoutWork.length > 0 && (
                    <div>
                      <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                        <i className="bi bi-clock-fill text-warning"></i> Students who haven't turned in work (
                        {studentsWithoutWork.length})
                      </h6>
                      <div className="d-flex flex-column gap-2">
                        {studentsWithoutWork.map((st) => (
                          <div key={st.id} className="border rounded-3 p-3 bg-white shadow-sm">
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="d-flex align-items-center gap-3">
                                <Avatar name={st.name} size={40} color="#00897b" />
                                <div>
                                  <div className="fw-semibold text-dark">{st.name}</div>
                                  <div className="text-muted small">{st.email}</div>
                                </div>
                              </div>
                              <div>
                                <span className="badge bg-light text-muted border">Assigned</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "yourWork" && !isTeacher && (
            <div>
              {isLoadingStudentSubmission ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading your submission...</span>
                  </div>
                  <p className="text-muted mt-2">Loading your work...</p>
                </div>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                    <h5 className="fw-bold text-dark mb-0">Your Submission</h5>
                    {studentSubmission?.submission_status === "not_submitted" ? (
                      <span className="badge bg-warning text-dark">Not submitted</span>
                    ) : studentSubmission?.submission?.grade !== null &&
                      studentSubmission?.submission?.grade !== undefined ? (
                      <span className="badge bg-success">Graded</span>
                    ) : (
                      <span className="badge bg-primary">Submitted</span>
                    )}
                  </div>

                  <div className="row g-4">
                    <div className="col-12 col-md-8">
                      <div className="bg-light border rounded-3 p-3 h-100">
                        <div className="fw-semibold text-dark mb-2">
                          <i className="bi bi-chat-left-text me-1"></i> Private Comments
                        </div>
                        <div
                          id={studentSubmission?.submission?.id ? `comment-container-${studentSubmission.submission.id}` : undefined}
                          style={{ maxHeight: "462px", height: "462px", overflowY: "auto" }}
                          className="mb-3"
                        >
                          {(() => {
                            const submissionId = studentSubmission?.submission?.id;
                            const comments = submissionId ? commentsMap[submissionId] || [] : [];
                            return comments.length > 0 ? (
                              comments.map((cm) => {
                                const senderName =
                                  cm.user?.first_name && cm.user?.last_name
                                    ? `${cm.user.first_name} ${cm.user.last_name}`
                                    : cm.user?.name || "Unknown";
                                const date = cm.created_at ? new Date(cm.created_at).toLocaleString() : "Just now";
                                const isTeacherComment = cm.user_id !== user.id;
                                return (
                                  <div key={`comment-${cm.id}-${cm.user_id || "0"}`} className="d-flex gap-3 mb-3">
                                    <Avatar name={senderName} size={36} color={isTeacherComment ? "#1a73e8" : "#00897b"} />
                                    <div className="flex-grow-1">
                                      <div className="d-flex align-items-center gap-2">
                                        <span className="fw-semibold text-dark">
                                          {senderName}
                                          {isTeacherComment && " (Teacher)"}
                                        </span>
                                        <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                                          {date}
                                        </span>
                                      </div>
                                      <p
                                        className="mb-0 text-dark"
                                        style={{
                                          fontSize: "0.95rem",
                                          lineHeight: "1.5",
                                          borderBottom: "1px solid #e0e0e0",
                                          marginRight: "20px",
                                          paddingBottom: "0.5rem",
                                        }}
                                      >
                                        {cm.comment}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-muted small fst-italic">No private comments yet.</p>
                            );
                          })()}
                        </div>

                        <div className="d-flex gap-2 align-items-start">
                          <Avatar name={user.first_name + " " + user.last_name} size={36} color="#00897b" />
                          <div className="flex-grow-1 d-flex gap-2">
                            <input
                              type="text"
                              className="form-control rounded-pill px-3 py-2 shadow-none"
                              style={{ border: "1px solid #dadce0", backgroundColor: "#f1f3f4" }}
                              placeholder="Write a private comment to the teacher..."
                              value={studentCommentInput}
                              onChange={(e) => setStudentCommentInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && studentCommentInput.trim()) {
                                  handleSendStudentComment();
                                }
                              }}
                              disabled={!studentSubmission?.submission?.id || isSendingStudentComment}
                            />
                            <button
                              className="btn btn-lg border-0 px-1"
                              onClick={handleSendStudentComment}
                              disabled={
                                !studentSubmission?.submission?.id ||
                                isSendingStudentComment ||
                                !studentCommentInput.trim()
                              }
                              title={
                                !studentSubmission?.submission?.id
                                  ? "You need to submit the assignment first to send a comment."
                                  : ""
                              }
                            >
                              {isSendingStudentComment ? (
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                              ) : (
                                <i className="bi bi-send-fill"></i>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="bg-light border rounded-3 p-3 h-100">
                        {studentSubmission?.submission_status === "not_submitted" ? (
                          <>
                            <div className="text-center py-4">
                              <i className="bi bi-inbox text-muted fs-1 mb-2"></i>
                              <p className="text-muted mb-3">You haven't submitted this assignment yet.</p>
                            </div>
                            <div className="d-flex gap-2 flex-wrap justify-content-center">
                              <button
                                className="btn btn-primary fw-medium shadow-sm"
                                onClick={() => setShowFileUploadModal(true)}
                              >
                                <i className="bi bi-plus-circle me-1"></i> Add or Create & Turn In
                              </button>
                              <button
                                className="btn btn-outline-secondary fw-medium"
                                onClick={() => setShowMarkAsDoneModal(true)}
                              >
                                Mark as done
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            {studentSubmission?.submission?.files &&
                              studentSubmission.submission.files.length > 0 && (
                                <div className="mb-3">
                                  <div className="fw-semibold text-dark mb-2">Your submitted files</div>
                                  <div className="d-flex flex-wrap gap-2">
                                    {studentSubmission.submission.files.map((file, idx) => {
                                      const normalizeName = (value) => {
                                        if (!value) return null;
                                        const text = String(value).trim();
                                        if (!text) return null;
                                        const parts = text.replace(/\\/g, "/").split("/");
                                        return parts[parts.length - 1] || null;
                                      };
                                      const fileObj = {
                                        id: `sub-${idx}`,
                                        name:
                                          normalizeName(file.file_name) ||
                                          normalizeName(file.filename) ||
                                          normalizeName(file.name) ||
                                          (file.file_path ? file.file_path.split("/").pop() : "file"),
                                        type: file.file_type || "pdf",
                                        url: file.file_url || file.url || "#",
                                      };
                                      return (
                                        <a
                                          key={idx}
                                          href={fileObj.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="border rounded p-2 px-3 d-flex align-items-center gap-2 text-decoration-none text-dark bg-white shadow-sm"
                                        >
                                          <i className={`bi ${getPreviewIcon(fileObj)} fs-5`}></i>
                                          <span className="small fw-medium">{fileObj.name}</span>
                                        </a>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                            {studentSubmission?.submission?.grade !== null &&
                              studentSubmission?.submission?.grade !== undefined && (
                                <div className="mb-3">
                                  <div className="fw-semibold text-dark mb-1">Grade & Feedback</div>
                                  <div className="display-6 fw-bold text-success">
                                    {studentSubmission.submission.grade} / {localCoursework.points}
                                  </div>
                                  {studentSubmission.submission.feedback && (
                                    <div className="mt-2">
                                      <div className="fw-semibold text-dark mb-1">Feedback</div>
                                      <div className="bg-white p-3 rounded border" style={{ whiteSpace: "pre-wrap" }}>
                                        {studentSubmission.submission.feedback}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                            {studentSubmission?.submission?.status === "returned" && (
                              <div className="alert alert-info mb-3">
                                This work has been returned to you by your teacher.
                              </div>
                            )}

                            <div className="border-top pt-3">
                              <button className="btn btn-outline-primary w-100" onClick={() => setShowFileUploadModal(true)}>
                                <i className="bi bi-arrow-repeat me-1"></i> Resubmit
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ---------- Edit Assignment Modal ---------- */}
      {showEditModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <h5 className="modal-title font-google fw-bold">Edit Assignment</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Instructions</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={editFormData.instructions}
                      onChange={(e) => setEditFormData({ ...editFormData, instructions: e.target.value })}
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Max Points</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editFormData.maxPoints}
                        onChange={(e) => setEditFormData({ ...editFormData, maxPoints: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Due Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editFormData.dueDate}
                        onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Topic</label>
                      <select
                        className="form-select"
                        value={editFormData.topicId}
                        onChange={(e) => setEditFormData({ ...editFormData, topicId: e.target.value })}
                      >
                        <option value="">None</option>
                        {topics.map((topic) => (
                          <option key={topic.id} value={topic.id}>
                            {topic.topic_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Attachments</label>
                    {existingAttachments.length > 0 && (
                      <div className="mb-2">
                        <div className="small text-muted">Current attachments:</div>
                        <ul className="list-unstyled d-flex flex-wrap gap-2">
                          {existingAttachments.map((att) => (
                            <li key={att.id} className="badge bg-light text-dark border d-flex align-items-center gap-2">
                              {att.file_name || att.name}
                              <button
                                type="button"
                                className="btn btn-sm p-0 text-danger"
                                onClick={() => handleRemoveAttachment(att.id)}
                                title="Remove this attachment"
                              >
                                <i className="bi bi-x-lg"></i>
                              </button>
                            </li>
                          ))}
                        </ul>
                        <div className="small text-warning">
                          <i className="bi bi-info-circle"></i> Click the × to remove an attachment. Uploading new files will add them.
                        </div>
                      </div>
                    )}
                    <input
                      type="file"
                      className="form-control"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setEditAttachments(files);
                      }}
                    />
                    {editAttachments.length > 0 && (
                      <div className="mt-2">
                        <div className="small text-muted">New files to upload:</div>
                        <ul className="list-unstyled d-flex flex-wrap gap-2">
                          {editAttachments.map((file, idx) => (
                            <li key={idx} className="badge bg-primary text-white">
                              {file.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer border-top px-4 py-3">
                  <button type="button" className="btn btn-light fw-medium px-4" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-medium px-4" disabled={isUpdating}>
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Existing Modals (Mark as done, Upload) ---------- */}
      {showMarkAsDoneModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <h5 className="modal-title font-google fw-bold">Mark as done</h5>
                <button
                  className="btn-close"
                  onClick={() => {
                    setShowMarkAsDoneModal(false);
                    setMarkAsDoneFiles([]);
                  }}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-muted mb-3">
                  You can optionally upload files before marking this assignment as done.
                </p>
                <div className="mb-4">
                  <label className="form-label small fw-bold text-muted">Attachments (optional)</label>
                  <input
                    type="file"
                    className="form-control"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []).map((f) => {
                        try {
                          if (!f.file_name) f.file_name = f.name;
                        } catch (err) {}
                        return f;
                      });
                      setMarkAsDoneFiles(files);
                    }}
                  />
                  <small className="form-text text-muted d-block mt-2">
                    Select multiple files if needed, or leave empty to mark without files.
                  </small>
                </div>
                {markAsDoneFiles.length > 0 && (
                  <div className="mb-4">
                    <div className="fw-semibold small text-dark mb-2">Selected files ({markAsDoneFiles.length})</div>
                    <div className="d-flex flex-wrap gap-2">
                      {markAsDoneFiles.map((file, index) => (
                        <span key={`${file.file_name || file.name}-${index}`} className="badge bg-white text-dark border">
                          {file.file_name || file.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-top px-4 py-3">
                <button
                  type="button"
                  className="btn btn-light fw-medium px-4"
                  onClick={() => {
                    setShowMarkAsDoneModal(false);
                    setMarkAsDoneFiles([]);
                  }}
                >
                  Cancel
                </button>
                <button type="button" className="btn btn-primary fw-medium px-4" onClick={handleMarkAsDone} disabled={isMarkingAsDone}>
                  {isMarkingAsDone ? "Marking..." : "Mark as done"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFileUploadModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <h5 className="modal-title font-google fw-bold">
                  {studentSubmission?.submission_status === "not_submitted"
                    ? "Turn in assignment"
                    : "Resubmit assignment"}
                </h5>
                <button
                  className="btn-close"
                  onClick={() => {
                    setShowFileUploadModal(false);
                    setUploadFiles([]);
                  }}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-muted mb-3">
                  {studentSubmission?.submission_status === "not_submitted"
                    ? "Select files to submit your work."
                    : "Select new files to replace your previous submission."}
                </p>
                <div className="mb-4">
                  <label className="form-label small fw-bold text-muted">Attachments (multiple files)</label>
                  <input
                    type="file"
                    className="form-control"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []).map((f) => {
                        const normalizedName = f?.name || f?.file_name || "upload";
                        const normalizedFile =
                          f instanceof File
                            ? new File([f], normalizedName, {
                                type: f.type || "application/octet-stream",
                                lastModified: f.lastModified || Date.now(),
                              })
                            : f;
                        try {
                          normalizedFile.file_name = normalizedName;
                          normalizedFile.filename = normalizedName;
                        } catch (err) {}
                        return normalizedFile;
                      });
                      setUploadFiles(files);
                    }}
                  />
                  <small className="form-text text-muted d-block mt-2">Choose one or more files.</small>
                </div>
                {uploadFiles.length > 0 && (
                  <div className="mb-4">
                    <div className="fw-semibold small text-dark mb-2">Selected files ({uploadFiles.length})</div>
                    <div className="d-flex flex-wrap gap-2">
                      {uploadFiles.map((file, index) => (
                        <span key={`upload-${file.file_name || file.name}-${index}`} className="badge bg-white text-dark border">
                          {file.file_name || file.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-top px-4 py-3">
                <button
                  type="button"
                  className="btn btn-light fw-medium px-4"
                  onClick={() => {
                    setShowFileUploadModal(false);
                    setUploadFiles([]);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary fw-medium px-4"
                  onClick={handleUploadAndTurnIn}
                  disabled={isSubmitting || uploadFiles.length === 0}
                >
                  {isSubmitting ? "Submitting..." : "Upload & Turn In"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewInstructionPage;