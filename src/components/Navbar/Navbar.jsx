import React, { useState } from 'react';
import Avatar from '../Common/Avatar.jsx';
import AppsDropdown from '../Common/AppsDropdown.jsx';
import ProfileModal from '../Common/ProfileModal.jsx';

const Navbar = ({
  user,
  activeClass,
  onNavigateHome,
  onToggleSidebar,
  onOpenCreateModal,
  onOpenJoinModal,
  onToggleRole,
  onUpdateUser
}) => {
  const [showApps, setShowApps] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);

  return (
    <nav className="navbar navbar-expand bg-white border-bottom fixed-top px-3 py-1" style={{ height: '64px', zIndex: 1045 }}>
      <div className="d-flex align-items-center justify-content-between w-100">
        
        {/* Left Section: Hamburger + Logo + Breadcrumb */}
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn-icon"
            onClick={onToggleSidebar}
            title="Main menu"
            aria-label="Main menu"
          >
            <i className="bi bi-list fs-4"></i>
          </button>

          <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={onNavigateHome}>
            <div className="d-flex align-items-center justify-content-center p-1">
              <svg width="28" height="28" viewBox="0 0 48 48">
                <path fill="#FBC02D" d="M6 8h36c2.2 0 4 1.8 4 4v24c0 2.2-1.8 4-4 4H6c-2.2 0-4-1.8-4-4V12c0-2.2 1.8-4 4-4z"/>
                <path fill="#388E3C" d="M10 12h28v20H10z"/>
                <path fill="#FFF" d="M24 18c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-3.3 0-10 1.7-10 5v2h20v-2c0-3.3-6.7-5-10-5z"/>
              </svg>
            </div>
            <span className="font-google fs-5 mb-0 text-dark">
              <span className="fw-medium">Google</span> <span className="fw-normal text-secondary">Classroom</span>
            </span>
          </div>

          {activeClass && (
            <>
              <i className="bi bi-chevron-right text-muted small"></i>
              <div className="d-flex flex-column" style={{ maxWidth: '280px' }}>
                <span className="fw-bold text-dark text-truncate mb-0" style={{ fontSize: '0.95rem' }}>
                  {activeClass.name}
                </span>
                <span className="text-muted small text-truncate" style={{ fontSize: '0.75rem' }}>
                  {activeClass.section || activeClass.subject}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right Section: + Create/Join, Google Apps, User Avatar */}
        <div className="d-flex align-items-center gap-1 position-relative">
          
          {/* Plus dropdown */}
          <div className="position-relative">
            <button
              className="btn-icon"
              onClick={() => {
                setShowPlusMenu(!showPlusMenu);
                setShowApps(false);
                setShowProfile(false);
              }}
              title="Create or join a class"
              aria-label="Create or join a class"
            >
              <i className="bi bi-plus fs-3"></i>
            </button>

            {showPlusMenu && (
              <div
                className="dropdown-menu show position-absolute py-2 bg-white shadow border"
                style={{ right: 0, top: '48px', minWidth: '180px', zIndex: 1055 }}
              >
                <button
                  className="dropdown-item d-flex align-items-center gap-2 py-2"
                  onClick={() => {
                    setShowPlusMenu(false);
                    onOpenJoinModal();
                  }}
                >
                  <i className="bi bi-box-arrow-in-right text-secondary"></i>
                  Join class
                </button>
                {user.role === 'teacher' && (
                  <button
                    className="dropdown-item d-flex align-items-center gap-2 py-2"
                    onClick={() => {
                      setShowPlusMenu(false);
                      onOpenCreateModal();
                    }}
                  >
                    <i className="bi bi-plus-circle text-secondary"></i>
                    Create class
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Google Apps launcher icon */}
          <button
            className="btn-icon"
            onClick={() => {
              setShowApps(!showApps);
              setShowPlusMenu(false);
              setShowProfile(false);
            }}
            title="Google apps"
          >
            <i className="bi bi-grid-3x3-gap-fill fs-5"></i>
          </button>
          <AppsDropdown show={showApps} onClose={() => setShowApps(false)} />

          {/* User Profile Avatar */}
          <div
            className="ms-2 d-flex align-items-center"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setShowProfile(!showProfile);
              setShowApps(false);
              setShowPlusMenu(false);
            }}
          >
            <Avatar name={user.name} size={36} color={user.color} />
          </div>
          <ProfileModal
            show={showProfile}
            onClose={() => setShowProfile(false)}
            user={user}
            onToggleRole={onToggleRole}
            onUpdateUser={onUpdateUser}
          />

        </div>

      </div>
    </nav>
  );
};

export default Navbar;
