import React, { useState, useEffect, useRef } from 'react';
import { renderAsync } from 'docx-preview';
import Avatar from '../../components/Common/Avatar.jsx';

const getFileExtension = (file) => {
  const name = file?.name || file?.fileName || file?.filename || '';
  const fromName = (name.split('.').pop() || '').toLowerCase();
  if (fromName) return fromName;

  const url = file?.url || '';
  const fromUrl = (url.match(/\.([a-z0-9]+)(?:[?#].*)?$/i) || [])[1];
  return fromUrl ? fromUrl.toLowerCase() : '';
};

const getPreviewMode = (file) => {
  const type = String(file?.type || '').toLowerCase();
  const ext = getFileExtension(file);

  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext) || type.includes('image')) {
    return 'image';
  }

  if (ext === 'pdf' || type === 'pdf') {
    return 'pdf';
  }

  if (ext === 'docx' || type === 'docx') {
    return 'docx';
  }

  if (['doc', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'txt', 'csv', 'rtf'].includes(ext) || ['word', 'excel', 'sheet', 'spreadsheet', 'powerpoint', 'presentation', 'document', 'text', 'csv'].includes(type)) {
    return 'office';
  }

  return 'unsupported';
};

const getPreviewUrl = (file) => {
  const url = file?.url;
  if (!url || url === '#') return null;

  const ext = getFileExtension(file);
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'txt', 'csv', 'rtf'].includes(ext)) {
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
  }

  return url;
};

const getPreviewIcon = (file) => {
  switch (getPreviewMode(file)) {
    case 'image':
      return 'bi-image-fill text-success';
    case 'pdf':
      return 'bi-file-earmark-pdf-fill text-danger';
    case 'docx':
      return 'bi-file-earmark-word-fill text-primary';
    case 'office':
      return 'bi-file-earmark-word-fill text-primary';
    default:
      return 'bi-file-earmark-text-fill text-secondary';
  }
};

