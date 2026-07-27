import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  getPendingUsers,
  getApprovedUsers,
  getRejectedUsers,
  getBlockedUsers,
  approveUser,
  rejectUser,
  blockUser,
  unblockUser,
} from '@/api/adminApi';
import UserList from '@/components/Admin/UserList';
import RejectUserModal from '@/components/Admin/RejectUserModal';
import BlockUserModal from '@/components/Admin/BlockUserModal';
import '../../pages/Admin/AdminPage.css';

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  // Check if user is admin, redirect if not
  useEffect(() => {
    if (user && user.role?.role_name !== 'admin') {
      navigate('/');
      addToast('Access denied. Admin only.', 'error');
    }
  }, [user, navigate, addToast]);

  // State for users
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [rejectedUsers, setRejectedUsers] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);

  // Loading states
  const [loadingPending, setLoadingPending] = useState(false);
  const [loadingApproved, setLoadingApproved] = useState(false);
  const [loadingRejected, setLoadingRejected] = useState(false);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState('pending');

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Load users only if user is admin
  useEffect(() => {
    if (user?.role?.role_name === 'admin') {
      loadAllUsers();
    }
  }, [user]);

  const loadAllUsers = async () => {
    await Promise.all([
      loadPendingUsers(),
      loadApprovedUsers(),
      loadRejectedUsers(),
      loadBlockedUsers(),
    ]);
  };

  const loadPendingUsers = async () => {
    try {
      setLoadingPending(true);
      const response = await getPendingUsers();
      if (response.success) {
        setPendingUsers(response.data);
      }
    } catch (error) {
      addToast('Failed to load pending users', 'error');
    } finally {
      setLoadingPending(false);
    }
  };

  const loadApprovedUsers = async () => {
    try {
      setLoadingApproved(true);
      const response = await getApprovedUsers();
      if (response.success) {
        setApprovedUsers(response.data);
      }
    } catch (error) {
      addToast('Failed to load approved users', 'error');
    } finally {
      setLoadingApproved(false);
    }
  };

  const loadRejectedUsers = async () => {
    try {
      setLoadingRejected(true);
      const response = await getRejectedUsers();
      if (response.success) {
        setRejectedUsers(response.data);
      }
    } catch (error) {
      addToast('Failed to load rejected users', 'error');
    } finally {
      setLoadingRejected(false);
    }
  };

  const loadBlockedUsers = async () => {
    try {
      setLoadingBlocked(true);
      const response = await getBlockedUsers();
      if (response.success) {
        setBlockedUsers(response.data);
      }
    } catch (error) {
      addToast('Failed to load blocked users', 'error');
    } finally {
      setLoadingBlocked(false);
    }
  };

  // Handle approve user
  const handleApproveUser = async (user) => {
    try {
      setIsSubmittingAction(true);
      const response = await approveUser(user.id);
      if (response.success) {
        addToast('User approved successfully', 'success');
        // Remove from pending and add to approved
        setPendingUsers(pendingUsers.filter((u) => u.id !== user.id));
        setApprovedUsers([{ ...user, approval_status: 'Approved' }, ...approvedUsers]);
      }
    } catch (error) {
      const message = error.message || 'Failed to approve user';
      addToast(message, 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle reject user
  const handleRejectUser = (user) => {
    setSelectedUser(user);
    setShowRejectModal(true);
  };

  const submitRejectUser = async (reason) => {
    try {
      setIsSubmittingAction(true);
      const response = await rejectUser(selectedUser.id, reason);
      if (response.success) {
        addToast('User rejected successfully', 'success');
        // Remove from pending and add to rejected
        setPendingUsers(
          pendingUsers.filter((u) => u.id !== selectedUser.id)
        );
        setRejectedUsers([{ ...selectedUser, approval_status: 'Rejected' }, ...rejectedUsers]);
        setShowRejectModal(false);
        setSelectedUser(null);
      }
    } catch (error) {
      const message = error.message || 'Failed to reject user';
      addToast(message, 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle block user
  const handleBlockUser = (user) => {
    setSelectedUser(user);
    setShowBlockModal(true);
  };

  const submitBlockUser = async (reason) => {
    try {
      setIsSubmittingAction(true);
      const response = await blockUser(selectedUser.id, reason);
      if (response.success) {
        addToast('User blocked successfully', 'success');
        // Remove from approved and add to blocked
        setApprovedUsers(
          approvedUsers.filter((u) => u.id !== selectedUser.id)
        );
        setBlockedUsers([
          { ...selectedUser, is_blocked: true, approval_status: 'Approved' },
          ...blockedUsers,
        ]);
        setShowBlockModal(false);
        setSelectedUser(null);
      }
    } catch (error) {
      const message = error.message || 'Failed to block user';
      addToast(message, 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle unblock user
  const handleUnblockUser = async (user) => {
    try {
      setIsSubmittingAction(true);
      const response = await unblockUser(user.id);
      if (response.success) {
        addToast('User unblocked successfully', 'success');
        // Remove from blocked and add to approved
        setBlockedUsers(blockedUsers.filter((u) => u.id !== user.id));
        setApprovedUsers([{ ...user, is_blocked: false, approval_status: 'Approved' }, ...approvedUsers]);
      }
    } catch (error) {
      const message = error.message || 'Failed to unblock user';
      addToast(message, 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const getTabBadgeCount = (tab) => {
    const counts = {
      pending: pendingUsers.length,
      approved: approvedUsers.length,
      rejected: rejectedUsers.length,
      blocked: blockedUsers.length,
    };
    return counts[tab] || 0;
  };

  // Only render admin page if user is admin
  if (!user || user.role?.role_name !== 'admin') {
    return null;
  }

  return (
    <div className="container-fluid px-2 px-md-4 py-3">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
        <div>
          <h3 className="fw-bold text-dark mb-1">
            <i className="bi bi-shield-check me-2"></i>User Management
          </h3>
          <p className="text-muted small mb-0">
            Manage user approvals, rejections, and blocks
          </p>
        </div>
        <button
          className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-medium"
          onClick={loadAllUsers}
          disabled={
            loadingPending ||
            loadingApproved ||
            loadingRejected ||
            loadingBlocked
          }
        >
          <i className="bi bi-arrow-clockwise me-1"></i>
          Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="card border shadow-sm rounded-3 h-100">
            <div className="card-body p-3 d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '56px', height: '56px', backgroundColor: '#fff3cd' }}
              >
                <i className="bi bi-clock-history text-warning fs-5"></i>
              </div>
              <div>
                <div className="text-muted small fw-medium mb-1">Pending</div>
                <div className="fw-bold text-dark fs-5">{pendingUsers.length}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card border shadow-sm rounded-3 h-100">
            <div className="card-body p-3 d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '56px', height: '56px', backgroundColor: '#d4edda' }}
              >
                <i className="bi bi-check-circle-fill text-success fs-5"></i>
              </div>
              <div>
                <div className="text-muted small fw-medium mb-1">Approved</div>
                <div className="fw-bold text-dark fs-5">{approvedUsers.length}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card border shadow-sm rounded-3 h-100">
            <div className="card-body p-3 d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '56px', height: '56px', backgroundColor: '#e2e3e5' }}
              >
                <i className="bi bi-x-circle-fill text-secondary fs-5"></i>
              </div>
              <div>
                <div className="text-muted small fw-medium mb-1">Rejected</div>
                <div className="fw-bold text-dark fs-5">{rejectedUsers.length}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card border shadow-sm rounded-3 h-100">
            <div className="card-body p-3 d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '56px', height: '56px', backgroundColor: '#f8d7da' }}
              >
                <i className="bi bi-shield-lock-fill text-danger fs-5"></i>
              </div>
              <div>
                <div className="text-muted small fw-medium mb-1">Blocked</div>
                <div className="fw-bold text-dark fs-5">{blockedUsers.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Card */}
      <div className="card border shadow-sm rounded-3">
        <div className="card-body p-0">
          {/* Tab Navigation */}
          <ul className="nav nav-tabs border-bottom" role="tablist" style={{ paddingLeft: '1.5rem', paddingTop: '1rem' }}>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'pending' ? 'active fw-bold' : 'text-muted'}`}
                onClick={() => setActiveTab('pending')}
                type="button"
                role="tab"
              >
                <i className="bi bi-clock-history me-2"></i>
                Pending
                <span className="badge bg-warning text-dark ms-2 small">
                  {getTabBadgeCount('pending')}
                </span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'approved' ? 'active fw-bold' : 'text-muted'}`}
                onClick={() => setActiveTab('approved')}
                type="button"
                role="tab"
              >
                <i className="bi bi-check-circle me-2"></i>
                Approved
                <span className="badge bg-success ms-2 small">
                  {getTabBadgeCount('approved')}
                </span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'rejected' ? 'active fw-bold' : 'text-muted'}`}
                onClick={() => setActiveTab('rejected')}
                type="button"
                role="tab"
              >
                <i className="bi bi-x-circle me-2"></i>
                Rejected
                <span className="badge bg-secondary ms-2 small">
                  {getTabBadgeCount('rejected')}
                </span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'blocked' ? 'active fw-bold' : 'text-muted'}`}
                onClick={() => setActiveTab('blocked')}
                type="button"
                role="tab"
              >
                <i className="bi bi-shield-lock me-2"></i>
                Blocked
                <span className="badge bg-danger ms-2 small">
                  {getTabBadgeCount('blocked')}
                </span>
              </button>
            </li>
          </ul>

          {/* Tab Content */}
          <div className="p-4">
              {activeTab === 'pending' && (
                <UserList
                  users={pendingUsers}
                  loading={loadingPending}
                  onApprove={handleApproveUser}
                  onReject={handleRejectUser}
                  onBlock={handleBlockUser}
                  onUnblock={handleUnblockUser}
                  emptyMessage="No pending users"
                />
              )}
              {activeTab === 'approved' && (
                <UserList
                  users={approvedUsers}
                  loading={loadingApproved}
                  onApprove={handleApproveUser}
                  onReject={handleRejectUser}
                  onBlock={handleBlockUser}
                  onUnblock={handleUnblockUser}
                  emptyMessage="No approved users"
                />
              )}
              {activeTab === 'rejected' && (
                <UserList
                  users={rejectedUsers}
                  loading={loadingRejected}
                  onApprove={handleApproveUser}
                  onReject={handleRejectUser}
                  onBlock={handleBlockUser}
                  onUnblock={handleUnblockUser}
                  emptyMessage="No rejected users"
                />
              )}
              {activeTab === 'blocked' && (
                <UserList
                  users={blockedUsers}
                  loading={loadingBlocked}
                  onApprove={handleApproveUser}
                  onReject={handleRejectUser}
                  onBlock={handleBlockUser}
                  onUnblock={handleUnblockUser}
                  emptyMessage="No blocked users"
                />
              )}
            </div>
          </div>
        </div>

      {/* Modals */}
      <RejectUserModal
        show={showRejectModal}
        user={selectedUser}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedUser(null);
        }}
        onSubmit={submitRejectUser}
        isLoading={isSubmittingAction}
      />
      <BlockUserModal
        show={showBlockModal}
        user={selectedUser}
        onClose={() => {
          setShowBlockModal(false);
          setSelectedUser(null);
        }}
        onSubmit={submitBlockUser}
        isLoading={isSubmittingAction}
      />
    </div>
  );
};

export default AdminPage;
