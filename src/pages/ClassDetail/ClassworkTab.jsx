import React, { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/context/ToastContext.jsx';

const ClassworkTab = ({ cls, user, onCreateCoursework, onSubmitCoursework, onViewInstruction, classwork }) => {
  const [selectedTopic, setSelectedTopic] = useState('All topics');
  const [expandedId, setExpandedId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [createType, setCreateType] = useState('assignment');
  const [topicName, setTopicName] = useState('');
  const [customTopics, setCustomTopics] = useState([]);

  // Create coursework form state
  const [cwTitle, setCwTitle] = useState('');
  const [cwInstructions, setCwInstructions] = useState('');
  const [cwTopic, setCwTopic] = useState('General');
  const [cwPoints, setCwPoints] = useState('100');
  const [cwDueDate, setCwDueDate] = useState('');
  const [cwAttachments, setCwAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const { addToast } = useToast();

  const isTeacher = useMemo(() => {
    if (!user) return false;

    if (typeof user.role === 'string') {
      const normalized = user.role.toLowerCase();
      return normalized === 'teacher' || normalized === 'instructor' || normalized === 'teacher/instructor';
    }

    if (user.role && typeof user.role === 'object') {
      const roleName = user.role.role_name || user.role.name || user.role.value || '';
      const normalized = String(roleName).toLowerCase();
      return normalized === 'teacher' || normalized === 'instructor' || normalized === 'teacher/instructor';
    }

    return Boolean(user.is_teacher || user.isTeacher);
  }, [user]);

  // --- Merge assignments and quizzes into a unified classwork list ---
  const classworkList = useMemo(() => {
    if (Array.isArray(classwork) && classwork.length) return classwork;
    const assignments = (cls.assignments || []).map(a => ({
      id: a.id,
      title: a.title,
      dueDate: a.due_date,
      points: a.max_points || 100,
      type: 'assignment',
      topic: a.topic || 'General',
      instructions: a.instructions || 'No instructions provided.',
      attachments: a.attachments || [],
      postedDate: a.created_at ? new Date(a.created_at).toLocaleDateString() : 'recently',
      stats: a.stats || null
    }));

    const quizzes = (cls.quizzes || []).map(q => ({
      id: q.id,
      title: q.title,
      dueDate: q.due_date,
      points: q.max_points || 100,
      type: 'quiz',
      topic: q.topic || 'General',
      instructions: q.instructions || 'No instructions provided.',
      attachments: q.attachments || [],
      postedDate: q.created_at ? new Date(q.created_at).toLocaleDateString() : 'recently',
      stats: q.stats || null
    }));

    return [...assignments, ...quizzes];
  }, [classwork, cls.assignments, cls.quizzes]);

  useEffect(() => {
    setSubmissionStatus((prev) => {
      const next = { ...prev };
      classworkList.forEach((cw) => {
        const hasSubmission = Boolean(
          cw.submitted ||
          cw.userSubmitted ||
          cw.userSubmission?.status === 'submitted' ||
          cw.userSubmission?.status === 'turned_in' ||
          cw.userSubmission?.status === 'graded' ||
          cw.status === 'submitted'
        );
        if (hasSubmission) next[cw.id] = true;
      });
      return next;
    });
  }, [classworkList]);

  // --- Derive topics from the classwork list ---
  const topics = useMemo(() => {
    const uniqueTopics = new Set([
      ...customTopics,
      ...classworkList.map(cw => cw.topic || 'General')
    ]);
    return ['All topics', ...uniqueTopics];
  }, [classworkList, customTopics]);

  const filteredWork = selectedTopic === 'All topics'
    ? classworkList
    : classworkList.filter(cw => cw.topic === selectedTopic);

  // Group by topic
  const groupedWork = filteredWork.reduce((acc, cw) => {
    const topic = cw.topic || 'No topic';
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(cw);
    return acc;
  }, {});

  const handleAddTopic = (e) => {
    e.preventDefault();
    const trimmedTopic = topicName.trim();
    if (!trimmedTopic) return;

    setCustomTopics((prev) => (prev.includes(trimmedTopic) ? prev : [...prev, trimmedTopic]));
    setSelectedTopic(trimmedTopic);
    setTopicName('');
    setShowTopicModal(false);
    addToast(`Topic "${trimmedTopic}" added!`, 'info');
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!cwTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = createType === 'assignment'
        ? (() => {
            const formData = new FormData();
            formData.append('class_id', cls.id);
            formData.append('title', cwTitle.trim());
            formData.append('instructions', cwInstructions.trim());
            formData.append('max_points', Number(cwPoints) || 100);
            formData.append('topic', cwTopic || 'General');
            if (cwDueDate) formData.append('due_date', cwDueDate);
            cwAttachments.forEach((file, index) => {
              if (file instanceof File) {
                formData.append(`attachments[${index}]`, file);
              }
            });
            return { type: 'assignment', data: formData };
          })()
        : {
            title: cwTitle.trim(),
            type: createType,
            topic: cwTopic,
            dueDate: createType === 'material' ? null : cwDueDate,
            points: createType === 'material' ? null : Number(cwPoints) || 100,
            instructions: cwInstructions.trim(),
            attachments: [{ type: 'pdf', name: `${cwTitle.replace(/\s+/g, '_')}_Docs.pdf`, url: '#' }],
            postedDate: 'Today'
          };

      const created = await onCreateCoursework(cls.id, payload);
      if (created !== false) {
        setCwTitle('');
        setCwInstructions('');
        setCwTopic('General');
        setCwPoints('100');
        setCwDueDate('');
        setCwAttachments([]);
        setShowCreateModal(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStudentTurnIn = async (cw) => {
    if (!onSubmitCoursework || submissionStatus[cw.id] || submittingId === cw.id) return;

    setSubmittingId(cw.id);
    try {
      const ok = await onSubmitCoursework(cls.id, cw.id);
      if (ok !== false) {
        setSubmissionStatus((prev) => ({ ...prev, [cw.id]: true }));
      }
    } catch (error) {
      console.error('Failed to turn in coursework:', error);
      addToast('Could not turn in the coursework right now.', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'assignment': return 'bi-clipboard-check-fill';
      case 'quiz': return 'bi-card-checklist';
      case 'material': return 'bi-bookmark-fill';
      case 'question': return 'bi-question-circle-fill';
      default: return 'bi-file-earmark-text-fill';
    }
  };

  return (
    <div>
      {/* Top Action Bar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom gap-3">
        <div className="d-flex align-items-center gap-2">
          {isTeacher && (
            <div className="dropdown">
              <button
                className="btn text-white rounded-pill px-3 py-2 fw-medium shadow-sm d-flex align-items-center gap-2"
                style={{ backgroundColor: '#1a73e8' }}
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-plus-lg fs-5"></i>
                <span>Create</span>
              </button>
              <ul className="dropdown-menu shadow my-2 border">
                <li>
                  <button className="dropdown-item py-2 d-flex align-items-center gap-2" onClick={() => { setCreateType('assignment'); setShowCreateModal(true); }}>
                    <i className="bi bi-clipboard-check text-primary"></i> Assignment
                  </button>
                </li>
                <li>
                  <button className="dropdown-item py-2 d-flex align-items-center gap-2" onClick={() => { setCreateType('quiz'); setShowCreateModal(true); }}>
                    <i className="bi bi-card-checklist text-success"></i> Quiz assignment
                  </button>
                </li>
                <li>
                  <button className="dropdown-item py-2 d-flex align-items-center gap-2" onClick={() => { setCreateType('question'); setShowCreateModal(true); }}>
                    <i className="bi bi-question-circle text-warning"></i> Question
                  </button>
                </li>
                <li>
                  <button className="dropdown-item py-2 d-flex align-items-center gap-2" onClick={() => { setCreateType('material'); setShowCreateModal(true); }}>
                    <i className="bi bi-bookmark text-info"></i> Material
                  </button>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item py-2 d-flex align-items-center gap-2" onClick={() => setShowTopicModal(true)}>
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
            onClick={() => window.open('https://drive.google.com', '_blank')}
          >
            <i className="bi bi-folder2-open text-warning fs-6"></i> Class Drive folder
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Topic Sidebar Pills */}
        <div className="col-12 col-md-3">
          <h6 className="fw-bold text-muted small text-uppercase mb-3 px-1">Topics</h6>
          <div className="d-flex flex-md-column gap-2 flex-wrap">
            {topics.map((t, idx) => (
              <div
                key={idx}
                className={`topic-pill text-truncate ${selectedTopic === t ? 'active' : ''}`}
                onClick={() => setSelectedTopic(t)}
                title={t}
              >
                {t}
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
                  <h4 className="font-google fw-bold text-dark mb-0" style={{ color: cls.themeColor || '#1a73e8' }}>
                    {topicName}
                  </h4>
                  <span className="badge bg-light text-muted border">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
                </div>

                <div className="d-flex flex-column gap-2">
                  {items.map((cw) => {
                    const isExpanded = expandedId === cw.id;
                    return (
                      <div key={cw.id} className="card border shadow-sm rounded-3 overflow-hidden">
                        
                        {/* Header Row */}
                        <div
                          className={`p-3 d-flex align-items-center justify-content-between ${isExpanded ? 'bg-light border-bottom' : 'bg-white'}`}
                          style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                          onClick={() => setExpandedId(isExpanded ? null : cw.id)}
                        >
                          <div className="d-flex align-items-center gap-3 overflow-hidden">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0 shadow-sm"
                              style={{ width: '40px', height: '40px', backgroundColor: cls.themeColor || '#1a73e8' }}
                            >
                              <i className={`bi ${getTypeIcon(cw.type)} fs-5`}></i>
                            </div>
                            <div className="overflow-hidden">
                              <h6 className="fw-bold mb-1 text-dark text-truncate" style={{ fontSize: '0.98rem' }}>
                                {cw.title}
                              </h6>
                              <span className="text-muted small">
                                Posted {cw.postedDate || 'recently'} {cw.points ? `• ${cw.points} points` : ''}
                              </span>
                            </div>
                          </div>

                          <div className="d-flex align-items-center gap-3 flex-shrink-0 ms-2">
                            {cw.dueDate && (
                              <span className="text-muted small fw-medium d-none d-sm-inline">
                                Due {cw.dueDate}
                              </span>
                            )}
                            <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} text-secondary`}></i>
                          </div>
                        </div>

                        {/* Expanded Details Body */}
                        {isExpanded && (
                          <div className="card-body p-4 bg-white animate-fade-in">
                            <div className="row g-4">
                              <div className={cw.stats || isTeacher ? "col-12 col-lg-8" : "col-12"}>
                                <p className="text-dark mb-4" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                  {cw.instructions || "No instructions provided."}
                                </p>

                                {cw.attachments && cw.attachments.length > 0 && (
                                  <div>
                                    <h6 className="fw-semibold small text-muted text-uppercase mb-2">Attachments</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                      {cw.attachments.map((att, idx) => (
                                        <a
                                          key={idx}
                                          href={att.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="border rounded p-2 px-3 d-flex align-items-center gap-2 text-decoration-none text-dark bg-light hover-bg-white shadow-sm"
                                        >
                                          <i className={`bi ${att.type === 'pdf' ? 'bi-file-earmark-pdf-fill text-danger' : att.type === 'form' ? 'bi-file-earmark-check-fill text-purple' : 'bi-file-earmark-word-fill text-primary'} fs-5`}></i>
                                          <span className="small fw-medium">{att.name}</span>
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Teacher Stats or Student Action Box */}
                              <div className="col-12 col-lg-4 border-start-lg">
                                {isTeacher && cw.stats ? (
                                  <div className="p-3 bg-light rounded-3 text-center border">
                                    <h6 className="fw-bold text-muted small text-uppercase mb-3">Submission Summary</h6>
                                    <div className="d-flex justify-content-around mb-3">
                                      <div>
                                        <div className="fs-3 fw-bolder text-primary">{cw.stats.turnedIn}</div>
                                        <div className="text-muted small">Turned in</div>
                                      </div>
                                      <div className="border-end"></div>
                                      <div>
                                        <div className="fs-3 fw-bolder text-dark">{cw.stats.assigned}</div>
                                        <div className="text-muted small">Assigned</div>
                                      </div>
                                      {cw.stats.graded !== undefined && (
                                        <>
                                          <div className="border-end"></div>
                                          <div>
                                            <div className="fs-3 fw-bolder text-success">{cw.stats.graded}</div>
                                            <div className="text-muted small">Graded</div>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                    <button
                                      className="btn btn-sm btn-outline-primary w-100 fw-medium"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onViewInstruction?.(cw, { openTab: 'studentWork' });
                                      }}
                                    >
                                      View submissions
                                    </button>
                                  </div>
                                ) : (
                                  <div className="p-3 bg-light rounded-3 border text-center">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                      <span className="fw-bold small text-dark">Your work</span>
                                      <span className={`badge ${submissionStatus[cw.id] ? 'bg-success' : 'bg-warning text-dark'} small`}>
                                        {submissionStatus[cw.id] ? 'Turned in' : 'Assigned'}
                                      </span>
                                    </div>
                                    <p className="text-muted small mb-3">Upload your completed files or mark as done.</p>
                                    <button
                                      className="btn btn-primary btn-sm w-100 fw-medium mb-2 shadow-sm"
                                      onClick={() => handleStudentTurnIn(cw)}
                                      disabled={submissionStatus[cw.id] || submittingId === cw.id}
                                    >
                                      {submissionStatus[cw.id] ? 'Turned in' : '+ Add or Create & Turn In'}
                                    </button>
                                    <button className="btn btn-outline-secondary btn-sm w-100 fw-medium">Mark as done</button>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="border-top mt-4 pt-3 d-flex justify-content-between align-items-center">
                              <button className="btn btn-link btn-sm p-0 text-decoration-none fw-medium text-secondary">
                                <i className="bi bi-chat-left-text me-1"></i> Add class comment
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
              <h6 className="fw-semibold text-dark">No coursework in this topic</h6>
              <p className="text-muted small mb-0">Check another topic or click "+ Create" to assign work.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Topic Modal */}
      {showTopicModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <h5 className="modal-title font-google fw-bold">Add topic</h5>
                <button className="btn-close" onClick={() => setShowTopicModal(false)}></button>
              </div>

              <form onSubmit={handleAddTopic}>
                <div className="modal-body p-4">
                  <label className="form-label small fw-bold text-muted">Topic name</label>
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
                  <button type="button" className="btn btn-light fw-medium px-4" onClick={() => setShowTopicModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-medium px-4">
                    Add topic
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Coursework Modal */}
      {showCreateModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <h5 className="modal-title font-google fw-bold text-capitalize">
                  Create {createType.replace('-', ' ')}
                </h5>
                <button className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>

              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body p-4">
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

                  <div className="form-floating mb-3">
                    <textarea
                      className="form-control"
                      id="cwInstr"
                      placeholder="Instructions (optional)"
                      style={{ minHeight: '120px' }}
                      value={cwInstructions}
                      onChange={(e) => setCwInstructions(e.target.value)}
                    />
                    <label htmlFor="cwInstr">Instructions (optional)</label>
                  </div>

                  {createType === 'assignment' && (
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-muted">Attachments (optional)</label>
                      <input
                        type="file"
                        className="form-control"
                        multiple
                        onChange={(e) => setCwAttachments(Array.from(e.target.files || []))}
                      />
                    </div>
                  )}

                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold text-muted">Topic</label>
                      <input
                        type="text"
                        className="form-control"
                        list="topic-suggestions"
                        value={cwTopic}
                        onChange={(e) => setCwTopic(e.target.value)}
                        placeholder="Enter or choose a topic"
                      />
                      <datalist id="topic-suggestions">
                        {topics.filter(t => t !== 'All topics').map((t, i) => (
                          <option key={i} value={t} />
                        ))}
                      </datalist>
                      <small className="form-text text-muted">You can type a new topic or pick one from the list.</small>
                    </div>

                    {createType !== 'material' && (
                      <>
                        <div className="col-6 col-md-4">
                          <label className="form-label small fw-bold text-muted">Points</label>
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
                          <label className="form-label small fw-bold text-muted">Due Date</label>
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
                </div>

                <div className="modal-footer border-top px-4 py-3">
                  <button type="button" className="btn btn-light fw-medium px-4" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn text-white fw-medium px-4"
                    style={{ backgroundColor: cls.themeColor || '#1a73e8' }}
                    disabled={!cwTitle.trim() || isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : createType === 'assignment' ? 'Create assignment' : 'Assign'}
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