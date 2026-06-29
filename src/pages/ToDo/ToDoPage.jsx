import React, { useState } from 'react';

const ToDoPage = ({ classes, user, onSelectClass }) => {
  const [activeSubTab, setActiveSubTab] = useState('assigned');
  const [selectedClassId, setSelectedClassId] = useState('all');

  const isTeacher = user.role === 'teacher';
  const targetClasses = classes.filter(c => !c.isArchived && (isTeacher ? c.isTeaching : !c.isTeaching));
  
  // Flatten classwork
  const allWork = [];
  targetClasses.forEach(cls => {
    if (cls.classwork) {
      cls.classwork.forEach(cw => {
        allWork.push({
          ...cw,
          className: cls.name,
          classId: cls.id,
          themeColor: cls.themeColor || '#1a73e8'
        });
      });
    }
  });

  const filteredByClass = selectedClassId === 'all'
    ? allWork
    : allWork.filter(w => w.classId === selectedClassId);

  // Separate by status
  const assignedList = filteredByClass.filter(w => w.dueDate);
  const missingList = filteredByClass.filter(w => w.dueDate && w.dueDate.includes('Mar'));
  const doneList = filteredByClass.filter(w => !w.dueDate || w.stats?.graded > 0 || w.type === 'question');

  const currentList = activeSubTab === 'assigned' ? assignedList : activeSubTab === 'missing' ? missingList : doneList;

  return (
    <div className="container-fluid px-2 px-md-4 py-3 max-w-5xl mx-auto" style={{ maxWidth: '960px' }}>
      
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 border-bottom pb-3 gap-3">
        <h3 className="font-google fw-bold text-dark mb-0 d-flex align-items-center gap-2">
          <i className={`bi ${isTeacher ? 'bi-clipboard-check text-primary' : 'bi-list-check text-success'}`}></i>
          {isTeacher ? 'To review' : 'To-do'}
        </h3>

        <select
          className="form-select shadow-sm fw-medium text-dark"
          style={{ width: '240px' }}
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
        >
          <option value="all">All classes</option>
          {targetClasses.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Sub tabs */}
      <ul className="nav nav-pills gap-2 mb-4">
        <li className="nav-item">
          <button
            className={`nav-link rounded-pill px-4 fw-medium ${activeSubTab === 'assigned' ? 'active bg-primary' : 'bg-white text-dark border'}`}
            onClick={() => setActiveSubTab('assigned')}
          >
            {isTeacher ? 'Review in progress' : 'Assigned'} ({assignedList.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link rounded-pill px-4 fw-medium ${activeSubTab === 'missing' ? 'active bg-danger' : 'bg-white text-dark border'}`}
            onClick={() => setActiveSubTab('missing')}
          >
            {isTeacher ? 'Needs grading' : 'Missing'} ({missingList.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link rounded-pill px-4 fw-medium ${activeSubTab === 'done' ? 'active bg-success' : 'bg-white text-dark border'}`}
            onClick={() => setActiveSubTab('done')}
          >
            {isTeacher ? 'Reviewed' : 'Done'} ({doneList.length})
          </button>
        </li>
      </ul>

      {/* Task List */}
      {currentList.length > 0 ? (
        <div className="d-flex flex-column gap-3">
          {currentList.map(item => (
            <div
              key={item.id}
              className="card border shadow-sm rounded-3 overflow-hidden bg-white hover-shadow"
              style={{ cursor: 'pointer', transition: 'all 0.15s' }}
              onClick={() => onSelectClass(item.classId)}
            >
              <div className="card-body p-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0 shadow-sm"
                    style={{ width: '44px', height: '44px', backgroundColor: item.themeColor }}
                  >
                    <i className={`bi ${item.type === 'quiz' ? 'bi-card-checklist' : 'bi-clipboard-check'} fs-5`}></i>
                  </div>
                  <div>
                    <span className="badge bg-light text-dark border mb-1">{item.className}</span>
                    <h6 className="fw-bold mb-1 text-dark">{item.title}</h6>
                    <span className="text-muted small">
                      {item.dueDate ? `Due ${item.dueDate}` : 'No due date'}
                    </span>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-4">
                  {isTeacher && item.stats && (
                    <div className="d-flex gap-3 text-center small">
                      <div>
                        <div className="fw-bold fs-5 text-primary">{item.stats.turnedIn}</div>
                        <div className="text-muted text-xs">Turned in</div>
                      </div>
                      <div className="border-end"></div>
                      <div>
                        <div className="fw-bold fs-5 text-dark">{item.stats.assigned}</div>
                        <div className="text-muted text-xs">Assigned</div>
                      </div>
                    </div>
                  )}
                  <i className="bi bi-chevron-right text-muted"></i>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5 my-5 bg-white border rounded-4 shadow-sm">
          <i className="bi bi-check2-circle text-success" style={{ fontSize: '4rem' }}></i>
          <h5 className="font-google fw-bold text-dark mt-3">No work to display!</h5>
          <p className="text-muted small mb-0">You're all caught up on this tab.</p>
        </div>
      )}

    </div>
  );
};

export default ToDoPage;
