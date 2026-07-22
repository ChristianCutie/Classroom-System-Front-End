import React, { useState, useEffect } from 'react';
import Avatar from '../../components/Common/Avatar.jsx';
import { useToast } from '@/context/ToastContext.jsx';
import { classAPI } from '@/api/client';

const GradesTab = ({ cls, user, onUpdateGrade }) => {
  const students = cls?.students || [];
  const assignments = cls?.classwork ? cls.classwork.filter(cw => cw.points !== null && cw.points !== undefined) : [];
  const { addToast } = useToast();

  // ---------- Role detection ----------
  const getRoleString = (u) => {
    if (!u) return '';
    if (typeof u.role === 'string') return u.role;
    if (u.role && typeof u.role === 'object') {
      const nested = u.role.role_name || u.role.name || u.role.value || '';
      if (typeof nested === 'string' && nested.trim()) return nested;
    }
    if (typeof u.role_name === 'string') return u.role_name;
    if (typeof u.type === 'string') return u.type;
    return '';
  };

  const roleStr = getRoleString(user).toLowerCase();
  const isTeacher =
    ['teacher', 'instructor', 'teacher/instructor'].includes(roleStr) ||
    Boolean(user?.is_teacher || user?.isTeacher);

  const getDisplayName = (person) => {
    if (!person) return "User";
    const fullName = [person.first_name || person.firstName, person.last_name || person.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return fullName || person.fullName || person.name || "User";
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

  // ---------- Grade matrix (studentId -> { assignmentId: grade }) ----------
  const initialGrades = cls?.grades || [];
  const [gradeMatrix, setGradeMatrix] = useState(() => {
    const matrix = {};
    students.forEach(st => {
      matrix[st.id] = {};
      const stRow = initialGrades.find(g => g.studentId === st.id) || {};
      assignments.forEach(asg => {
        matrix[st.id][asg.id] = stRow[asg.id] ?? null;
      });
    });
    return matrix;
  });

  // ---------- Summary state ----------
  const [gradesSummary, setGradesSummary] = useState(null);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [gradesError, setGradesError] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  // ---------- Assignment drill‑down ----------
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);

  // ---------- Fetch summary ----------
  useEffect(() => {
    if (!cls || !cls.id) return;
    let mounted = true;
    const fetchGrades = async () => {
      setLoadingGrades(true);
      try {
        const res = await classAPI.getClassGrades(cls.id);
        if (!mounted) return;
        setGradesSummary(res.data?.data || null);
        setGradesError(null);
      } catch (err) {
        console.error('❌ Failed to fetch grades:', err);
        if (!mounted) return;
        setGradesError(err);
        addToast('Failed to load grades summary', 'danger');
      } finally {
        if (mounted) setLoadingGrades(false);
      }
    };
    fetchGrades();
    return () => { mounted = false; };
  }, [cls?.id, addToast]);

  // ---------- Handlers ----------
  const handleGradeChange = (studentId, cwId, newScore) => {
    const numeric = newScore === '' ? null : Number(newScore);
    const updated = {
      ...gradeMatrix,
      [studentId]: {
        ...gradeMatrix[studentId],
        [cwId]: numeric
      }
    };
    setGradeMatrix(updated);
    if (onUpdateGrade) {
      onUpdateGrade(cls.id, studentId, cwId, numeric);
    }
  };

  const calculateClassAverage = (cwId) => {
    let sum = 0;
    let count = 0;
    students.forEach(st => {
      const score = gradeMatrix[st.id]?.[cwId];
      if (score !== null && score !== undefined && !isNaN(score)) {
        sum += score;
        count++;
      }
    });
    if (count === 0) return '—';
    return (sum / count).toFixed(1);
  };

  const calculateStudentOverall = (stId) => {
    let earned = 0;
    let totalPossible = 0;
    assignments.forEach(asg => {
      const score = gradeMatrix[stId]?.[asg.id];
      if (score !== null && score !== undefined && !isNaN(score)) {
        earned += score;
        totalPossible += (asg.points || 100);
      }
    });
    if (totalPossible === 0) return '—';
    return `${Math.round((earned / totalPossible) * 100)}%`;
  };

  // ---------- Counts for assignment list ----------
  const getAssignmentStats = (cwId) => {
    let submitted = 0;
    let graded = 0;
    students.forEach(st => {
      const score = gradeMatrix[st.id]?.[cwId];
      if (score !== null && score !== undefined && !isNaN(score)) {
        submitted++;
        if (score !== '') graded++;
      }
    });
    return { submitted, graded };
  };

  // ---------- Empty state ----------
  if (students.length === 0 || assignments.length === 0) {
    return (
      <div className="text-center py-5 bg-white border rounded-3 shadow-sm my-4">
        <i className="bi bi-table text-muted fs-1 mb-2"></i>
        <h6 className="fw-semibold text-dark">Your Gradebook is ready</h6>
        <p className="text-muted small mb-0">
          {students.length === 0 ? 'No students in this class yet.' : 'No graded assignments found.'}
        </p>
        <p className="text-muted small">Once you add students and graded assignments, grades will appear in this table.</p>
      </div>
    );
  }

  // ---------- Student View ----------
  if (!isTeacher) {
    const myId = students.find(s => getDisplayName(s) === getDisplayName(user))?.id || students[0]?.id;
    if (!myId) {
      return <div className="alert alert-warning">You are not enrolled in this class.</div>;
    }
    return (
      <div className="max-w-4xl mx-auto py-2" style={{ maxWidth: '800px' }}>
        <div className="d-flex align-items-center justify-content-between p-4 bg-white border rounded-3 shadow-sm mb-4">
          <div className="d-flex align-items-center gap-3">
            <Avatar name={user} size={52} color={user.color} />
            <div>
              <h5 className="fw-bold mb-0 text-dark">{getDisplayName(user)}</h5>
              <span className="text-muted small">Course Overall Grade</span>
            </div>
          </div>
          <div className="text-end">
            <span className="fs-2 fw-bolder text-primary font-monospace">{calculateStudentOverall(myId)}</span>
          </div>
        </div>

        <h6 className="fw-bold text-muted small text-uppercase mb-3">Grades & Submissions</h6>
        <div className="bg-white border rounded-3 shadow-sm overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="py-3 ps-4">Assignment</th>
                  <th className="py-3">Topic</th>
                  <th className="py-3">Status</th>
                  <th className="py-3 pe-4 text-end">Grade</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(asg => {
                  const myScore = gradeMatrix[myId]?.[asg.id];
                  const hasGrade = myScore !== null && myScore !== undefined;
                  return (
                    <tr key={asg.id}>
                      <td className="ps-4 fw-medium text-dark py-3">{asg.title}</td>
                      <td className="text-muted small">{normalizeTopicValue(asg.topic)}</td>
                      <td>
                        <span className={`badge ${hasGrade ? 'bg-success bg-opacity-10 text-success border border-success' : 'bg-warning bg-opacity-10 text-warning border border-warning'}`}>
                          {hasGrade ? 'Graded & Returned' : 'Assigned / Pending'}
                        </span>
                      </td>
                      <td className="pe-4 text-end font-monospace fw-bold">
                        {hasGrade ? `${myScore} / ${asg.points}` : `— / ${asg.points}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Teacher: Summary View ----------
  if (isTeacher && showSummary) {
    return (
      <div className="bg-white border rounded-3 shadow-sm overflow-hidden">
        <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h5 className="mb-0 fw-bold text-dark">
              {gradesSummary?.class_name || cls?.class_name || 'Grades'}
            </h5>
            <span className="text-muted small">Summary of all student grades</span>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              onClick={() => setShowSummary(false)}
            >
              <i className="bi bi-arrow-left"></i> Back to Gradebook
            </button>
          </div>
        </div>

        <div className="p-3">
          {loadingGrades ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : gradesError ? (
            <div className="alert alert-danger">Failed to load summary. Please try again.</div>
          ) : (gradesSummary?.grades && gradesSummary.grades.length > 0) ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 border rounded">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 py-3">Student</th>
                    <th className="py-3">Email</th>
                    <th className="py-3 text-center">Assignments</th>
                    <th className="py-3 text-center">Quizzes</th>
                    <th className="py-3 text-center">Average</th>
                  </tr>
                </thead>
                <tbody>
                  {gradesSummary.grades.map((g, idx) => {
                    const avgValue = parseFloat(g.average) || 0;
                    let badgeColor = 'bg-secondary';
                    if (avgValue >= 90) badgeColor = 'bg-success';
                    else if (avgValue >= 75) badgeColor = 'bg-info';
                    else if (avgValue >= 60) badgeColor = 'bg-warning text-dark';
                    else if (avgValue > 0) badgeColor = 'bg-danger';

                    return (
                      <tr key={idx} className="border-bottom">
                        <td className="ps-4 py-2 fw-medium text-dark">{g.student_name}</td>
                        <td className="text-muted small">{g.email}</td>
                        <td className="text-center font-monospace">{g.assignments}</td>
                        <td className="text-center font-monospace">{g.quizzes}</td>
                        <td className="text-center">
                          <span className={`badge ${badgeColor} fs-6 px-3 py-2 rounded-pill`}>
                            {g.average}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2"></i>
              No grade data available.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- Teacher: Assignment Drill‑Down ----------
  if (selectedAssignmentId !== null) {
    const selectedAsg = assignments.find(a => a.id === selectedAssignmentId);
    if (!selectedAsg) {
      // if assignment not found, go back
      setSelectedAssignmentId(null);
      return null;
    }

    return (
      <div className="bg-white border rounded-3 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3">
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              onClick={() => setSelectedAssignmentId(null)}
            >
              <i className="bi bi-arrow-left"></i> Back to assignments
            </button>
            <div>
              <h5 className="mb-0 fw-bold text-dark">{selectedAsg.title}</h5>
              <span className="text-muted small">
                {selectedAsg.points} points • Due {selectedAsg.dueDate || 'No due date'}
              </span>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              onClick={() => setShowSummary(prev => !prev)}
            >
              <i className="bi bi-card-list"></i> {showSummary ? 'Summary' : 'Summary'}
            </button>
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              onClick={() => addToast("Grades exported to Google Sheets!", "success")}
            >
              <i className="bi bi-file-earmark-spreadsheet"></i> Export
            </button>
          </div>
        </div>

        {/* Student grades table */}
        <div className="table-responsive" style={{ maxHeight: '70vh', overflow: 'auto' }}>
          <table className="table table-bordered mb-0 align-middle">
            <thead className="table-light sticky-top" style={{ zIndex: 10 }}>
              <tr>
                <th className="ps-4 py-3" style={{ width: '250px' }}>Student</th>
                <th className="py-3 text-center">Grade</th>
                <th className="py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map(st => {
                const score = gradeMatrix[st.id]?.[selectedAsg.id];
                const hasGrade = score !== null && score !== undefined && score !== '';
                return (
                  <tr key={st.id}>
                    <td className="ps-4 py-2">
                      <div className="d-flex align-items-center gap-2">
                        <Avatar name={st} size={32} color="#00897b" />
                        <span className="fw-medium text-dark">{getDisplayName(st)}</span>
                      </div>
                    </td>
                    <td className="text-center py-2">
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <input
                          type="number"
                          className="form-control form-control-sm text-center font-monospace fw-semibold"
                          style={{ maxWidth: '80px' }}
                          placeholder="___"
                          value={hasGrade ? score : ''}
                          onChange={(e) => handleGradeChange(st.id, selectedAsg.id, e.target.value)}
                          min="0"
                          max={selectedAsg.points || 100}
                        />
                        <span className="text-muted small">/ {selectedAsg.points}</span>
                      </div>
                    </td>
                    <td className="text-center py-2">
                      {hasGrade ? (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success">
                          Graded
                        </span>
                      ) : (
                        <span className="badge bg-warning bg-opacity-10 text-warning border border-warning">
                          Not graded
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ---------- Teacher: Assignment List ----------
  return (
    <div className="bg-white border rounded-3 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 className="mb-0 fw-bold text-dark">Assignments</h5>
          <span className="text-muted small">Click an assignment to view and edit student grades</span>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
            onClick={() => setShowSummary(prev => !prev)}
          >
            <i className="bi bi-card-list"></i> {showSummary ? 'Summary' : 'Summary'}
          </button>
          <button
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            onClick={() => addToast("Grades exported to Google Sheets!", "success")}
          >
            <i className="bi bi-file-earmark-spreadsheet"></i> Export to Sheets
          </button>
        </div>
      </div>

      {/* Assignment list */}
      <div className="table-responsive">
        <table className="table table-hover mb-0 align-middle">
          <thead className="table-light">
            <tr>
              <th className="ps-4 py-3">Assignment</th>
              <th className="py-3">Topic</th>
              <th className="py-3 text-center">Points</th>
              <th className="py-3 text-center">Submissions</th>
              <th className="py-3 text-center">Class Avg</th>
              <th className="py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map(asg => {
              const stats = getAssignmentStats(asg.id);
              const avg = calculateClassAverage(asg.id);
              return (
                <tr key={asg.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedAssignmentId(asg.id)}>
                  <td className="ps-4 py-3 fw-medium text-dark">{asg.title}</td>
                  <td className="text-muted small">{normalizeTopicValue(asg.topic)}</td>
                  <td className="text-center font-monospace">{asg.points}</td>
                  <td className="text-center">
                    <span className="badge bg-light text-dark border">
                      {stats.submitted} / {students.length}
                    </span>
                  </td>
                  <td className="text-center font-monospace fw-semibold text-primary">
                    {avg !== '—' ? `${avg} / ${asg.points}` : '—'}
                  </td>
                  <td className="text-center">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={(e) => { e.stopPropagation(); setSelectedAssignmentId(asg.id); }}
                    >
                      <i className="bi bi-eye me-1"></i> View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GradesTab;