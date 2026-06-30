import React, { useState, useEffect } from "react";
import { bannerGradients } from '../../data/mockData.jsx';
import { useNavigate } from "react-router-dom";
import apiClient from "@/api/client.js";
import ClassCard from "./ClassCard"; // your existing presentational card

// Custom hook to get the authenticated user – replace with your own
import { useAuth } from "@/context/AuthContext"; // adjust path

const ClassesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // must provide user with { id, role: { role_name } }

  // State
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Form states
  const [newClass, setNewClass] = useState({
    class_name: "",
    section: "",
    subject: "",
    room: "",
    description: "",
  });
  const [joinCode, setJoinCode] = useState("");

  // Fetch classes
  const fetchClasses = async () => {
    if (!user) return; // prevent fetch without user
    setLoading(true);
    try {
      const res = await apiClient.get("/classes");
      setClasses(res.data.data);  
      setError(null);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Authorization failed. Please log in again.");
        // Optionally logout:
        // logout();
        navigate('/');
      } else {
        setError("Failed to load classes. Please try again.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

   useEffect(() => {
    fetchClasses();
  }, [user]); // re-fetch when user changes

  // Compute active & teaching/enrolled
  const activeClasses = classes.filter((c) => !c.is_archived);
  const teachingClasses = activeClasses.filter((c) => c.teacher_id === user.id);
  const enrolledClasses = activeClasses.filter((c) => c.teacher_id !== user.id);

  // Handlers
  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post("/create/classes", newClass);
      setShowCreateModal(false);
      setNewClass({
        class_name: "",
        section: "",
        subject: "",
        room: "",
        description: "",
      });
      fetchClasses();
    } catch (err) {
      alert("Failed to create class. Check your input.");
      console.error(err);
    }
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post("/classes/join", { class_code: joinCode });
      setShowJoinModal(false);
      setJoinCode("");
      fetchClasses();
    } catch (err) {
      alert(
        "Failed to join class. Check the code or you may already be enrolled.",
      );
      console.error(err);
    }
  };

  const handleArchiveClass = async (classId) => {
    if (!window.confirm("Archive this class?")) return;
    try {
      await apiClient.patch(`/classes/${classId}/archive`);
      fetchClasses();
    } catch (err) {
      alert("Failed to archive class.");
      console.error(err);
    }
  };

  const handleUnenrollClass = async (classId) => {
    if (!window.confirm("Unenroll from this class?")) return;
    try {
      await apiClient.delete(`/classes/${classId}/unenroll`);
      fetchClasses();
    } catch (err) {
      alert("Failed to unenroll.");
      console.error(err);
    }
  };
  const handleOpenClasswork = (classId) => {
    navigate(`/classwork/${classId}`);
  };

  const handleSelectClass = (classId) => {
    navigate(`/class/${classId}`);
  };

  // Loading / error
  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger text-center m-4" role="alert">
        {error}
        <button className="btn btn-outline-danger ms-3" onClick={fetchClasses}>
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (activeClasses.length === 0) {
    return (
      <>
        <div className="d-flex flex-column align-items-center justify-content-center text-center py-5 mt-5">
          <div
            className="rounded-circle bg-white shadow p-4 mb-4 d-flex align-items-center justify-content-center"
            style={{ width: "120px", height: "120px" }}
          >
            <i
              className="bi bi-easel2 text-primary"
              style={{ fontSize: "3.5rem" }}
            ></i>
          </div>
          <h4 className="font-google fw-bold text-dark mb-2">
            Welcome to Google Classroom
          </h4>
          <p
            className="text-muted max-w-md mx-auto mb-4"
            style={{ maxWidth: "420px" }}
          >
            Classroom helps classes communicate, save time, and stay organized.
            Get started by joining or creating your first class.
          </p>
          <div className="d-flex gap-3">
            <button
              className="btn btn-outline-primary px-4 py-2 fw-medium rounded-pill"
              onClick={() => setShowJoinModal(true)}
            >
              Join a class
            </button>
            {user.role.role_name === "teacher" && (
              <button
                className="btn text-white px-4 py-2 fw-medium rounded-pill shadow-sm"
                style={{ backgroundColor: "#1a73e8" }}
                onClick={() => setShowCreateModal(true)}
              >
                Create a class
              </button>
            )}
          </div>
        </div>

        {/* Modals – see below */}
        <CreateModal
          show={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          newClass={newClass}
          setNewClass={setNewClass}
          onSubmit={handleCreateClass}
        />
        <JoinModal
          show={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          joinCode={joinCode}
          setJoinCode={setJoinCode}
          onSubmit={handleJoinClass}
        />
      </>
    );
  }

  // Main view with classes
  return (
    <div className="container-fluid px-2 px-md-4 py-3">
      {/* Teaching Section */}
      {teachingClasses.length > 0 && (
        <div className="mb-5">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
            <h5 className="font-google fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-person-workspace text-primary"></i>
              Teaching ({teachingClasses.length})
            </h5>
            <button
              className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-medium"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="bi bi-plus-lg me-1"></i> Create class
            </button>
          </div>
          <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 row-cols-xxl-4 g-4">
            {teachingClasses.map((cls) => (
              <div key={cls.id} className="col">
                <ClassCard
                  cls={cls}
                  user={user}
                  onSelectClass={handleSelectClass}
                  onArchiveClass={handleArchiveClass}
                  onUnenrollClass={handleUnenrollClass}
                  onOpenClasswork={handleOpenClasswork}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enrolled Section */}
      {enrolledClasses.length > 0 && (
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
            <h5 className="font-google fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-backpack text-success"></i>
              Enrolled ({enrolledClasses.length})
            </h5>
            <button
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-medium"
              onClick={() => setShowJoinModal(true)}
            >
              <i className="bi bi-plus-lg me-1"></i> Join class
            </button>
          </div>
          <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 row-cols-xxl-4 g-4">
            {enrolledClasses.map((cls) => (
              <div key={cls.id} className="col">
                <ClassCard
                  cls={cls}
                  user={user}
                  onSelectClass={handleSelectClass}
                  onArchiveClass={handleArchiveClass}
                  onUnenrollClass={handleUnenrollClass}
                  onOpenClasswork={handleOpenClasswork}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        newClass={newClass}
        setNewClass={setNewClass}
        onSubmit={handleCreateClass}
      />
      <JoinModal
        show={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        joinCode={joinCode}
        setJoinCode={setJoinCode}
        onSubmit={handleJoinClass}
      />
    </div>
  );
};

// ----------------------
// Modal Components (Bootstrap)
// ----------------------
const CreateModal = ({ show, onClose, newClass, setNewClass, onSubmit }) => {
  // Local UI state for banner theme (does not affect submission)
  const [bannerId, setBannerId] = useState('blue');
  const [error, setError] = useState(''); // kept for design, never used

  if (!show) return null;

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '8px' }}>
          <div className="modal-header border-bottom-0 pt-4 px-4 pb-0">
            <h5 className="modal-title font-google fw-bold">Create a new class</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body p-4">
              {error && <div className="alert alert-danger py-2 text-sm">{error}</div>}

              <div className="form-floating mb-3">
                <input
                  type="text"
                  className="form-control"
                  id="classNameInput"
                  placeholder="Class name (required)"
                  required
                  value={newClass.class_name}
                  onChange={(e) =>
                    setNewClass({ ...newClass, class_name: e.target.value })
                  }
                  autoFocus
                />
                <label htmlFor="classNameInput">Class name (required)</label>
              </div>

              <div className="form-floating mb-3">
                <input
                  type="text"
                  className="form-control"
                  id="sectionInput"
                  placeholder="Section"
                  value={newClass.section}
                  onChange={(e) =>
                    setNewClass({ ...newClass, section: e.target.value })
                  }
                />
                <label htmlFor="sectionInput">Section</label>
              </div>

              <div className="form-floating mb-3">
                <input
                  type="text"
                  className="form-control"
                  id="subjectInput"
                  placeholder="Subject"
                  value={newClass.subject}
                  onChange={(e) =>
                    setNewClass({ ...newClass, subject: e.target.value })
                  }
                />
                <label htmlFor="subjectInput">Subject</label>
              </div>

              <div className="form-floating mb-3">
                <input
                  type="text"
                  className="form-control"
                  id="roomInput"
                  placeholder="Room"
                  value={newClass.room}
                  onChange={(e) =>
                    setNewClass({ ...newClass, room: e.target.value })
                  }
                />
                <label htmlFor="roomInput">Room</label>
              </div>

              {/* Banner Theme Picker (UI only) */}
              <div className="mb-3">
                <label className="form-label text-muted small fw-bold text-uppercase">
                  Choose Banner Theme
                </label>
                <div className="d-flex gap-2 flex-wrap">
                  {bannerGradients.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className="btn p-0 border rounded shadow-sm d-flex align-items-center justify-content-center"
                      style={{
                        width: '44px',
                        height: '28px',
                        background: b.css,
                        border: bannerId === b.id ? '3px solid #1a73e8' : '1px solid #ddd',
                        transform: bannerId === b.id ? 'scale(1.08)' : 'none',
                        transition: 'all 0.15s',
                      }}
                      onClick={() => setBannerId(b.id)}
                      title={b.name}
                    >
                      {bannerId === b.id && (
                        <i className="bi bi-check text-white small fw-bold"></i>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional: keep description if needed */}
              <div className="form-floating mb-3">
                <textarea
                  className="form-control"
                  id="descriptionInput"
                  placeholder="Description"
                  style={{ height: '80px' }}
                  value={newClass.description || ''}
                  onChange={(e) =>
                    setNewClass({ ...newClass, description: e.target.value })
                  }
                />
                <label htmlFor="descriptionInput">Description</label>
              </div>
            </div>

            <div className="modal-footer border-top-0 pb-4 px-4 pt-0">
              <button
                type="button"
                className="btn btn-light px-4 fw-medium text-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn text-white px-4 fw-medium"
                style={{ backgroundColor: '#1a73e8' }}
                disabled={!newClass.class_name?.trim()}
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const JoinModal = ({ show, onClose, joinCode, setJoinCode, onSubmit }) => {
  if (!show) return null;
  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      tabIndex="-1"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Join a class</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Class code *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. A3FQ582"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-success">
                Join
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClassesPage;
