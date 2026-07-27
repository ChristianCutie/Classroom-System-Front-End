import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext.jsx';
import { classAPI } from '@/api/client';
import ClassCard from '../Classes/ClassCard';

const ArchivedPage = ({ onSelectClass, onOpenClasswork }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  const fetchArchived = async () => {
    setLoading(true);
    try {
      const res = await classAPI.getArchivedClasses();
      const all = res.data?.data || [];
      const archived = all.filter(c => c.is_archived === true || c.is_archived === 1);
      setClasses(archived);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch archived classes:', err);
      setError('Could not load archived classes.');
      addToast('Failed to load archived classes', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchived();
  }, []);

  const handleRestore = async (classId) => {
    try {
      await classAPI.restoreClass(classId);
      addToast('Class restored successfully!', 'success');
      setClasses(prev => prev.filter(c => c.id !== classId));
    } catch (err) {
      console.error('Failed to restore:', err);
      addToast('Could not restore the class.', 'danger');
    }
  };

  const handleDelete = async (classId) => {
    if (!window.confirm('Delete this class forever? This action cannot be undone.')) return;
    try {
      await classAPI.deleteClass(classId);
      addToast('Class deleted permanently.', 'success');
      setClasses(prev => prev.filter(c => c.id !== classId));
    } catch (err) {
      console.error('Failed to delete:', err);
      addToast('Could not delete the class.', 'danger');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5 mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted mt-2">Loading archived classes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5 mt-5">
        <i className="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3"></i>
        <h5 className="text-danger">{error}</h5>
        <button className="btn btn-outline-primary mt-3" onClick={fetchArchived}>
          Try again
        </button>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="text-center py-5 mt-5">
        <div className="rounded-circle bg-white shadow p-4 mb-4 d-inline-block">
          <i className="bi bi-archive text-secondary" style={{ fontSize: '3rem' }}></i>
        </div>
        <h4 className="font-google fw-bold text-dark mb-2">No archived classes</h4>
        <p className="text-muted small max-w-sm mx-auto" style={{ maxWidth: '380px' }}>
          Classes you archive will appear here. You can restore them anytime or delete them forever.
        </p>
      </div>
    );
  }

  return (
    <div className="container-fluid px-2 px-md-4 py-3">
      <div className="mb-4 border-bottom pb-3">
        <h4 className="font-google fw-bold text-dark mb-1 d-flex align-items-center gap-2">
          <i className="bi bi-archive-fill text-secondary"></i>
          Archived classes ({classes.length})
        </h4>
        <p className="text-muted small mb-0">Archived classes are frozen. Teachers and students can view coursework but cannot post new items.</p>
      </div>

      <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 row-cols-xxl-4 g-4">
        {classes.map(cls => (
          <div key={cls.id} className="col">
            <ClassCard
              cls={cls}
              user={null} // not needed for archived actions
              onSelectClass={onSelectClass}
              onOpenClasswork={onOpenClasswork}
              onRestoreClass={handleRestore}
              onArchiveClass={() => {}}
              onUnenrollClass={() => {}}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArchivedPage;