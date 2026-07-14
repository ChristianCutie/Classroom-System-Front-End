import React, { useState, useEffect } from 'react';
import Avatar from '../../components/Common/Avatar.jsx';
import { useToast } from '@/context/ToastContext.jsx';
import { classAPI } from '@/api/client';

const GradesTab = ({ cls, user, onUpdateGrade }) => {
  const students = cls.students || [];
  const assignments = cls.classwork ? cls.classwork.filter(cw => cw.points !== null && cw.points !== undefined) : [];
  const { addToast } = useToast();

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

  const initialGrades = cls.grades || [];

  const [gradeMatrix, setGradeMatrix] = useState(() => {
    // build map: { studentId: { cwId: val } }
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

  const [gradesSummary, setGradesSummary] = useState(null);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [gradesError, setGradesError] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (!cls || !cls.id) return;
    let mounted = true;
    const fetchGrades = async () => {
      setLoadingGrades(true);
      try {
        const res = await classAPI.getClassGrades(cls.id);
        if (!mounted) return;
        setGradesSummary(res.data?.data || null);
      } catch (err) {
        if (!mounted) return;
        setGradesError(err);
        addToast('Failed to load grades summary', 'danger');
      } finally {
        if (mounted) setLoadingGrades(false);
      }
    };
    fetchGrades();
    return () => { mounted = false; };
  }, [cls?.id]);

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

  if (students.length === 0 || assignments.length === 0) {
    return (
      <div className="text-center py-5 bg-white border rounded-3 shadow-sm my-4">
        <i className="bi bi-table text-muted fs-1 mb-2"></i>
        <h6 className="fw-semibold text-dark">Your Gradebook is ready</h6>
        <p className="text-muted small mb-0">Once you add students and graded assignments, grades will appear in this table.</p>
      </div>
    );
  }

  // Student view of their own grades
  if (user.role !== 'teacher') {
    // Find current user or first student
    const myId = students.find(s => getDisplayName(s) === getDisplayName(user))?.id || students[0].id;
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

  if (user.role === 'teacher' && showSummary) {
    return (
      <div className="bg-white border rounded-3 shadow-sm p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="mb-0">{gradesSummary?.class_name || cls.class_name || 'Grades'}</h5>
            <div className="text-muted small">Grades summary</div>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowSummary(false)}>Back to Gradebook</button>
          </div>
        </div>
        {loadingGrades ? (
          <div className="text-center py-4">Loading...</div>
        ) : (gradesSummary?.grades && gradesSummary.grades.length > 0) ? (
          <div className="table-responsive">
            <table className="table table-striped mb-0">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Assignments</th>
                  <th>Quizzes</th>
                  <th>Average</th>
                </tr>
              </thead>
              <tbody>
                {gradesSummary.grades.map((g, idx) => (
                  <tr key={idx}>
                    <td>{g.student_name}</td>
                    <td>{g.email}</td>
                    <td>{g.assignments}</td>
                    <td>{g.quizzes}</td>
                    <td>{g.average}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-3 text-muted">No grades available.</div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-3 shadow-sm overflow-hidden">
      
      {/* Gradebook Header description */}
      <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
        <span className="small text-muted fw-medium d-flex align-items-center gap-2">
          <i className="bi bi-info-circle text-primary"></i>
          Type numbers directly into the cells below to grade or update scores.
        </span>
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

      <div className="table-responsive" style={{ maxHeight: '70vh', overflow: 'auto' }}>
        <table className="table table-bordered mb-0 align-middle text-center" style={{ minWidth: `${Math.max(650, assignments.length * 180 + 300)}px` }}>
          
          {/* Table Headers */}
          <thead className="table-light sticky-top" style={{ zIndex: 10 }}>
            <tr>
              <th
                className="text-start ps-4 py-3 bg-light"
                style={{ width: '240px', position: 'sticky', left: 0, zIndex: 11 }}
              >
                <div className="fw-bold text-dark mb-1">Students</div>
                <div className="text-muted small fw-normal">Sort by last name <i className="bi bi-arrow-down-up small"></i></div>
              </th>

              <th className="py-3 bg-light" style={{ width: '120px' }}>
                <div className="fw-bold text-dark mb-1">Overall</div>
                <div className="text-muted small fw-normal">Average</div>
              </th>

              {assignments.map(asg => (
                <th key={asg.id} className="py-3 bg-light px-2" style={{ minWidth: '170px', maxWidth: '220px' }}>
                  <div className="d-flex justify-content-between align-items-start px-1">
                    <span className="text-truncate fw-bold text-dark small" title={asg.title}>{asg.title}</span>
                    <div className="dropdown d-inline">
                      <button className="btn btn-link btn-sm p-0 text-muted ms-1" data-bs-toggle="dropdown">
                        <i className="bi bi-three-dots-vertical"></i>
                      </button>
                      <ul className="dropdown-menu shadow small">
                        <li><button className="dropdown-item py-1" onClick={() => addToast(`Return all submissions for ${asg.title}`, "info")}>Return all</button></li>
                        <li><button className="dropdown-item py-1" onClick={() => addToast(`View assignment  for ${asg.title}`, "info")}>View assignment</button></li>
                      </ul>
                    </div>
                  </div>
                  <div className="text-muted text-xs font-monospace mt-1">Out of {asg.points}</div>
                </th>
              ))}
            </tr>

            {/* Class Average Row */}
            <tr className="border-bottom">
              <th
                className="text-start ps-4 py-2 bg-light text-muted small fw-semibold"
                style={{ position: 'sticky', left: 0, zIndex: 11 }}
              >
                Class average
              </th>
              <td className="font-monospace fw-bold text-primary py-2 bg-light">
                —
              </td>
              {assignments.map(asg => (
                <td key={asg.id} className="font-monospace fw-semibold text-secondary py-2 bg-light">
                  {calculateClassAverage(asg.id)} / {asg.points}
                </td>
              ))}
            </tr>
          </thead>

          {/* Student Rows */}
          <tbody>
            {students.map(st => (
              <tr key={st.id}>
                <td
                  className="text-start ps-4 py-2 bg-white"
                  style={{ position: 'sticky', left: 0, zIndex: 5, boxShadow: '1px 0 0 0 #dadce0' }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <Avatar name={st} size={32} color="#00897b" />
                    <span className="fw-medium text-dark text-truncate small">{getDisplayName(st)}</span>
                  </div>
                </td>

                <td className="font-monospace fw-bold text-dark py-2">
                  {calculateStudentOverall(st.id)}
                </td>

                {assignments.map(asg => {
                  const score = gradeMatrix[st.id]?.[asg.id];
                  return (
                    <td key={asg.id} className="p-1">
                      <div className="d-flex align-items-center justify-content-center">
                        <input
                          type="number"
                          className="form-control form-control-sm text-center font-monospace fw-semibold border-0 shadow-none hover-bg-light"
                          style={{ maxWidth: '80px', borderRadius: '4px' }}
                          placeholder="___"
                          value={score ?? ''}
                          onChange={(e) => handleGradeChange(st.id, asg.id, e.target.value)}
                          min="0"
                          max={asg.points || 100}
                        />
                        <span className="text-muted small ms-1">/ {asg.points}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
};

export default GradesTab;
