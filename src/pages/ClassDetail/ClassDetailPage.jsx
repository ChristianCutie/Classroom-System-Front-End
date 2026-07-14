import React, { useState, useMemo, useEffect } from 'react';
import StreamTab from './StreamTab.jsx';
import ClassworkTab from './ClassworkTab.jsx';
import PeopleTab from './PeopleTab.jsx';
import GradesTab from './GradesTab.jsx';
import ViewInstructionPage from './ViewInstructionPage.jsx';
import { useToast } from '@/context/ToastContext.jsx';
import { assignmentAPI, resolveAttachmentUrl } from '@/api/client.js';
import { bannerGradients } from '../../data/mockData.jsx';

const ClassDetailPage = ({
  cls,
  user,
  onPostAnnouncement,
  onAddComment,
  onCreateCoursework,
  onSubmitCoursework,
  onCreateTopic,
  onUpdateGrade,
  onUpdateClassBanner,
  onDiscussionCreated
}) => {
  const [activeTab, setActiveTab] = useState('stream');
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [selectedCoursework, setSelectedCoursework] = useState(null);
  const [instructionViewTab, setInstructionViewTab] = useState('instructions');
  const { addToast } = useToast();
  const [classworkFromApi, setClassworkFromApi] = useState(null);

  if (!cls) return null;

  const handleViewInstruction = (coursework, options = {}) => {
    setSelectedCoursework(coursework);
    setInstructionViewTab(options.openTab || 'instructions');
  };

  const handleBackToClasswork = () => {
    setSelectedCoursework(null);
    setInstructionViewTab('instructions');
    setActiveTab('classwork');
  };

  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab);
    setSelectedCoursework(null);
    setInstructionViewTab('instructions');
  };

  const normalizeTopicValue = (value) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed || '';
    }

    if (!value || typeof value !== 'object') return '';

    const derivedName = value.topic_name || value.name || value.topicName || value.label || value.title || value.topic;
    if (typeof derivedName === 'string') {
      const trimmed = derivedName.trim();
      return trimmed || '';
    }

    return '';
  };

  const mergedClasswork = useMemo(() => {
    const apiItems = Array.isArray(classworkFromApi) ? classworkFromApi : [];
    const localItems = Array.isArray(cls?.classwork) ? cls.classwork : [];
    const assignmentItems = Array.isArray(cls?.assignments) ? cls.assignments : [];
    const mergedById = new Map();

    const mergeItem = (item) => {
      if (!item?.id) return;

      const existing = mergedById.get(item.id) || {};
      mergedById.set(item.id, {
        ...existing,
        ...item,
        submitted: item.submitted ?? existing.submitted ?? false,
        userSubmission: item.userSubmission || existing.userSubmission || null,
        status: item.status || existing.status || null,
        submissions: item.submissions || existing.submissions || [],
        stats: item.stats || existing.stats || null,
      });
    };

    apiItems.forEach(mergeItem);
    localItems.forEach(mergeItem);
    assignmentItems.forEach(mergeItem);

    return Array.from(mergedById.values());
  }, [classworkFromApi, cls?.classwork, cls?.assignments]);

  // Build grade matrix from assignments with submissions
  const gradeMatrix = useMemo(() => {
    const matrix = {};
    const students = cls?.students || [];
    students.forEach(st => {
      matrix[st.id] = {};
    });
    
    // Extract grades from API classwork submissions
    if (classworkFromApi && Array.isArray(classworkFromApi)) {
      classworkFromApi.forEach(asg => {
        if (asg.submissions && Array.isArray(asg.submissions)) {
          asg.submissions.forEach(sub => {
            const studentId = sub.student_id || sub.studentId;
            if (studentId && matrix[studentId]) {
              if (sub.grade !== null && sub.grade !== undefined) {
                matrix[studentId][asg.id] = sub.grade;
              }
            }
          });
        }
      });
    }
    
    // Fall back to class grades if available
    const initialGrades = cls?.grades || [];
    students.forEach(st => {
      const stRow = initialGrades.find(g => g.studentId === st.id) || {};
      Object.keys(stRow).forEach(key => {
        if (key !== 'studentId' && matrix[st.id][key] === undefined) {
          matrix[st.id][key] = stRow[key];
        }
      });
    });
    
    return matrix;
  }, [cls, classworkFromApi]);

  const handleReturnWork = (classId, courseworkId, studentId) => {
    addToast('Returned work to student.', 'success');
    // If there is a more specific API handler for returning work, call it via props
    // For now, we provide a feedback toast and leave room for server integration.
  };
  //
  //
  // =========== Use Effects for Data Fetching and State Persistence ===========
  //
  //
  //

  // Persist active tab in sessionStorage
