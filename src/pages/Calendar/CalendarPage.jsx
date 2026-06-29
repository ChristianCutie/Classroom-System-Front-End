import React, { useState } from 'react';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarPage = ({ classes, onSelectClass }) => {
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  const activeClasses = classes.filter(c => !c.isArchived);
  
  // Collect all coursework with due dates
  const allEvents = [];
  activeClasses.forEach(cls => {
    if (cls.classwork) {
      cls.classwork.forEach(cw => {
        if (cw.dueDate) {
          allEvents.push({
            id: cw.id,
            title: cw.title,
            dueDate: cw.dueDate,
            className: cls.name,
            classId: cls.id,
            color: cls.themeColor || '#1a73e8'
          });
        }
      });
    }
  });

  const filteredEvents = selectedClassId === 'all'
    ? allEvents
    : allEvents.filter(e => e.classId === selectedClassId);

  return (
    <div className="container-fluid px-2 px-md-4 py-3">
      {/* Calendar Top Filter & Navigation Bar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="dropdown">
            <select
              className="form-select fw-medium text-dark shadow-sm"
              style={{ minWidth: '220px' }}
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              <option value="all">All classes</option>
              {activeClasses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-medium"
            onClick={() => setCurrentWeekOffset(0)}
          >
            Today
          </button>
          <div className="btn-group shadow-sm">
            <button
              className="btn btn-light border btn-sm"
              onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <button
              className="btn btn-light border btn-sm px-3 fw-medium"
            >
              Week of Mar {Math.max(1, 16 + currentWeekOffset * 7)} – Mar {Math.min(31, 22 + currentWeekOffset * 7)}, 2026
            </button>
            <button
              className="btn btn-light border btn-sm"
              onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="card border shadow-sm rounded-3 overflow-hidden bg-white">
        <div className="row g-0 text-center border-bottom bg-light">
          {daysOfWeek.map((day, idx) => (
            <div key={idx} className="col border-end py-3">
              <div className="text-muted small text-uppercase fw-bold">{day}</div>
              <div className={`fs-5 fw-bold mt-1 ${idx === 3 && currentWeekOffset === 0 ? 'text-white bg-primary rounded-circle mx-auto d-flex align-items-center justify-content-center' : 'text-dark'}`} style={idx === 3 && currentWeekOffset === 0 ? { width: '32px', height: '32px' } : {}}>
                {15 + idx + currentWeekOffset * 7}
              </div>
            </div>
          ))}
        </div>

        {/* Calendar Body columns */}
        <div className="row g-0" style={{ minHeight: '500px' }}>
          {daysOfWeek.map((_, dayIdx) => {
            // Distribute events across days for realistic visual simulation
            const dayEvents = filteredEvents.filter((_, eIdx) => (eIdx % 7) === dayIdx);

            return (
              <div key={dayIdx} className="col border-end p-2 d-flex flex-column gap-2 bg-white" style={{ minHeight: '500px' }}>
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    className="p-2 rounded text-white shadow-sm"
                    style={{
                      backgroundColor: event.color,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      transition: 'transform 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                    onClick={() => onSelectClass(event.classId)}
                    title={`${event.title} (${event.className})`}
                  >
                    <div className="fw-bold text-truncate">{event.title}</div>
                    <div className="text-white text-opacity-75 text-truncate small" style={{ fontSize: '0.72rem' }}>
                      {event.className}
                    </div>
                    <div className="text-white text-opacity-90 small fw-medium mt-1">
                      <i className="bi bi-clock me-1"></i> 11:59 PM
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default CalendarPage;
