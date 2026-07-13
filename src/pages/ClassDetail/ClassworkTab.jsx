// ClassworkTab.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import DocViewer, { DocViewerRenderers } from "@iamjariwala/react-doc-viewer";
import "@iamjariwala/react-doc-viewer/dist/index.css";
import { useToast } from "@/context/ToastContext.jsx";
import apiClient, {
  assignmentAPI,
  resolveAttachmentUrl,
} from "@/api/client.js";

const ClassworkTab = ({
  cls,
  user,
  onCreateCoursework,
  onSubmitCoursework,
  onCreateTopic,
  onViewInstruction,
  classwork,
}) => {
  const [selectedTopic, setSelectedTopic] = useState("All topics");
  const [expandedId, setExpandedId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [createType, setCreateType] = useState("assignment");
  const [topicName, setTopicName] = useState("");
  const [customTopics, setCustomTopics] = useState([]);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [cwTopicId, setCwTopicId] = useState(null);
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [topicActionMenuId, setTopicActionMenuId] = useState(null);
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [editingTopicName, setEditingTopicName] = useState("");
  const [showTopicActionModal, setShowTopicActionModal] = useState(false);
  const [isUpdatingTopic, setIsUpdatingTopic] = useState(false);
  const [isDeletingTopic, setIsDeletingTopic] = useState(false);

  const [topicMode, setTopicMode] = useState("existing");
  const [isCreatingNewTopic, setIsCreatingNewTopic] = useState(false);

  // Create coursework form state
  const [cwTitle, setCwTitle] = useState("");
  const [cwInstructions, setCwInstructions] = useState("");
  const [cwTopic, setCwTopic] = useState("General");
  const [cwPoints, setCwPoints] = useState("100");
  const [cwDueDate, setCwDueDate] = useState("");
  const [cwAttachments, setCwAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [localClasswork, setLocalClasswork] = useState([]);
  const { addToast } = useToast();

  // [Student search and dropdown state
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Student assignment states
  const [cwAssignToAll, setCwAssignToAll] = useState(true);
  const [cwSelectedStudents, setCwSelectedStudents] = useState([]);

  // ---------- Submissions per coursework ----------
  const [submissionsMap, setSubmissionsMap] = useState({});
  const [loadingSubmissionsMap, setLoadingSubmissionsMap] = useState({});
  const [courseworkDetailsMap, setCourseworkDetailsMap] = useState({});
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [previewMode, setPreviewMode] = useState(null);
  const [viewerError, setViewerError] = useState("");
  const [docViewerDocs, setDocViewerDocs] = useState([]);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [docxPreviewError, setDocxPreviewError] = useState("");
  const docxPreviewRef = useRef(null);
  const [isPreparingPreview, setIsPreparingPreview] = useState(false);

  // Reset function
  const resetCreateForm = () => {
    setCwTitle("");
    setCwInstructions("");
    setCwTopic("General");
    setCwTopicId(null);
    setCwPoints("100");
    setCwDueDate("");
    setCwAttachments([]);
    setCwSelectedStudents([]);
    setStudentSearchTerm("");
    setShowStudentDropdown(false);
    setIsCreatingNewTopic(false);
  };

  const normalizeTopicValue = (value) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed || "";
    }
    if (!value || typeof value !== "object") return "";
    const directName =
      value.name ||
      value.topic_name ||
      value.topicName ||
      value.label ||
      value.title ||
      value.topic;
    if (typeof directName === "string") {
      const trimmed = directName.trim();
      return trimmed || "";
    }
    return "";
  };

  const getAttachmentDisplayName = (att) => {
    if (!att) return "Unnamed";

    const candidates = [
      att.file_name,
      att.filename,
      att.fileName,
      att.original_name,
      att.originalName,
      att.display_name,
      att.displayName,
      att.name,
      att.title,
      att.label,
      att.topic,
    ];

    const name = candidates.find(
      (value) => typeof value === "string" && value.trim(),
    );
    if (name) {
      return name.trim();
    }

    const path =
      att.file_path || att.url || att.fileUrl || att.path || att.link;
    if (typeof path === "string" && path.trim()) {
      const parts = path.replace(/\\/g, "/").split("/");
      return parts[parts.length - 1] || "Unnamed";
    }
    return "Unnamed";
  };

  const isTeacher = useMemo(() => {
    if (!user) return false;
    if (typeof user.role === "string") {
      const normalized = user.role.toLowerCase();
      return (
        normalized === "teacher" ||
        normalized === "instructor" ||
        normalized === "teacher/instructor"
      );
    }
    if (user.role && typeof user.role === "object") {
      const roleName =
        user.role.role_name || user.role.name || user.role.value || "";
      const normalized = String(roleName).toLowerCase();
      return (
        normalized === "teacher" ||
        normalized === "instructor" ||
        normalized === "teacher/instructor"
      );
    }
    return Boolean(user.is_teacher || user.isTeacher);
  }, [user]);

  useEffect(() => {
    if (Array.isArray(classwork)) {
      setLocalClasswork(classwork);
    }
  }, [classwork]);

  // --- Merge assignments and quizzes into a unified classwork list ---
  const classworkList = useMemo(() => {
    const sourceWork =
      Array.isArray(localClasswork) && localClasswork.length
        ? localClasswork
        : Array.isArray(classwork) && classwork.length
          ? classwork
          : null;

    if (sourceWork) {
      return sourceWork.map((item) => {
        const detail = courseworkDetailsMap[item.id] || {};
        const attachments = (detail.attachments || item.attachments || []).map(
          (att) => ({
            name: getAttachmentDisplayName(att),
            url: att.file_path
              ? resolveAttachmentUrl(att.file_path)
              : att.url || att.fileUrl || "#",
            type:
              att.file_type ||
              att.type ||
              getAttachmentPreviewMode(att) ||
              "file",
          }),
        );

        return {
          ...item,
          topic: normalizeTopicValue(item.topic) || "General",
          instructions:
            detail.instructions ||
            item.instructions ||
            item.description ||
            "No instructions provided.",
          attachments,
        };
      });
    }

    const assignments = (cls.assignments || []).map((a) => ({
      id: a.id,
      title: a.title,
      dueDate: a.due_date,
      points: a.max_points || 100,
      type: "assignment",
      topic: normalizeTopicValue(a.topic) || "General",
      instructions: a.instructions || "No instructions provided.",
      attachments: (a.attachments || []).map((att) => ({
        name: getAttachmentDisplayName(att),
        url: att.file_path ? resolveAttachmentUrl(att.file_path) : "#",
        type: att.file_type || "file",
      })),
      postedDate: a.created_at
        ? new Date(a.created_at).toLocaleDateString()
        : "recently",
      stats: a.stats || null,
    }));

    const quizzes = (cls.quizzes || []).map((q) => ({
      id: q.id,
      title: q.title,
      dueDate: q.due_date,
      points: q.max_points || 100,
      type: "quiz",
      topic: normalizeTopicValue(q.topic) || "General",
      instructions: q.instructions || "No instructions provided.",
      attachments: (q.attachments || []).map((att) => ({
        name: getAttachmentDisplayName(att),
        url: att.file_path ? resolveAttachmentUrl(att.file_path) : "#",
        type: att.file_type || "file",
      })),
      postedDate: q.created_at
        ? new Date(q.created_at).toLocaleDateString()
        : "recently",
      stats: q.stats || null,
    }));
    return [...assignments, ...quizzes];
  }, [
    localClasswork,
    classwork,
    cls.assignments,
    cls.quizzes,
    courseworkDetailsMap,
  ]);

  const fetchCourseworkDetails = async (courseworkId) => {
    if (!courseworkId) return;
    if (courseworkDetailsMap[courseworkId]) return;

    const coursework = classworkList.find((item) => item.id === courseworkId);
    if (!coursework || coursework.type !== "assignment") return;

    try {
      const res = await assignmentAPI.getAssignmentDetails(courseworkId);
      const data = res.data?.data || res.data || {};
      const parsedAttachments = (data.attachments || []).map((att) => ({
        ...att,
        name: getAttachmentDisplayName(att),
        url: att.file_path
          ? resolveAttachmentUrl(att.file_path)
          : att.url || att.fileUrl || "#",
        type: att.file_type || att.type || "file",
      }));

      setCourseworkDetailsMap((prev) => ({
        ...prev,
        [courseworkId]: {
          instructions:
            data.instructions || data.description || coursework.instructions,
          attachments: parsedAttachments,
        },
      }));
    } catch (error) {
      console.error("Failed to load coursework details:", error);
    }
  };

  useEffect(() => {
    if (!isTeacher || !expandedId) return;
    fetchCourseworkDetails(expandedId);
    fetchSubmissionsForCoursework(expandedId);
  }, [expandedId, isTeacher]);

  useEffect(() => {
    setSubmissionStatus((prev) => {
      const next = { ...prev };
      classworkList.forEach((cw) => {
        const hasSubmission = Boolean(
          cw.submitted ||
          cw.userSubmitted ||
          cw.userSubmission?.status === "submitted" ||
          cw.userSubmission?.status === "turned_in" ||
          cw.userSubmission?.status === "graded" ||
          cw.status === "submitted" ||
          (Array.isArray(cw.submissions) &&
            cw.submissions.some((sub) =>
              ["submitted", "turned_in", "graded"].includes(sub?.status),
            )),
        );
        if (hasSubmission) next[cw.id] = true;
      });
      return next;
    });
  }, [classworkList]);

  useEffect(() => {
    let mounted = true;

    const loadTopics = async () => {
      if (!cls?.id) return;
      try {
        const res = await apiClient.get(`/dropdown/topics?class_id=${cls.id}`);
        const topicsFromApi = (res.data?.data || []).map((topic) => ({
          id: topic.id ?? topic.topic_id ?? null,
          name: topic.topic_name || topic.name || topic.topicName || "",
        }));
        if (mounted) {
          setAvailableTopics(topicsFromApi.filter((topic) => topic.name));
        }
      } catch (error) {
        console.error("Failed to load topics:", error);
      }
    };

    loadTopics();
    return () => {
      mounted = false;
    };
  }, [cls?.id]);

  const topics = useMemo(() => {
    const topicList = [
      ...customTopics,
      ...(Array.isArray(cls?.topics) ? cls.topics : [])
        .map((topic) => normalizeTopicValue(topic))
        .filter(Boolean),
      ...availableTopics.map((topic) => normalizeTopicValue(topic.name)),
      ...classworkList.map((cw) => normalizeTopicValue(cw.topic) || "General"),
    ];
    const uniqueTopics = Array.from(new Set(topicList.filter(Boolean)));
    return ["All topics", ...uniqueTopics];
  }, [classworkList, customTopics, cls?.topics, availableTopics]);

  const topicOptions = useMemo(() => {
    const merged = [
      ...availableTopics.map((topic) => ({
        id: topic.id,
        name: normalizeTopicValue(topic.name),
      })),
      ...customTopics.map((topicName) => ({
        id: null,
        name: normalizeTopicValue(topicName),
      })),
    ];
    return merged.filter((topic, index, arr) => {
      const firstIndex = arr.findIndex((item) => item.name === topic.name);
      return firstIndex === index;
    });
  }, [availableTopics, customTopics]);

  const filteredWork =
    selectedTopic === "All topics"
      ? classworkList
      : classworkList.filter((cw) => cw.topic === selectedTopic);

  const groupedWork = filteredWork.reduce((acc, cw) => {
    const topic = normalizeTopicValue(cw.topic) || "No topic";
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(cw);
    return acc;
  }, {});

  // ---------- Fetch submissions for a specific coursework ----------
  const fetchSubmissionsForCoursework = async (cwId) => {
    if (!cwId || !isTeacher) return;
    if (submissionsMap[cwId] || loadingSubmissionsMap[cwId]) return;

    setLoadingSubmissionsMap((prev) => ({ ...prev, [cwId]: true }));

    try {
      const students = cls.students || [];
      if (students.length === 0) {
        setSubmissionsMap((prev) => ({
          ...prev,
          [cwId]: { turnedIn: 0, graded: 0, submissions: [] },
        }));
        setLoadingSubmissionsMap((prev) => ({ ...prev, [cwId]: false }));
        return;
      }

      const promises = students.map(async (st) => {
        try {
          const res = await assignmentAPI.getStudentAssignmentSubmission(
            cwId,
            st.id,
          );
          const data = res.data?.data || res.data;
          return { studentId: st.id, data };
        } catch (err) {
          console.error(
            `Failed to fetch submission for student ${st.id}:`,
            err,
          );
          return { studentId: st.id, data: null };
        }
      });

      const results = await Promise.all(promises);

      let turnedIn = 0;
      let graded = 0;
      const submissions = [];

      results.forEach(({ studentId, data }) => {
        if (data && data.submission_status !== "not_submitted") {
          turnedIn++;
          if (
            data.submission?.grade !== null &&
            data.submission?.grade !== undefined
          ) {
            graded++;
          }
          submissions.push({
            studentId,
            ...data,
          });
        }
      });

      setSubmissionsMap((prev) => ({
        ...prev,
        [cwId]: { turnedIn, graded, submissions },
      }));
    } catch (err) {
      console.error("Failed to fetch submissions for coursework:", err);
      setSubmissionsMap((prev) => ({
        ...prev,
        [cwId]: { turnedIn: 0, graded: 0, submissions: [] },
      }));
    } finally {
      setLoadingSubmissionsMap((prev) => ({ ...prev, [cwId]: false }));
    }
  };

  useEffect(() => {
    if (!isTeacher || !expandedId) return;
    fetchSubmissionsForCoursework(expandedId);
  }, [expandedId, isTeacher]);

  // ---------- Handlers ----------
  const getAttachmentPreviewMode = (att) => {
    if (!att) return null;

    const name = String(
      att.name || att.file_name || att.filename || att.fileName || "",
    ).toLowerCase();
    const type = String(att.type || "").toLowerCase();
    const extension = name.includes(".") ? name.split(".").pop() : type;

    const imageExtensions = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"];
    const pdfExtensions = ["pdf"];
    const documentExtensions = ["doc", "xls", "xlsx", "ppt", "pptx"];

    if (imageExtensions.includes(extension)) return "image";
    if (pdfExtensions.includes(extension)) return "pdf";
    if (extension === "docx") return "docx";
    if (documentExtensions.includes(extension)) return "document";
    return null;
  };

  const getAttachmentPreviewUrl = (att) => {
    if (!att) return null;
    const url =
      att.url || att.file_path || att.fileUrl || att.path || att.link;
    if (!url || url === "#") return null;
    return resolveAttachmentUrl(url);
  };

  const getAttachmentUrlCandidates = (url) => {
    if (!url || url === "#") return [];

    const normalized = String(url).trim();
    const candidates = [normalized];

    if (normalized.includes("/public/api/lms_files/")) {
      candidates.push(
        normalized.replace(/\/public\/api\/lms_files\//i, "/lms_files/"),
      );
      candidates.push(
        normalized.replace(/\/public\/api\/lms_files\//i, "/public/lms_files/"),
      );
    }

    if (normalized.includes("/public/lms_files/")) {
      candidates.push(
        normalized.replace(/\/public\/lms_files\//i, "/lms_files/"),
      );
    }

    if (normalized.startsWith("/")) {
      candidates.push(`${window.location.origin}${normalized}`);
    }

    return Array.from(new Set(candidates.filter(Boolean)));
  };

  const openAttachmentPreview = (att) => {
    const mode = getAttachmentPreviewMode(att);
    if (!mode) {
      if (att?.url && att.url !== "#") {
        window.open(att.url, "_blank", "noopener,noreferrer");
      }
      return;
    }

    setPreviewAttachment(att);
    setPreviewMode(mode);
  };

  const closeAttachmentPreview = () => {
    setPreviewAttachment(null);
    setPreviewMode(null);
    setPreviewImageUrl(null);
    setViewerError("");
    setDocxPreviewError("");
    setDocViewerDocs([]);
    setIsPreparingPreview(false);
    if (docxPreviewRef.current) docxPreviewRef.current.innerHTML = "";
  };

  useEffect(() => {
    let cancelled = false;

    const preparePreview = async () => {
      if (!previewAttachment || !previewMode) {
        setPreviewImageUrl(null);
        setDocViewerDocs([]);
        setViewerError("");
        setIsPreparingPreview(false);
        return;
      }

      const previewUrl = getAttachmentPreviewUrl(previewAttachment);
      if (!previewUrl) {
        if (!cancelled) {
          setViewerError("The attachment URL is not available.");
          setDocViewerDocs([]);
          setIsPreparingPreview(false);
        }
        return;
      }

      const shouldUseViewer =
        previewMode === "pdf" ||
        previewMode === "document" ||
        previewMode === "image" ||
        previewMode === "docx";
      if (!shouldUseViewer) {
        if (!cancelled) {
          setDocViewerDocs([]);
          setViewerError("");
          setDocxPreviewError("");
          setIsPreparingPreview(false);
        }
        return;
      }

      if (!cancelled) {
        setIsPreparingPreview(true);
        setViewerError("");
      }

      if (previewMode === "image") {
        if (!cancelled) {
          setPreviewImageUrl(previewUrl);
          setDocViewerDocs([]);
          setViewerError("");
          setDocxPreviewError("");
          setIsPreparingPreview(false);
        }
        return;
      }

      if (previewMode === "docx") {
        if (!cancelled) {
          setDocViewerDocs([]);
          setViewerError("");
          setDocxPreviewError("");
          setIsPreparingPreview(false);
        }
        return;
      }

      try {
        let resolvedUrl = previewUrl;
        const candidates = getAttachmentUrlCandidates(previewUrl);

        for (const candidate of candidates) {
          try {
            const response = await fetch(candidate, {
              method: "HEAD",
              mode: "cors",
            });

            if (!cancelled && response.ok) {
              resolvedUrl = candidate;
              break;
            }
          } catch (candidateError) {
            continue;
          }
        }

        if (cancelled) return;

        if (!resolvedUrl) {
          setViewerError(
            "This attachment could not be loaded because the file is unavailable.",
          );
          setDocViewerDocs([]);
          setIsPreparingPreview(false);
          return;
        }

        const finalResponse = await fetch(resolvedUrl, {
          method: "HEAD",
          mode: "cors",
        });

        if (cancelled) return;

        if (!finalResponse.ok) {
          setViewerError(
            "This attachment could not be loaded because the file is unavailable.",
          );
          setDocViewerDocs([]);
          setIsPreparingPreview(false);
          return;
        }

        setDocViewerDocs([
          {
            uri: resolvedUrl,
            fileName: previewAttachment.name || "attachment",
          },
        ]);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to prepare attachment preview:", error);
          setViewerError(
            "This attachment could not be loaded because the file is unavailable.",
          );
          setDocViewerDocs([]);
        }
      } finally {
        if (!cancelled) {
          setIsPreparingPreview(false);
        }
      }
    };

    preparePreview();

    return () => {
      cancelled = true;
    };
  }, [previewAttachment?.url, previewAttachment?.name, previewMode]);

  const handleAddTopic = async (e) => {
    e.preventDefault();
    const trimmedTopic = topicName.trim();
    if (!trimmedTopic) return;

    setIsCreatingTopic(true);
    try {
      const created = await onCreateTopic?.(trimmedTopic);
      if (created !== false) {
        const normalizedTopic =
          created && typeof created === "object"
            ? {
                id: created.id ?? created.topic_id ?? null,
                name:
                  created.name ||
                  created.topic_name ||
                  created.topicName ||
                  trimmedTopic,
              }
            : { id: null, name: trimmedTopic };

        setCustomTopics((prev) =>
          prev.includes(normalizedTopic.name)
            ? prev
            : [...prev, normalizedTopic.name],
        );
        if (normalizedTopic.id) {
          setAvailableTopics((prev) => {
            const exists = prev.some((item) => item.id === normalizedTopic.id);
            return exists
              ? prev.map((item) =>
                  item.id === normalizedTopic.id
                    ? { ...item, name: normalizedTopic.name }
                    : item,
                )
              : [...prev, normalizedTopic];
          });
        }
        setSelectedTopic(normalizedTopic.name);
        setCwTopic(normalizedTopic.name);
        setCwTopicId(normalizedTopic.id ?? null);
        setTopicName("");
        setShowTopicModal(false);
      }
    } catch (error) {
      console.error("Failed to create topic:", error);
    } finally {
      setIsCreatingTopic(false);
    }
  };

  const handleRenameTopic = async (topic) => {
    const trimmedName = editingTopicName.trim();
    if (!trimmedName || !topic?.id) return;

    setIsUpdatingTopic(true);
    try {
      const res = await apiClient.post(`/update/topics/${topic.id}`, {
        topic_name: trimmedName,
      });
      const updatedTopic = res.data?.data;
      const updatedName = updatedTopic?.topic_name || trimmedName;

      setAvailableTopics((prev) =>
        prev.map((item) =>
          item.id === topic.id ? { ...item, name: updatedName } : item,
        ),
      );
      setCustomTopics((prev) => prev.filter((name) => name !== topic.name));
      setLocalClasswork((prev) =>
        prev.map((item) =>
          normalizeTopicValue(item.topic) === topic.name
            ? { ...item, topic: updatedName }
            : item,
        ),
      );
      if (selectedTopic === topic.name) {
        setSelectedTopic(updatedName);
      }
      setEditingTopicId(null);
      setEditingTopicName("");
      setTopicActionMenuId(null);
      setShowTopicActionModal(false);
      addToast("Topic renamed successfully.", "success");
    } catch (error) {
      console.error("Failed to rename topic:", error);
      addToast("Could not rename the topic.", "error");
    } finally {
      setIsUpdatingTopic(false);
    }
  };

  const handleDeleteTopic = async (topic) => {
    if (!topic?.id) return;

    setIsDeletingTopic(true);
    try {
      await apiClient.post(`/archive/topics/${topic.id}`);
      setAvailableTopics((prev) => prev.filter((item) => item.id !== topic.id));
      setCustomTopics((prev) => prev.filter((name) => name !== topic.name));
      setTopicActionMenuId(null);
      setShowTopicActionModal(false);
      addToast("Topic deleted successfully.", "success");
    } catch (error) {
      console.error("Failed to delete topic:", error);
      addToast("Could not delete the topic.", "error");
    } finally {
      setIsDeletingTopic(false);
    }
  };

  const ensureTopicExists = async (topicValue) => {
    const trimmedTopic = topicValue?.trim();
    if (!trimmedTopic) return { id: null, name: "General" };

    const normalizedInput = trimmedTopic.toLowerCase();
    const existingTopic = availableTopics.find(
      (topic) => topic.name?.toLowerCase() === normalizedInput,
    );

    if (existingTopic) {
      return {
        id: existingTopic.id ?? null,
        name: existingTopic.name,
      };
    }

    try {
      setIsCreatingTopic(true);
      const res = await apiClient.post("/create/topics", {
        topic_name: trimmedTopic,
      });
      const createdTopic = res.data?.data || {};
      const normalizedTopic = {
        id: createdTopic.id ?? createdTopic.topic_id ?? null,
        name: createdTopic.topic_name || createdTopic.name || trimmedTopic,
      };

      setAvailableTopics((prev) => {
        const exists = prev.some((item) => item.id === normalizedTopic.id);
        return exists
          ? prev.map((item) =>
              item.id === normalizedTopic.id ? normalizedTopic : item,
            )
          : [...prev, normalizedTopic];
      });
      setCustomTopics((prev) =>
        prev.includes(normalizedTopic.name)
          ? prev
          : [...prev, normalizedTopic.name],
      );

      return normalizedTopic;
    } catch (error) {
      console.error("Failed to create topic from assignment modal:", error);
      addToast("Could not create the topic. Please try again.", "error");
      return null;
    } finally {
      setIsCreatingTopic(false);
    }
  };

  // Helper to get avatar URL or generate fallback
  const getStudentAvatar = (student) => {
    // Try common field names
    const avatar =
      student.avatar ||
      student.profile_pic ||
      student.photo ||
      student.photo_url ||
      student.picture;
    if (avatar) return avatar;
    return null; // fallback will use initials
  };

  // Generate a consistent color based on name
  const stringToColor = (str) => {
    if (!str) return "#6c757d";
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = "#";
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += ("00" + value.toString(16)).substr(-2);
    }
    return color;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!cwTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const resolvedTopic = await ensureTopicExists(cwTopic || "General");
      if (!resolvedTopic) return;

      const finalTopicName = resolvedTopic.name || "General";
      const finalTopicId = resolvedTopic.id ?? cwTopicId ?? null;

      const payload =
        createType === "assignment"
          ? (() => {
              const formData = new FormData();
              formData.append("class_id", cls.id);
              formData.append("title", cwTitle.trim());
              formData.append("instructions", cwInstructions.trim());
              formData.append("max_points", Number(cwPoints) || 100);
              formData.append("topic", finalTopicName);
              if (finalTopicId) {
                formData.append("topic_id", finalTopicId);
              }
              if (cwDueDate) formData.append("due_date", cwDueDate);

              // --- Send attachments and raw filenames ---
              cwAttachments.forEach((file) => {
                if (file instanceof File) {
                  formData.append("attachments[]", file);
                  formData.append("file_name", file.name);
                  formData.append("file_names[]", file.name);
                }
              });

              // Assign students
              if (cwAssignToAll) {
                formData.append("assign_to_all", "true");
              } else if (cwSelectedStudents.length > 0) {
                cwSelectedStudents.forEach((studentId) => {
                  formData.append("student_ids[]", studentId);
                });
              }
              if (!cwAssignToAll && cwSelectedStudents.length === 0) {
                addToast(
                  "Please select at least one student or choose 'All students'.",
                  "warning",
                );
                setIsSubmitting(false);
                return;
              }

              return { type: "assignment", data: formData };
            })()
          : {
              title: cwTitle.trim(),
              type: createType,
              topic: finalTopicName,
              dueDate: createType === "material" ? null : cwDueDate,
              points:
                createType === "material" ? null : Number(cwPoints) || 100,
              instructions: cwInstructions.trim(),
              attachments: [
                {
                  type: "pdf",
                  name: `${cwTitle.replace(/\s+/g, "_")}_Docs.pdf`,
                  url: "#",
                },
              ],
              postedDate: "Today",
            };

      const created = await onCreateCoursework(cls.id, payload);
      if (created !== false) {
        // Reset form
        setCwTitle("");
        setCwInstructions("");
        setCwTopic("General");
        setCwTopicId(null);
        setCwPoints("100");
        setCwDueDate("");
        setCwAttachments([]);
        setCwAssignToAll(true);
        setCwSelectedStudents([]);
        setShowCreateModal(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add student to selection
  const addStudent = (studentId) => {
    if (!cwSelectedStudents.includes(studentId)) {
      setCwSelectedStudents((prev) => [...prev, studentId]);
    }
  };

  // [NEW] Remove student from selection
  const removeStudent = (studentId) => {
    setCwSelectedStudents((prev) => prev.filter((id) => id !== studentId));
  };

  // [NEW] Filtered students based on search term
  const filteredStudents = useMemo(() => {
    if (!studentSearchTerm.trim()) return cls.students || [];
    const term = studentSearchTerm.toLowerCase().trim();
    return (cls.students || []).filter((student) => {
      const name = (
        student.name ||
        student.full_name ||
        student.username ||
        ""
      ).toLowerCase();
      const email = (student.email || "").toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }, [studentSearchTerm, cls.students]);

  const handleStudentTurnIn = async (cw) => {
    if (
      !onSubmitCoursework ||
      submissionStatus[cw.id] ||
      submittingId === cw.id
    )
      return;

    setSubmittingId(cw.id);
    try {
      const ok = await onSubmitCoursework(cls.id, cw.id);
      if (ok !== false) {
        setSubmissionStatus((prev) => ({ ...prev, [cw.id]: true }));
      }
    } catch (error) {
      console.error("Failed to turn in coursework:", error);
      addToast("Could not turn in the coursework right now.", "error");
    } finally {
      setSubmittingId(null);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "assignment":
        return "bi-clipboard-check-fill";
      case "quiz":
        return "bi-card-checklist";
      case "material":
        return "bi-bookmark-fill";
      case "question":
        return "bi-question-circle-fill";
      default:
        return "bi-file-earmark-text-fill";
    }
  };

  // ---------- Render ----------
  return (
    <div>
      {/* Top Action Bar (unchanged) */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom gap-3">
        <div className="d-flex align-items-center gap-2">
          {isTeacher && (
            <div className="dropdown">
              <button
                className="btn text-white rounded-pill px-3 py-2 fw-medium shadow-sm d-flex align-items-center gap-2"
                style={{ backgroundColor: "#1a73e8" }}
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-plus-lg fs-5"></i>
                <span>Create</span>
              </button>
              <ul className="dropdown-menu shadow my-2 border">
                <li>
                  <button
                    className="dropdown-item py-2 d-flex align-items-center gap-2"
                    onClick={() => {
                      setCreateType("assignment");
                      setShowCreateModal(true);
                    }}
                  >
                    <i className="bi bi-clipboard-check text-primary"></i>{" "}
                    Assignment
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item py-2 d-flex align-items-center gap-2"
                    onClick={() => {
                      setCreateType("quiz");
                      setShowCreateModal(true);
                    }}
                  >
                    <i className="bi bi-card-checklist text-success"></i> Quiz
                    assignment
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item py-2 d-flex align-items-center gap-2"
                    onClick={() => {
                      setCreateType("question");
                      setShowCreateModal(true);
                    }}
                  >
                    <i className="bi bi-question-circle text-warning"></i>{" "}
                    Question
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item py-2 d-flex align-items-center gap-2"
                    onClick={() => {
                      setCreateType("material");
                      setShowCreateModal(true);
                    }}
                  >
                    <i className="bi bi-bookmark text-info"></i> Material
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item py-2 d-flex align-items-center gap-2"
                    onClick={() => setShowTopicModal(true)}
                  >
                    <i className="bi bi-tag text-secondary"></i> Topic
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="d-flex align-items-center gap-3 flex-wrap">
          <button className="btn btn-sm btn-light border rounded-pill px-3 d-flex align-items-center gap-2 text-dark fw-medium py-2">
            <i className="bi bi-camera-video text-success fs-6"></i> Meet
          </button>
          <button className="btn btn-sm btn-light border rounded-pill px-3 d-flex align-items-center gap-2 text-dark fw-medium py-2">
            <i className="bi bi-calendar-date text-primary fs-6"></i> Calendar
          </button>
          <button
            className="btn btn-sm btn-light border rounded-pill px-3 d-flex align-items-center gap-2 text-dark fw-medium py-2"
            onClick={() => window.open("https://drive.google.com", "_blank")}
          >
            <i className="bi bi-folder2-open text-warning fs-6"></i> Class Drive
            folder
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Topic Sidebar Pills (unchanged) */}
        <div className="col-12 col-md-3">
          <h6 className="fw-bold text-muted small text-uppercase mb-3 px-1">
            Topics
          </h6>
          <div className="d-flex flex-md-column gap-2 flex-wrap">
            {topics.map((t, idx) => (
              <div
                key={idx}
                className={`topic-pill text-truncate ${selectedTopic === t ? "active" : ""}`}
                onClick={() => setSelectedTopic(t)}
                title={t}
              >
                <span className="flex-grow-1 text-truncate">{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Classwork Accordion List */}
        <div className="col-12 col-md-9">
          {Object.keys(groupedWork).length > 0 ? (
            Object.entries(groupedWork).map(([topicName, items]) => (
              <div key={topicName} className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                  <div className="d-flex align-items-center gap-2">
                    <h4
                      className="font-google fw-bold text-dark mb-0"
                      style={{ color: cls.themeColor || "#1a73e8" }}
                    >
                      {topicName}
                    </h4>
                    {(() => {
                      const topicMeta = topicOptions.find(
                        (item) => item.name === topicName,
                      );
                      return isTeacher && topicMeta?.id ? (
                        <div className="position-relative">
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTopicId(topicMeta.id);
                              setEditingTopicName(topicMeta.name);
                              setTopicActionMenuId(topicMeta.id ?? topicName);
                              setShowTopicActionModal(true);
                            }}
                          >
                            <i className="bi bi-three-dots"></i>
                          </button>
                        </div>
                      ) : null;
                    })()}
                  </div>
                  <span className="badge bg-light text-muted border">
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </span>
                </div>

                <div className="d-flex flex-column gap-2">
                  {items.map((cw) => {
                    const isExpanded = expandedId === cw.id;
                    const subInfo = submissionsMap[cw.id];
                    const turnedIn =
                      subInfo?.turnedIn ?? cw.stats?.turnedIn ?? 0;
                    const graded = subInfo?.graded ?? cw.stats?.graded ?? 0;
                    const assigned =
                      cw.stats?.assigned ?? cls.students?.length ?? 0;
                    const isLoading = loadingSubmissionsMap[cw.id];

                    return (
                      <div
                        key={cw.id}
                        className="card border shadow-sm rounded-3 overflow-hidden"
                      >
                        {/* Header Row (unchanged) */}
                        <div
                          className={`p-3 d-flex align-items-center justify-content-between ${isExpanded ? "bg-light border-bottom" : "bg-white"}`}
                          style={{
                            cursor: "pointer",
                            transition: "background 0.15s",
                          }}
                          onClick={() =>
                            setExpandedId(isExpanded ? null : cw.id)
                          }
                        >
                          <div className="d-flex align-items-center gap-3 overflow-hidden">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0 shadow-sm"
                              style={{
                                width: "40px",
                                height: "40px",
                                backgroundColor: cls.themeColor || "#1a73e8",
                              }}
                            >
                              <i
                                className={`bi ${getTypeIcon(cw.type)} fs-5`}
                              ></i>
                            </div>
                            <div className="overflow-hidden">
                              <h6
                                className="fw-bold mb-1 text-dark text-truncate"
                                style={{ fontSize: "0.98rem" }}
                              >
                                {cw.title}
                              </h6>
                              <span className="text-muted small">
                                Posted {cw.postedDate || "recently"}{" "}
                                {cw.points ? `• ${cw.points} points` : ""}
                              </span>
                            </div>
                          </div>

                          <div className="d-flex align-items-center gap-3 flex-shrink-0 ms-2">
                            {cw.dueDate && (
                              <span className="text-muted small fw-medium d-none d-sm-inline">
                                Due{" "}
                                {new Date(cw.dueDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </span>
                            )}
                            <i
                              className={`bi bi-chevron-${isExpanded ? "up" : "down"} text-secondary`}
                            ></i>
                          </div>
                        </div>

                        {/* Expanded Details Body */}
                        {isExpanded && (
                          <div className="card-body p-4 bg-white animate-fade-in">
                            <div className="row g-4">
                              <div
                                className={
                                  isTeacher ? "col-12 col-lg-8" : "col-12"
                                }
                              >
                                <p
                                  className="text-dark mb-4"
                                  style={{
                                    whiteSpace: "pre-wrap",
                                    lineHeight: "1.6",
                                  }}
                                >
                                  {cw.instructions ||
                                    "No instructions provided."}
                                </p>

                                {cw.attachments &&
                                  cw.attachments.length > 0 && (
                                    <div>
                                      <h6 className="fw-semibold small text-muted text-uppercase mb-2">
                                        Attachments
                                      </h6>
                                      <div className="d-flex flex-wrap gap-2">
                                        {cw.attachments.map((att, idx) => {
                                          // Determine icon based on file type
                                          let iconClass =
                                            "bi-file-earmark-text-fill text-secondary";
                                          if (att.type === "pdf")
                                            iconClass =
                                              "bi-file-earmark-pdf-fill text-danger";
                                          else if (
                                            [
                                              "jpg",
                                              "jpeg",
                                              "png",
                                              "gif",
                                              "svg",
                                            ].includes(att.type?.toLowerCase())
                                          ) {
                                            iconClass =
                                              "bi-file-earmark-image-fill text-info";
                                          } else if (
                                            att.type === "doc" ||
                                            att.type === "docx"
                                          ) {
                                            iconClass =
                                              "bi-file-earmark-word-fill text-primary";
                                          } else if (
                                            att.type === "xls" ||
                                            att.type === "xlsx"
                                          ) {
                                            iconClass =
                                              "bi-file-earmark-excel-fill text-success";
                                          } else if (
                                            att.type === "ppt" ||
                                            att.type === "pptx"
                                          ) {
                                            iconClass =
                                              "bi-file-earmark-slides-fill text-warning";
                                          } else if (
                                            att.type === "zip" ||
                                            att.type === "rar"
                                          ) {
                                            iconClass =
                                              "bi-file-earmark-zip-fill text-muted";
                                          }

                                          return (
                                            <button
                                              key={idx}
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openAttachmentPreview(att);
                                              }}
                                              className="border rounded p-2 px-3 d-flex align-items-center gap-2 text-decoration-none text-dark bg-light hover-bg-white shadow-sm"
                                            >
                                              <i
                                                className={`bi ${iconClass} fs-5`}
                                              ></i>
                                              <span className="small fw-medium">
                                                {att.name}
                                              </span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                              </div>

                              {/* Teacher Stats or Student Action Box */}
                              <div className="col-12 col-lg-4 border-start-lg">
                                {isTeacher ? (
                                  <div className="p-3 bg-light rounded-3 text-center border">
                                    <h6 className="fw-bold text-muted small text-uppercase mb-3">
                                      Submission Summary
                                    </h6>
                                    {isLoading ? (
                                      <div className="py-2">
                                        <div
                                          className="spinner-border spinner-border-sm text-primary"
                                          role="status"
                                        >
                                          <span className="visually-hidden">
                                            Loading...
                                          </span>
                                        </div>
                                        <div className="text-muted small mt-1">
                                          Loading submissions...
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="d-flex justify-content-around mb-3">
                                        <div>
                                          <div className="fs-3 fw-bolder text-primary">
                                            {turnedIn}
                                          </div>
                                          <div className="text-muted small">
                                            Turned in
                                          </div>
                                        </div>
                                        <div className="border-end"></div>
                                        <div>
                                          <div className="fs-3 fw-bolder text-dark">
                                            {assigned}
                                          </div>
                                          <div className="text-muted small">
                                            Assigned
                                          </div>
                                        </div>
                                        <div className="border-end"></div>
                                        <div>
                                          <div className="fs-3 fw-bolder text-success">
                                            {graded}
                                          </div>
                                          <div className="text-muted small">
                                            Graded
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    <button
                                      className="btn btn-sm btn-outline-primary w-100 fw-medium"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onViewInstruction?.(cw, {
                                          openTab: "studentWork",
                                        });
                                      }}
                                    >
                                      View submissions
                                    </button>
                                  </div>
                                ) : (
                                  <div className="p-3 bg-light rounded-3 border text-center">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                      <span className="fw-bold small text-dark">
                                        Your work
                                      </span>
                                      <span
                                        className={`badge ${submissionStatus[cw.id] ? "bg-success" : "bg-warning text-dark"} small`}
                                      >
                                        {submissionStatus[cw.id]
                                          ? "Turned in"
                                          : "Assigned"}
                                      </span>
                                    </div>
                                    <p className="text-muted small mb-3">
                                      Upload your completed files or mark as
                                      done.
                                    </p>
                                    <button
                                      className="btn btn-primary btn-sm w-100 fw-medium mb-2 shadow-sm"
                                      onClick={() => handleStudentTurnIn(cw)}
                                      disabled={
                                        submissionStatus[cw.id] ||
                                        submittingId === cw.id
                                      }
                                    >
                                      {submissionStatus[cw.id]
                                        ? "Turned in"
                                        : "+ Add or Create & Turn In"}
                                    </button>
                                    <button className="btn btn-outline-secondary btn-sm w-100 fw-medium">
                                      Mark as done
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="border-top mt-4 pt-3 d-flex justify-content-between align-items-center">
                              <button className="btn btn-link btn-sm p-0 text-decoration-none fw-medium text-secondary">
                                <i className="bi bi-chat-left-text me-1"></i>{" "}
                                Add class comment
                              </button>
                              <button
                                className="btn btn-link btn-sm p-0 text-decoration-none fw-medium text-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewInstruction?.(cw);
                                }}
                              >
                                View instructions
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-5 bg-white border rounded-3 shadow-sm">
              <i className="bi bi-journal-check text-muted fs-1 mb-2"></i>
              <h6 className="fw-semibold text-dark">
                No coursework in this topic
              </h6>
              <p className="text-muted small mb-0">
                Check another topic or click "+ Create" to assign work.
              </p>
            </div>
          )}
        </div>
      </div>

      {previewAttachment && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1050 }}
          tabIndex="-1"
          onClick={closeAttachmentPreview}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-bottom px-4 py-3">
                <div className="d-flex align-items-center">
                  {/* Group: title + eye icon */}
                  {previewAttachment.url && previewAttachment.url !== "#" && (
                    <div className="d-flex align-items-center gap-2">
                      <h5 className="modal-title fw-bold text-dark">
                        {previewAttachment.name || "Attachment preview"}
                      </h5>
                      <a
                        href={previewAttachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted"
                      >
                        <i className="bi bi-eye"></i>
                      </a>
                    </div>
                  )}

                  {/* Close button pushed to the right */}
                  <button
                    type="button"
                    className="btn-close ms-auto"
                    onClick={closeAttachmentPreview}
                    aria-label="Close"
                  ></button>
                </div>
              </div>
              <div className="modal-body p-0" style={{ minHeight: "70vh" }}>
                {previewMode === "image" ? (
                  <div className="position-relative w-100" style={{ minHeight: "70vh" }}>
                    {isPreparingPreview ? (
                      <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                        <div className="text-center">
                          <div className="spinner-border mb-2" role="status" />
                          <div>Preparing preview...</div>
                        </div>
                      </div>
                    ) : previewImageUrl ? (
                      <img
                        src={previewImageUrl}
                        alt={previewAttachment?.name || "Attachment preview"}
                        className="w-100"
                        style={{ maxHeight: "75vh", objectFit: "contain", padding: "1rem" }}
                      />
                    ) : viewerError ? (
                      <div className="d-flex flex-column justify-content-center align-items-center text-center p-5 h-100">
                        <i className="bi bi-exclamation-triangle-fill fs-1 text-warning mb-3"></i>
                        <h6 className="fw-semibold text-dark">Preview unavailable</h6>
                        <p className="text-muted small mb-3">{viewerError}</p>
                        <a
                          href={previewAttachment?.url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline-primary btn-sm"
                        >
                          Open file directly
                        </a>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {(previewMode === "pdf" || previewMode === "document" || previewMode === "docx") &&
                getAttachmentPreviewUrl(previewAttachment) ? (
                  <div className="w-100 h-100" style={{ minHeight: "70vh" }}>
                    {viewerError ? (
                      <div className="d-flex flex-column justify-content-center align-items-center text-center p-5 h-100">
                        <i className="bi bi-exclamation-triangle-fill fs-1 text-warning mb-3"></i>
                        <h6 className="fw-semibold text-dark">
                          Preview unavailable
                        </h6>
                        <p className="text-muted small mb-3">{viewerError}</p>
                        <a
                          href={getAttachmentPreviewUrl(previewAttachment)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline-primary btn-sm"
                        >
                          Open file directly
                        </a>
                      </div>
                    ) : (
                      <div style={{ height: "70vh", width: "100%" }}>
                        {previewMode === "docx" ? (
                          <div className="p-3 bg-white h-100" style={{ minHeight: "70vh" }}>
                            <iframe
                              title="Word preview"
                              src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(getAttachmentPreviewUrl(previewAttachment))}`}
                              className="w-100 h-100"
                              style={{ border: 0, minHeight: "70vh" }}
                            />
                            <div className="mt-2 text-center">
                              <a
                                href={getAttachmentPreviewUrl(previewAttachment)}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-outline-primary btn-sm"
                              >
                                Open file directly
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div style={{ height: "70vh", width: "100%" }}>
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
                                  header: {
                                    disableHeader: false,
                                  },
                                  pdfVerticalScrollByDefault: true,
                                }}
                                style={{ height: "100%", width: "100%" }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Topic Actions Modal (unchanged) */}
      {showTopicActionModal && editingTopicId && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <h5 className="modal-title font-google fw-bold">
                  Manage topic
                </h5>
                <button
                  className="btn-close"
                  onClick={() => {
                    setShowTopicActionModal(false);
                    setEditingTopicId(null);
                    setEditingTopicName("");
                    setTopicActionMenuId(null);
                  }}
                ></button>
              </div>
              <div className="modal-body p-4">
                <label className="form-label small fw-bold text-muted">
                  Topic name
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={editingTopicName}
                  onChange={(e) => setEditingTopicName(e.target.value)}
                  placeholder="Enter topic name"
                  autoFocus
                />
              </div>
              <div className="modal-footer border-top px-4 py-3">
                <button
                  type="button"
                  className="btn btn-light fw-medium px-4"
                  onClick={() => {
                    setShowTopicActionModal(false);
                    setEditingTopicId(null);
                    setEditingTopicName("");
                    setTopicActionMenuId(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger fw-medium px-4"
                  onClick={() => {
                    const topicMeta = topicOptions.find(
                      (item) => item.id === editingTopicId,
                    );
                    if (topicMeta) handleDeleteTopic(topicMeta);
                  }}
                  disabled={isDeletingTopic}
                >
                  {isDeletingTopic ? "Deleting..." : "Delete"}
                </button>
                <button
                  type="button"
                  className="btn btn-primary fw-medium px-4"
                  onClick={() => {
                    const topicMeta = topicOptions.find(
                      (item) => item.id === editingTopicId,
                    );
                    if (topicMeta) handleRenameTopic(topicMeta);
                  }}
                  disabled={isUpdatingTopic || !editingTopicName.trim()}
                >
                  {isUpdatingTopic ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Topic Modal (unchanged) */}
      {showTopicModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <h5 className="modal-title font-google fw-bold">Add topic</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowTopicModal(false)}
                ></button>
              </div>

              <form onSubmit={handleAddTopic}>
                <div className="modal-body p-4">
                  <label className="form-label small fw-bold text-muted">
                    Topic name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter a topic name"
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="modal-footer border-top px-4 py-3">
                  <button
                    type="button"
                    className="btn btn-light fw-medium px-4"
                    onClick={() => setShowTopicModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary fw-medium px-4"
                    disabled={isCreatingTopic}
                  >
                    {isCreatingTopic ? "Adding..." : "Add topic"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <h5 className="modal-title font-google fw-bold text-capitalize">
                  Create {createType.replace("-", " ")}
                </h5>
                <button
                  className="btn-close"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                ></button>
              </div>

              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body p-4">
                  {/* Title */}
                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      id="cwTitle"
                      placeholder="Title"
                      value={cwTitle}
                      onChange={(e) => setCwTitle(e.target.value)}
                      required
                      autoFocus
                    />
                    <label htmlFor="cwTitle">Title (required)</label>
                  </div>

                  {/* Instructions */}
                  <div className="form-floating mb-3">
                    <textarea
                      className="form-control"
                      id="cwInstr"
                      placeholder="Instructions (optional)"
                      style={{ minHeight: "120px" }}
                      value={cwInstructions}
                      onChange={(e) => setCwInstructions(e.target.value)}
                    />
                    <label htmlFor="cwInstr">Instructions (optional)</label>
                  </div>

                  {/* Attachments (only for assignments) */}
                  {createType === "assignment" && (
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-muted">
                        Attachments (optional)
                      </label>
                      <input
                        type="file"
                        className="form-control"
                        multiple
                        onChange={(e) =>
                          setCwAttachments(Array.from(e.target.files || []))
                        }
                      />
                      {/* Display selected file names */}
                      {cwAttachments.length > 0 && (
                        <div className="mt-2">
                          <small className="text-muted">Selected files:</small>
                          <ul className="list-unstyled small mb-0">
                            {cwAttachments.map((file, idx) => (
                              <li
                                key={idx}
                                className="d-flex align-items-center gap-2"
                              >
                                <i className="bi bi-file-earmark-text"></i>
                                <span>{file.name}</span>
                                <span className="text-muted">
                                  ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Topic, Points, Due Date */}
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold text-muted">
                        Topic
                      </label>
                      {!isCreatingNewTopic ? (
                        <select
                          className="form-select"
                          value={cwTopicId ? String(cwTopicId) : ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "__new__") {
                              setIsCreatingNewTopic(true);
                              setCwTopic("");
                              setCwTopicId(null);
                              return;
                            }
                            const matchedTopic = availableTopics.find(
                              (topic) => String(topic.id) === val,
                            );
                            setCwTopic(matchedTopic?.name || "");
                            setCwTopicId(matchedTopic?.id ?? null);
                          }}
                        >
                          <option value="">Select a topic</option>
                          {topicOptions.map((topic) => (
                            <option
                              key={topic.id ?? topic.name}
                              value={String(topic.id ?? topic.name)}
                            >
                              {topic.name || "Unnamed topic"}
                            </option>
                          ))}
                          <option value="__new__">+ Create new topic</option>
                        </select>
                      ) : (
                        <>
                          <input
                            type="text"
                            className="form-control"
                            value={cwTopic}
                            onChange={(e) => {
                              setCwTopic(e.target.value);
                              setCwTopicId(null);
                            }}
                            placeholder="Enter new topic name"
                            autoFocus
                          />
                          <div className="mt-2">
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0 text-decoration-none"
                              onClick={() => {
                                setIsCreatingNewTopic(false);
                                if (availableTopics.length > 0) {
                                  const first = availableTopics[0];
                                  setCwTopic(first.name);
                                  setCwTopicId(first.id);
                                } else {
                                  setCwTopic("General");
                                  setCwTopicId(null);
                                }
                              }}
                            >
                              ← Choose existing topic
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {createType !== "material" && (
                      <>
                        <div className="col-6 col-md-4">
                          <label className="form-label small fw-bold text-muted">
                            Points
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={cwPoints}
                            onChange={(e) => setCwPoints(e.target.value)}
                            min="0"
                            max="1000"
                          />
                        </div>
                        <div className="col-6 col-md-4">
                          <label className="form-label small fw-bold text-muted">
                            Due Date
                          </label>
                          <input
                            type="date"
                            className="form-control"
                            value={cwDueDate}
                            onChange={(e) => setCwDueDate(e.target.value)}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* ===== STUDENT ASSIGNMENT (always visible) ===== */}
                  {/* Student assignment – always visible with avatars */}
                  {createType === "assignment" && (
                    <div className="mb-3 border-top pt-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label small fw-bold text-muted mb-0">
                          Assign to students
                        </label>
                        <div>
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-decoration-none p-0 me-2"
                            onClick={() => {
                              const allIds = (cls.students || []).map(
                                (s) => s.id,
                              );
                              setCwSelectedStudents(allIds);
                              setStudentSearchTerm("");
                              setShowStudentDropdown(false);
                            }}
                          >
                            Select all
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-decoration-none p-0 text-danger"
                            onClick={() => {
                              setCwSelectedStudents([]);
                              setStudentSearchTerm("");
                              setShowStudentDropdown(false);
                            }}
                          >
                            Clear all
                          </button>
                        </div>
                      </div>

                      <div ref={dropdownRef}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Type student name or email to add..."
                          value={studentSearchTerm}
                          onChange={(e) => {
                            setStudentSearchTerm(e.target.value);
                            setShowStudentDropdown(true);
                          }}
                          onFocus={() => setShowStudentDropdown(true)}
                          onBlur={() => {
                            setTimeout(
                              () => setShowStudentDropdown(false),
                              150,
                            );
                          }}
                          autoComplete="off"
                        />

                        {/* Dropdown with avatars */}
                        {showStudentDropdown && filteredStudents.length > 0 && (
                          <ul
                            className="list-group mt-1 shadow-sm"
                            style={{
                              maxHeight: "200px",
                              overflowY: "auto",
                              position: "relative",
                              zIndex: 1050,
                            }}
                          >
                            {filteredStudents.map((student) => {
                              const isSelected = cwSelectedStudents.includes(
                                student.id,
                              );
                              const displayName =
                                student.first_name + " " + student.last_name ||
                                student.full_name ||
                                student.username ||
                                "Unnamed";
                              const displayEmail = student.email || "";
                              const avatarUrl = getStudentAvatar(student);
                              const initials = displayName
                                .split(" ")
                                .map((word) => word[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2);
                              const bgColor = stringToColor(displayName);

                              return (
                                <li
                                  key={student.id}
                                  className={`list-group-item list-group-item-action d-flex align-items-center gap-3 ${
                                    isSelected ? "active" : ""
                                  }`}
                                  style={{ cursor: "pointer" }}
                                  onClick={() => {
                                    if (isSelected) {
                                      removeStudent(student.id);
                                    } else {
                                      addStudent(student.id);
                                    }
                                    setStudentSearchTerm("");
                                    setShowStudentDropdown(false);
                                  }}
                                >
                                  {avatarUrl ? (
                                    <img
                                      src={avatarUrl}
                                      alt={displayName}
                                      className="rounded-circle"
                                      style={{
                                        width: "32px",
                                        height: "32px",
                                        objectFit: "cover",
                                      }}
                                    />
                                  ) : (
                                    <span
                                      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                                      style={{
                                        width: "32px",
                                        height: "32px",
                                        backgroundColor: bgColor,
                                        fontSize: "0.75rem",
                                        flexShrink: 0,
                                      }}
                                    >
                                      {initials}
                                    </span>
                                  )}
                                  <div className="flex-grow-1">
                                    <div className="fw-semibold">
                                      {displayName}
                                    </div>
                                    <small
                                      className={
                                        isSelected ? "text-light" : "text-muted"
                                      }
                                    >
                                      {displayEmail}
                                    </small>
                                  </div>
                                  {isSelected && (
                                    <i className="bi bi-check-circle-fill text-light"></i>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}

                        {/* Selected tags with avatars */}
                        {cwSelectedStudents.length > 0 && (
                          <div className="d-flex flex-wrap gap-2 mt-2">
                            {cwSelectedStudents.map((studentId) => {
                              const student = cls.students?.find(
                                (s) => s.id === studentId,
                              );
                              if (!student) return null;
                              const displayName =
                                student.name ||
                                student.first_name + " " + student.last_name ||
                                student.username ||
                                "Student";
                              const displayEmail = student.email || "";
                              const avatarUrl = getStudentAvatar(student);
                              const initials = displayName
                                .split(" ")
                                .map((word) => word[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2);
                              const bgColor = stringToColor(displayName);

                              return (
                                <span
                                  key={studentId}
                                  className="badge bg-light text-dark d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill border"
                                  style={{ fontSize: "0.9rem" }}
                                >
                                  {avatarUrl ? (
                                    <img
                                      src={avatarUrl}
                                      alt={displayName}
                                      className="rounded-circle"
                                      style={{
                                        width: "20px",
                                        height: "20px",
                                        objectFit: "cover",
                                      }}
                                    />
                                  ) : (
                                    <span
                                      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                                      style={{
                                        width: "20px",
                                        height: "20px",
                                        backgroundColor: bgColor,
                                        fontSize: "0.6rem",
                                        flexShrink: 0,
                                      }}
                                    >
                                      {initials}
                                    </span>
                                  )}
                                  <span>{displayName}</span>
                                  {displayEmail && (
                                    <span
                                      className="text-muted small"
                                      style={{ fontSize: "0.7rem" }}
                                    >
                                      {displayEmail}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    className="btn-close btn-close-sm ms-1"
                                    aria-label="Remove"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeStudent(studentId);
                                    }}
                                  ></button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {cwSelectedStudents.length === 0 && (
                          <div className="text-muted small mt-1">
                            No students selected – assignment will not be
                            visible to anyone.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer border-top px-4 py-3">
                  <button
                    type="button"
                    className="btn btn-light fw-medium px-4"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetCreateForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn text-white fw-medium px-4"
                    style={{ backgroundColor: cls.themeColor || "#1a73e8" }}
                    disabled={
                      !cwTitle.trim() ||
                      isSubmitting ||
                      (createType === "assignment" &&
                        cwSelectedStudents.length === 0)
                    }
                  >
                    {isSubmitting
                      ? "Creating..."
                      : createType === "assignment"
                        ? "Create assignment"
                        : "Assign"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassworkTab;