const SubmissionFilePreview = ({ file }) => {
  const containerRef = useRef(null);
  const [previewError, setPreviewError] = useState('');
  const previewMode = getPreviewMode(file);
  const previewUrl = getPreviewUrl(file);

  useEffect(() => {
    let cancelled = false;

    const renderPreview = async () => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = '';
      setPreviewError('');

      if (previewMode !== 'docx' || !previewUrl) return;

      try {
        const response = await fetch(previewUrl);
        if (!response.ok) throw new Error('Unable to load document');
        const arrayBuffer = await response.arrayBuffer();
        if (cancelled) return;

        await renderAsync(arrayBuffer, containerRef.current, undefined, {
          className: 'docx-preview',
          inWrapper: true,
          ignoreWidth: false,
          breakPages: true,
          useBase64URL: false,
        });
      } catch (err) {
        if (!cancelled) {
          containerRef.current.innerHTML = '';
          setPreviewError('Unable to render this Word document preview.');
        }
      }
    };

    renderPreview();
    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [file?.id, file?.name, file?.url, previewMode, previewUrl]);

  if (previewMode === 'pdf' && previewUrl) {
    return (
      <iframe
        title={`Preview ${file?.name || 'file'}`}
        src={previewUrl}
        className="w-100"
        style={{ minHeight: '420px', border: '0' }}
      />
    );
  }

  if (previewMode === 'image' && previewUrl) {
    return (
      <div className="d-flex justify-content-center align-items-center p-3 bg-white" style={{ minHeight: '420px' }}>
        <img
          src={previewUrl}
          alt={file?.name || 'Preview'}
          style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
        />
      </div>
    );
  }

  if (previewMode === 'docx' && previewUrl) {
    return (
      <div className="p-3 bg-white" style={{ minHeight: '420px' }}>
        <div ref={containerRef} className="docx-preview-container" style={{ minHeight: '380px', overflow: 'auto' }} />
        {previewError && <p className="text-muted small mt-2 mb-0">{previewError}</p>}
      </div>
    );
  }

  if (previewMode === 'office' && previewUrl) {
    return (
      <iframe
        title={`Preview ${file?.name || 'file'}`}
        src={previewUrl}
        className="w-100"
        style={{ minHeight: '420px', border: '0' }}
      />
    );
  }

  return (
    <div className="d-flex flex-column justify-content-center align-items-center text-center p-5" style={{ minHeight: '420px' }}>
      <i className="bi bi-file-earmark-text fs-1 text-muted mb-3"></i>
      <h6 className="fw-semibold text-dark">Preview unavailable</h6>
      <p className="text-muted small mb-0">This file type cannot be previewed directly in the browser.</p>
      {previewUrl && (
        <a href={previewUrl} target="_blank" rel="noreferrer" className="btn btn-outline-primary btn-sm mt-3">
          Open file
        </a>
      )}
    </div>
  );
};

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
  defaultActiveTab = 'instructions'
}) => {
  const [activeTab, setActiveTab] = useState(defaultActiveTab || 'instructions');
  const [studentComment, setStudentComment] = useState('');
  const [privateComments, setPrivateComments] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [submissionState, setSubmissionState] = useState({ submitted: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSubmissionFiles, setSelectedSubmissionFiles] = useState([]);
  const [selectedAttachmentByStudent, setSelectedAttachmentByStudent] = useState({});
  const [privateFeedbackByStudent, setPrivateFeedbackByStudent] = useState({});

  if (!coursework) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">Assignment not found.</p>
        <button className="btn btn-primary" onClick={onBack}>Go Back</button>
      </div>
    );
  }

  const getRoleString = (u) => {
    if (!u) return '';

    if (typeof u.role === 'string') return u.role;

    if (u.role && typeof u.role === 'object') {
      const nestedRoleName = u.role.role_name || u.role.name || u.role.value || '';
      if (typeof nestedRoleName === 'string' && nestedRoleName.trim()) {
        return nestedRoleName;
      }
    }

    if (typeof u.role_name === 'string') return u.role_name;
    if (typeof u.type === 'string') return u.type;
    return '';
  };

  const roleStr = (getRoleString(user) || '').toString().toLowerCase();
  const isTeacher = ['teacher', 'instructor', 'teacher/instructor'].includes(roleStr) || Boolean(user?.is_teacher || user?.isTeacher);
  const cwStats = coursework.stats || { turnedIn: 0, assigned: 0, graded: 0 };
  const totalStudents = students.length;
  const turnedInCount = cwStats.turnedIn;
  const assignedCount = cwStats.assigned;
  const gradedCount = cwStats.graded || 0;

  // Find students who turned in work
  const studentsWithWork = students.slice(0, turnedInCount);
  const studentsWithoutWork = students.slice(turnedInCount);

  useEffect(() => {
    setActiveTab(defaultActiveTab || 'instructions');
  }, [defaultActiveTab]);

  useEffect(() => {
    const submitted = Boolean(
      coursework?.submitted ||
      coursework?.userSubmission?.status === 'submitted' ||
      coursework?.userSubmission?.status === 'turned_in' ||
      coursework?.userSubmission?.status === 'graded' ||
      coursework?.status === 'submitted'
    );
    setSubmissionState({ submitted });
  }, [coursework?.id, coursework?.submitted, coursework?.status, coursework?.userSubmission?.status]);

  const handleAddComment = () => {
    if (!studentComment.trim()) return;
    const newComment = {
      id: `pc_${Date.now()}`,
      author: user.name,
      avatar: user.avatar || "U",
      text: studentComment.trim(),
      date: 'Just now',
      isPrivate: true
    };
    setPrivateComments([...privateComments, newComment]);
    setStudentComment('');
  };

  const handleGradeStudent = (studentId, score) => {
    if (onUpdateGrade) {
      onUpdateGrade(cls.id, studentId, coursework.id, score);
    }
  };

  const handleTurnInWork = async () => {
    if (!onSubmitWork || submissionState.submitted || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const ok = await onSubmitWork(cls.id, coursework.id, selectedSubmissionFiles);
      if (ok !== false) {
        setSubmissionState({ submitted: true });
        setSelectedSubmissionFiles([]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-fluid px-2 px-md-4 py-3">
      {/* Back button */}
      <button
        className="btn btn-link text-decoration-none text-primary fw-medium mb-3 d-flex align-items-center gap-2 p-0"
        onClick={onBack}
      >
        <i className="bi bi-arrow-left"></i>
        Back to Classwork
      </button>

      {/* Assignment Header Card */}
      <div className="card border shadow-sm rounded-3 mb-4 bg-white overflow-hidden">
        <div
          className="p-4 d-flex align-items-center justify-content-between"
          style={{ backgroundColor: cls.themeColor || '#1a73e8', minHeight: '120px' }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm"
              style={{ width: '56px', height: '56px', backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <i className={`bi ${coursework.type === 'quiz' ? 'bi-card-checklist' : 'bi-clipboard-check'} fs-3`}></i>
            </div>
            <div className="text-white">
              <h3 className="font-google fw-bold mb-1" style={{ fontSize: '1.5rem' }}>
                {coursework.title}
              </h3>
              <div className="small text-white text-opacity-90">
                {cls.name} • {coursework.topic || 'No topic'}
              </div>
            </div>
          </div>

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

        {/* Tabs */}
        <div className="border-bottom bg-white">
          <ul className="nav gc-nav-tabs px-3">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'instructions' ? 'active' : ''}`}
                onClick={() => setActiveTab('instructions')}
              >
                Instructions
              </button>
            </li>
            {isTeacher && (
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'studentWork' ? 'active' : ''}`}
                  onClick={() => setActiveTab('studentWork')}
                >
                  Student Work
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Tab Content */}
        <div className="card-body p-4">
          {activeTab === 'instructions' && (
            <div>
              {/* Assignment Metadata */}
              <div className="row g-3 mb-4 pb-4 border-bottom">
                <div className="col-6 col-md-3">
                  <div className="text-muted small fw-semibold text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>
                    Points
                  </div>
                  <div className="fw-bold text-dark">
                    {coursework.points !== null && coursework.points !== undefined ? coursework.points : 'Ungraded'}
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-muted small fw-semibold text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>
                    Due Date
                  </div>
                  <div className="fw-bold text-dark">
                    {coursework.dueDate || 'No due date'}
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-muted small fw-semibold text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>
                    Topic
                  </div>
                  <div className="fw-bold text-dark text-truncate">
                    {coursework.topic || 'None'}
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-muted small fw-semibold text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>
                    Posted
                  </div>
                  <div className="fw-bold text-dark">
                    {coursework.postedDate || 'Recently'}
                  </div>
                </div>
              </div>

              {/* Instructions Text */}
              <div className="mb-4">
                <h6 className="fw-bold text-muted small text-uppercase mb-3">Instructions</h6>
                <div className="bg-light rounded-3 p-4 border" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {coursework.instructions || 'No instructions provided.'}
                </div>
              </div>

              {/* Attachments */}
              {coursework.attachments && coursework.attachments.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-bold text-muted small text-uppercase mb-3">Attachments</h6>
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
                            style={{ width: '48px', height: '48px', backgroundColor: '#f8f9fa' }}
                          >
                            <i className={`bi fs-4 ${att.type === 'pdf' ? 'bi-file-earmark-pdf-fill text-danger' : att.type === 'form' ? 'bi-file-earmark-check-fill text-purple' : att.type === 'youtube' ? 'bi-youtube text-danger' : 'bi-file-earmark-word-fill text-primary'}`}></i>
                          </div>
                          <div className="overflow-hidden">
                            <div className="fw-semibold small text-truncate">{att.name}</div>
                            <div className="text-muted text-xs text-uppercase" style={{ fontSize: '0.72rem' }}>{att.type}</div>
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Action Area (if student) */}
              {!isTeacher && (
                <div className="border-top pt-4 mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold text-dark mb-0">Your Work</h6>
                    <span className={`badge ${submissionState.submitted ? 'bg-success' : 'bg-warning text-dark'} border`}>
                      {submissionState.submitted ? 'Turned in' : 'Assigned'}
                    </span>
                  </div>
                  <div className="bg-light rounded-3 p-4 border text-center">
                    <i className="bi bi-cloud-upload text-primary fs-1 mb-2"></i>
                    <p className="text-muted small mb-3">Upload your completed files or mark as done.</p>

                    <div className="text-start mb-3">
                      <label className="form-label small fw-bold text-muted">Attachments (multiple files)</label>
                      <input
                        type="file"
                        className="form-control"
                        multiple
                        onChange={(e) => setSelectedSubmissionFiles(Array.from(e.target.files || []))}
                      />
                      <small className="form-text text-muted">You can select more than one file for your submission.</small>
                    </div>

                    {selectedSubmissionFiles.length > 0 && (
                      <div className="text-start mb-3">
                        <div className="fw-semibold small text-dark mb-2">Selected files</div>
                        <div className="d-flex flex-wrap gap-2">
                          {selectedSubmissionFiles.map((file, index) => (
                            <span key={`${file.name}-${index}`} className="badge bg-white text-dark border">
                              {file.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="d-flex gap-2 justify-content-center flex-wrap">
                      <button
                        className="btn btn-primary fw-medium shadow-sm"
                        onClick={handleTurnInWork}
                        disabled={submissionState.submitted || isSubmitting}
                      >
                        {submissionState.submitted ? 'Turned in' : '+ Add or Create & Turn In'}
                      </button>
                      <button className="btn btn-outline-secondary fw-medium">
                        Mark as done
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Private Comments Section */}
              <div className="border-top pt-4 mt-4">
                <h6 className="fw-bold text-muted small text-uppercase mb-3">
                  <i className="bi bi-chat-left-text me-1"></i>
                  Private Comments
                </h6>

                {privateComments.length > 0 ? (
                  <div className="mb-3">
                    {privateComments.map((cm) => (
                      <div key={cm.id} className="d-flex gap-3 mb-3">
                        <Avatar name={cm.author} size={36} color="#5f6368" />
                        <div className="flex-grow-1 bg-light rounded-3 p-3 border">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-bold text-dark small">{cm.author}</span>
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>{cm.date}</span>
                          </div>
                          <p className="mb-0 text-dark small" style={{ fontSize: '0.88rem' }}>{cm.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted small mb-3 fst-italic">No private comments yet.</p>
                )}

                <div className="d-flex gap-2">
                  <Avatar name={user.name} size={36} color={user.color} />
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control border rounded-pill px-3 py-2 shadow-none"
                      placeholder="Add a private comment to your teacher..."
                      value={studentComment}
                      onChange={(e) => setStudentComment(e.target.value)}
                    />
                    <button
                      className="btn btn-primary rounded-pill px-4"
                      onClick={handleAddComment}
                      disabled={!studentComment.trim()}
                    >
                      <i className="bi bi-send-fill"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'studentWork' && isTeacher && (
            <div>
              {/* Summary Stats */}
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
                  <i className="bi bi-clipboard-check-fill text-primary"></i>
                  Submission Review
                </h6>

                {studentsWithWork.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {studentsWithWork.map((st) => {
                      const currentGrade = gradeMatrix?.[st.id]?.[coursework.id];
                      const isGraded = currentGrade !== null && currentGrade !== undefined;
                      const studentName = st?.name || st?.full_name || st?.email || 'Student';
                      const studentFirstName = (studentName || '').split(' ')[0] || 'Submission';
                      const submissionPreview = [
                        {
                          id: `${st.id}-sample`,
                          name: `${studentFirstName}_work.pdf`,
                          type: 'pdf',
                          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
                        },
                        {
                          id: `${st.id}-sample-2`,
                          name: `${studentFirstName}_notes.docx`,
                          type: 'word',
                          url: '#'
                        }
                      ];
                      const selectedAttachment = selectedAttachmentByStudent[st.id] || submissionPreview[0];
                      const privateFeedback = privateFeedbackByStudent[st.id] || '';

                      return (
                        <div key={st.id} className="border rounded-4 p-4 bg-white shadow-sm">
                          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                            <div className="d-flex align-items-center gap-3">
                              <Avatar name={studentName} size={44} color="#1a73e8" />
                              <div>
                                <div className="fw-semibold text-dark">{studentName}</div>
                                <div className="text-muted small">{st.email || 'No email provided'}</div>
                              </div>
                            </div>

                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              {isGraded ? (
                                <span className="badge bg-success fs-6 font-monospace">
                                  {currentGrade} / {coursework.points}
                                </span>
                              ) : (
                                <span className="badge bg-warning text-dark border">Not graded</span>
                              )}
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => setSelectedStudentId(selectedStudentId === st.id ? null : st.id)}
                              >
                                {selectedStudentId === st.id ? 'Hide review' : 'Review submission'}
                              </button>
                            </div>
                          </div>

                          {selectedStudentId === st.id && (
                            <div className="border-top mt-3 pt-3">
                              <div className="row g-4">
                                <div className="col-12 col-lg-8">
                                  <div className="border rounded-3 overflow-hidden bg-light">
                                    <div className="px-3 py-2 border-bottom bg-white d-flex justify-content-between align-items-center">
                                      <div>
                                        <div className="fw-semibold text-dark">Preview</div>
                                        <div className="small text-muted">Current file: {selectedAttachment.name}</div>
                                      </div>
                                      <span className="badge bg-light text-muted border">{selectedAttachment.type}</span>
                                    </div>

                                    <SubmissionFilePreview file={selectedAttachment} />
                                  </div>
                                </div>

                                <div className="col-12 col-lg-4">
                                  <div className="border rounded-3 p-3 bg-white shadow-sm">
                                    <div className="mb-3">
                                      <div className="fw-semibold text-dark mb-2">Current file</div>
                                      <div className="text-muted small">{selectedAttachment.name}</div>
                                    </div>

                                    <label className="form-label small fw-bold text-muted mb-1">Grade (out of {coursework.points})</label>
                                    <input
                                      type="number"
                                      className="form-control mb-3"
                                      placeholder="Enter grade"
                                      min="0"
                                      max={coursework.points || 100}
                                      value={currentGrade ?? ''}
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? null : Number(e.target.value);
                                        handleGradeStudent(st.id, val);
                                      }}
                                    />

                                    <label className="form-label small fw-bold text-muted mb-1">Private comment</label>
                                    <textarea
                                      className="form-control mb-3"
                                      rows="4"
                                      placeholder="Add feedback for this student..."
                                      value={privateFeedback}
                                      onChange={(e) => setPrivateFeedbackByStudent({ ...privateFeedbackByStudent, [st.id]: e.target.value })}
                                    ></textarea>

                                    <div className="mb-3">
                                      <h6 className="fw-semibold text-muted small text-uppercase mb-2">Attached files</h6>
                                      <div className="d-flex flex-wrap gap-2">
                                        {submissionPreview.map((file) => (
                                          <button
                                            key={file.id}
                                            type="button"
                                            className={`border rounded p-2 px-3 d-flex align-items-center gap-2 text-decoration-none text-dark bg-white shadow-sm ${selectedAttachment.id === file.id ? 'border-primary' : ''}`}
                                            onClick={() => setSelectedAttachmentByStudent({ ...selectedAttachmentByStudent, [st.id]: file })}
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
                                        onClick={() => {
                                          if (onReturnWork) onReturnWork(cls.id, coursework.id, st.id);
                                          alert(`Returned work to ${st.name}`);
                                        }}
                                      >
                                        <i className="bi bi-reply me-2"></i>
                                        Return to student
                                      </button>
                                      <button className="btn btn-outline-secondary">
                                        <i className="bi bi-download me-2"></i>
                                        Download all files
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
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
                    <i className="bi bi-clock-fill text-warning"></i>
                    Students who haven't turned in work ({studentsWithoutWork.length})
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewInstructionPage;
