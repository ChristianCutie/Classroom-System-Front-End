# Admin Dashboard - Component Reference Guide

## Quick Start

### 1. View Admin Dashboard
```javascript
// Navigate to /admin route
// Admin link appears in sidebar only for admin users
navigate('/admin');
```

### 2. Import Components (if extending)
```javascript
import AdminPage from '@/pages/Admin/AdminPage';
import UserList from '@/components/Admin/UserList';
import RejectUserModal from '@/components/Admin/RejectUserModal';
import BlockUserModal from '@/components/Admin/BlockUserModal';
```

## Component API Reference

### AdminPage Props
The main component accepts no props - it manages all internal state.

```javascript
<AdminPage />
```

**Internal State:**
- `pendingUsers`: Array of user objects
- `approvedUsers`: Array of user objects
- `rejectedUsers`: Array of user objects
- `blockedUsers`: Array of user objects
- `activeTab`: 'pending' | 'approved' | 'rejected' | 'blocked'
- `selectedUser`: User object selected for modal action
- `isSubmittingAction`: Boolean for loading state

### UserList Props

```javascript
<UserList
  users={users}                           // Required: Array<User>
  loading={loading}                       // Required: Boolean
  onApprove={(user) => {}}               // Required: Function
  onReject={(user) => {}}                // Required: Function
  onBlock={(user) => {}}                 // Required: Function
  onUnblock={(user) => {}}               // Required: Function
  showActions={true}                      // Optional: Boolean (default: true)
  emptyMessage="No users found"          // Optional: String
/>
```

### RejectUserModal Props

```javascript
<RejectUserModal
  show={true}                             // Required: Boolean
  user={selectedUser}                    // Required: User object
  onClose={() => {}}                     // Required: Function
  onSubmit={(reason) => {}}              // Required: Function(reason)
  isLoading={false}                      // Required: Boolean
/>
```

### BlockUserModal Props

```javascript
<BlockUserModal
  show={true}                             // Required: Boolean
  user={selectedUser}                    // Required: User object
  onClose={() => {}}                     // Required: Function
  onSubmit={(reason) => {}}              // Required: Function(reason)
  isLoading={false}                      // Required: Boolean
/>
```

## User Object Structure

```javascript
{
  id: 1,
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  approval_status: "Approved",           // Pending|Approved|Rejected
  is_blocked: 0,                         // 0|1
  is_archived: 0,                        // 0|1
  created_at: "2024-01-15T10:30:00",
  approved_at: "2024-01-16T14:20:00",
  approved_by: 2,
  rejected_at: null,
  rejection_reason: null,
  blocked_at: null,
  blocked_by: null,
  block_reason: null,
  role: {
    id: 3,
    role_name: "student",  // or: teacher, admin, parent
    name: "student"
  }
}
```

## API Function Reference

### adminApi.js Functions

```javascript
// Fetch functions
import { 
  getPendingUsers,     // GET /admin/users/pending
  getApprovedUsers,    // GET /admin/users/approved
  getRejectedUsers,    // GET /admin/users/rejected
  getBlockedUsers      // GET /admin/users/blocked
} from '@/api/adminApi';

// Action functions
import { 
  approveUser,         // PUT /admin/users/{id}/approve
  rejectUser,          // PUT /admin/users/{id}/reject
  blockUser,           // PUT /admin/users/{id}/block
  unblockUser          // PUT /admin/users/{id}/unblock
} from '@/api/adminApi';
```

### Example Usage

```javascript
// Get pending users
const response = await getPendingUsers();
// Response: { success: true, data: [...users] }

// Approve a user
const result = await approveUser(userId);
// Response: { success: true, message: "User approved successfully." }

// Reject user with reason
const result = await rejectUser(userId, "Does not meet requirements");
// Response: { success: true, message: "User rejected successfully." }

// Block user with reason
const result = await blockUser(userId, "Violates community guidelines");
// Response: { success: true, message: "User blocked successfully." }

// Unblock user
const result = await unblockUser(userId);
// Response: { success: true, message: "User unblocked successfully." }
```

## Common Patterns

### 1. Handle Approve Action
```javascript
const handleApproveUser = async (user) => {
  try {
    setIsLoading(true);
    const response = await approveUser(user.id);
    if (response.success) {
      addToast('User approved successfully', 'success');
      // Update UI lists
      setPendingUsers(prev => prev.filter(u => u.id !== user.id));
      setApprovedUsers(prev => [user, ...prev]);
    }
  } catch (error) {
    addToast(error.message || 'Failed to approve user', 'error');
  } finally {
    setIsLoading(false);
  }
};
```

### 2. Handle Reject with Modal
```javascript
const [showRejectModal, setShowRejectModal] = useState(false);
const [selectedUser, setSelectedUser] = useState(null);

const handleRejectClick = (user) => {
  setSelectedUser(user);
  setShowRejectModal(true);
};

const handleSubmitReject = async (reason) => {
  try {
    const response = await rejectUser(selectedUser.id, reason);
    if (response.success) {
      addToast('User rejected successfully', 'success');
      // Update lists...
      setShowRejectModal(false);
    }
  } catch (error) {
    addToast(error.message || 'Failed to reject user', 'error');
  }
};
```