useEffect(() => {
  const savedTab = sessionStorage.getItem('classDetailActiveTab');
  if (savedTab && ['stream', 'classwork', 'people', 'grades'].includes(savedTab)) {
    setActiveTab(savedTab);
  }
}, []);

useEffect(() => {
  sessionStorage.setItem('classDetailActiveTab', activeTab);
}, [activeTab]);

  useEffect(() => {
    if (!selectedCoursework?.id) return;

    const sourceClasswork =
      mergedClasswork.find((item) => item.id === selectedCoursework.id) ||
      (cls?.classwork || []).find((item) => item.id === selectedCoursework.id) ||
      (cls?.assignments || []).find((item) => item.id === selectedCoursework.id);

    if (!sourceClasswork) return;

    const mergedCoursework = {
      ...selectedCoursework,
      ...sourceClasswork,
      id: selectedCoursework.id,
      submitted: sourceClasswork.submitted ?? selectedCoursework.submitted,
      userSubmission: sourceClasswork.userSubmission || selectedCoursework.userSubmission || null,
      status: sourceClasswork.status || selectedCoursework.status,
      submissions: sourceClasswork.submissions || selectedCoursework.submissions || [],
      stats: sourceClasswork.stats || selectedCoursework.stats || {
        turnedIn: 0,
        assigned: cls?.students?.length || 0,
        graded: 0,
      },
    };

    const hasChanged =
      mergedCoursework.submitted !== selectedCoursework.submitted ||
      mergedCoursework.status !== selectedCoursework.status ||
      mergedCoursework.userSubmission?.status !== selectedCoursework.userSubmission?.status ||
      (mergedCoursework.submissions || []).length !== (selectedCoursework.submissions || []).length;

    if (hasChanged) {
      setSelectedCoursework(mergedCoursework);
    }
  }, [selectedCoursework?.id, selectedCoursework?.submitted, selectedCoursework?.status, selectedCoursework?.userSubmission?.status, selectedCoursework?.submissions?.length, mergedClasswork, cls?.classwork, cls?.assignments, cls?.students?.length, cls?.submissionVersion]);

  // Fetch assignments for the class from backend and map to frontend shape
  useEffect(() => {
    let mounted = true;
    const fetchAssignments = async () => {
      if (!cls?.id) return;

      try {
        const res = await assignmentAPI.getAssignments(cls.id);
        const items = res.data?.data || [];
        const mapped = items.map(a => {
          const normalizedSubmissions = Array.isArray(a.submissions) ? a.submissions : [];
          const hasLocalSubmissionSignal = Boolean(
            a.submitted ||
            a.user_submitted ||
            a.userSubmitted ||
            a.user_submission?.status ||
            a.userSubmission?.status ||
            ['submitted', 'turned_in', 'graded'].includes(a.status)
          );
          const turnedIn = hasLocalSubmissionSignal ? Math.max(normalizedSubmissions.length, 1) : normalizedSubmissions.length;
          const graded = normalizedSubmissions.filter(s => s.grade !== null && s.grade !== undefined).length + (a.user_submission?.status === 'graded' || a.userSubmission?.status === 'graded' ? 1 : 0);
          return {
            id: a.id,
            title: a.title,
            dueDate: a.due_date || a.dueDate || null,
            points: a.max_points ?? a.maxPoints ?? null,
            type: 'assignment',
            topic: normalizeTopicValue(a.topic) || 'General',
            instructions: a.instructions || a.description || 'No instructions provided.',
            attachments: (a.attachments || []).map(att => {
              const attachmentName = [
                att.file_name,
                att.filename,
                att.fileName,
                att.original_name,
                att.originalName,
                att.display_name,
                att.displayName,
                att.name,
              ].find(value => typeof value === 'string' && value.trim());

              return {
                id: att.id,
                name: attachmentName || att.file_path?.split('/').pop() || 'Attachment',
                type: att.file_type || 'file',
                url: att.file_path ? resolveAttachmentUrl(att.file_path) : att.url || null
              };
            }),
            postedDate: a.created_at ? new Date(a.created_at).toLocaleDateString() : 'recently',
            submitted: hasLocalSubmissionSignal || normalizedSubmissions.length > 0,
            userSubmission: a.userSubmission || a.user_submission || null,
            status: a.status || a.user_submission?.status || a.userSubmission?.status || null,
            stats: { turnedIn, assigned: (cls.students || []).length, graded },
            submissions: normalizedSubmissions.map(sub => ({
              id: sub.id,
              student_id: sub.student_id || sub.studentId,
              grade: sub.grade,
              feedback: sub.feedback || sub.comments || '',
              submitted_at: sub.submitted_at || sub.created_at,
              status: sub.status || 'submitted'
            }))
          };
        });
        if (mounted) setClassworkFromApi(mapped);
      } catch (err) {
        console.error('Failed to load assignments for class:', err);
        if (mounted) setClassworkFromApi([]);
      }
    };

    fetchAssignments();
    return () => { mounted = false; };
  }, [cls?.id, cls?.students?.length, cls?.submissionVersion]);

  return (
    <div className="container-fluid px-2 px-md-4 py-2">
      
      {/* Navigation Tabs Header */}
      <div className="border-bottom bg-white mb-3 mt-n3 mx-n2 mx-md-n4 px-2 px-md-4 d-flex justify-content-between align-items-center flex-wrap">
        <ul className="nav gc-nav-tabs">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'stream' ? 'active' : ''}`}
              onClick={() => handleTabChange('stream')}
            >
              Stream
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'classwork' ? 'active' : ''}`}
              onClick={() => handleTabChange('classwork')}
            >
              Classwork
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'people' ? 'active' : ''}`}
              onClick={() => handleTabChange('people')}
            >
              People
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'grades' ? 'active' : ''}`}
              onClick={() => handleTabChange('grades')}
            >
              Grades
            </button>
            </li>
        </ul>

        <div className="d-flex align-items-center gap-2 py-2">
          <button
            className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-flex align-items-center gap-2"
            onClick={() => setShowCustomizeModal(true)}
          >
            <i className="bi bi-palette text-primary"></i>
            <span>Customize</span>
          </button>
        </div>
      </div>

      {/* Main Banner */}
      <div
        className="gc-detail-banner mb-4"
        style={{ background: cls.banner }}
      >
        <div className="d-flex justify-content-between align-items-end w-100">
          <div>
            <h1 className="font-google fw-bold mb-1 text-white" style={{ fontSize: '2.2rem', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
              {cls.subject}
            </h1>
            <p className="mb-0 text-white text-opacity-90 fs-5">
              {cls.section || cls.subject}
            </p>
          </div>
          <div className="d-none d-md-block text-end">
            <span className="badge bg-white text-dark py-2 px-3 fw-medium font-monospace shadow-sm">
              Class Code: {cls.class_code}
            </span>
          </div>
        </div>
      </div>

      {/* Active Tab Component */}
      <div>
        {selectedCoursework ? (
          <ViewInstructionPage
            cls={cls}
            coursework={selectedCoursework}
            user={user}
            students={cls.students || []}
            gradeMatrix={gradeMatrix}
            onBack={handleBackToClasswork}
            onSubmitWork={onSubmitCoursework}
            onUpdateGrade={onUpdateGrade}
            onReturnWork={handleReturnWork}
            defaultActiveTab={instructionViewTab}
          />
        ) : (
          <>
            {activeTab === 'stream' && (
              <StreamTab
                cls={cls}
                user={user}
                onPostAnnouncement={onPostAnnouncement}
                onAddComment={onAddComment}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onDiscussionCreated={onDiscussionCreated}
              />
            )}
            {activeTab === 'classwork' && (
              <ClassworkTab
                cls={cls}
                user={user}
                onCreateCoursework={onCreateCoursework}
                onSubmitCoursework={onSubmitCoursework}
                onCreateTopic={onCreateTopic}
                onViewInstruction={handleViewInstruction}
                classwork={mergedClasswork}
                onSetActiveTab={setActiveTab}
              />
            )}
            {activeTab === 'people' && (
              <PeopleTab
                cls={cls}
                user={user}
              />
            )}
            {activeTab === 'grades' && (
              <GradesTab
                cls={{ ...cls, classwork: mergedClasswork }}
                user={user}
                onUpdateGrade={onUpdateGrade}
              />
            )}
          </>
        )}
      </div>

      {/* Customize Theme Modal */}
      {showCustomizeModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <h5 className="modal-title font-google fw-bold">Customize appearance</h5>
                <button className="btn-close" onClick={() => setShowCustomizeModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <label className="form-label small fw-bold text-muted text-uppercase mb-3">Select Banner Theme</label>
                <div className="row g-3">
                  {bannerGradients.map((b) => (
                    <div key={b.id} className="col-6">
                      <div
                        className="p-3 rounded-3 text-white fw-bold d-flex align-items-center justify-content-between shadow-sm"
                        style={{
                          background: b.css,
                          cursor: 'pointer',
                          height: '70px',
                          border: cls.banner === b.css ? '3px solid #000' : 'none'
                        }}
                        onClick={() => {
                          onUpdateClassBanner(cls.id, b.css, b.color);
                          setShowCustomizeModal(false);
                        }}
                      >
                        <span className="small">{b.name}</span>
                        {cls.banner === b.css && <i className="bi bi-check-circle-fill text-white fs-5"></i>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClassDetailPage;