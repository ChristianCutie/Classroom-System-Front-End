import React, { useState, useEffect } from 'react';
import { calendarAPI } from '@/api/client';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CalendarPage = ({ onSelectClass }) => {
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [classes, setClasses] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper: get Monday of the week for a given date and offset
  const getWeekStart = (date, offset = 0) => {
    const d = new Date(date);
    d.setDate(d.getDate() + offset * 7);
    const day = d.getDay(); // 0=Sun
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const toDateStr = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Fetch classes and events
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch class list
        const classesRes = await calendarAPI.getClasses();
        setClasses(classesRes.data.classes || []);

        // 2. Fetch events (filtered by class if selected)
        const classId = selectedClassId === 'all' ? null : selectedClassId;
        const eventsRes = await calendarAPI.getEvents(classId);
        setEvents(eventsRes.data.events || []);
      } catch (err) {
        setError('Failed to load calendar data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedClassId]);
  // Compute week range
  const today = new Date();
  const weekStart = getWeekStart(today, currentWeekOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  // Generate day labels for the week
  const weekDays = daysOfWeek.map((day, idx) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + idx);
    return {
      name: day,
      date,
      dateStr: toDateStr(date),
      isToday: toDateStr(date) === toDateStr(today),
    };
  });

  // Filter events for each day
  const getEventsForDay = (dateStr) => {
    return events.filter(ev => toDateStr(ev.due_date) === dateStr);
  };

  // Handle class selection change (also updates the filter in API call)
  const handleClassChange = (e) => {
    setSelectedClassId(e.target.value);
  };

  // Navigate weeks
  const goToToday = () => setCurrentWeekOffset(0);
  const prevWeek = () => setCurrentWeekOffset(offset => offset - 1);
  const nextWeek = () => setCurrentWeekOffset(offset => offset + 1);

  if (loading) {
    return <div className="p-4 text-center">Loading calendar...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-danger">{error}</div>;
  }

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
              onChange={handleClassChange}
            >
              <option value="all">All classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.class_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-medium"
            onClick={goToToday}
          >
            Today
          </button>
          <div className="btn-group shadow-sm">
            <button
              className="btn btn-light border btn-sm"
              onClick={prevWeek}
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <button className="btn btn-light border btn-sm px-3 fw-medium">
              {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </button>
            <button
              className="btn btn-light border btn-sm"
              onClick={nextWeek}
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="card border shadow-sm rounded-3 overflow-hidden bg-white">
        <div className="row g-0 text-center border-bottom bg-light">
          {weekDays.map((day, idx) => (
            <div key={idx} className="col border-end py-3">
              <div className="text-muted small text-uppercase fw-bold">{day.name}</div>
              <div
                className={`fs-5 fw-bold mt-1 ${
                  day.isToday
                    ? 'text-white bg-primary rounded-circle mx-auto d-flex align-items-center justify-content-center'
                    : 'text-dark'
                }`}
                style={day.isToday ? { width: '32px', height: '32px' } : {}}
              >
                {day.date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Calendar Body columns */}
        <div className="row g-0" style={{ minHeight: '500px' }}>
          {weekDays.map((day, idx) => {
            const dayEvents = getEventsForDay(day.dateStr);
            return (
              <div
                key={idx}
                className="col border-end p-2 d-flex flex-column gap-2 bg-white"
                style={{ minHeight: '500px' }}
              >
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    className="p-2 rounded text-white shadow-sm"
                    style={{
                      backgroundColor: event.color || '#1a73e8',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      transition: 'transform 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                    onClick={() => onSelectClass && onSelectClass(event.class_id)}
                    title={`${event.title} (${event.class_name})`}
                  >
                    <div className="fw-bold text-truncate">{event.title}</div>
                    <div className="text-white text-opacity-75 text-truncate small" style={{ fontSize: '0.72rem' }}>
                      {event.class_name}
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