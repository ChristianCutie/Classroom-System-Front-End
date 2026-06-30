import React, { useState } from "react";
import logo from "@/images/Logo.png";
import { useAuth } from "@/context/AuthContext";

const LoginPage = ({ onLogin, onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("e.vance@university.edu");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("Dr. Eleanor Vance");
  const [role, setRole] = useState("teacher");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  const handleSelectQuickAccount = (acc) => {
    setEmail(acc.email);
    setName(acc.name);
    setRole(acc.role);
    // Optionally set a default password for demo (e.g., 'password')
    setPassword("password"); // if your seeded users have a known password
    setStep(2);
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    // Extract a display name if custom email entered
    if (!name || name === "Dr. Eleanor Vance") {
      const parts = email.split("@")[0].replace(/\./g, " ").split(" ");
      const formatted = parts
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");
      setName(formatted || "Classroom User");
    }
    setStep(2);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (step === 2 && password.length < 3 && password !== "") {
      setError("Password must be at least 3 characters");
      return;
    }
    setError("");

    // Call real login
    const result = await login(email, password);
    if (result.success) {
      // Redirect to dashboard (or let parent handle)
      window.location.href = "/dashboard"; // or use navigate from react-router
    } else {
      setError(result.message);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light p-3"
      style={{
        background: "linear-gradient(135deg, #f8f9fa 0%, #e8f0fe 100%)",
      }}
    >
      {/* Google Classroom Header */}
      <div className="text-center mb-4">
        <div
          className="d-inline-flex align-items-center justify-content-center p-3  mb-2"
          style={{ width: 92, height: 92 }}
        >
          <img
            src={logo}
            alt="Classroom logo"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
        <h2 className="font-google fw-bold text-dark mb-1">SNL Classroom</h2>
        <p className="text-muted small">
          Where teaching and learning come together
        </p>
      </div>

      {/* Login Card */}
      <div
        className="card border-0 shadow-lg rounded-4 overflow-hidden w-100"
        style={{ maxWidth: "460px" }}
      >
        <div className="card-body p-4 p-md-5 bg-white">
          <div className="text-center mb-4">
            <span className="font-google fw-medium fs-4 text-dark d-block">
              Sign in
            </span>
            <span className="text-muted small">
              to continue to SNL Classroom
            </span>
          </div>

          {error && (
            <div className="alert alert-danger py-2 px-3 small rounded-3 d-flex align-items-center gap-2 mb-3">
              <i className="bi bi-exclamation-circle-fill"></i>
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <div>
              {/* Quick Sign In accounts */}
              {/* <div className="mb-4">
                <label className="form-label text-muted text-xs fw-bold text-uppercase d-block mb-2" style={{ letterSpacing: '0.6px' }}>
                  Quick Sign-In Demo Accounts
                </label>
                <div className="d-flex flex-column gap-2">
                  {quickAccounts.map((acc, idx) => (
                    <div
                      key={idx}
                      className="border rounded-3 p-2 px-3 d-flex align-items-center justify-content-between hover-bg-light"
                      style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                      onClick={() => handleSelectQuickAccount(acc)}
                    >
                      <div className="d-flex align-items-center gap-3 overflow-hidden">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold small flex-shrink-0"
                          style={{ width: '38px', height: '38px', backgroundColor: acc.color, fontSize: '0.85rem' }}
                        >
                          {acc.avatar}
                        </div>
                        <div className="overflow-hidden text-start">
                          <div className="fw-semibold text-dark text-truncate small mb-0">{acc.name}</div>
                          <div className="text-muted text-xs text-truncate">{acc.email}</div>
                          <span className={`badge mt-1 text-xs ${acc.role === 'teacher' ? 'bg-primary bg-opacity-10 text-primary border border-primary' : 'bg-success bg-opacity-10 text-success border border-success'}`} style={{ fontSize: '0.68rem' }}>
                            {acc.role === 'teacher' ? 'Teacher / Instructor' : 'Student'}
                          </span>
                        </div>
                      </div>
                      <i className="bi bi-chevron-right text-muted small"></i>
                    </div>
                  ))}
                </div>
              </div>

              <div className="d-flex align-items-center my-3">
                <hr className="flex-grow-1 text-muted" />
                <span className="mx-3 text-muted text-xs fw-medium text-uppercase">Or enter manually</span>
                <hr className="flex-grow-1 text-muted" />
              </div> */}

              <form onSubmit={handleNextStep}>
                <div className="form-floating mb-3">
                  <input
                    type="email"
                    className="form-control rounded-3"
                    id="loginEmail"
                    placeholder="Email or phone"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <label htmlFor="loginEmail">Email or phone</label>
                </div>

                <div className="form-floating mb-3">
                  <input
                    type="text"
                    className="form-control rounded-3"
                    id="loginName"
                    placeholder="Your Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <label htmlFor="loginName">Your Full Name</label>
                </div>

                <div className="mb-4">
                  <label className="form-label text-muted small fw-medium mb-2">
                    Select Your Role
                  </label>
                  <div className="row g-2">
                    <div className="col-6">
                      <input
                        type="radio"
                        className="btn-check"
                        name="roleOptions"
                        id="roleTeacher"
                        autoComplete="off"
                        checked={role === "teacher"}
                        onChange={() => setRole("teacher")}
                      />
                      <label
                        className="btn btn-outline-primary w-100 p-2 rounded-3 d-flex flex-column align-items-center justify-content-center gap-1"
                        htmlFor="roleTeacher"
                      >
                        <i className="bi bi-easel2-fill fs-5"></i>
                        <span className="small fw-semibold">Teacher</span>
                      </label>
                    </div>

                    <div className="col-6">
                      <input
                        type="radio"
                        className="btn-check"
                        name="roleOptions"
                        id="roleStudent"
                        autoComplete="off"
                        checked={role === "student"}
                        onChange={() => setRole("student")}
                      />
                      <label
                        className="btn btn-outline-success w-100 p-2 rounded-3 d-flex flex-column align-items-center justify-content-center gap-1"
                        htmlFor="roleStudent"
                      >
                        <i className="bi bi-mortarboard-fill fs-5"></i>
                        <span className="small fw-semibold">Student</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-4 pt-2">
                  <a
                    href="#forgot"
                    className="text-decoration-none small text-primary fw-medium"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Demo: Enter any valid email to proceed.");
                    }}
                  >
                    Forgot email?
                  </a>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 py-2 rounded-3 fw-medium shadow-sm"
                  >
                    Next
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              {/* Step 2: Password & Account confirmation */}
              <div className="border rounded-3 p-3 bg-light mb-4 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3 overflow-hidden">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold small flex-shrink-0"
                    style={{
                      width: "40px",
                      height: "40px",
                      backgroundColor:
                        role === "teacher" ? "#1a73e8" : "#00897b",
                    }}
                  >
                    {(name || "U").substring(0, 2).toUpperCase()}
                  </div>
                  <div className="overflow-hidden text-start">
                    <div className="fw-semibold text-dark small text-truncate mb-0">
                      {name}
                    </div>
                    <div className="text-muted text-xs text-truncate">
                      {email}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3 text-xs"
                  onClick={() => {
                    setStep(1);
                    setPassword("");
                    setError("");
                  }}
                >
                  Change
                </button>
              </div>

              <form onSubmit={handleLoginSubmit}>
                <div className="form-floating mb-3">
                  <input
                    type="password"
                    className="form-control rounded-3"
                    id="loginPassword"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                  />
                  <label htmlFor="loginPassword">
                    Enter your password (optional for demo)
                  </label>
                </div>

                <div className="form-check mb-4 text-start ps-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="showPasswordCheck"
                    onChange={(e) => {
                      const input = document.getElementById("loginPassword");
                      if (input)
                        input.type = e.target.checked ? "text" : "password";
                    }}
                  />
                  <label
                    className="form-check-label text-muted small"
                    htmlFor="showPasswordCheck"
                  >
                    Show password
                  </label>
                </div>

                <div className="p-3 bg-light rounded-3 mb-4 text-start border small">
                  <div className="fw-semibold text-dark mb-1">
                    <i className="bi bi-shield-check text-success me-1"></i>
                    Signing in as{" "}
                    <strong>
                      {role === "teacher" ? "Teacher" : "Student"}
                    </strong>
                  </div>
                  <span className="text-muted text-xs">
                    {role === "teacher"
                      ? "You will have full instructor access to create classes, assign coursework, and grade submissions."
                      : "You will join enrolled courses, turn in assignments, and check your grades."}
                  </span>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-4">
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none small text-secondary p-0 fw-medium"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 py-2 rounded-3 fw-medium shadow"
                  >
                    Sign in to Classroom
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

         {/* Card bottom footer */}
        <div className="card-footer bg-light border-top py-3 px-4 d-flex justify-content-between align-items-center text-xs text-muted">
          <button
            type="button"
            className="btn btn-link btn-sm p-0 text-decoration-none text-primary fw-medium"
            onClick={onSwitchToRegister}
          >
            Create account
          </button>
          <div className="d-flex gap-3 small">
            <a href="#help" className="text-decoration-none text-muted" onClick={(e) => e.preventDefault()}>Help</a>
            <a href="#privacy" className="text-decoration-none text-muted" onClick={(e) => e.preventDefault()}>Privacy</a>
            <a href="#terms" className="text-decoration-none text-muted" onClick={(e) => e.preventDefault()}>Terms</a>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 text-center text-muted small">
        <span>Protected by Google reCAPTCHA Enterprise</span>
      </div>
    </div>
  );
};

export default LoginPage;
