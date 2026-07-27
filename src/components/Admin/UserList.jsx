import React from 'react';

const UserList = ({
  users,
  loading,
  onApprove,
  onReject,
  onBlock,
  onUnblock,
  showActions = true,
  emptyMessage = 'No users found',
}) => {
  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <i className="bi bi-inbox fs-3 d-block mb-2"></i>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const getStatusBadge = (user) => {
    if (user.is_blocked) {
      return (
        <span className="badge bg-danger">
          <i className="bi bi-shield-lock me-1"></i>
          Blocked
        </span>
      );
    }

    switch (user.approval_status) {
      case 'Approved':
        return (
          <span className="badge bg-success">
            <i className="bi bi-check-circle me-1"></i>
            Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="badge bg-secondary">
            <i className="bi bi-x-circle me-1"></i>
            Rejected
          </span>
        );
      case 'Pending':
        return (
          <span className="badge bg-warning text-dark">
            <i className="bi bi-clock me-1"></i>
            Pending
          </span>
        );
      default:
        return (
          <span className="badge bg-secondary">
            {user.approval_status}
          </span>
        );
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'primary',
      teacher: 'info',
      student: 'success',
      parent: 'warning',
    };
    return colors[role?.role_name?.toLowerCase()] || 'secondary';
  };

  return (
    <div className="table-responsive">
      <table className="table mb-0">
        <thead className="table-light">
          <tr>
            <th scope="col">User</th>
            <th scope="col">Role</th>
            <th scope="col">Status</th>
            <th scope="col">Joined</th>
            {showActions && <th scope="col">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: '36px', height: '36px', fontSize: '0.85rem', fontWeight: '600' }}
                  >
                    {user.first_name?.charAt(0).toUpperCase() ||
                      user.email?.charAt(0).toUpperCase() ||
                      'U'}
                  </div>
                  <div>
                    <div className="fw-medium small">
                      {user.first_name} {user.last_name}
                    </div>
                    <small className="text-muted">{user.email}</small>
                  </div>
                </div>
              </td>
              <td>
                <span className={`badge bg-${getRoleColor(user.role)}`}>
                  {user.role?.role_name ? user.role.role_name.charAt(0).toUpperCase() + user.role.role_name.slice(1) : 'No Role'}
                </span>
              </td>
              <td>
                {getStatusBadge(user)}
              </td>
              <td>
                <small className="text-muted">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : 'N/A'}
                </small>
              </td>
              {showActions && (
                <td>
                  <div className="d-flex gap-2 align-items-center">
                    {user.approval_status === 'Pending' && (
                      <>
                        <button
                          className="btn btn-sm btn-success rounded-2"
                          title="Approve"
                          onClick={() => onApprove(user)}
                          style={{ padding: '0.4rem 0.6rem' }}
                        >
                          <i className="bi bi-check-circle"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-danger rounded-2"
                          title="Reject"
                          onClick={() => onReject(user)}
                          style={{ padding: '0.4rem 0.6rem' }}
                        >
                          <i className="bi bi-x-circle"></i>
                        </button>
                      </>
                    )}
                    {user.approval_status === 'Approved' &&
                      !user.is_blocked && (
                        <button
                          className="btn btn-sm btn-danger rounded-2"
                          title="Block"
                          onClick={() => onBlock(user)}
                          style={{ padding: '0.4rem 0.6rem' }}
                        >
                          <i className="bi bi-shield-lock"></i>
                        </button>
                      )}
                    {user.is_blocked && (
                      <button
                        className="btn btn-sm btn-warning rounded-2"
                        title="Unblock"
                        onClick={() => onUnblock(user)}
                        style={{ padding: '0.4rem 0.6rem' }}
                      >
                        <i className="bi bi-shield-check"></i>
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;
