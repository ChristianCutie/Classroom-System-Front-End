import React, { useState, useEffect, useMemo, useRef } from "react";
import Avatar from "../../components/Common/Avatar.jsx";
import { useToast } from "@/context/ToastContext.jsx";
import { classAPI } from "@/api/client";

const GradesTab = ({ cls, user, onUpdateGrade }) => {
  // ---------- Stable references to students & assignments ----------
  const students = useMemo(() => cls?.students || [], [cls?.students]);
  const assignments = useMemo(
    () =>
      cls?.classwork
        ? cls.classwork.filter(
            (cw) => cw.points !== null && cw.points !== undefined,
          )
        : [],
    [cls?.classwork],
  );

  const { addToast } = useToast();

  // ---------- Helpers ----------
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

  const getDisplayName = (person) => {
    if (!person) return "User";
    const fullName = [
      person.first_name || person.firstName,
      person.last_name || person.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
    return fullName || person.fullName || person.name || "User";
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

  const getStudentAvatar = (student) => {
    const avatar =
      student.avatar ||
      student.profile_pic ||
      student.photo ||
      student.photo_url ||
      student.picture;
    return avatar || null;
  };

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

  const roleStr = getRoleString(user).toLowerCase();
  const isTeacher =
    ["teacher", "instructor", "teacher/instructor"].includes(roleStr) ||
    Boolean(user?.is_teacher || user?.isTeacher);

  // ---------- Grade matrix: store { score, submitted } ----------
  const [gradeMatrix, setGradeMatrix] = useState(() => {
    const matrix = {};
    students.forEach((st) => {
      matrix[st.id] = {};
      assignments.forEach((asg) => {
        matrix[st.id][asg.id] = { score: null, submitted: false };
      });
    });
    return matrix;
  });

  // ---------- Summary state ----------
  const [gradesSummary, setGradesSummary] = useState(null);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [gradesError, setGradesError] = useState(null);

  // ---------- UI state ----------
  const [activeTab, setActiveTab] = useState("assignments");
  const [expandedAssignmentId, setExpandedAssignmentId] = useState(null);

  // ---------- Ref to track fetched class ----------
  const fetchedClassIdRef = useRef(null);

  // ---------- Fetch grades – only when class ID changes or assignments length changes ----------
  useEffect(() => {
    if (!cls?.id || students.length === 0 || assignments.length === 0) return;
    // Skip if we already fetched for this class and have data
    if (fetchedClassIdRef.current === cls.id && gradesSummary) return;

    let mounted = true;
    const fetchGrades = async () => {
      setLoadingGrades(true);
      try {
        const res = await classAPI.getClassGrades(cls.id);
        if (!mounted) return;
        const data = res.data?.data;
        setGradesSummary(data || null);

        if (data && data.grades) {
          const newMatrix = {};
          students.forEach((st) => {
            newMatrix[st.id] = {};
            assignments.forEach((asg) => {
              newMatrix[st.id][asg.id] = { score: null, submitted: false };
            });
            const studentGrade = data.grades.find(
              (g) => g.student_id === st.id,
            );
            if (studentGrade) {
              studentGrade.assignment_details.forEach((detail) => {
                const assignmentId = detail.assignment_id;
                if (newMatrix[st.id][assignmentId] !== undefined) {
                  newMatrix[st.id][assignmentId] = {
                    score: detail.score,
                    submitted: detail.submitted || false,
                  };
                }
              });
            }
          });
          setGradeMatrix(newMatrix);
        }
        setGradesError(null);
        fetchedClassIdRef.current = cls.id; // mark as fetched
      } catch (err) {
        console.error("❌ Failed to fetch grades:", err);
        if (!mounted) return;
        setGradesError(err);
        addToast("Failed to load grades summary", "danger");
      } finally {
        if (mounted) setLoadingGrades(false);
      }
    };

    fetchGrades();
    return () => {
      mounted = false;
    };
  }, [cls?.id, assignments.length, students.length]); // Dependencies: class ID and lengths (stable numbers)

  // ---------- Handlers ----------
  const handleGradeChange = (studentId, cwId, newScore) => {
    const numeric = newScore === "" ? null : Number(newScore);
    const updated = {
      ...gradeMatrix,
      [studentId]: {
        ...gradeMatrix[studentId],
        [cwId]: {
          ...gradeMatrix[studentId][cwId],
          score: numeric,
        },
      },
    };
    setGradeMatrix(updated);
    if (onUpdateGrade) {
      onUpdateGrade(cls.id, studentId, cwId, numeric);
    }
  };

  const calculateClassAverage = (cwId) => {
    let sum = 0;
    let count = 0;
    students.forEach((st) => {
      const entry = gradeMatrix[st.id]?.[cwId];
      if (
        entry &&
        entry.score !== null &&
        entry.score !== undefined &&
        !isNaN(entry.score)
      ) {
        sum += entry.score;
        count++;
      }
    });
    if (count === 0) return "—";
    return (sum / count).toFixed(1);
  };

  const calculateStudentOverall = (stId) => {
    let earned = 0;
    let totalPossible = 0;
    assignments.forEach((asg) => {
      const entry = gradeMatrix[stId]?.[asg.id];
      if (
        entry &&
        entry.score !== null &&
        entry.score !== undefined &&
        !isNaN(entry.score)
      ) {
        earned += entry.score;
        totalPossible += asg.points || 100;
      }
    });
    if (totalPossible === 0) return "—";
    return `${Math.round((earned / totalPossible) * 100)}%`;
  };

  const getAssignmentStats = (cwId) => {
    let submitted = 0;
    let graded = 0;
    students.forEach((st) => {
      const entry = gradeMatrix[st.id]?.[cwId];
      if (entry) {
        if (entry.submitted) submitted++;
        if (
          entry.score !== null &&
          entry.score !== undefined &&
          !isNaN(entry.score)
        )
          graded++;
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
          {students.length === 0
            ? "No students in this class yet."
            : "No graded assignments found."}
        </p>
        <p className="text-muted small">
          Once you add students and graded assignments, grades will appear in
          this table.
        </p>
      </div>
    );
  }

  // ---------- Student View ----------
  if (!isTeacher) {
    const myId =
      students.find((s) => getDisplayName(s) === getDisplayName(user))?.id ||
      students[0]?.id;
    if (!myId) {
      return (
        <div className="alert alert-warning">
          You are not enrolled in this class.
        </div>
      );
    }
    return (
      <div className="max-w-4xl mx-auto py-2" style={{ maxWidth: "800px" }}>
        <div className="d-flex align-items-center justify-content-between p-4 bg-white border rounded-3 shadow-sm mb-4">
          <div className="d-flex align-items-center gap-3">
            <Avatar name={user} size={52} color={user.color} />
            <div>
              <h5 className="fw-bold mb-0 text-dark">{getDisplayName(user)}</h5>
              <span className="text-muted small">Course Overall Grade</span>
            </div>
          </div>
          <div className="text-end">
            <span className="fs-2 fw-bolder text-primary font-monospace">
              {calculateStudentOverall(myId)}
            </span>
          </div>
        </div>

        <h6 className="fw-bold text-muted small text-uppercase mb-3">
          Grades & Submissions
        </h6>
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
                {assignments.map((asg) => {
                  const entry = gradeMatrix[myId]?.[asg.id];
                  const hasGrade =
                    entry && entry.score !== null && entry.score !== undefined;
                  const isSubmitted = entry ? entry.submitted : false;
                  return (
                    <tr key={asg.id}>
                      <td className="ps-4 fw-medium text-dark py-3">
                        {asg.title}
                      </td>
                      <td className="text-muted small">
                        {normalizeTopicValue(asg.topic)}
                      </td>
                      <td>
                        <span
                          className={`badge ${isSubmitted ? "bg-success bg-opacity-10 text-success border border-success" : "bg-warning bg-opacity-10 text-warning border border-warning"}`}
                        >
                          {isSubmitted ? "Submitted" : "Assigned / Pending"}
                        </span>
                      </td>
                      <td className="pe-4 text-end font-monospace fw-bold">
                        {hasGrade
                          ? `${entry.score} / ${asg.points}`
                          : `— / ${asg.points}`}
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

  // ---------- Teacher View ----------
  const displayClassName =
    gradesSummary?.class_name || cls.class_name || cls.name || "Gradebook";

  return (
    <div className="card border shadow-sm rounded-3 mb-4 bg-white overflow-hidden">
      {/* Header */}
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
            <i className="bi bi-table fs-3"></i>
          </div>
          <div className="text-white">
            <h3
              className="font-google fw-bold mb-0"
              style={{ fontSize: "1.5rem" }}
            >
              {displayClassName}
            </h3>
            <div className="small text-white text-opacity-90">
              {students.length} students • {assignments.length} assignments
            </div>
          </div>
        </div>
        <button
          className="btn btn-light btn-sm d-flex align-items-center gap-2"
          onClick={() =>
            addToast("Grades exported to Google Sheets!", "success")
          }
        >
          <i className="bi bi-file-earmark-spreadsheet"></i> Export to Sheets
        </button>
      </div>

      {/* Tabs */}
      <div className="border-bottom bg-white">
        <ul className="nav gc-nav-tabs px-3">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "assignments" ? "active" : ""}`}
              onClick={() => setActiveTab("assignments")}
            >
              Assignments
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "summary" ? "active" : ""}`}
              onClick={() => setActiveTab("summary")}
            >
              Summary
            </button>
          </li>
        </ul>
      </div>

      <div className="card-body p-4">
        {activeTab === "assignments" && (
          <div className="d-flex flex-column gap-3">
            {assignments.map((asg) => {
              const isExpanded = expandedAssignmentId === asg.id;
              const stats = getAssignmentStats(asg.id);
              const avg = calculateClassAverage(asg.id);

              return (
                <div
                  key={asg.id}
                  className="border rounded-3 overflow-hidden shadow-sm"
                >
                  {/* Accordion Header */}
                  <div
                    className={`p-3 d-flex align-items-center justify-content-between ${isExpanded ? "bg-light border-bottom" : "bg-white"}`}
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      setExpandedAssignmentId(isExpanded ? null : asg.id)
                    }
                  >
                    <div className="d-flex align-items-center gap-3 flex-wrap">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
                        style={{
                          width: "40px",
                          height: "40px",
                          backgroundColor: cls.themeColor || "#1a73e8",
                        }}
                      >
                        <i className="bi bi-clipboard-check fs-5"></i>
                      </div>
                      <div>
                        <h6 className="fw-bold mb-0 text-dark">{asg.title}</h6>
                        <div className="text-muted small">
                          {normalizeTopicValue(asg.topic)} • {asg.points} pts •{" "}
                          {asg.dueDate || "No due date"}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-3 flex-wrap">
                      <span className="badge bg-light text-dark border">
                        {stats.submitted} / {students.length} submitted
                      </span>
                      <span className="badge bg-light text-dark border">
                        Class avg:{" "}
                        {avg !== "—" ? `${avg} / ${asg.points}` : "—"}
                      </span>
                      <i
                        className={`bi bi-chevron-${isExpanded ? "up" : "down"} text-secondary`}
                      ></i>
                    </div>
                  </div>

                  {/* Accordion Body */}
                  {isExpanded && (
                    <div className="p-3 bg-white animate-fade-in">
                      <div
                        className="table-responsive"
                        style={{ maxHeight: "50vh", overflow: "auto" }}
                      >
                        <table className="table table-hover align-middle mb-0">
                          <thead
                            className="table-light sticky-top"
                            style={{ zIndex: 5 }}
                          >
                            <tr>
                              <th
                                className="ps-3 py-2"
                                style={{ width: "250px" }}
                              >
                                Student
                              </th>
                              <th
                                className="py-2 text-center"
                                style={{ width: "200px" }}
                              >
                                Grade
                              </th>
                              <th className="py-2 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.map((st) => {
                              const entry = gradeMatrix[st.id]?.[asg.id];
                              const hasGrade =
                                entry &&
                                entry.score !== null &&
                                entry.score !== undefined &&
                                entry.score !== "";
                              const isSubmitted = entry
                                ? entry.submitted
                                : false;
                              return (
                                <tr key={st.id}>
                                  <td className="ps-3 py-2">
                                    <div className="d-flex align-items-center gap-2">
                                      <Avatar
                                        name={st}
                                        size={32}
                                        color="#00897b"
                                      />
                                      <span className="fw-medium text-dark">
                                        {getDisplayName(st)}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2 text-center">
                                    <div className="d-flex align-items-center justify-content-center gap-2">
                                      <span className="fw-semibold font-monospace">
                                        {hasGrade ? entry.score : "—"}
                                      </span>
                                      <span className="text-muted small">
                                        / {asg.points}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2 text-center">
                                    {isSubmitted ? (
                                      <span className="badge bg-success bg-opacity-10 text-success border border-success">
                                        Submitted
                                      </span>
                                      
                                    ) : (
                                      <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary">
                                        Not submitted
                                      </span>
                                    )}
                                    {/* {hasGrade && (
                                      <span className="badge bg-primary bg-opacity-10 text-primary border border-primary ms-1">
                                        Graded
                                      </span>
                                    )} */}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "summary" && (
          <div>
            {loadingGrades ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : gradesError ? (
              <div className="alert alert-danger">
                Failed to load summary. Please try again.
              </div>
            ) : gradesSummary?.grades && gradesSummary.grades.length > 0 ? (
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
                      let badgeColor = "bg-secondary";
                      if (avgValue >= 90) badgeColor = "bg-success";
                      else if (avgValue >= 75) badgeColor = "bg-info";
                      else if (avgValue >= 60)
                        badgeColor = "bg-warning text-dark";
                      else if (avgValue > 0) badgeColor = "bg-danger";

                      return (
                        <tr key={idx} className="border-bottom">
                          <td className="ps-4 py-2 fw-medium text-dark">
                            {g.student_name}
                          </td>
                          <td className="text-muted small">{g.email}</td>
                          <td className="text-center font-monospace">
                            {g.assignments}
                          </td>
                          <td className="text-center font-monospace">
                            {g.quizzes}
                          </td>
                          <td className="text-center">
                            <span
                              className={`badge ${badgeColor} fs-6 px-3 py-2 rounded-pill`}
                            >
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
        )}
      </div>
    </div>
  );
};

export default GradesTab;