### 3. Refresh User Lists
```javascript
const loadAllUsers = async () => {
  const [pending, approved, rejected, blocked] = await Promise.all([
    getPendingUsers(),
    getApprovedUsers(),
    getRejectedUsers(),
    getBlockedUsers()
  ]);
  
  setPendingUsers(pending.data);
  setApprovedUsers(approved.data);
  setRejectedUsers(rejected.data);
  setBlockedUsers(blocked.data);
};
```

## Event Handlers

### UserList Events

```javascript
// Called when user clicks approve button
onApprove={(user) => {
  // user contains the full user object
  handleApproveUser(user);
}}

// Called when user clicks reject button
onReject={(user) => {
  setSelectedUser(user);
  setShowRejectModal(true);
}}

// Called when user clicks block button
onBlock={(user) => {
  setSelectedUser(user);
  setShowBlockModal(true);
}}

// Called when user clicks unblock button
onUnblock={(user) => {
  handleUnblockUser(user);
}}
```

## Toast Notifications

```javascript
import { useToast } from '@/context/ToastContext';

const { addToast } = useToast();

// Success notification
addToast('User approved successfully', 'success');

// Error notification
addToast('Failed to approve user', 'error');

// Warning notification
addToast('This action cannot be undone', 'warning');

// Info notification
addToast('Users list has been refreshed', 'info');
```

## Styling Classes

```css
/* Main container */
.admin-page

/* Stat cards */
.stat-card
.stat-card-pending
.stat-card-approved
.stat-card-rejected
.stat-card-blocked
.stat-icon
.stat-value
.stat-label

/* Tables */
.table-responsive
.table-light

/* Badges */
.badge (Bootstrap class)

/* Buttons */
.btn-outline-success
.btn-outline-danger
.btn-outline-warning

/* Modals */
.modal
.modal-header
.modal-body
.modal-footer

/* Navigation tabs */
.nav-tabs
.nav-link
```

## Examples

### Example 1: Basic Admin Dashboard Setup
```javascript
import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import AdminPage from '@/pages/Admin/AdminPage';

const AdminSection = () => {
  return <AdminPage />;
};

export default AdminSection;
```

### Example 2: Using UserList Component Standalone
```javascript
import UserList from '@/components/Admin/UserList';
import { getPendingUsers, approveUser } from '@/api/adminApi';

const PendingApprovals = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const response = await getPendingUsers();
    setUsers(response.data);
    setLoading(false);
  };

  const handleApprove = async (user) => {
    await approveUser(user.id);
    setUsers(users.filter(u => u.id !== user.id));
    addToast('User approved', 'success');
  };

  return (
    <UserList
      users={users}
      loading={loading}
      onApprove={handleApprove}
      emptyMessage="No pending users"
    />
  );
};
```

### Example 3: Custom Modal Implementation
```javascript
import RejectUserModal from '@/components/Admin/RejectUserModal';
import { rejectUser } from '@/api/adminApi';

const RejectFlow = () => {
  const [show, setShow] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRejectSubmit = async (reason) => {
    setIsLoading(true);
    await rejectUser(user.id, reason);
    setIsLoading(false);
    setShow(false);
  };

  return (
    <>
      <button onClick={() => setShow(true)}>Reject User</button>
      <RejectUserModal
        show={show}
        user={user}
        onClose={() => setShow(false)}
        onSubmit={handleRejectSubmit}
        isLoading={isLoading}
      />
    </>
  );
};
```

## Debugging Tips

### Check User List State
```javascript
// In browser console while on admin page
console.log(document.__react);  // View React component state
```

### Verify API Responses
```javascript
// In network tab of DevTools
// Check XHR requests to /admin/users/* endpoints
// Verify response status and data structure
```

### Test API Functions Directly
```javascript
// In browser console
import { getPendingUsers } from './api/adminApi';
getPendingUsers().then(res => console.log(res));
```

### Check Authentication
```javascript
// In localStorage
localStorage.getItem('auth_token')    // Should have JWT token
localStorage.getItem('auth_user')     // Should have user object with role
```

## CSS Customization

### Override Stat Card Colors
```css
.stat-card-pending {
  border-left-color: #your-color;
}

.stat-card-pending .stat-icon {
  background-color: #your-bg-color;
  color: #your-text-color;
}
```

### Customize Modal Styling
```css
.modal-header {
  background-color: #your-color;
}

.modal-title {
  color: #your-color;
}
```

### Adjust Table Layout
```css
.table-light th {
  background-color: #your-color;
}

.table tbody tr:hover {
  background-color: #your-color;
}
```

## Performance Tips

1. **Use React DevTools Profiler** to identify slow renders
2. **Memoize expensive computations** with useMemo
3. **Debounce refresh button** to prevent rapid API calls
4. **Lazy load modal components** if using many modals
5. **Use key prop correctly** in list rendering

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Admin link not visible | Check user role in localStorage auth_user |
| API requests failing | Verify VITE_API_URL environment variable |
| Styling looks broken | Clear browser cache and rebuild |
| State not updating | Check useEffect dependencies and key props |
| Buttons not responding | Check isLoading state prevents double-clicks |

