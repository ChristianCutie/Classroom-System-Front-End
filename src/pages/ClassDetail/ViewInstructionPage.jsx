// ViewInstructionPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { renderAsync } from "docx-preview";
import Avatar from "../../components/Common/Avatar.jsx";
import { assignmentAPI } from "@/api/client.js";

// ---------- helpers (unchanged) ----------
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
    return "office";
  return "unsupported";
};

const getPreviewUrl = (file) => {
  const url = file?.url;
  if (!url || url === "#") return null;
  const ext = getFileExtension(file);
  if (
    [
      "doc",
      "docx",
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
    ].includes(ext)
  ) {
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
  }
  return url;
};

const getPreviewIcon = (file) => {
  switch (getPreviewMode(file)) {
    case "image":
      return "bi-image-fill text-success";
    case "pdf":
      return "bi-file-earmark-pdf-fill text-danger";
    case "docx":
      return "bi-file-earmark-word-fill text-primary";
    case "office":
      return "bi-file-earmark-word-fill text-primary";
    default:
      return "bi-file-earmark-text-fill text-secondary";
  }
};

// ---------- SubmissionFilePreview (unchanged) ----------
const SubmissionFilePreview = ({ file }) => {
  const containerRef = useRef(null);
  const [previewError, setPreviewError] = useState("");
  const previewMode = getPreviewMode(file);
  const previewUrl = getPreviewUrl(file);

  useEffect(() => {
    let cancelled = false;
    const renderPreview = async () => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = "";
      setPreviewError("");
      if (previewMode !== "docx" || !previewUrl) return;
      try {
        const response = await fetch(previewUrl);
        if (!response.ok) throw new Error("Unable to load document");
        const arrayBuffer = await response.arrayBuffer();
        if (cancelled) return;
        await renderAsync(arrayBuffer, containerRef.current, undefined, {
          className: "docx-preview",
          inWrapper: true,
          ignoreWidth: false,
          breakPages: true,
          useBase64URL: false,
        });
      } catch (err) {
        if (!cancelled) {
          containerRef.current.innerHTML = "";
          setPreviewError("Unable to render this Word document preview.");
        }
      }
    };
    renderPreview();
    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [file?.id, file?.name, file?.url, previewMode, previewUrl]);

  if (previewMode === "pdf" && previewUrl) {
    return (
      <iframe
        title="Preview"
        src={previewUrl}
        className="w-100"
        style={{ minHeight: "420px", border: 0 }}
      />
    );
  }
  if (previewMode === "image" && previewUrl) {
    return (
      <div
        className="d-flex justify-content-center align-items-center p-3 bg-white"
        style={{ minHeight: "420px" }}
      >
        <img
          src={previewUrl}
          alt={file?.name || "Preview"}
          style={{ maxWidth: "100%", maxHeight: "400px", objectFit: "contain" }}
        />
      </div>
    );
  }
  if (previewMode === "docx" && previewUrl) {
    return (
      <div className="p-3 bg-white" style={{ minHeight: "420px" }}>
        <div
          ref={containerRef}
          className="docx-preview-container"
          style={{ minHeight: "380px", overflow: "auto" }}
        />
        {previewError && (
          <p className="text-muted small mt-2 mb-0">{previewError}</p>
        )}
      </div>
    );
  }
  if (previewMode === "office" && previewUrl) {
    return (
      <iframe
        title="Preview"
        src={previewUrl}
        className="w-100"
        style={{ minHeight: "420px", border: 0 }}
      />
    );
  }
  return (
    <div
      className="d-flex flex-column justify-content-center align-items-center text-center p-5"
      style={{ minHeight: "420px" }}
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
};

// ---------- MAIN COMPONENT ----------
const ViewInstructionPage = ({
  cls,
  coursework,
  user,
  students,
  gradeMatrix,
  onBack,
  onSubmitWork,
  onUpdateGrade,
  onReturnWork,
  defaultActiveTab = "instructions",
}) => {
  const [activeTab, setActiveTab] = useState(
    defaultActiveTab || "instructions",
  );
  const [studentComment, setStudentComment] = useState("");
  const [privateComments, setPrivateComments] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [submissionState, setSubmissionState] = useState({ submitted: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSubmissionFiles, setSelectedSubmissionFiles] = useState([]);
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [selectedAttachmentByStudent, setSelectedAttachmentByStudent] =
    useState({});
  const [privateFeedbackByStudent, setPrivateFeedbackByStudent] = useState({});
  const [draftGradesByStudent, setDraftGradesByStudent] = useState({});
  const [savingStudentId, setSavingStudentId] = useState(null);
  const [returningStudentId, setReturningStudentId] = useState(null);
  const [showMarkAsDoneModal, setShowMarkAsDoneModal] = useState(false);
  const [markAsDoneFiles, setMarkAsDoneFiles] = useState([]);
  const [isMarkingAsDone, setIsMarkingAsDone] = useState(false);
  const autoOpenReviewRef = useRef(false);

  // ---------- Teacher: all submissions map ----------
  const [submissionsMap, setSubmissionsMap] = useState({});
  const [isLoadingAllSubmissions, setIsLoadingAllSubmissions] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // ---------- Student: own submission data ----------
  const [studentSubmission, setStudentSubmission] = useState(null);
  const [isLoadingStudentSubmission, setIsLoadingStudentSubmission] =
    useState(false);

  // ---------- Teacher private comment input per student ----------
  const [teacherPrivateComment, setTeacherPrivateComment] = useState({});
  const [sendingPrivateComment, setSendingPrivateComment] = useState({});

  // ---------- Student private comment edit states ----------
  const [isEditingPrivateComment, setIsEditingPrivateComment] = useState(false);
  const [editPrivateCommentText, setEditPrivateCommentText] = useState("");

  // ---------- Student resubmit states ----------
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [resubmitFiles, setResubmitFiles] = useState([]);
  const [resubmitComment, setResubmitComment] = useState("");
  const [teacherSentComment, setTeacherSentComment] = useState({});

  // Student comment send
  const [studentPrivateCommentInput, setStudentPrivateCommentInput] =
    useState("");
  const [isSendingStudentComment, setIsSendingStudentComment] = useState(false);

  // Turn-in modal
  const [showTurnInModal, setShowTurnInModal] = useState(false);
  const [turnInFiles, setTurnInFiles] = useState([]);
  const [turnInComment, setTurnInComment] = useState("");

  // ---------- Student send private comment ----------
  const handleSendStudentPrivateComment = async () => {
    const submissionId = studentSubmission?.submission?.id;
    const comment = studentPrivateCommentInput.trim();
    if (!submissionId || !comment) return;

    setIsSendingStudentComment(true);
    try {
      await assignmentAPI.sendPrivateComment(submissionId, {
        private_comment: comment,
      });
      // Update local studentSubmission
      setStudentSubmission((prev) => ({
        ...prev,
        submission: {
          ...prev.submission,
          private_comment: comment,
        },
      }));
      setStudentPrivateCommentInput("");
      alert("Private comment sent.");
    } catch (err) {
      console.error("Error sending private comment:", err);
      alert("Could not send private comment. Please try again.");
    } finally {
      setIsSendingStudentComment(false);
    }
  };

  // ---------- Student update private comment handler ----------
  const handleStudentUpdatePrivateComment = async () => {
    const submissionId = studentSubmission?.submission?.id;
    if (!submissionId || !editPrivateCommentText.trim()) return;

    try {
      await assignmentAPI.sendPrivateComment(submissionId, {
        private_comment: editPrivateCommentText.trim(),
      });
      // Update local studentSubmission
      setStudentSubmission((prev) => ({
        ...prev,
        submission: {
          ...prev.submission,
          private_comment: editPrivateCommentText.trim(),
        },
      }));
      setIsEditingPrivateComment(false);
      setEditPrivateCommentText("");
      alert("Private comment updated.");
    } catch (err) {
      console.error("Error updating private comment:", err);
      alert("Could not update private comment.");
    }
  };

  // ---------- Student resubmit handler ----------
  const handleResubmit = async () => {
    if (!onSubmitWork || isResubmitting) return;
    // Use the existing submission's private comment if the user didn't update it
    const comment =
      resubmitComment.trim() ||
      studentSubmission?.submission?.private_comment ||
      "";
    setIsResubmitting(true);
    try {
      const ok = await onSubmitWork(cls.id, coursework.id, resubmitFiles, {
        private_comment: comment,
        studentId: user?.id,
        studentName: user?.name,
        studentEmail: user?.email,
        className: cls?.name,
        assignmentTitle: coursework?.title,
        submittedAt: new Date().toISOString(),
        status: "submitted",
      });
      if (ok !== false) {
        setSubmissionState({ submitted: true });
        setResubmitFiles([]);
        setResubmitComment("");
        // Refetch student submission after resubmission
        const res = await assignmentAPI.getStudentAssignmentSubmission(
          coursework.id,
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

  // ---------- Helper functions ----------
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
    typeof coursework.topic === "string"
      ? coursework.topic.trim() || "No topic"
      : normalizeTopicValue(coursework.topic) || "No topic";

  // ---------- Fetch teacher submissions ----------
  useEffect(() => {
    if (
      !isTeacher ||
      activeTab !== "studentWork" ||
      !coursework?.id ||
      !students?.length
    ) {
      if (activeTab !== "studentWork") setSubmissionsMap({});
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
              coursework.id,
              st.id,
            );
            const data = res.data?.data || res.data;
            map[st.id] = data;
          } catch (err) {
            console.error(
              `Failed to fetch submission for student ${st.id}:`,
              err,
            );
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
  }, [activeTab, coursework?.id, isTeacher, students]);

  // ---------- Fetch student's own submission ----------
  useEffect(() => {
    if (isTeacher || activeTab !== "yourWork" || !coursework?.id || !user?.id) {
      if (activeTab !== "yourWork") setStudentSubmission(null);
      return;
    }

    const fetchMySubmission = async () => {
      setIsLoadingStudentSubmission(true);
      try {
        const res = await assignmentAPI.getStudentAssignmentSubmission(
          coursework.id,
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
  }, [activeTab, coursework?.id, isTeacher, user?.id]);

  // ---------- Compute teacher counts ----------
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
    return (
      data?.submission?.grade !== null && data?.submission?.grade !== undefined
    );
  }).length;
  const totalStudents = students.length;
  const assignedCount = totalStudents;

  // Auto-open first student's review for teacher
  useEffect(() => {
    if (!isTeacher || activeTab !== "studentWork" || isLoadingAllSubmissions)
      return;
    if (autoOpenReviewRef.current) return;
    if (studentsWithWork.length > 0) {
      autoOpenReviewRef.current = true;
      setSelectedStudentId(studentsWithWork[0].id);
    }
  }, [activeTab, isTeacher, isLoadingAllSubmissions, studentsWithWork]);

  // ---------- Other effects ----------
  useEffect(() => {
    setActiveTab(defaultActiveTab || "instructions");
  }, [defaultActiveTab]);

  useEffect(() => {
    autoOpenReviewRef.current = false;
  }, [coursework?.id]);

  useEffect(() => {
    const submitted = Boolean(
      coursework?.submitted ||
      coursework?.userSubmission?.status === "submitted" ||
      coursework?.userSubmission?.status === "turned_in" ||
      coursework?.userSubmission?.status === "graded" ||
      coursework?.status === "submitted" ||
      coursework?.submissions?.some((sub) =>
        ["submitted", "turned_in", "graded"].includes(sub?.status),
      ),
    );
    setSubmissionState({ submitted });
  }, [
    coursework?.id,
    coursework?.submitted,
    coursework?.status,
    coursework?.userSubmission?.status,
    coursework?.submissions?.length,
  ]);

  useEffect(() => {
    const nextDrafts = {};
    students.forEach((st) => {
      nextDrafts[st.id] = gradeMatrix?.[st.id]?.[coursework.id] ?? null;
    });
    setDraftGradesByStudent(nextDrafts);
  }, [students, coursework?.id, gradeMatrix]);

  // ---------- Handlers ----------
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
        await onUpdateGrade(cls.id, studentId, coursework.id, score, feedback);
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
      const savedGrade = gradeMatrix?.[studentId]?.[coursework.id];
      if (String(score) !== String(savedGrade ?? "")) {
        await saveGrade(studentId, score, feedback);
        setDraftGradesByStudent((prev) => ({ ...prev, [studentId]: score }));
      }
      if (onReturnWork) {
        await onReturnWork(cls.id, coursework.id, studentId, score, feedback);
        alert(
          `Returned work to ${students.find((s) => s.id === studentId)?.name || "student"}`,
        );
      }
    } catch (err) {
      console.error("Error returning work:", err);
      alert("Could not return work. Please try again.");
    } finally {
      setReturningStudentId(null);
    }
  };

  const handleSendPrivateComment = async (submissionId, studentId) => {
    const comment = teacherPrivateComment[studentId]?.trim();
    if (!comment) return;

    setSendingPrivateComment((prev) => ({ ...prev, [studentId]: true }));
    try {
      await assignmentAPI.sendPrivateComment(submissionId, {
        private_comment: comment,
      });
      setSubmissionsMap((prev) => {
        const updated = { ...prev };
        if (updated[studentId]?.submission) {
          updated[studentId].submission.private_comment = comment;
        }
        return updated;
      });
      // 👇 Set flag that teacher sent comment for this student
      setTeacherSentComment((prev) => ({ ...prev, [studentId]: true }));
      setTeacherPrivateComment((prev) => ({ ...prev, [studentId]: "" }));
      alert("Private comment sent to student.");
    } catch (err) {
      console.error("Error sending private comment:", err);
      alert("Could not send private comment. Please try again.");
    } finally {
      setSendingPrivateComment((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  const handleTurnInWork = async () => {
    if (!turnInFiles.length) {
      alert("Please select at least one file.");
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      turnInFiles.forEach((file) => {
        formData.append("files[]", file);
      });
      if (turnInComment.trim()) {
        formData.append("private_comment", turnInComment.trim());
      }

      const response = await assignmentAPI.submitAssignment(
        coursework.id,
        formData,
      );
      if (response.status === 200 || response.status === 201) {
        // Update local state
        setSubmissionState({ submitted: true });
        // Refetch student submission to get updated data
        const res = await assignmentAPI.getStudentAssignmentSubmission(
          coursework.id,
          user.id,
        );
        setStudentSubmission(res.data?.data || res.data);
        // Close modal and reset
        setShowTurnInModal(false);
        setTurnInFiles([]);
        setTurnInComment("");
        // Optionally call onSubmitWork for parent side effects (without redirect)
        // but we'll skip to avoid navigation.
      } else {
        alert("Submission failed. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting:", error);
      alert("Could not submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsDone = async () => {
    if (!onSubmitWork || submissionState.submitted || isMarkingAsDone) return;
    setIsMarkingAsDone(true);
    try {
      const ok = await onSubmitWork(cls.id, coursework.id, markAsDoneFiles, {
        private_comment: submissionMessage.trim(),
        studentId: user?.id,
        studentName: user?.name,
        studentEmail: user?.email,
        className: cls?.name,
        assignmentTitle: coursework?.title,
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
            coursework.id,
            user.id,
          );
          setStudentSubmission(res.data?.data || res.data);
        }
      }
    } finally {
      setIsMarkingAsDone(false);
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
            minHeight: "120px",
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
                className={`bi ${coursework.type === "quiz" ? "bi-card-checklist" : "bi-clipboard-check"} fs-3`}
              ></i>
            </div>
            <div className="text-white">
              <h3
                className="font-google fw-bold mb-1"
                style={{ fontSize: "1.5rem" }}
              >
                {coursework.title}
              </h3>
              <div className="small text-white text-opacity-90">
                {cls.name} • {displayTopic}
              </div>
            </div>
          </div>
          {isTeacher && (
            <div className="d-none d-md-flex gap-4 text-white text-center">
              <div>
                <div className="fs-3 fw-bold">{turnedInCount}</div>
                <div className="small text-white text-opacity-90">
                  Turned in
                </div>
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
                    <div className="small text-white text-opacity-90">
                      Graded
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
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
          {/* ---------- INSTRUCTIONS TAB ---------- */}
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
                    {coursework.points !== null &&
                    coursework.points !== undefined
                      ? coursework.points
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
                    {coursework.dueDate || "No due date"}
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
                    {coursework.postedDate || "Recently"}
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
                  {coursework.instructions || "No instructions provided."}
                </div>
              </div>

              {coursework.attachments && coursework.attachments.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-bold text-muted small text-uppercase mb-3">
                    Attachments
                  </h6>
                  <div className="row g-2">
                    {coursework.attachments.map((att, idx) => (
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
                            <i
                              className={`bi fs-4 ${att.type === "pdf" ? "bi-file-earmark-pdf-fill text-danger" : att.type === "form" ? "bi-file-earmark-check-fill text-purple" : att.type === "youtube" ? "bi-youtube text-danger" : "bi-file-earmark-word-fill text-primary"}`}
                            ></i>
                          </div>
                          <div className="overflow-hidden">
                            <div className="fw-semibold small text-truncate">
                              {att.name}
                            </div>
                            <div
                              className="text-muted text-xs text-uppercase"
                              style={{ fontSize: "0.72rem" }}
                            >
                              {att.type}
                            </div>
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------- TEACHER: STUDENT WORK TAB ---------- */}
          {activeTab === "studentWork" && isTeacher && (
            // ... (unchanged, same as before) ...
            <div>
              {isLoadingAllSubmissions ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">
                      Loading submissions...
                    </span>
                  </div>
                  <p className="text-muted mt-2">
                    Loading student submissions...
                  </p>
                </div>
              ) : fetchError ? (
                <div className="alert alert-danger">{fetchError}</div>
              ) : (
                <>
                  <div className="row g-3 mb-4 pb-4 border-bottom">
                    <div className="col-6 col-md-3">
                      <div className="border rounded-3 p-3 bg-white text-center shadow-sm">
                        <div className="fs-2 fw-bold text-primary">
                          {turnedInCount}
                        </div>
                        <div className="text-muted small">Turned in</div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="border rounded-3 p-3 bg-white text-center shadow-sm">
                        <div className="fs-2 fw-bold text-warning">
                          {assignedCount}
                        </div>
                        <div className="text-muted small">Assigned</div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="border rounded-3 p-3 bg-white text-center shadow-sm">
                        <div className="fs-2 fw-bold text-success">
                          {gradedCount}
                        </div>
                        <div className="text-muted small">Graded</div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="border rounded-3 p-3 bg-white text-center shadow-sm">
                        <div className="fs-2 fw-bold text-dark">
                          {totalStudents}
                        </div>
                        <div className="text-muted small">Total students</div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-clipboard-check-fill text-primary"></i>{" "}
                      Submission Review
                    </h6>
                    {studentsWithWork.length > 0 ? (
                      <div className="d-flex flex-column gap-3">
                        {studentsWithWork.map((st) => {
                          const subData = submissionsMap[st.id];
                          const savedGrade =
                            gradeMatrix?.[st.id]?.[coursework.id];
                          const currentGrade =
                            draftGradesByStudent[st.id] ?? savedGrade ?? "";
                          const gradeFromApi = subData?.submission?.grade;
                          const gradeToShow =
                            gradeFromApi !== null && gradeFromApi !== undefined
                              ? gradeFromApi
                              : currentGrade;
                          const isGraded =
                            gradeToShow !== null &&
                            gradeToShow !== undefined &&
                            gradeToShow !== "";
                          const studentName =
                            st?.name || st?.full_name || st?.email || "Student";
                          const studentFirstName =
                            (studentName || "").split(" ")[0] || "Submission";

                          const isSelected = selectedStudentId === st.id;
                          const submissionFiles =
                            subData?.submission?.files || [];
                          const previewFiles =
                            submissionFiles.length > 0
                              ? submissionFiles.map((f, idx) => ({
                                  id: `${st.id}-${idx}`,
                                  name:
                                    f.file_name || f.filename || `file_${idx}`,
                                  type: f.file_type || f.type || "pdf",
                                  url: f.file_url || f.url || "#",
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
                            selectedAttachmentByStudent[st.id] ||
                            previewFiles[0];
                          const privateFeedback =
                            privateFeedbackByStudent[st.id] || "";
                          const hasGrade =
                            gradeToShow !== null &&
                            gradeToShow !== undefined &&
                            gradeToShow !== "";
                          const submissionId = subData?.submission?.id;
                          const currentPrivateComment =
                            subData?.submission?.private_comment || "";

                          // Determine if the teacher sent the current comment (heuristic)
                          // We'll use a local flag: if teacherSentComment[st.id] is true, show as "You (Teacher)".
                          const isTeacherComment =
                            teacherSentComment[st.id] || false;

                          return (
                            <div
                              key={st.id}
                              className="border rounded-4 p-4 bg-white shadow-sm"
                            >
                              {/* Header row: student name, grade badge, review button */}
                              <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                                <div className="d-flex align-items-center gap-3">
                                  <Avatar
                                    name={studentName}
                                    size={44}
                                    color="#1a73e8"
                                  />
                                  <div>
                                    <div className="fw-semibold text-dark">
                                      {studentName}
                                    </div>
                                    <div className="text-muted small">
                                      {st.email || "No email provided"}
                                    </div>
                                  </div>
                                </div>
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                  {isGraded ? (
                                    <span className="badge bg-success fs-6 font-monospace">
                                      {gradeToShow} / {coursework.points}
                                    </span>
                                  ) : (
                                    <span className="badge bg-warning text-dark border">
                                      Not graded
                                    </span>
                                  )}
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() =>
                                      setSelectedStudentId(
                                        isSelected ? null : st.id,
                                      )
                                    }
                                  >
                                    {isSelected
                                      ? "Hide review"
                                      : "Review submission"}
                                  </button>
                                </div>
                              </div>

                              {/* Expanded review panel */}
                              {isSelected && (
                                <div className="border-top mt-3 pt-3">
                                  {subData?.submission ? (
                                    <div className="row g-4">
                                      {/* LEFT COLUMN: Preview + Comment Thread */}
                                      <div className="col-12 col-lg-8">
                                        {/* File preview */}
                                        <div className="border rounded-3 overflow-hidden bg-light">
                                          <div className="px-3 py-2 border-bottom bg-white d-flex justify-content-between align-items-center">
                                            <div>
                                              <div className="fw-semibold text-dark">
                                                Preview
                                              </div>
                                              <div className="small text-muted">
                                                Current file:{" "}
                                                {selectedAttachment.name}
                                              </div>
                                            </div>
                                            <span className="badge bg-light text-muted border">
                                              {selectedAttachment.type}
                                            </span>
                                          </div>
                                          <SubmissionFilePreview
                                            file={selectedAttachment}
                                          />
                                        </div>

                                        {/* ----- COMMENT THREAD (under preview) ----- */}
                                        <div className="mt-4">
                                          <h6 className="fw-bold text-muted small text-uppercase mb-3">
                                            <i className="bi bi-chat-left-text me-1"></i>{" "}
                                            Private Comments
                                          </h6>

                                          {/* Student's comment (if any) */}
                                          {currentPrivateComment && (
                                            <div className="d-flex gap-3 mb-3">
                                              <Avatar
                                                name={studentName}
                                                size={36}
                                                color="#00897b"
                                              />
                                              <div className="flex-grow-1">
                                                <div className="d-flex align-items-center gap-2">
                                                  <span className="fw-semibold text-dark">
                                                    {studentName}
                                                  </span>
                                                  <span
                                                    className="text-muted"
                                                    style={{
                                                      fontSize: "0.75rem",
                                                    }}
                                                  >
                                                    {subData?.submission
                                                      ?.submitted_at
                                                      ? new Date(
                                                          subData.submission
                                                            .submitted_at,
                                                        ).toLocaleString()
                                                      : "Just now"}
                                                  </span>
                                                </div>
                                                <p
                                                  className="mb-0 text-dark"
                                                  style={{
                                                    fontSize: "0.95rem",
                                                    lineHeight: "1.5",
                                                  }}
                                                >
                                                  {currentPrivateComment}
                                                </p>
                                              </div>
                                            </div>
                                          )}

                                          {/* Teacher's comment (if any) – shown only if teacherSentComment flag is true */}
                                          {isTeacherComment &&
                                            currentPrivateComment && (
                                              <div className="d-flex gap-3 mb-3">
                                                <Avatar
                                                  name={user.name}
                                                  size={36}
                                                  color="#1a73e8"
                                                />
                                                <div className="flex-grow-1">
                                                  <div className="d-flex align-items-center gap-2">
                                                    <span className="fw-semibold text-dark">
                                                      You (Teacher)
                                                    </span>
                                                    <span
                                                      className="text-muted"
                                                      style={{
                                                        fontSize: "0.75rem",
                                                      }}
                                                    >
                                                      Just now
                                                    </span>
                                                  </div>
                                                  <p
                                                    className="mb-0 text-dark"
                                                    style={{
                                                      fontSize: "0.95rem",
                                                      lineHeight: "1.5",
                                                    }}
                                                  >
                                                    {currentPrivateComment}
                                                  </p>
                                                </div>
                                              </div>
                                            )}

                                          {/* If no comments yet */}
                                          {!currentPrivateComment && (
                                            <p className="text-muted small fst-italic">
                                              No private comments yet.
                                            </p>
                                          )}

                                          {/* Teacher's comment input – appears at the bottom of the thread */}
                                          <div className="d-flex gap-2 align-items-start mt-3">
                                            <Avatar
                                              name={user.name}
                                              size={36}
                                              color={user.color}
                                            />
                                            <div className="flex-grow-1 d-flex gap-2">
                                              <input
                                                type="text"
                                                className="form-control rounded-pill px-3 py-2 shadow-none"
                                                style={{
                                                  border: "1px solid #dadce0",
                                                  backgroundColor: "#f1f3f4",
                                                }}
                                                placeholder="Write a private comment to this student..."
                                                value={
                                                  teacherPrivateComment[
                                                    st.id
                                                  ] || ""
                                                }
                                                onChange={(e) =>
                                                  setTeacherPrivateComment(
                                                    (prev) => ({
                                                      ...prev,
                                                      [st.id]: e.target.value,
                                                    }),
                                                  )
                                                }
                                                onKeyDown={(e) => {
                                                  if (
                                                    e.key === "Enter" &&
                                                    teacherPrivateComment[
                                                      st.id
                                                    ]?.trim()
                                                  ) {
                                                    handleSendPrivateComment(
                                                      submissionId,
                                                      st.id,
                                                    );
                                                  }
                                                }}
                                              />
                                              <button
                                                className="btn btn-primary rounded-pill px-3"
                                                onClick={() =>
                                                  handleSendPrivateComment(
                                                    submissionId,
                                                    st.id,
                                                  )
                                                }
                                                disabled={
                                                  sendingPrivateComment[
                                                    st.id
                                                  ] ||
                                                  !teacherPrivateComment[
                                                    st.id
                                                  ]?.trim()
                                                }
                                              >
                                                {sendingPrivateComment[
                                                  st.id
                                                ] ? (
                                                  <span
                                                    className="spinner-border spinner-border-sm"
                                                    role="status"
                                                    aria-hidden="true"
                                                  ></span>
                                                ) : (
                                                  <i className="bi bi-send-fill"></i>
                                                )}
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* RIGHT COLUMN: Grade, Feedback, Files, Actions */}
                                      <div className="col-12 col-lg-4">
                                        <div className="border rounded-3 p-3 bg-white shadow-sm">
                                          <div className="mb-3">
                                            <div className="fw-semibold text-dark mb-2">
                                              Current file
                                            </div>
                                            <div className="text-muted small">
                                              {selectedAttachment.name}
                                            </div>
                                          </div>

                                          <label className="form-label small fw-bold text-muted mb-1">
                                            Grade
                                          </label>
                                          <div className="d-flex align-items-center gap-2 mb-3">
                                            <input
                                              type="number"
                                              className="form-control w-50"
                                              placeholder="--"
                                              min="0"
                                              max={coursework.points || 100}
                                              value={gradeToShow ?? ""}
                                              onChange={(e) => {
                                                const val =
                                                  e.target.value === ""
                                                    ? null
                                                    : Number(e.target.value);
                                                handleGradeInputChange(
                                                  st.id,
                                                  val,
                                                );
                                              }}
                                            />
                                            <span className="text-muted small">
                                              / {coursework.points ?? 100}
                                            </span>
                                          </div>

                                          <label className="form-label small fw-bold text-muted mb-1">
                                            Feedback (for grading)
                                          </label>
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
                                            <h6 className="fw-semibold text-muted small text-uppercase mb-2">
                                              Attached files
                                            </h6>
                                            <div className="d-flex flex-wrap gap-2">
                                              {previewFiles.map((file) => (
                                                <button
                                                  key={file.id}
                                                  type="button"
                                                  className={`border rounded p-2 px-3 d-flex align-items-center gap-2 text-decoration-none text-dark bg-white shadow-sm ${selectedAttachment.id === file.id ? "border-primary" : ""}`}
                                                  onClick={() =>
                                                    setSelectedAttachmentByStudent(
                                                      {
                                                        ...selectedAttachmentByStudent,
                                                        [st.id]: file,
                                                      },
                                                    )
                                                  }
                                                >
                                                  <i
                                                    className={`bi ${getPreviewIcon(file)} fs-5`}
                                                  ></i>
                                                  <span className="small fw-medium">
                                                    {file.name}
                                                  </span>
                                                </button>
                                              ))}
                                            </div>
                                          </div>

                                          <div className="d-grid gap-2">
                                            <button
                                              className="btn btn-primary"
                                              onClick={() =>
                                                handleReturnToStudent(st.id)
                                              }
                                              disabled={
                                                !hasGrade ||
                                                returningStudentId === st.id
                                              }
                                            >
                                              {returningStudentId === st.id ? (
                                                <>
                                                  <span
                                                    className="spinner-border spinner-border-sm me-2"
                                                    role="status"
                                                    aria-hidden="true"
                                                  ></span>
                                                  Returning...
                                                </>
                                              ) : (
                                                <>
                                                  <i className="bi bi-reply me-2"></i>{" "}
                                                  Return to student
                                                </>
                                              )}
                                            </button>
                                            <button className="btn btn-outline-secondary">
                                              <i className="bi bi-download me-2"></i>{" "}
                                              Download all files
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center py-4 text-muted">
                                      <i className="bi bi-inbox fs-2"></i>
                                      <p>
                                        No submission data available for this
                                        student.
                                      </p>
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
                        <p className="text-muted small mb-0">
                          No students have turned in work yet.
                        </p>
                      </div>
                    )}
                  </div>
                  {studentsWithoutWork.length > 0 && (
                    <div>
                      <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                        <i className="bi bi-clock-fill text-warning"></i>{" "}
                        Students who haven't turned in work (
                        {studentsWithoutWork.length})
                      </h6>
                      <div className="d-flex flex-column gap-2">
                        {studentsWithoutWork.map((st) => (
                          <div
                            key={st.id}
                            className="border rounded-3 p-3 bg-white shadow-sm"
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="d-flex align-items-center gap-3">
                                <Avatar
                                  name={st.name}
                                  size={40}
                                  color="#00897b"
                                />
                                <div>
                                  <div className="fw-semibold text-dark">
                                    {st.name}
                                  </div>
                                  <div className="text-muted small">
                                    {st.email}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <span className="badge bg-light text-muted border">
                                  Assigned
                                </span>
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

          {/* ---------- STUDENT: YOUR WORK TAB (UPDATED) ---------- */}
          {activeTab === "yourWork" && !isTeacher && (
            <div>
              {isLoadingStudentSubmission ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">
                      Loading your submission...
                    </span>
                  </div>
                  <p className="text-muted mt-2">Loading your work...</p>
                </div>
              ) : (
                <>
                  {/* Header with status */}
                  <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                    <h5 className="fw-bold text-dark mb-0">Your Submission</h5>
                    {studentSubmission?.submission_status ===
                    "not_submitted" ? (
                      <span className="badge bg-warning text-dark">
                        Not submitted
                      </span>
                    ) : studentSubmission?.submission?.grade !== null &&
                      studentSubmission?.submission?.grade !== undefined ? (
                      <span className="badge bg-success">Graded</span>
                    ) : (
                      <span className="badge bg-primary">Submitted</span>
                    )}
                  </div>

                  <div className="row g-4">
                    {/* ---------- LEFT COLUMN: Private Comment ---------- */}
                    <div className="col-12 col-md-8">
                      <div className="bg-light border rounded-3 p-3 h-100">
                        <div className="fw-semibold text-dark mb-2">
                          <i className="bi bi-chat-left-text me-1"></i> Private
                          Comment
                        </div>

                        {/* Existing comment (if any) */}
                        {studentSubmission?.submission?.private_comment && (
                          <div className="d-flex gap-3 mb-3">
                            <Avatar
                              name={user.name}
                              size={36}
                              color="#00897b"
                            />
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center gap-2">
                                <span className="fw-semibold text-dark">
                                  You (Student)
                                </span>
                                <span
                                  className="text-muted"
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  {studentSubmission?.submission?.submitted_at
                                    ? new Date(
                                        studentSubmission.submission
                                          .submitted_at,
                                      ).toLocaleString()
                                    : "Just now"}
                                </span>
                              </div>
                              <p
                                className="mb-0 text-dark"
                                style={{
                                  fontSize: "0.95rem",
                                  lineHeight: "1.5",
                                }}
                              >
                                {studentSubmission.submission.private_comment}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Teacher's reply (if any) - we don't have separate teacher comment; it's stored in the same field? 
                  Actually the API returns a single private_comment. We'll just show the current one. */}
                        {/* If no comment yet */}
                        {!studentSubmission?.submission?.private_comment && (
                          <p className="text-muted small fst-italic">
                            No private comments yet.
                          </p>
                        )}

                        {/* Input to add/update comment */}
                        <div className="d-flex gap-2 align-items-start mt-3">
                          <Avatar name={user.name} size={36} color="#00897b" />
                          <div className="flex-grow-1 d-flex gap-2">
                            <input
                              type="text"
                              className="form-control rounded-pill px-3 py-2 shadow-none"
                              style={{
                                border: "1px solid #dadce0",
                                backgroundColor: "#f1f3f4",
                              }}
                              placeholder="Write a private comment to the teacher..."
                              value={studentPrivateCommentInput}
                              onChange={(e) =>
                                setStudentPrivateCommentInput(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  studentPrivateCommentInput.trim()
                                ) {
                                  handleSendStudentPrivateComment();
                                }
                              }}
                              disabled={
                                !studentSubmission?.submission?.id ||
                                isSendingStudentComment
                              }
                            />
                            <button
                              className="btn btn-primary rounded-pill px-3"
                              onClick={handleSendStudentPrivateComment}
                              disabled={
                                !studentSubmission?.submission?.id ||
                                isSendingStudentComment ||
                                !studentPrivateCommentInput.trim()
                              }
                            >
                              {isSendingStudentComment ? (
                                <span
                                  className="spinner-border spinner-border-sm"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                              ) : (
                                <i className="bi bi-send-fill"></i>
                              )}
                            </button>
                          </div>
                        </div>
                        {!studentSubmission?.submission?.id && (
                          <div className="text-muted small mt-2">
                            You need to submit the assignment first to send a
                            private comment.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ---------- RIGHT COLUMN: Turn In / Submitted Files ---------- */}
                    <div className="col-12 col-md-4">
                      <div className="bg-light border rounded-3 p-3 h-100">
                        {studentSubmission?.submission_status ===
                        "not_submitted" ? (
                          // --- Not submitted: show Turn In & Mark as Done buttons ---
                          <>
                            <div className="text-center py-4">
                              <i className="bi bi-inbox text-muted fs-1 mb-2"></i>
                              <p className="text-muted mb-3">
                                You haven't submitted this assignment yet.
                              </p>
                            </div>
                            <div className="d-flex gap-2 flex-wrap justify-content-center">
                              <button
                                className="btn btn-primary fw-medium shadow-sm"
                                onClick={() => setShowTurnInModal(true)}
                              >
                                <i className="bi bi-plus-circle me-1"></i> Add
                                or Create & Turn In
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
                          // --- Submitted: show files and Resubmit button ---
                          <>
                            {/* Submitted files */}
                            {studentSubmission?.submission?.files &&
                              studentSubmission.submission.files.length > 0 && (
                                <div className="mb-3">
                                  <div className="fw-semibold text-dark mb-2">
                                    Your submitted files
                                  </div>
                                  <div className="d-flex flex-wrap gap-2">
                                    {studentSubmission.submission.files.map(
                                      (file, idx) => {
                                        const fileObj = {
                                          id: `sub-${idx}`,
                                          name:
                                            file.file_name ||
                                            file.filename ||
                                            "file",
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
                                            <i
                                              className={`bi ${getPreviewIcon(fileObj)} fs-5`}
                                            ></i>
                                            <span className="small fw-medium">
                                              {fileObj.name}
                                            </span>
                                          </a>
                                        );
                                      },
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Grade & Feedback (if graded) */}
                            {studentSubmission?.submission?.grade !== null &&
                              studentSubmission?.submission?.grade !==
                                undefined && (
                                <div className="mb-3">
                                  <div className="fw-semibold text-dark mb-1">
                                    Grade & Feedback
                                  </div>
                                  <div className="display-6 fw-bold text-success">
                                    {studentSubmission.submission.grade} /{" "}
                                    {coursework.points}
                                  </div>
                                  {studentSubmission.submission.feedback && (
                                    <div className="mt-2">
                                      <div className="fw-semibold text-dark mb-1">
                                        Feedback
                                      </div>
                                      <div
                                        className="bg-white p-3 rounded border"
                                        style={{ whiteSpace: "pre-wrap" }}
                                      >
                                        {studentSubmission.submission.feedback}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                            {studentSubmission?.submission?.status ===
                              "returned" && (
                              <div className="alert alert-info mb-3">
                                This work has been returned to you by your
                                teacher.
                              </div>
                            )}

                            <div className="border-top pt-3">
                              <button
                                className="btn btn-primary w-100"
                                onClick={() => setShowTurnInModal(true)}
                              >
                                <i className="bi bi-arrow-repeat me-1"></i>{" "}
                                Resubmit
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

      {/* Mark as Done Modal */}
      {showMarkAsDoneModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <h5 className="modal-title font-google fw-bold">
                  Mark as done
                </h5>
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
                  You can optionally upload files before marking this assignment
                  as done.
                </p>
                <div className="mb-4">
                  <label className="form-label small fw-bold text-muted">
                    Attachments (optional)
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    multiple
                    onChange={(e) =>
                      setMarkAsDoneFiles(Array.from(e.target.files || []))
                    }
                  />
                  <small className="form-text text-muted d-block mt-2">
                    Select multiple files if needed, or leave empty to mark
                    without files.
                  </small>
                </div>
                {markAsDoneFiles.length > 0 && (
                  <div className="mb-4">
                    <div className="fw-semibold small text-dark mb-2">
                      Selected files ({markAsDoneFiles.length})
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {markAsDoneFiles.map((file, index) => (
                        <span
                          key={`${file.name}-${index}`}
                          className="badge bg-white text-dark border"
                        >
                          {file.name}
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
                <button
                  type="button"
                  className="btn btn-primary fw-medium px-4"
                  onClick={handleMarkAsDone}
                  disabled={isMarkingAsDone}
                >
                  {isMarkingAsDone ? "Marking..." : "Mark as done"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Turn In Modal */}
      {showTurnInModal && (
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
                    setShowTurnInModal(false);
                    setTurnInFiles([]);
                    setTurnInComment("");
                  }}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-muted mb-3">
                  {studentSubmission?.submission_status === "not_submitted"
                    ? "Upload your completed files and submit your work."
                    : "Upload new files to replace your previous submission."}
                </p>
                <div className="mb-4">
                  <label className="form-label small fw-bold text-muted">
                    Attachments (multiple files)
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    multiple
                    onChange={(e) =>
                      setTurnInFiles(Array.from(e.target.files || []))
                    }
                  />
                  <small className="form-text text-muted d-block mt-2">
                    Select one or more files for your submission.
                  </small>
                </div>
                {turnInFiles.length > 0 && (
                  <div className="mb-4">
                    <div className="fw-semibold small text-dark mb-2">
                      Selected files ({turnInFiles.length})
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {turnInFiles.map((file, index) => (
                        <span
                          key={`${file.name}-${index}`}
                          className="badge bg-white text-dark border"
                        >
                          {file.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted">
                    Private comment (optional)
                  </label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Add a private note for the teacher..."
                    value={turnInComment}
                    onChange={(e) => setTurnInComment(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer border-top px-4 py-3">
                <button
                  type="button"
                  className="btn btn-light fw-medium px-4"
                  onClick={() => {
                    setShowTurnInModal(false);
                    setTurnInFiles([]);
                    setTurnInComment("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary fw-medium px-4"
                  onClick={handleTurnInWork}
                  disabled={isSubmitting || turnInFiles.length === 0}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
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
