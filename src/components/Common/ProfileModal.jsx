import React from "react";
import Avatar from "@/components/Common/Avatar.jsx";

const ProfileModal = ({
  show,
  onClose,
  user,
  onToggleRole,
  onUpdateUser,
  onLogout,
}) => {
  if (!show) return null;

  const handleSignOut = async () => {
    onClose();
    if (onLogout) {
      await onLogout();
    }
  };

  const getDisplayName = (person) => {
    if (!person) return "User";
    const fullName = [person.first_name || person.firstName, person.last_name || person.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return fullName || person.fullName || person.name || "User";
  };

  const displayName = getDisplayName(user);

  return (
    <div
      className="position-absolute bg-white shadow-lg border rounded-4 p-4 text-center"
      style={{
        top: "60px",
        right: "16px",
        width: "340px",
        zIndex: 1060,
      }}
    >
      <div className="d-flex justify-content-end mb-1">
        <button className="btn-close small" onClick={onClose}></button>
      </div>

      <div className="mb-3 d-flex justify-content-center">
        <Avatar
          name={user}
          size={84}
          color={user.color}
          className="shadow"
        />
      </div>

      <h6 className="fw-bold mb-0 text-dark">{displayName}</h6>
      <p className="text-muted small mb-3">{user.email}</p>

      <div className="p-3 bg-light rounded-3 mb-3 text-start border">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <span className="small fw-bold text-uppercase text-secondary">
            Active Role
          </span>
          <span
            className={`badge ${user.role === "teacher" ? "bg-primary" : "bg-success"}`}
          >
            {user.role === "teacher" ? "Teacher / Instructor" : "Student"}
          </span>
        </div>
        <p className="text-muted small mb-2" style={{ fontSize: "0.8rem" }}>
          {user.role === "teacher"
            ? "You can create assignments, grade submissions, and manage class rosters."
            : "You can turn in coursework, view your grades, and post class comments."}
        </p>
        <button
          className="btn btn-sm btn-outline-primary w-100 fw-medium d-flex align-items-center justify-content-center gap-2"
          onClick={onToggleRole}
        >
          <i className="bi bi-arrow-repeat"></i>
          Switch to {user.role === "teacher" ? "Student View" : "Teacher View"}
        </button>
      </div>

      <div className="d-grid gap-2 mb-3">
        <button className="btn btn-outline-secondary btn-sm rounded-pill py-2">
          Manage your Profile
        </button>
        <button
          className="btn btn-outline-danger btn-sm rounded-pill py-2 mt-1 d-flex align-items-center justify-content-center gap-2"
          onClick={handleSignOut}
        >
          <i className="bi bi-box-arrow-right"></i>
          Sign out
        </button>
      </div>

      <div className="border-top pt-3 d-flex justify-content-center gap-3 small text-muted">
        <a
          href="#privacy"
          className="text-decoration-none text-muted"
          onClick={(e) => {
            e.preventDefault();
            alert("Privacy Policy");
          }}
        >
          Privacy Policy
        </a>
        <span>•</span>
        <a
          href="#terms"
          className="text-decoration-none text-muted"
          onClick={(e) => {
            e.preventDefault();
            alert("Terms of Service");
          }}
        >
          Terms of Service
        </a>
      </div>
    </div>
  );
};

export default ProfileModal;
