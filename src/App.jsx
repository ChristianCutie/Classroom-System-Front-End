import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';          // 1. Import Auth
import apiClient from '@/api/client';                     // 2. API client
import { Routes, Route, useNavigate } from 'react-router-dom';

// Components
import Navbar from './components/Navbar/Navbar.jsx';
import Sidebar from './components/Sidebar/Sidebar.jsx';
import CreateClassModal from './components/Common/CreateClassModal.jsx';
import JoinClassModal from './components/Common/JoinClassModal.jsx';
import ToastContainer from './components/Common/ToastContainer.jsx';
import { useToast } from '@/context/ToastContext.jsx';
import LoginPage from './pages/Auth/LoginPage.jsx';
import RegisterPage from './pages/Auth/RegisterPage.jsx';
import ClassesPage from './pages/Classes/ClassesPage.jsx';
import ClassDetailPage from './pages/ClassDetail/ClassDetailPage.jsx';
import CalendarPage from './pages/Calendar/CalendarPage.jsx';
import ToDoPage from './pages/ToDo/ToDoPage.jsx';
import ArchivedPage from './pages/Archived/ArchivedPage.jsx';
import SettingsPage from './pages/Settings/SettingsPage.jsx';

const App = () => {
  // ------------------------------------------------------------
  // 3. Use AuthContext (replaces isLoggedIn & user state)
  // ------------------------------------------------------------
  const { user, login, logout, loading } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // ------------------------------------------------------------
  // 4. Real classes state (fetched from API)
  // ------------------------------------------------------------
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  // ------------------------------------------------------------
  // UI state (unchanged)
  // ------------------------------------------------------------
  const [authMode, setAuthMode] = useState('login');
  const [selectedClass, setSelectedClass] = useState(null);
  const [activeClassLoading, setActiveClassLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // ------------------------------------------------------------
  // 5. Fetch classes when user logs in
  // ------------------------------------------------------------
  useEffect(() => {
    if (user) {
      fetchClasses();
    } else {
      setClasses([]);
      navigate('/');
    }
  }, [user, navigate]);

  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const res = await apiClient.get('/classes');
      setClasses(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
      addToast('Unable to load classes right now.', 'error');
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleRegister = (newUser) => {
    // Currently the registration form does not have a backend endpoint,
    // so keep the page flow moving by switching back to sign in.
    setAuthMode('login');
    // Optionally, you could persist the new user locally or send to API later.
    console.log('Registered user:', newUser);
  };

  // ------------------------------------------------------------
  // 6. Auto‑close sidebar on resize (unchanged)
  // ------------------------------------------------------------
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 992);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ------------------------------------------------------------
  // 7. If Auth is loading or not logged in, show LoginPage
  // ------------------------------------------------------------
  if (loading) {
    return <div className="d-flex justify-content-center mt-5">Loading…</div>;
  }

  if (!user) {
    return authMode === 'login' ? (
      <LoginPage onSwitchToRegister={() => setAuthMode('register')} />
    ) : (
      <RegisterPage
        onRegister={handleRegister}
        onSwitchToLogin={() => setAuthMode('login')}
      />
    );
  }

  // ------------------------------------------------------------
  // Helper: selected class details
  // ------------------------------------------------------------
  // `selectedClass` is loaded from the API when a class card is clicked.

  // ------------------------------------------------------------
  // 8. Navigation handlers (updated for React Router)
  // ------------------------------------------------------------
  const handleSelectClass = async (classId) => {
    if (!classId) return;

    setActiveClassLoading(true);
    if (window.innerWidth < 992) setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const res = await apiClient.get(`/classes/${classId}`);
      setSelectedClass(res.data?.data || null);
      navigate(`/class/${classId}`);
    } catch (err) {
      console.error('Failed to load class detail:', err);
      setSelectedClass(null);
      addToast('Unable to open that class right now.', 'error');
      navigate('/');
    } finally {
      setActiveClassLoading(false);
    }
  };

  const handleNavigatePage = (page) => {
    setSelectedClass(null);
    if (window.innerWidth < 992) setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(`/${page === 'home' ? '' : page}`);
  };

  // ------------------------------------------------------------
  // 9. API‑backed class operations
  // ------------------------------------------------------------
  const handleCreateClass = async (data) => {
    try {
      const res = await apiClient.post('/classes', data);
      const newClass = res.data.data;
      setClasses(prev => [newClass, ...prev]);
      handleSelectClass(newClass.id);
    } catch (err) {
      console.error('Create class error:', err);
      addToast('Could not create the class. Please try again.', 'error');
    }
  };

  const handleJoinClass = async (code) => {
    try {
      const res = await apiClient.post('/classes/join', { code });
      const joinedClass = res.data.data;
      setClasses(prev => [joinedClass, ...prev]);
      addToast('You joined the class successfully.', 'success');
      handleSelectClass(joinedClass.id);
      return true;
    } catch (err) {
      console.error('Join class error:', err);
      addToast('Unable to join that class. Check the code and try again.', 'error');
      return false;
    }
  };

  const handleArchiveClass = async (classId) => {
    try {
      await apiClient.patch(`/classes/${classId}/archive`);
      setClasses(prev =>
        prev.map(c => (c.id === classId ? { ...c, is_archived: 1 } : c))
      );
      addToast('Class archived.', 'success');
      navigate('/');
    } catch (err) {
      console.error('Archive error:', err);
      addToast('Could not archive the class.', 'error');
    }
  };

  const handleRestoreClass = async (classId) => {
    try {
      await apiClient.patch(`/classes/${classId}/restore`);
      setClasses(prev =>
        prev.map(c => (c.id === classId ? { ...c, is_archived: 0 } : c))
      );
      addToast('Class restored.', 'success');
    } catch (err) {
      console.error('Restore error:', err);
      addToast('Could not restore the class.', 'error');
    }
  };

  const handleDeleteClass = async (classId) => {
    try {
      await apiClient.delete(`/classes/${classId}`);
      setClasses(prev => prev.filter(c => c.id !== classId));
      addToast('Class deleted.', 'success');
      navigate('/');
    } catch (err) {
      console.error('Delete error:', err);
      addToast('Could not delete the class.', 'error');
    }
  };

  const handleUnenrollClass = async (classId) => {
    try {
      await apiClient.delete(`/classes/${classId}/unenroll`);
      setClasses(prev => prev.filter(c => c.id !== classId));
      addToast('You left the class.', 'success');
      navigate('/');
    } catch (err) {
      console.error('Unenroll error:', err);
      addToast('Could not leave the class.', 'error');
    }
  };

  // ------------------------------------------------------------
  // 10. Class detail actions (announcements, coursework, etc.)
  //     These will also call the API – simplified here for brevity
  // ------------------------------------------------------------
  const handlePostAnnouncement = async (classId, annData) => {
    try {
      const res = await apiClient.post(`/classes/${classId}/announcements`, annData);
      const newAnn = res.data.data;
      setClasses(prev =>
        prev.map(c =>
          c.id === classId
            ? { ...c, announcements: [newAnn, ...(c.announcements || [])] }
            : c
        )
      );
      addToast('Announcement posted.', 'success');
    } catch (err) {
      console.error('Post announcement error:', err);
      addToast('Could not post the announcement.', 'error');
    }
  };

  const handleAddComment = async (classId, annId, text) => {
    try {
      const res = await apiClient.post(`/classes/${classId}/announcements/${annId}/comments`, { text });
      const newComment = res.data.data;
      setClasses(prev =>
        prev.map(c =>
          c.id === classId
            ? {
                ...c,
                announcements: (c.announcements || []).map(a =>
                  a.id === annId
                    ? { ...a, comments: [...(a.comments || []), newComment] }
                    : a
                )
              }
            : c
        )
      );
      addToast('Comment added.', 'success');
    } catch (err) {
      console.error('Add comment error:', err);
      addToast('Could not add the comment.', 'error');
    }
  };

  const handleCreateCoursework = async (classId, cwData) => {
    try {
      const res = await apiClient.post(`/classes/${classId}/coursework`, cwData);
      const newCw = res.data.data;
      setClasses(prev =>
        prev.map(c =>
          c.id === classId
            ? { ...c, classwork: [newCw, ...(c.classwork || [])] }
            : c
        )
      );
      addToast('Coursework created.', 'success');
    } catch (err) {
      console.error('Create coursework error:', err);
      addToast('Could not create the coursework.', 'error');
    }
  };

  const handleSubmitCoursework = async (classId, courseworkId) => {
    try {
      await apiClient.post(`/classes/${classId}/coursework/${courseworkId}/submit`);
      await fetchClasses();
      addToast('Submission turned in.', 'success');
    } catch (err) {
      console.error('Submit coursework error:', err);
      addToast('Could not submit the coursework.', 'error');
    }
  };

  const handleUpdateGrade = async (classId, studentId, cwId, newScore) => {
    try {
      await apiClient.patch(`/classes/${classId}/grades`, {
        student_id: studentId,
        coursework_id: cwId,
        score: newScore
      });
      await fetchClasses();
      addToast('Grade updated.', 'success');
    } catch (err) {
      console.error('Update grade error:', err);
      addToast('Could not update the grade.', 'error');
    }
  };

  const handleUpdateClassBanner = async (classId, bannerCss, themeColor) => {
    try {
      await apiClient.patch(`/classes/${classId}`, { banner: bannerCss, theme_color: themeColor });
      setClasses(prev =>
        prev.map(c =>
          c.id === classId ? { ...c, banner: bannerCss, theme_color: themeColor } : c
        )
      );
      addToast('Class theme updated.', 'success');
    } catch (err) {
      console.error('Update banner error:', err);
      addToast('Could not update the class theme.', 'error');
    }
  };

  const handleDiscussionCreated = async (classId) => {
    try {
      // Refetch the selected class to load new discussions
      const res = await apiClient.get(`/classes/${classId}`);
      setSelectedClass(res.data?.data || null);
      // Also update the classes list
      setClasses(prev =>
        prev.map(c =>
          c.id === classId ? res.data?.data : c
        )
      );
      addToast('Discussion refreshed.', 'success');
    } catch (err) {
      console.error('Failed to refresh class after discussion creation:', err);
      addToast('Could not refresh the class discussion.', 'error');
    }
  };

  // ------------------------------------------------------------
  // 11. Role toggle – update user profile via API
  // ------------------------------------------------------------
  const handleToggleRole = async () => {
    try {
      const newRole = user.role === 'teacher' ? 'student' : 'teacher';
      const res = await apiClient.patch('/user/role', { role: newRole });
      // Update user in context – we need to refresh user data
      // For simplicity, we'll refetch user profile (via a new API call)
      // Alternatively, we can update local user state if AuthContext provides setUser
      // but we can also just fetch updated user from /user/me
      const userRes = await apiClient.get('/user');
      // We'll assume AuthContext has a method to update user.
      // For now, we'll reload the page or use a custom event.
      window.location.reload(); // quick hack – better to use setUser from context
    } catch (err) {
      console.error('Toggle role error:', err);
      addToast('Could not switch roles right now.', 'error');
    }
  };

  // ------------------------------------------------------------
  // 12. Render with React Router
  // ------------------------------------------------------------
  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar
        user={user}
        activeClass={selectedClass}
        onNavigateHome={() => navigate('/')}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenCreateModal={() => setShowCreateModal(true)}
        onOpenJoinModal={() => setShowJoinModal(true)}
        onToggleRole={handleToggleRole}
        onUpdateUser={(updated) => { /* update user in context if needed */ }}
        onLogout={logout}
      />

      <div className="d-flex flex-grow-1 position-relative">
        <Sidebar
          isOpen={sidebarOpen}
          classes={classes}
          user={user}
          onNavigatePage={handleNavigatePage}
          onSelectClass={handleSelectClass}
        />

        <main className={`gc-main-content w-100 ${sidebarOpen ? 'sidebar-open' : ''}`}>
          {loadingClasses ? (
            <div className="text-center mt-5">Loading classes…</div>
          ) : (
            <Routes>
              <Route 
                path="/" 
                element={
                  <ClassesPage
                    classes={classes}
                    user={user}
                    onSelectClass={handleSelectClass}
                    onArchiveClass={handleArchiveClass}
                    onUnenrollClass={handleUnenrollClass}
                    onOpenCreateModal={() => setShowCreateModal(true)}
                    onOpenJoinModal={() => setShowJoinModal(true)}
                    onOpenClasswork={(cId) => handleSelectClass(cId)}
                    onRefreshClasses={fetchClasses}
                  />
                }
              />
              
              <Route 
                path="/class/:classId" 
                element={
                  activeClassLoading ? (
                    <div className="text-center mt-5">Loading class details…</div>
                  ) : selectedClass ? (
                    <ClassDetailPage
                      cls={selectedClass}
                      user={user}
                      onPostAnnouncement={handlePostAnnouncement}
                      onAddComment={handleAddComment}
                      onCreateCoursework={handleCreateCoursework}
                      onSubmitCoursework={handleSubmitCoursework}
                      onUpdateGrade={handleUpdateGrade}
                      onUpdateClassBanner={handleUpdateClassBanner}
                      onDiscussionCreated={handleDiscussionCreated}
                    />
                  ) : (
                    <div className="text-center mt-5">Class not found.</div>
                  )
                }
              />

              <Route 
                path="/calendar" 
                element={
                  <CalendarPage
                    classes={classes}
                    onSelectClass={handleSelectClass}
                  />
                }
              />

              <Route 
                path="/todo" 
                element={
                  <ToDoPage
                    classes={classes}
                    user={user}
                    onSelectClass={handleSelectClass}
                  />
                }
              />

              <Route 
                path="/archived" 
                element={
                  <ArchivedPage
                    classes={classes}
                    user={user}
                    onRestoreClass={handleRestoreClass}
                    onDeleteClass={handleDeleteClass}
                  />
                }
              />

              <Route 
                path="/settings" 
                element={
                  <SettingsPage
                    user={user}
                    classes={classes}
                    onUpdateUser={(updated) => { /* update user context */ }}
                    onToggleRole={handleToggleRole}
                  />
                }
              />
            </Routes>
          )}
        </main>
      </div>

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

      <ToastContainer />
    </div>
  );
};

export default App;