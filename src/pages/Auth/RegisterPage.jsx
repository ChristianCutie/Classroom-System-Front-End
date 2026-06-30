import React, { useState } from 'react';
import apiClient from '@/api/client.js';

const RegisterPage = ({ onRegister, onSwitchToLogin }) => {
  const ROLE_IDS = { student: 3, teacher: 2 };
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    institution: '',
    // removed agreeTerms and agreePrivacy
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (error) setError('');
  };

  // Password strength calculation
  const getPasswordStrength = () => {
    const pw = formData.password;
    if (!pw) return { score: 0, label: '', color: '#dadce0', percent: 0 };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    const levels = [
      { label: 'Very weak', color: '#d93025', percent: 20 },
      { label: 'Weak', color: '#f29900', percent: 40 },
      { label: 'Fair', color: '#f9ab00', percent: 60 },
      { label: 'Strong', color: '#1e8e3e', percent: 80 },
      { label: 'Very strong', color: '#137333', percent: 100 }
    ];
    return { score, ...levels[Math.min(score, levels.length - 1)] };
  };

  const passwordStrength = getPasswordStrength();

  const handleNextStep = () => {
    if (step === 2) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError('First and last name are required');
        return;
      }
      if (!formData.email.trim() || !formData.email.includes('@') || !formData.email.includes('.')) {
        setError('Please enter a valid email address');
        return;
      }
      setError('');
      setStep(3);
    } else if (step === 3) {
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (passwordStrength.score < 2) {
        setError('Password is too weak. Add uppercase letters, numbers, or symbols.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      // Removed agreeTerms check
      setError('');
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const payload = {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      email: formData.email.trim(),
      password: formData.password,
      role_id: ROLE_IDS[formData.role] ?? null,
      role: formData.role,
      institution: formData.institution.trim(),
      avatar: `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase(),
    };

    try {
      const response = await apiClient.post('/create/users', payload);

      if (onRegister) {
        onRegister(response.data.data);
      }
      // Optionally redirect or show success
    } catch (err) {
      if (err.response && err.response.status === 422) {
        const errors = err.response.data.errors;
        const firstError = Object.values(errors)[0][0];
        setError(firstError);
      } else {
        setError('Registration failed. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const totalSteps = 4;
  const progressPercent = (step / totalSteps) * 100;

  return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-3 py-5" style={{ background: 'linear-gradient(135deg, #e8f0fe 0%, #f8f9fa 50%, #e6f4ea 100%)' }}>
      
      {/* Header */}
      <div className="text-center mb-4">
        <div className="d-inline-flex align-items-center justify-content-center bg-white p-3 rounded-circle shadow-sm mb-2">
          <svg width="44" height="44" viewBox="0 0 48 48">
            <path fill="#FBC02D" d="M6 8h36c2.2 0 4 1.8 4 4v24c0 2.2-1.8 4-4 4H6c-2.2 0-4-1.8-4-4V12c0-2.2 1.8-4 4-4z"/>
            <path fill="#388E3C" d="M10 12h28v20H10z"/>
            <path fill="#FFF" d="M24 18c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-3.3 0-10 1.7-10 5v2h20v-2c0-3.3-6.7-5-10-5z"/>
          </svg>
        </div>
        <h2 className="font-google fw-bold text-dark mb-1">Create your Google Account</h2>
        <p className="text-muted small">to continue to Google Classroom</p>
      </div>

      {/* Progress Indicator */}
      <div className="w-100 mb-3" style={{ maxWidth: '460px' }}>
        <div className="d-flex justify-content-between mb-2 small fw-medium">
          <span className="text-primary">Step {step} of {totalSteps}</span>
          <span className="text-muted">
            {step === 1 && 'Choose account type'}
            {step === 2 && 'Personal info'}
            {step === 3 && 'Secure your account'}
            {step === 4 && 'Review & finish'}
          </span>
        </div>
        <div className="progress rounded-pill" style={{ height: '4px' }}>
          <div
            className="progress-bar"
            role="progressbar"
            style={{ width: `${progressPercent}%`, backgroundColor: '#1a73e8', transition: 'width 0.3s ease' }}
            aria-valuenow={progressPercent}
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
      </div>

      {/* Main Card */}
      <div className="card border-0 shadow-lg rounded-4 overflow-hidden w-100" style={{ maxWidth: '460px' }}>
        <div className="card-body p-4 p-md-5 bg-white">

          {error && (
            <div className="alert alert-danger py-2 px-3 small rounded-3 d-flex align-items-center gap-2 mb-3">
              <i className="bi bi-exclamation-circle-fill"></i>
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Role Selection */}
          {step === 1 && (
            <div>
              <h5 className="font-google fw-bold text-dark mb-1">I am a...</h5>
              <p className="text-muted small mb-4">Choose the account type that best describes you.</p>

              <div className="d-flex flex-column gap-3">
                <div
                  className={`border rounded-3 p-4 d-flex align-items-center gap-3 ${formData.role === 'student' ? 'border-primary bg-primary bg-opacity-10' : 'border-light bg-light'}`}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => updateField('role', 'student')}
                >
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0 shadow-sm"
                    style={{ width: '56px', height: '56px', backgroundColor: '#00897b', fontSize: '1.5rem' }}
                  >
                    <i className="bi bi-mortarboard-fill"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="fw-bold mb-1 text-dark">Student / Learner</h6>
                    <p className="text-muted small mb-0">Join classes, turn in assignments, and track your grades.</p>
                  </div>
                  <div className="form-check mb-0">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="roleSelection"
                      checked={formData.role === 'student'}
                      onChange={() => updateField('role', 'student')}
                    />
                  </div>
                </div>

                <div
                  className={`border rounded-3 p-4 d-flex align-items-center gap-3 ${formData.role === 'teacher' ? 'border-primary bg-primary bg-opacity-10' : 'border-light bg-light'}`}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => updateField('role', 'teacher')}
                >
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0 shadow-sm"
                    style={{ width: '56px', height: '56px', backgroundColor: '#1a73e8', fontSize: '1.5rem' }}
                  >
                    <i className="bi bi-easel2-fill"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="fw-bold mb-1 text-dark">Teacher / Instructor</h6>
                    <p className="text-muted small mb-0">Create classes, assign coursework, and grade student submissions.</p>
                  </div>
                  <div className="form-check mb-0">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="roleSelection"
                      checked={formData.role === 'teacher'}
                      onChange={() => updateField('role', 'teacher')}
                    />
                  </div>
                </div>
              </div>

              <button
                className="btn btn-primary w-100 py-2 rounded-3 fw-medium shadow-sm mt-4"
                onClick={() => setStep(2)}
              >
                Continue
                <i className="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          )}

          {/* STEP 2: Personal Information */}
          {step === 2 && (
            <div>
              <h5 className="font-google fw-bold text-dark mb-1">Basic information</h5>
              <p className="text-muted small mb-4">Enter your name and email address.</p>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <div className="form-floating">
                    <input
                      type="text"
                      className="form-control"
                      id="firstNameInput"
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                      autoFocus
                    />
                    <label htmlFor="firstNameInput">First name</label>
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-floating">
                    <input
                      type="text"
                      className="form-control"
                      id="lastNameInput"
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={(e) => updateField('lastName', e.target.value)}
                    />
                    <label htmlFor="lastNameInput">Last name</label>
                  </div>
                </div>
              </div>

              <div className="form-floating mb-3">
                <input
                  type="email"
                  className="form-control"
                  id="emailInput"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
                <label htmlFor="emailInput">Email address</label>
                <small className="form-text text-muted d-block mt-1">You'll use this email to sign in.</small>
              </div>

              <div className="form-floating mb-4">
                <input
                  type="text"
                  className="form-control"
                  id="institutionInput"
                  placeholder="School / Institution (optional)"
                  value={formData.institution}
                  onChange={(e) => updateField('institution', e.target.value)}
                />
                <label htmlFor="institutionInput">School / Institution (optional)</label>
              </div>

              <div className="d-flex justify-content-between gap-2">
                <button className="btn btn-light px-4 py-2 rounded-3 fw-medium text-secondary" onClick={handlePrevStep}>
                  <i className="bi bi-arrow-left me-2"></i>
                  Back
                </button>
                <button className="btn btn-primary px-4 py-2 rounded-3 fw-medium shadow-sm" onClick={handleNextStep}>
                  Next
                  <i className="bi bi-arrow-right ms-2"></i>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Password Setup */}
          {step === 3 && (
            <div>
              <h5 className="font-google fw-bold text-dark mb-1">Create a password</h5>
              <p className="text-muted small mb-4">Use 8 or more characters with a mix of letters, numbers & symbols.</p>

              <div className="form-floating mb-2">
                <input
                  type="password"
                  className="form-control"
                  id="passwordInput"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  autoFocus
                />
                <label htmlFor="passwordInput">Password</label>
              </div>

              {formData.password && (
                <div className="mb-3">
                  <div className="progress rounded-pill mb-1" style={{ height: '4px' }}>
                    <div
                      className="progress-bar"
                      style={{ width: `${passwordStrength.percent}%`, backgroundColor: passwordStrength.color, transition: 'all 0.3s' }}
                    ></div>
                  </div>
                  <small className="fw-medium" style={{ color: passwordStrength.color, fontSize: '0.78rem' }}>
                    <i className="bi bi-shield-lock-fill me-1"></i>
                    Password strength: {passwordStrength.label}
                  </small>
                </div>
              )}

              <div className="form-floating mb-3">
                <input
                  type="password"
                  className="form-control"
                  id="confirmPasswordInput"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                />
                <label htmlFor="confirmPasswordInput">Confirm password</label>
              </div>

              <div className="bg-light rounded-3 p-3 mb-4 small">
                <div className="fw-semibold text-dark mb-2">
                  <i className="bi bi-info-circle text-primary me-1"></i>
                  Password requirements
                </div>
                <div className="d-flex align-items-center mb-1">
                  <i className={`bi ${formData.password.length >= 8 ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'} me-2 small`}></i>
                  <span className={formData.password.length >= 8 ? 'text-success' : 'text-muted'}>At least 8 characters</span>
                </div>
                <div className="d-flex align-items-center mb-1">
                  <i className={`bi ${/[A-Z]/.test(formData.password) ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'} me-2 small`}></i>
                  <span className={/[A-Z]/.test(formData.password) ? 'text-success' : 'text-muted'}>One uppercase letter</span>
                </div>
                <div className="d-flex align-items-center mb-1">
                  <i className={`bi ${/[0-9]/.test(formData.password) ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'} me-2 small`}></i>
                  <span className={/[0-9]/.test(formData.password) ? 'text-success' : 'text-muted'}>One number</span>
                </div>
                <div className="d-flex align-items-center">
                  <i className={`bi ${/[^A-Za-z0-9]/.test(formData.password) ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'} me-2 small`}></i>
                  <span className={/[^A-Za-z0-9]/.test(formData.password) ? 'text-success' : 'text-muted'}>One special character</span>
                </div>
              </div>

              <div className="d-flex justify-content-between gap-2">
                <button className="btn btn-light px-4 py-2 rounded-3 fw-medium text-secondary" onClick={handlePrevStep}>
                  <i className="bi bi-arrow-left me-2"></i>
                  Back
                </button>
                <button className="btn btn-primary px-4 py-2 rounded-3 fw-medium shadow-sm" onClick={handleNextStep}>
                  Next
                  <i className="bi bi-arrow-right ms-2"></i>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Submit - removed terms checkboxes */}
          {step === 4 && (
            <div>
              <h5 className="font-google fw-bold text-dark mb-1">Confirm your details</h5>
              <p className="text-muted small mb-4">Review your information and click Create Account to finish.</p>

              <div className="border rounded-3 bg-light p-3 mb-4">
                <div className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                    style={{
                      width: '52px',
                      height: '52px',
                      backgroundColor: formData.role === 'teacher' ? '#1a73e8' : '#00897b'
                    }}
                  >
                    {`${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase()}
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="fw-bold text-dark mb-0">{formData.firstName} {formData.lastName}</h6>
                    <span className="text-muted small">{formData.email}</span>
                  </div>
                  <span className={`badge ${formData.role === 'teacher' ? 'bg-primary' : 'bg-success'}`}>
                    {formData.role === 'teacher' ? 'Teacher' : 'Student'}
                  </span>
                </div>

                <div className="row g-3 small">
                  <div className="col-6">
                    <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem' }}>Full Name</div>
                    <div className="fw-medium text-dark">{formData.firstName} {formData.lastName}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem' }}>Account Type</div>
                    <div className="fw-medium text-dark text-capitalize">{formData.role}</div>
                  </div>
                  <div className="col-12">
                    <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem' }}>Institution</div>
                    <div className="fw-medium text-dark">{formData.institution || 'Not provided'}</div>
                  </div>
                </div>
              </div>

              {/* Terms checkboxes removed */}

              <div className="d-flex justify-content-between gap-2">
                <button className="btn btn-light px-4 py-2 rounded-3 fw-medium text-secondary" onClick={handlePrevStep}>
                  <i className="bi bi-arrow-left me-2"></i>
                  Back
                </button>
                <button
                  className="btn btn-primary px-4 py-2 rounded-3 fw-medium shadow-sm d-flex align-items-center gap-2"
                  onClick={handleRegisterSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle-fill"></i>
                      Create Account
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="card-footer bg-light border-top py-3 px-4 d-flex justify-content-between align-items-center text-xs text-muted">
          <button
            type="button"
            className="btn btn-link btn-sm p-0 text-decoration-none text-primary fw-medium"
            onClick={onSwitchToLogin}
          >
            Already have an account? Sign in
          </button>
          <div className="d-flex gap-3 small">
            <a href="#help" className="text-decoration-none text-muted" onClick={(e) => e.preventDefault()}>Help</a>
            <a href="#privacy" className="text-decoration-none text-muted" onClick={(e) => e.preventDefault()}>Privacy</a>
            <a href="#terms" className="text-decoration-none text-muted" onClick={(e) => e.preventDefault()}>Terms</a>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-muted small" style={{ maxWidth: '460px' }}>
        <span>Protected by Google reCAPTCHA Enterprise to ensure you're not a robot.</span>
      </div>

    </div>
  );
};

export default RegisterPage;