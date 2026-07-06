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
  const { user, login, logout, loading, updateUser } = useAuth();
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
      if (cwData?.type === 'assignment') {
        const formData = cwData?.data instanceof FormData ? cwData.data : null;
        if (!formData) throw new Error('Assignment payload is missing');

        const res = await apiClient.post('/create/assignments', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const newAssignment = res.data?.data;

        setClasses(prev =>
          prev.map(c =>
            c.id === classId
              ? { ...c, classwork: [newAssignment, ...(c.classwork || [])] }
              : c
          )
        );
        setSelectedClass(prev =>
          prev?.id === classId
            ? { ...prev, classwork: [newAssignment, ...(prev.classwork || [])] }
            : prev
        );
        await fetchClasses();
        addToast('Assignment created.', 'success');
        return true;
      }

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
      return true;
    } catch (err) {
      console.error('Create coursework error:', err);
      addToast('Could not create the coursework.', 'error');
      return false;
    }
  };

  const handleSubmitCoursework = async (classId, courseworkId, files = []) => {
    try {
      if (files.length > 0) {
        const formData = new FormData();
        formData.append('class_id', classId);
        formData.append('assignment_id', courseworkId);
        files.forEach((file, index) => {
          if (file instanceof File) {
            formData.append(`attachments[${index}]`, file);
          }
        });

        await apiClient.post(`/assignments/${courseworkId}/submit`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await apiClient.post(`/assignments/${courseworkId}/submit`);
      }

      const markSubmitted = (items = []) =>
        items.map((item) => (item.id === courseworkId ? {
          ...item,
          submitted: true,
          userSubmitted: true,
          userSubmission: { status: 'submitted' },
          status: 'submitted'
        } : item));

      setSelectedClass((prev) =>
        prev?.id === classId
          ? {
              ...prev,
              classwork: markSubmitted(prev.classwork || []),
              assignments: markSubmitted(prev.assignments || []),
              submissionVersion: Date.now()
            }
          : prev
      );

      setClasses((prev) =>
        prev.map((clsItem) =>
          clsItem.id === classId
            ? {
                ...clsItem,
                classwork: markSubmitted(clsItem.classwork || []),
                assignments: markSubmitted(clsItem.assignments || []),
                submissionVersion: Date.now()
              }
            : clsItem
        )
      );

      await fetchClasses();
      addToast('Submission turned in.', 'success');
      return true;
    } catch (err) {
      console.error('Submit coursework error:', err);
      addToast('Could not submit the coursework.', 'error');
      return false;
    }
  };

  const handleUpdateGrade = async (classId, studentId, cwId, newScore) => {
    try {
      // Try to find the submission ID for this student & coursework
      const classObj = classes.find(c => c.id === classId) || selectedClass;
      const student = classObj?.students?.find(s => s.id === studentId);

      let submissionId = null;
      // Try the detailed assignment route first (note: controller exposes '/assignmments/{id}/details')
      const tryFetchDetails = async (url) => {
        try {
          const res = await apiClient.get(url);
          const data = res.data?.data || res.data;
          const subs = data?.submissions || [];
          if (!subs || !subs.length) return null;
          // attempt to match by student id, student object, or name
          for (const s of subs) {
            if (s.student_id && s.student_id === studentId) return s.id;
            if (s.student && (s.student.id === studentId || s.student_id === studentId)) return s.id;
            const name = student ? `${student.first_name || student.firstName || ''} ${student.last_name || student.lastName || ''}`.trim() : '';
            if (name && (s.student_name === name || String(s.student_name).includes(name) )) return s.id;
          }
        } catch (e) {
          return null;
        }
        return null;
      };

      submissionId = await tryFetchDetails(`/assignmments/${cwId}/details`);
      if (!submissionId) submissionId = await tryFetchDetails(`/assignments/${cwId}`);

      if (submissionId) {
        await apiClient.post(`/submissions/${submissionId}/grade`, { grade: newScore });
        await fetchClasses();
        addToast('Submission graded.', 'success');
        return;
      }

      console.warn('Could not find submission id to grade; falling back to server grade endpoint not available');
      addToast('Could not find the student submission to grade. Try grading from the assignment page.', 'error');
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

  const getUserRoleName = (roleValue) => {
    if (typeof roleValue === 'string') return roleValue;
    if (roleValue?.role_name) return roleValue.role_name;
    if (roleValue?.name) return roleValue.name;
    return 'student';
  };

  const getRoleIdForName = (roleName) => {
    switch ((roleName || '').toLowerCase()) {
      case 'teacher':
        return 2;
      case 'student':
        return 3;
      default:
        return null;
    }
  };

  // ------------------------------------------------------------
  // 11. Role toggle – update user profile via API
  // ------------------------------------------------------------
  const handleToggleRole = async () => {
    if (!user?.id) {
      addToast('You need to be signed in to change your role.', 'error');
      return;
    }

    const currentRole = getUserRoleName(user?.role);
    const newRole = currentRole === 'teacher' ? 'student' : 'teacher';
    const roleId = getRoleIdForName(newRole);

    if (!roleId) {
      addToast('Unable to determine the selected role.', 'error');
      return;
    }

    try {
      const res = await apiClient.post(`/update/users/${user.id}`, {
        role_id: roleId,
        role: newRole,
      });

      const updatedUser = {
        ...user,
        ...(res?.data?.data || {}),
        role: newRole,
        role_id: roleId,
      };

      updateUser(updatedUser);
      addToast('Your role was updated successfully.', 'success');
    } catch (err) {
      console.error('Toggle role error:', err);
      addToast('Could not switch roles right now.', 'error');
    }
  };

  // ------------------------------------------------------------
  // 12. Render with React Router
  // ------------------------------------------------------------

    // Helper: Build grade matrix from a class's grades array
  // Matrix format: { [studentId]: { [courseworkId]: score } }
  const buildGradeMatrix = (cls) => {
    const matrix = {};
    if (!cls || !cls.students) return matrix;
    cls.students.forEach(st => {
      matrix[st.id] = {};
    });
    if (cls.grades) {
      cls.grades.forEach(g => {
        const { studentId, ...scores } = g;
        matrix[studentId] = { ...(matrix[studentId] || {}), ...scores };
      });
    }
    return matrix;
  };
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