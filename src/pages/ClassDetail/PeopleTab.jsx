import React, { useState } from "react";
import Avatar from "../../components/Common/Avatar.jsx";
import { useToast } from "@/context/ToastContext.jsx";
import { classAPI } from "@/api/client";

const PeopleTab = ({ cls, user, onRefresh }) => {
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const { addToast } = useToast();

  const students = cls.students || [];
  const allSelected =
    students.length > 0 && selectedStudents.length === students.length;

  const getFullName = (person) => {
    if (!person) return "Unknown";
    return (
      [person.first_name || person.firstName, person.last_name || person.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      person.fullName ||
      person.name ||
      "Unknown"
    );
  };

  const teacherName = getFullName(cls.teacher);

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.id));
    }
  };

  const toggleStudent = (id) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter((sId) => sId !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  // ---------- Remove single student ----------
  const handleRemoveStudent = async (studentId, studentName) => {
    if (!window.confirm(`Remove ${studentName} from this class?`)) return;
    try {
      await classAPI.removeStudent(cls.id, studentId);
      addToast(`${studentName} removed successfully.`, "success");
      // Remove from local list (optimistic update)
      // if (onRefresh) onRefresh(); // or filter locally
      if (onRefresh) onRefresh();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to remove student.", "error");
    }
  };

  // ---------- Bulk remove selected students ----------
  const handleBulkRemove = async () => {
    if (selectedStudents.length === 0) return;
    if (!window.confirm(`Remove ${selectedStudents.length} selected students?`)) return;
    try {
      // Remove one by one (or parallel)
      await Promise.all(
        selectedStudents.map((id) => classAPI.removeStudent(cls.id, id))
      );
      addToast(`${selectedStudents.length} students removed.`, "success");
      setSelectedStudents([]);
      if (onRefresh) onRefresh();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to remove students.", "error");
    }
  };

  // ---------- Invite handler ----------
  const handleInvite = (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    addToast(`Invitation sent to ${inviteEmail.trim()}`, "success");
    setInviteEmail("");
    setShowInviteModal(false);
  };

  // Determine if user is teacher
  const roleString =
    typeof user?.role === "string"
      ? user.role
      : user?.role?.role_name || user?.role?.name || user?.role?.value || "";
  const normalizedRole = String(roleString).toLowerCase();
  const isTeacher =
    ["teacher", "instructor", "teacher/instructor"].includes(normalizedRole) ||
    Boolean(user?.is_teacher || user?.isTeacher);

  return (
    <div className="max-w-4xl mx-auto" style={{ maxWidth: "850px" }}>
      {/* Teachers Section */}
      <div className="mb-5">
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
          <h4
            className="font-google fw-bold mb-0"
            style={{ color: cls.themeColor || "#1a73e8" }}
          >
            Teachers
          </h4>
          {isTeacher && (
            <button
              className="btn btn-icon text-primary"
              title="Invite teachers"
              onClick={() => setShowInviteModal(true)}
            >
              <i className="bi bi-person-plus-fill fs-4"></i>
            </button>
          )}
        </div>

        <div className="d-flex align-items-center justify-content-between py-2 px-3 hover-bg-light rounded">
          <div className="d-flex align-items-center gap-3">
            <Avatar
              name={cls.teacher}
              avatar={cls.teacher?.avatar}
              size={44}
              color={cls.themeColor || "#1a73e8"}
            />
            <span className="fw-medium text-dark">{teacherName}</span>
          </div>
          <a
            href={`mailto:${cls.teacher?.email || "teacher@university.edu"}`}
            className="btn btn-icon text-secondary"
            title="Email teacher"
          >
            <i className="bi bi-envelope fs-5"></i>
          </a>
        </div>
      </div>

      {/* Students Section */}
      <div>
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
          <div className="d-flex align-items-center gap-3">
            <h4
              className="font-google fw-bold mb-0"
              style={{ color: cls.themeColor || "#1a73e8" }}
            >
              Students
            </h4>
            <span className="badge bg-light text-muted border">
              {students.length} {students.length === 1 ? "student" : "students"}
            </span>
          </div>

          {isTeacher && (
            <button
              className="btn btn-icon text-primary"
              title="Invite students"
              onClick={() => setShowInviteModal(true)}
            >
              <i className="bi bi-person-plus-fill fs-4"></i>
            </button>
          )}
        </div>

        {/* Bulk action toolbar when checkboxes are checked */}
        {isTeacher && students.length > 0 && (
          <div className="d-flex align-items-center justify-content-between bg-light p-2 rounded mb-3 border">
            <div className="form-check ms-2 mb-0 d-flex align-items-center gap-2">
              <input
                type="checkbox"
                className="form-check-input"
                id="selectAllStudents"
                checked={allSelected}
                onChange={toggleSelectAll}
              />
              <label
                className="form-check-label small fw-medium text-muted"
                htmlFor="selectAllStudents"
              >
                Select all ({selectedStudents.length} selected)
              </label>
            </div>

            {selectedStudents.length > 0 && (
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  onClick={() =>
                    addToast(
                      `Emailing ${selectedStudents.length} selected students...`,
                      "info"
                    )
                  }
                >
                  <i className="bi bi-envelope"></i> Email
                </button>
                <button
                  className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                  onClick={handleBulkRemove}
                >
                  <i className="bi bi-person-x"></i> Remove
                </button>
              </div>
            )}
          </div>
        )}

        {/* Students List */}
        {students.length > 0 ? (
          <div className="d-flex flex-column">
            {students.map((st) => (
              <div
                key={st.id}
                className="d-flex align-items-center justify-content-between py-2 px-3 border-bottom hover-bg-light"
                style={{ transition: "background 0.15s" }}
              >
                <div className="d-flex align-items-center gap-3">
                  {isTeacher && (
                    <input
                      type="checkbox"
                      className="form-check-input mb-0 me-1"
                      checked={selectedStudents.includes(st.id)}
                      onChange={() => toggleStudent(st.id)}
                    />
                  )}
                  <Avatar
                    name={st}
                    avatar={st.avatar}
                    size={40}
                    color="#00897b"
                  />
                  <div>
                    <div className="fw-medium text-dark">{getFullName(st)}</div>
                    <div
                      className="text-muted small"
                      style={{ fontSize: "0.78rem" }}
                    >
                      {st.email}
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-1">
                  <a
                    href={`mailto:${st.email}`}
                    className="btn btn-icon text-secondary"
                    title={`Email ${getFullName(st)}`}
                  >
                    <i className="bi bi-envelope"></i>
                  </a>
                  {isTeacher && (
                    <div className="dropdown">
                      <button
                        type="button"
                        className="btn btn-icon text-secondary"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <i className="bi bi-three-dots-vertical"></i>
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end shadow border small">
                        <li>
                          <button
                            className="dropdown-item py-2"
                            onClick={() =>
                              addToast(`Muted ${getFullName(st)}`, "info")
                            }
                          >
                            <i className="bi bi-volume-mute me-2"></i> Mute
                            student
                          </button>
                        </li>
                        <li>
                          <button
                            className="dropdown-item py-2 text-danger"
                            onClick={() =>
                              handleRemoveStudent(st.id, getFullName(st))
                            }
                          >
                            <i className="bi bi-person-x me-2"></i> Remove
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5 bg-white border rounded-3 shadow-sm">
            <i className="bi bi-people text-muted fs-1 mb-2"></i>
            <h6 className="fw-semibold text-dark">No students here</h6>
            <p className="text-muted small mb-0">
              Invite students or give them the class code:{" "}
              <strong className="font-monospace text-primary">
                {cls.code}
              </strong>
            </p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <h5 className="modal-title font-google fw-bold">
                  Invite students or teachers
                </h5>
                <button
                  className="btn-close"
                  onClick={() => setShowInviteModal(false)}
                ></button>
              </div>

              <form onSubmit={handleInvite}>
                <div className="modal-body p-4">
                  <p className="text-muted small mb-3">
                    Invite link:{" "}
                    <span className="font-monospace text-primary bg-light px-2 py-1 rounded border small">
                      https://classroom.google.com/c/{cls.code}
                    </span>
                  </p>

                  <div className="form-floating mb-2">
                    <input
                      type="email"
                      className="form-control"
                      id="inviteEmail"
                      placeholder="Type a name or email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      autoFocus
                      required
                    />
                    <label htmlFor="inviteEmail">Type a name or email</label>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3">
                  <button
                    type="button"
                    className="btn btn-light fw-medium px-4"
                    onClick={() => setShowInviteModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn text-white fw-medium px-4"
                    style={{ backgroundColor: cls.themeColor || "#1a73e8" }}
                    disabled={!inviteEmail.trim()}
                  >
                    Invite
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

export default PeopleTab;