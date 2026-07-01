import React, { useState, useEffect, useRef } from "react";
import Avatar from "../../components/Common/Avatar.jsx";
import { discussionAPI } from "../../api/client.js";
import apiClient from "../../api/client.js";

const StreamTab = ({
  cls,
  user,
  onPostAnnouncement,
  onAddComment,
  onNavigateTab,
  onDiscussionCreated,
}) => {
  const fileInputRef = useRef(null);
  
  const [isComposing, setIsComposing] = useState(false);
  const [composerMode, setComposerMode] = useState("announcement"); // "announcement" or "discussion"
  const [announcementText, setAnnouncementText] = useState("");
  const [discussionTitle, setDiscussionTitle] = useState("");
  const [discussionDescription, setDiscussionDescription] = useState("");
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});
  const [discussionCommentInputs, setDiscussionCommentInputs] = useState({});
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const upcomingWork = [
    ...(Array.isArray(cls.assignments)
      ? cls.assignments.map((item) => ({ ...item, type: "Assignment" }))
      : []),
    ...(Array.isArray(cls.quizzes)
      ? cls.quizzes.map((item) => ({ ...item, type: "Quiz" }))
      : []),
  ]
    .filter((item) => item.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 2);

  const getDisplayName = (person) => {
    if (!person) return "User";
    const fullName = [person.first_name || person.firstName, person.last_name || person.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return fullName || person.fullName || person.name || "User";
  };

  const fullName = getDisplayName(cls.teacher) || "Teacher";

  const handleAddAttachment = (type) => {
    if (type === "file") {
      // Trigger file input click
      fileInputRef.current?.click();
    } else if (type === "link") {
      // Open link modal
      setShowLinkModal(true);
      setLinkInput("");
    } else if (type === "drive") {
      // Placeholder for Google Drive integration
      alert("Google Drive integration coming soon!");
    } else if (type === "youtube") {
      // Placeholder for YouTube integration
      alert("YouTube integration coming soon!");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newAtt = {
      type: "file",
      name: file.name,
      url: URL.createObjectURL(file),
      file: file,
    };
    setAttachments([...attachments, newAtt]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddLink = () => {
    if (!linkInput.trim()) return;

    // Validate URL
    try {
      new URL(linkInput);
    } catch {
      alert("Please enter a valid URL");
      return;
    }

    const urlObj = new URL(linkInput);
    const hostName = urlObj.hostname;
    const newAtt = {
      type: "link",
      name: hostName,
      url: linkInput,
    };
    setAttachments([...attachments, newAtt]);
    setShowLinkModal(false);
    setLinkInput("");
  };

  const handlePost = async (e) => {
    e.preventDefault();
    
    if (composerMode === "announcement") {
      if (!announcementText.trim()) return;
      onPostAnnouncement(cls.id, {
        text: announcementText.trim(),
        attachments,
      });
      setAnnouncementText("");
    } else {
      // Discussion mode
      if (!discussionTitle.trim()) return;
      setIsSubmitting(true);
      try {
        await discussionAPI.createDiscussion({
          classId: cls.id,
          userId: user.id || 1,
          title: discussionTitle.trim(),
          description: discussionDescription.trim(),
          sendToAll: sendToAll,
          studentIds: !sendToAll ? selectedStudents : null,
          attachments,
        });
        
        // Clear form
        setDiscussionTitle("");
        setDiscussionDescription("");
        setSendToAll(true);
        setSelectedStudents([]);
        
        // Trigger refresh of class data
        if (onDiscussionCreated) {
          onDiscussionCreated(cls.id);
        }
      } catch (error) {
        console.error("Failed to create discussion:", error);
        alert("Failed to create discussion. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
    
    setAttachments([]);
    setIsComposing(false);
  };

  const handlePostComment = (announcementId, e) => {
    e.preventDefault();
    const text = commentInputs[announcementId];
    if (!text || !text.trim()) return;
    onAddComment(cls.id, announcementId, text.trim());
    setCommentInputs({ ...commentInputs, [announcementId]: "" });
  };

  const handlePostDiscussionComment = async (discussionId, e) => {
    e.preventDefault();
    const text = discussionCommentInputs[discussionId];
    if (!text || !text.trim()) return;

    try {
      // Call API to post comment on discussion
      await apiClient.post(`/classes/${cls.id}/discussions/${discussionId}/comments`, {
        text: text.trim(),
      });

      // Clear input
      setDiscussionCommentInputs({
        ...discussionCommentInputs,
        [discussionId]: "",
      });

      // Refresh class data to show new comment
      if (onDiscussionCreated) {
        onDiscussionCreated(cls.id);
      }
    } catch (error) {
      console.error("Failed to post discussion comment:", error);
      alert("Failed to post comment. Please try again.");
    }
  };

  return (
    <div className="row g-4">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: "none" }}
        accept="*/*"
      />

      {/* Left Column: Class Code & Upcoming Work */}
      <div className="col-12 col-lg-3">
        {/* Class code card */}
        <div className="card border shadow-sm mb-3 rounded-3 overflow-hidden">
          <div className="card-body p-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="fw-semibold text-dark small">
                Class code: {cls.class_code}
              </span>
              <button
                className="btn btn-link p-0 text-decoration-none"
                onClick={() => setShowCodeModal(true)}
                title="Display full screen"
              >
                <i className="bi bi-fullscreen text-secondary"></i>
              </button>
            </div>
            <div className="d-flex align-items-center justify-content-between">
              <span className="font-monospace fs-4 fw-bold text-primary">
                {cls.class_code}
              </span>
              <button
                className="btn btn-sm btn-outline-secondary p-1 px-2 text-xs"
                onClick={() => {
                  navigator.clipboard?.writeText(cls.class_code);
                  alert("Class code copied to clipboard!");
                }}
                title="Copy class code"
              >
                <i className="bi bi-clipboard"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Upcoming coursework card */}
        <div className="card border shadow-sm rounded-3">
          <div className="card-body p-3">
            <h6 className="fw-bold text-dark mb-2">Upcoming</h6>
            {upcomingWork.length > 0 ? (
              <div className="mb-3">
                {upcomingWork.slice(0, 3).map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="mb-2 pb-2 border-bottom"
                  >
                    <div
                      className="text-muted small"
                      style={{ fontSize: "0.78rem" }}
                    >
                      Due {item.due_date}
                    </div>
                    <div
                      className="text-dark fw-medium small text-truncate"
                      style={{ cursor: "pointer" }}
                      onClick={() => onNavigateTab("classwork")}
                    >
                      {item.title}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted small mb-3">Woohoo, no work due soon!</p>
            )}
            <div className="text-end">
              <button
                className="btn btn-link btn-sm p-0 text-decoration-none fw-medium"
                onClick={() => onNavigateTab("classwork")}
              >
                View all
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Stream Composer & Items */}
      <div className="col-12 col-lg-9">
        {/* Announce something box */}
        {!isComposing ? (
          <div
            className="gc-announcement-box p-3 mb-4 d-flex align-items-center gap-3 shadow-sm"
            style={{ cursor: "pointer", transition: "box-shadow 0.2s" }}
            onClick={() => setIsComposing(true)}
          >
            <Avatar
              name={user}
              size={42}
              color={cls.themeColor || "#1a73e8"}
              className="border border-white border-3 shadow"
            />
            <div className="text-muted flex-grow-1 small fw-medium py-2">
              Announce something to your class
            </div>
            <button
              className="btn btn-icon btn-sm text-secondary"
              title="Reuse post"
            >
              <i className="bi bi-arrow-repeat fs-5"></i>
            </button>
          </div>
        ) : (
          <div className="gc-announcement-box p-4 mb-4 shadow">
            <form onSubmit={handlePost}>
              {/* Mode Toggle */}
              <div className="d-flex gap-2 mb-3 pb-3 border-bottom">
                <button
                  type="button"
                  className={`btn btn-sm ${composerMode === "announcement" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => {
                    setComposerMode("announcement");
                    setDiscussionTitle("");
                    setDiscussionDescription("");
                  }}
                >
                  Announcement
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${composerMode === "discussion" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => {
                    setComposerMode("discussion");
                    setAnnouncementText("");
                  }}
                >
                  Discussion
                </button>
              </div>

              <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                <span className="badge bg-light text-dark border py-1 px-2 small">
                  For: <strong>{cls.name}</strong>
                </span>
                <span className="badge bg-light text-dark border py-1 px-2 small">
                  Students: <strong>{sendToAll ? "All students" : `${selectedStudents.length} selected`}</strong>
                </span>
              </div>

              {/* Announcement Mode */}
              {composerMode === "announcement" && (
                <div className="form-floating mb-3">
                  <textarea
                    className="form-control border-0 px-0 shadow-none"
                    placeholder="Announce something to your class"
                    id="announceArea"
                    style={{
                      minHeight: "120px",
                      resize: "vertical",
                      fontSize: "0.95rem",
                    }}
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    autoFocus
                  />
                  <label htmlFor="announceArea" className="px-0 text-muted">
                    Announce something to your class
                  </label>
                </div>
              )}

              {/* Discussion Mode */}
              {composerMode === "discussion" && (
                <>
                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control border-0 px-0 shadow-none"
                      placeholder="Discussion title"
                      id="discussionTitle"
                      style={{ fontSize: "0.95rem" }}
                      value={discussionTitle}
                      onChange={(e) => setDiscussionTitle(e.target.value)}
                      autoFocus
                    />
                    <label htmlFor="discussionTitle" className="px-0 text-muted">
                      Discussion title
                    </label>
                  </div>

                  <div className="form-floating mb-3">
                    <textarea
                      className="form-control border-0 px-0 shadow-none"
                      placeholder="Add a description (optional)"
                      id="discussionDescription"
                      style={{
                        minHeight: "100px",
                        resize: "vertical",
                        fontSize: "0.95rem",
                      }}
                      value={discussionDescription}
                      onChange={(e) => setDiscussionDescription(e.target.value)}
                    />
                    <label htmlFor="discussionDescription" className="px-0 text-muted">
                      Add a description (optional)
                    </label>
                  </div>

                  {/* Send to Options */}
                  <div className="mb-3 p-2 bg-light rounded border">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="sendToAll"
                        className="form-check-input"
                        checked={sendToAll}
                        onChange={(e) => {
                          setSendToAll(e.target.checked);
                          if (e.target.checked) setSelectedStudents([]);
                        }}
                      />
                      <label htmlFor="sendToAll" className="form-check-label mb-0 small fw-medium">
                        Send to all students
                      </label>
                    </div>
                    {!sendToAll && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setShowStudentSelector(true)}
                      >
                        <i className="bi bi-people me-1"></i>
                        Select Students ({selectedStudents.length})
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Attachments preview */}
              {attachments.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mb-3 bg-light p-2 rounded border">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="badge bg-white text-dark border py-2 px-3 d-flex align-items-center gap-2"
                    >
                      <i
                        className={`bi ${
                          att.type === "drive"
                            ? "bi-google text-primary"
                            : att.type === "youtube"
                            ? "bi-youtube text-danger"
                            : att.type === "link"
                            ? "bi-link-45deg text-secondary"
                            : "bi-file-earmark-text-fill text-primary"
                        }`}
                      ></i>
                      <span
                        className="text-truncate"
                        style={{ maxWidth: "180px" }}
                        title={att.name}
                      >
                        {att.name}
                      </span>
                      <i
                        className="bi bi-x ms-1 text-muted"
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          setAttachments(
                            attachments.filter((_, i) => i !== idx),
                          )
                        }
                      ></i>
                    </div>
                  ))}
                </div>
              )}

              {/* Attachment Toolbar + Action buttons */}
              <div className="d-flex justify-content-between align-items-center border-top pt-3 flex-wrap gap-2">
                <div className="d-flex gap-1">
                  <button
                    type="button"
                    className="btn btn-icon btn-sm"
                    onClick={() => handleAddAttachment("drive")}
                    title="Add Google Drive file"
                  >
                    <i className="bi bi-google text-primary fs-6"></i>
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon btn-sm"
                    onClick={() => handleAddAttachment("youtube")}
                    title="Add YouTube video"
                  >
                    <i className="bi bi-youtube text-danger fs-6"></i>
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon btn-sm"
                    onClick={() => handleAddAttachment("file")}
                    title="Upload file"
                  >
                    <i className="bi bi-upload text-secondary fs-6"></i>
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon btn-sm"
                    onClick={() => handleAddAttachment("link")}
                    title="Add link"
                  >
                    <i className="bi bi-link-45deg text-secondary fs-5"></i>
                  </button>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-light px-3 fw-medium text-secondary small"
                    onClick={() => {
                      setIsComposing(false);
                      setAnnouncementText("");
                      setDiscussionTitle("");
                      setDiscussionDescription("");
                      setSendToAll(true);
                      setSelectedStudents([]);
                      setAttachments([]);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn text-white px-4 fw-medium small"
                    style={{ backgroundColor: cls.themeColor || "#1a73e8" }}
                    disabled={
                      isSubmitting ||
                      (composerMode === "announcement" && !announcementText.trim()) ||
                      (composerMode === "discussion" && !discussionTitle.trim())
                    }
                  >
                    {isSubmitting ? "Creating..." : "Post"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Stream feed items */}
        {(cls.announcements && cls.announcements.length > 0) || (cls.discussions && cls.discussions.length > 0) ? (
          <>
            {/* Announcements */}
            {cls.announcements &&
              cls.announcements.map((ann) => (
                <div
                  key={`announcement-${ann.id}`}
                  className="card border shadow-sm mb-3 rounded-3 overflow-hidden"
                >
                  <div className="card-body p-4">
                    {/* Author header */}
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="d-flex align-items-center gap-3">
                        <Avatar
                          name={ann.author}
                          size={42}
                          color={cls.themeColor || "#1a73e8"}
                        />
                        <div>
                          <h6
                            className="fw-bold mb-0 text-dark"
                            style={{ fontSize: "0.95rem" }}
                          >
                            {ann.author.name}
                          </h6>
                          <small
                            className="text-muted"
                            style={{ fontSize: "0.78rem" }}
                          >
                            {ann.date}
                          </small>
                        </div>
                      </div>
                      <button className="btn btn-icon btn-sm text-muted">
                        <i className="bi bi-three-dots-vertical"></i>
                      </button>
                    </div>

                    {/* Body Text */}
                    <p
                      className="card-text text-dark mb-3"
                      style={{
                        whiteSpace: "pre-wrap",
                        lineHeight: "1.5",
                        fontSize: "0.93rem",
                      }}
                    >
                      {ann.text}
                    </p>

                    {/* Attachments */}
                    {ann.attachments && ann.attachments.length > 0 && (
                      <div className="row g-2 mb-4">
                        {ann.attachments.map((att, aIdx) => (
                          <div key={aIdx} className="col-12 col-md-6">
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="border rounded p-2 d-flex align-items-center gap-3 text-decoration-none text-dark bg-white hover-bg-light shadow-sm"
                              style={{ transition: "background 0.15s" }}
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
                                  className={`bi fs-4 ${att.type === "pdf" ? "bi-file-earmark-pdf-fill text-danger" : att.type === "drive" ? "bi-google text-primary" : att.type === "youtube" ? "bi-youtube text-danger" : "bi-file-earmark-text-fill text-primary"}`}
                                ></i>
                              </div>
                              <div className="overflow-hidden">
                                <div className="fw-semibold small text-truncate">
                                  {att.name}
                                </div>
                                <div
                                  className="text-muted small text-uppercase"
                                  style={{ fontSize: "0.72rem" }}
                                >
                                  {att.type}
                                </div>
                              </div>
                            </a>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comments Section */}
                    <div className="border-top pt-3 mt-3">
                      <div className="text-muted small mb-3 fw-medium d-flex align-items-center gap-2">
                        <i className="bi bi-people"></i>
                        {ann.comments ? ann.comments.length : 0} class{" "}
                        {ann.comments?.length === 1 ? "comment" : "comments"}
                      </div>

                      {ann.comments &&
                        ann.comments.map((cm) => (
                          <div key={cm.id} className="d-flex gap-3 mb-3">
                            <Avatar name={cm.author} size={32} color="#5f6368" />
                            <div className="flex-grow-1 bg-light rounded-3 p-2 px-3 border">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="fw-bold text-dark small">
                                  {cm.author}
                                </span>
                                <span
                                  className="text-muted"
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  {cm.date}
                                </span>
                              </div>
                              <p
                                className="mb-0 text-dark small"
                                style={{ fontSize: "0.88rem" }}
                              >
                                {cm.text}
                              </p>
                            </div>
                          </div>
                        ))}

                      {/* Add comment input */}
                      <form
                        onSubmit={(e) => handlePostComment(ann.id, e)}
                        className="d-flex align-items-center gap-2 mt-3"
                      >
                        <Avatar name={user} size={32} color={user.color} />
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control form-control-sm border rounded-pill px-3 py-2 shadow-none"
                            placeholder="Add class comment..."
                            value={commentInputs[ann.id] || ""}
                            onChange={(e) =>
                              setCommentInputs({
                                ...commentInputs,
                                [ann.id]: e.target.value,
                              })
                            }
                          />
                          <button
                            type="submit"
                            className="btn btn-link text-primary pe-3 ms-n5"
                            style={{ zIndex: 5 }}
                            disabled={!commentInputs[ann.id]?.trim()}
                          >
                            <i className="bi bi-send-fill"></i>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              ))}

            {/* Discussions */}
            {cls.discussions &&
              cls.discussions.map((discussion) => (
                <div
                  key={`discussion-${discussion.id}`}
                  className="card border shadow-sm mb-3 rounded-3 overflow-hidden"
                  style={{ borderLeft: `4px solid ${cls.themeColor || "#1a73e8"}` }}
                >
                  <div className="card-body p-4">
                    {/* Author header */}
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="d-flex align-items-center gap-3">
                        <Avatar
                          name={`Teacher ${discussion.user_id}`}
                          size={42}
                          color={cls.themeColor || "#1a73e8"}
                        />
                        <div>
                          <h6
                            className="fw-bold mb-0 text-dark"
                            style={{ fontSize: "0.95rem" }}
                          >
                            Teacher (Discussion)
                          </h6>
                          <small
                            className="text-muted"
                            style={{ fontSize: "0.78rem" }}
                          >
                            {discussion.created_at
                              ? new Date(discussion.created_at).toLocaleDateString()
                              : "Just now"}
                          </small>
                        </div>
                      </div>
                      <button className="btn btn-icon btn-sm text-muted">
                        <i className="bi bi-three-dots-vertical"></i>
                      </button>
                    </div>

                    {/* Discussion Badge */}
                    <div className="mb-2">
                      <span className="badge bg-info text-dark small">
                        <i className="bi bi-chat-left-quote me-1"></i>Discussion
                      </span>
                    </div>

                    {/* Title */}
                    <h5 className="card-title text-dark fw-bold mb-2">
                      {discussion.title}
                    </h5>

                    {/* Description */}
                    {discussion.description && (
                      <p
                        className="card-text text-dark mb-3"
                        style={{
                          whiteSpace: "pre-wrap",
                          lineHeight: "1.5",
                          fontSize: "0.93rem",
                        }}
                      >
                        {discussion.description}
                      </p>
                    )}



                    {/* Attachments */}
                    {discussion.attachments && discussion.attachments.length > 0 && (
                      <div className="row g-2 mb-4">
                        {discussion.attachments.map((att, aIdx) => (
                          <div key={aIdx} className="col-12 col-md-6">
                            <a
                              href={att.file_path || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="border rounded p-2 d-flex align-items-center gap-3 text-decoration-none text-dark bg-white hover-bg-light shadow-sm"
                              style={{ transition: "background 0.15s" }}
                            >
                              <div
                                className="rounded d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{
                                  width: "48px",
                                  height: "48px",
                                  backgroundColor: "#f8f9fa",
                                }}
                              >
                                <i className="bi bi-file-earmark-text-fill text-primary fs-4"></i>
                              </div>
                              <div className="overflow-hidden">
                                <div className="fw-semibold small text-truncate">
                                  {att.file_name}
                                </div>
                                <div
                                  className="text-muted small text-uppercase"
                                  style={{ fontSize: "0.72rem" }}
                                >
                                  Attachment
                                </div>
                              </div>
                            </a>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comments Section */}
                    <div className="border-top pt-3 mt-3">
                      <div className="text-muted small mb-3 fw-medium d-flex align-items-center gap-2">
                        <i className="bi bi-chat-dots"></i>
                        {discussion.comments ? discussion.comments.length : 0} comment
                        {discussion.comments?.length !== 1 ? "s" : ""}
                      </div>

                      {discussion.comments &&
                        discussion.comments.map((cm) => (
                          <div key={cm.id} className="d-flex gap-3 mb-3">
                            <Avatar name={cm.author} size={32} color="#5f6368" />
                            <div className="flex-grow-1 bg-light rounded-3 p-2 px-3 border">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="fw-bold text-dark small">
                                  {cm.author}
                                </span>
                                <span
                                  className="text-muted"
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  {cm.date}
                                </span>
                              </div>
                              <p
                                className="mb-0 text-dark small"
                                style={{ fontSize: "0.88rem" }}
                              >
                                {cm.text}
                              </p>
                            </div>
                          </div>
                        ))}

                      {/* Add comment input */}
                      <form
                        onSubmit={(e) => handlePostDiscussionComment(discussion.id, e)}
                        className="d-flex align-items-center gap-2 mt-3"
                      >
                        <Avatar name={user} size={32} color={user.color} />
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control form-control-sm border rounded-pill px-3 py-2 shadow-none"
                            placeholder="Add a comment..."
                            value={discussionCommentInputs[discussion.id] || ""}
                            onChange={(e) =>
                              setDiscussionCommentInputs({
                                ...discussionCommentInputs,
                                [discussion.id]: e.target.value,
                              })
                            }
                          />
                          <button
                            type="submit"
                            className="btn btn-link text-primary pe-3 ms-n5"
                            style={{ zIndex: 5 }}
                            disabled={!discussionCommentInputs[discussion.id]?.trim()}
                          >
                            <i className="bi bi-send-fill"></i>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
          </>
        ) : (
          <div className="text-center py-5 bg-white border rounded-3 shadow-sm">
            <i className="bi bi-chat-square-text text-muted fs-1 mb-2"></i>
            <h6 className="fw-semibold text-dark">No announcements yet</h6>
            <p className="text-muted small mb-0">
              Use the stream to share announcements, post assignments, and
              respond to student questions.
            </p>
          </div>
        )}
      </div>

      {/* Class Code Fullscreen Modal */}
      {showCodeModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.85)", zIndex: 1070 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content text-center p-5 rounded-4 border-0">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="font-google fw-bold mb-0">{cls.name}</h4>
                <button
                  className="btn-close"
                  onClick={() => setShowCodeModal(false)}
                ></button>
              </div>
              <p className="text-muted text-uppercase fw-semibold mb-2">
                Invite Code
              </p>
              <div className="bg-light p-4 rounded-4 mb-4 d-inline-block border">
                <span
                  className="font-monospace fw-bolder text-primary"
                  style={{ fontSize: "4.5rem", letterSpacing: "4px" }}
                >
                  {cls.class_code}
                </span>
              </div>
              <p className="text-muted small">
                Students can join at classroom.google.com using this code.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Student Selector Modal */}
      {showStudentSelector && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content rounded-4 border-0">
              <div className="modal-header border-bottom ps-4 pe-4 pt-4 pb-3">
                <h5 className="modal-title fw-bold">Select Students</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowStudentSelector(false)}
                ></button>
              </div>
              <div className="modal-body p-4" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {cls.students && cls.students.length > 0 ? (
                  <div className="d-flex flex-column gap-2">
                    {cls.students.map((student) => (
                      <div key={student.id} className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`student-${student.id}`}
                          checked={selectedStudents.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents([...selectedStudents, student.id]);
                            } else {
                              setSelectedStudents(
                                selectedStudents.filter((id) => id !== student.id)
                              );
                            }
                          }}
                        />
                        <label className="form-check-label" htmlFor={`student-${student.id}`}>
                          {student.first_name} {student.last_name}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted small mb-0">No students available</p>
                )}
              </div>
              <div className="modal-footer border-top ps-4 pe-4 pt-3 pb-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowStudentSelector(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowStudentSelector(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Input Modal */}
      {showLinkModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content rounded-4 border-0">
              <div className="modal-header border-bottom ps-4 pe-4 pt-4 pb-3">
                <h5 className="modal-title fw-bold">Add Link</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowLinkModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="form-floating">
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://example.com"
                    id="linkInput"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddLink()}
                    autoFocus
                  />
                  <label htmlFor="linkInput">Paste link URL</label>
                </div>
              </div>
              <div className="modal-footer border-top ps-4 pe-4 pt-3 pb-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowLinkModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddLink}
                  disabled={!linkInput.trim()}
                >
                  Add Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default StreamTab;
