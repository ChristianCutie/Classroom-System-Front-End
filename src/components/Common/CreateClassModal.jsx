import React, { useState } from 'react';
import { bannerGradients } from '../../data/mockData.jsx';

const CreateClassModal = ({ show, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    section: '',
    subject: '',
    room: '',
    bannerId: 'blue'
  });
  const [error, setError] = useState('');

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Class name is required');
      return;
    }
    const selectedBanner = bannerGradients.find(b => b.id === formData.bannerId) || bannerGradients[0];
    onCreate({
      name: formData.name.trim(),
      section: formData.section.trim(),
      subject: formData.subject.trim(),
      room: formData.room.trim(),
      banner: selectedBanner.css,
      themeColor: selectedBanner.color
    });
    setFormData({ name: '', section: '', subject: '', room: '', bannerId: 'blue' });
    setError('');
    onClose();
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '8px' }}>
          <div className="modal-header border-bottom-0 pt-4 px-4 pb-0">
            <h5 className="modal-title font-google fw-bold">Create class</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {error && <div className="alert alert-danger py-2 text-sm">{error}</div>}
              
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className="form-control"
                  id="classNameInput"
                  placeholder="Class name (required)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  autoFocus
                  required
                />
                <label htmlFor="classNameInput">Class name (required)</label>
              </div>

              <div className="form-floating mb-3">
                <input
                  type="text"
                  className="form-control"
                  id="sectionInput"
                  placeholder="Section"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                />
                <label htmlFor="sectionInput">Section</label>
              </div>

              <div className="form-floating mb-3">
                <input
                  type="text"
                  className="form-control"
                  id="subjectInput"
                  placeholder="Subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
                <label htmlFor="subjectInput">Subject</label>
              </div>

              <div className="form-floating mb-4">
                <input
                  type="text"
                  className="form-control"
                  id="roomInput"
                  placeholder="Room"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                />
                <label htmlFor="roomInput">Room</label>
              </div>

              <div className="mb-2">
                <label className="form-label text-muted small fw-bold text-uppercase">Choose Banner Theme</label>
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
                        border: formData.bannerId === b.id ? '3px solid #1a73e8' : '1px solid #ddd',
                        transform: formData.bannerId === b.id ? 'scale(1.08)' : 'none',
                        transition: 'all 0.15s'
                      }}
                      onClick={() => setFormData({ ...formData, bannerId: b.id })}
                      title={b.name}
                    >
                      {formData.bannerId === b.id && <i className="bi bi-check text-white small fw-bold"></i>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer border-top-0 pb-4 px-4 pt-0">
              <button type="button" className="btn btn-light px-4 fw-medium text-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn text-white px-4 fw-medium"
                style={{ backgroundColor: '#1a73e8' }}
                disabled={!formData.name.trim()}
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

export default CreateClassModal;
