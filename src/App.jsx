import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar/Navbar.jsx';
import Sidebar from './components/Sidebar/Sidebar.jsx';
import CreateClassModal from './components/Common/CreateClassModal.jsx';
import JoinClassModal from './components/Common/JoinClassModal.jsx';

// Pages
import LoginPage from './pages/Auth/LoginPage.jsx';
import ClassesPage from './pages/Classes/ClassesPage.jsx';
import ClassDetailPage from './pages/ClassDetail/ClassDetailPage.jsx';
import CalendarPage from './pages/Calendar/CalendarPage.jsx';
import ToDoPage from './pages/ToDo/ToDoPage.jsx';
import ArchivedPage from './pages/Archived/ArchivedPage.jsx';
import SettingsPage from './pages/Settings/SettingsPage.jsx';

import { initialUser, initialClasses } from './data/mockData.jsx';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(initialUser);
  const [classes, setClasses] = useState(initialClasses);
  const [activePage, setActivePage] = useState('home');
  const [activeClassId, setActiveClassId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Expose global logout handler for ProfileModal
  useEffect(() => {
    window.onLogout = () => {
      setIsLoggedIn(false);
      setActivePage('home');
      setActiveClassId(null);
    };
    return () => {
      delete window.onLogout;
    };
  }, []);

  // Auto-close sidebar on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 992) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isLoggedIn) {
    return (
      <LoginPage
        onLogin={(loggedUser) => {
          setUser(loggedUser);
          setIsLoggedIn(true);
          setActivePage('home');
        }}
      />
    );
  }

  const activeClass = classes.find(c => c.id === activeClassId) || null;

  const handleSelectClass = (classId) => {
    setActiveClassId(classId);
    setActivePage('classDetail');
    if (window.innerWidth < 992) {
      setSidebarOpen(false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigatePage = (page) => {
    setActivePage(page);
    setActiveClassId(null);
    if (window.innerWidth < 992) {
      setSidebarOpen(false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateClass = (data) => {
    const newCls = {
      id: `c_${Date.now()}`,
      name: data.name,
      section: data.section,
      subject: data.subject,
      room: data.room,
      code: Math.random().toString(36).substring(2, 9),
      teacher: { name: user.name, avatar: user.avatar || "U", email: user.email },
      isTeaching: true,
      isArchived: false,
      banner: data.banner,
      themeColor: data.themeColor,
      announcements: [
        {
          id: `a_${Date.now()}`,
          author: { name: user.name, avatar: user.avatar || "U" },
          date: 'Just now',
          text: `Welcome to ${data.name}! Let's have a great learning journey.`,
          attachments: [],
          comments: []
        }
      ],
      topics: ["Week 1: Introduction"],
      classwork: [],
      students: [],
      grades: []
    };
    setClasses([newCls, ...classes]);
    handleSelectClass(newCls.id);
  };

  const handleJoinClass = (code) => {
    const found = classes.find(c => c.code.toLowerCase() === code.toLowerCase());
    if (found) {
      handleSelectClass(found.id);
      return true;
    }
    return false;
  };

  const handleArchiveClass = (classId) => {
    setClasses(classes.map(c => c.id === classId ? { ...c, isArchived: true } : c));
    if (activeClassId === classId) {
      handleNavigatePage('home');
    }
  };

  const handleRestoreClass = (classId) => {
    setClasses(classes.map(c => c.id === classId ? { ...c, isArchived: false } : c));
  };

  const handleDeleteClass = (classId) => {
    setClasses(classes.filter(c => c.id !== classId));
  };

  const handleUnenrollClass = (classId) => {
    setClasses(classes.filter(c => c.id !== classId));
    if (activeClassId === classId) {
      handleNavigatePage('home');
    }
  };

  const handlePostAnnouncement = (classId, annData) => {
    const newAnn = {
      id: `a_${Date.now()}`,
      author: { name: user.name, avatar: user.avatar || "U" },
      date: 'Just now',
      text: annData.text,
      attachments: annData.attachments || [],
      comments: []
    };
    setClasses(classes.map(c => {
      if (c.id === classId) {
        return {
          ...c,
          announcements: [newAnn, ...(c.announcements || [])]
        };
      }
      return c;
    }));
  };

  const handleAddComment = (classId, annId, text) => {
    const newComment = {
      id: `cm_${Date.now()}`,
      author: user.name,
      avatar: user.avatar || "U",
      text,
      date: 'Just now'
    };
    setClasses(classes.map(c => {
      if (c.id === classId) {
        return {
          ...c,
          announcements: (c.announcements || []).map(a => {
            if (a.id === annId) {
              return {
                ...a,
                comments: [...(a.comments || []), newComment]
              };
            }
            return a;
          })
        };
      }
      return c;
    }));
  };

  const handleCreateCoursework = (classId, cwData) => {
    const newCw = {
      id: `cw_${Date.now()}`,
      ...cwData,
      stats: user.role === 'teacher' ? { turnedIn: 0, assigned: (classes.find(c => c.id === classId)?.students?.length || 5), graded: 0 } : null
    };
    setClasses(classes.map(c => {
      if (c.id === classId) {
        return {
          ...c,
          classwork: [newCw, ...(c.classwork || [])]
        };
      }
      return c;
    }));
  };

  const handleSubmitCoursework = (classId, courseworkId) => {
    setClasses(classes.map(c => {
      if (c.id === classId) {
        return {
          ...c,
          classwork: (c.classwork || []).map(cw => {
            if (cw.id === courseworkId && cw.stats) {
              return {
                ...cw,
                stats: {
                  ...cw.stats,
                  turnedIn: cw.stats.turnedIn + 1,
                  assigned: Math.max(0, cw.stats.assigned - 1)
                }
              };
            }
            return cw;
          })
        };
      }
      return c;
    }));
  };

  const handleUpdateGrade = (classId, studentId, cwId, newScore) => {
    setClasses(classes.map(c => {
      if (c.id === classId) {
        const initialGrades = c.grades || [];
        const existingStudentIdx = initialGrades.findIndex(g => g.studentId === studentId);
        let updatedGrades;
        if (existingStudentIdx !== -1) {
          updatedGrades = initialGrades.map((g, idx) => {
            if (idx === existingStudentIdx) {
              return { ...g, [cwId]: newScore };
            }
            return g;
          });
        } else {
          updatedGrades = [...initialGrades, { studentId, [cwId]: newScore }];
        }
        return { ...c, grades: updatedGrades };
      }
      return c;
    }));
  };

  const handleUpdateClassBanner = (classId, bannerCss, themeColor) => {
    setClasses(classes.map(c => {
      if (c.id === classId) {
        return { ...c, banner: bannerCss, themeColor };
      }
      return c;
    }));
  };

  const handleToggleRole = () => {
    const nextRole = user.role === 'teacher' ? 'student' : 'teacher';
    setUser({ ...user, role: nextRole });
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      
      {/* Top Navbar */}
      <Navbar
        user={user}
        activeClass={activeClass}
        onNavigateHome={() => handleNavigatePage('home')}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenCreateModal={() => setShowCreateModal(true)}
        onOpenJoinModal={() => setShowJoinModal(true)}
        onToggleRole={handleToggleRole}
        onUpdateUser={(updated) => setUser(updated)}
      />

      {/* Main Layout: Sidebar + Content */}
      <div className="d-flex flex-grow-1 position-relative">
        <Sidebar
          isOpen={sidebarOpen}
          activePage={activePage}
          activeClassId={activeClassId}
          classes={classes}
          user={user}
          onNavigatePage={handleNavigatePage}
          onSelectClass={handleSelectClass}
        />

        <main className={`gc-main-content w-100 ${sidebarOpen ? 'sidebar-open' : ''}`}>
          {activePage === 'home' && (
            <ClassesPage
              classes={classes}
              user={user}
              onSelectClass={handleSelectClass}
              onArchiveClass={handleArchiveClass}
              onUnenrollClass={handleUnenrollClass}
              onOpenCreateModal={() => setShowCreateModal(true)}
              onOpenJoinModal={() => setShowJoinModal(true)}
              onOpenClasswork={(cId) => handleSelectClass(cId)}
            />
          )}

          {activePage === 'classDetail' && activeClass && (
            <ClassDetailPage
              cls={activeClass}
              user={user}
              onPostAnnouncement={handlePostAnnouncement}
              onAddComment={handleAddComment}
              onCreateCoursework={handleCreateCoursework}
              onSubmitCoursework={handleSubmitCoursework}
              onUpdateGrade={handleUpdateGrade}
              onUpdateClassBanner={handleUpdateClassBanner}
            />
          )}

          {activePage === 'calendar' && (
            <CalendarPage
              classes={classes}
              onSelectClass={handleSelectClass}
            />
          )}

          {activePage === 'todo' && (
            <ToDoPage
              classes={classes}
              user={user}
              onSelectClass={handleSelectClass}
            />
          )}

          {activePage === 'archived' && (
            <ArchivedPage
              classes={classes}
              user={user}
              onRestoreClass={handleRestoreClass}
              onDeleteClass={handleDeleteClass}
            />
          )}

          {activePage === 'settings' && (
            <SettingsPage
              user={user}
              classes={classes}
              onUpdateUser={(updated) => setUser(updated)}
              onToggleRole={handleToggleRole}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateClassModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateClass}
      />

      <JoinClassModal
        show={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoin={handleJoinClass}
        user={user}
      />

    </div>
  );
};

export default App;
