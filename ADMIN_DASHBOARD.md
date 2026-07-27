# Admin Dashboard Documentation

## Overview
The Admin Dashboard is a comprehensive user management interface that allows administrators to manage user approvals, rejections, and blocks within the system.

## Features

### 1. User Management Tabs
- **Pending**: View and manage users awaiting approval
- **Approved**: View all approved users and manage their status
- **Rejected**: View rejected users
- **Blocked**: View and manage blocked users

### 2. User Actions
- **Approve**: Accept pending users into the system
- **Reject**: Reject users with optional reason
- **Block**: Block approved users with optional reason
- **Unblock**: Restore access to blocked users

### 3. Statistics Dashboard
- Real-time count of users in each status
- Color-coded stat cards for quick overview
- Quick navigation between tabs

### 4. User Information Display
Each user table shows:
- User avatar with initials
- Full name and email
- Role badge (Admin, Teacher, Student, Parent)
- Current status (Approved, Rejected, Pending, Blocked)
- Join date

## File Structure

```
src/
├── api/
│   └── adminApi.js                    # API functions for admin endpoints
├── components/Admin/
│   ├── UserList.jsx                   # User table display component
│   ├── RejectUserModal.jsx            # Modal for rejecting users
│   └── BlockUserModal.jsx             # Modal for blocking users
└── pages/Admin/
    ├── AdminPage.jsx                  # Main admin dashboard page
    └── AdminPage.css                  # Admin dashboard styles
```

## API Integration

### Endpoints Used
- `GET /admin/users` - Get all users with filters
- `GET /admin/users/pending` - Get pending users
- `GET /admin/users/approved` - Get approved users
- `GET /admin/users/rejected` - Get rejected users
- `GET /admin/users/blocked` - Get blocked users
- `PUT /admin/users/{id}/approve` - Approve a user
- `PUT /admin/users/{id}/reject` - Reject a user (with optional reason)
- `PUT /admin/users/{id}/block` - Block a user (with optional reason)
- `PUT /admin/users/{id}/unblock` - Unblock a user

## Component Details

### AdminPage.jsx
Main dashboard component that:
- Manages all user lists state
- Handles user actions (approve, reject, block, unblock)
- Displays statistics and tabs
- Manages modal visibility and selected user data
- Provides refresh functionality

**Key State:**
```javascript
- pendingUsers[]
- approvedUsers[]
- rejectedUsers[]
- blockedUsers[]
- activeTab (pending|approved|rejected|blocked)
- selectedUser
- isSubmittingAction
```

### UserList.jsx
Displays users in a responsive table with:
- User information (avatar, name, email)
- Role badge with color coding
- Status badge with icons
- Action buttons based on user status
- Loading and empty states

**Props:**
```javascript
{
  users,                    // Array of user objects
  loading,                  // Boolean loading state
  onApprove,               // Approve handler
  onReject,                // Reject handler
  onBlock,                 // Block handler
  onUnblock,               // Unblock handler
  showActions,             // Boolean to show action buttons
  emptyMessage             // Custom empty state message
}
```

### RejectUserModal.jsx
Modal dialog for rejecting users with:
- Confirmation message
- Optional reason textarea (1000 char limit)
- Character counter
- Submit and cancel buttons
- Loading state

### BlockUserModal.jsx
Modal dialog for blocking users with:
- Confirmation message with warning alert
- Optional reason textarea (1000 char limit)
- Character counter
- Submit and cancel buttons
- Loading state

## Styling

### Theme Integration
- Uses CSS variables from main app (--gc-*)
- Responsive design with mobile support
- Bootstrap grid and components
- Smooth animations and transitions

### Color Scheme
- **Pending**: Warning (yellow/gold)
- **Approved**: Success (green)
- **Rejected**: Secondary (gray)
- **Blocked**: Danger (red)

## Usage

### Accessing the Admin Panel
1. Login as an admin user
2. Look for "Admin" link in the sidebar (only visible to admins)
3. Click to navigate to the admin dashboard

### Approving Users
1. Navigate to "Pending" tab
2. Locate the user to approve
3. Click the green checkmark button
4. User will move to "Approved" tab

### Rejecting Users
1. Navigate to "Pending" tab
2. Click the red X button
3. Enter optional reason in modal
4. Click "Reject User"
5. User will move to "Rejected" tab

### Blocking Users
1. Navigate to "Approved" tab
2. Click the shield lock button
3. Enter optional reason in modal
4. Click "Block User"
5. User will move to "Blocked" tab

### Unblocking Users
1. Navigate to "Blocked" tab
2. Click the shield check button
3. User will move back to "Approved" tab

### Refreshing Data
- Click the "Refresh" button in tab navigation
- All user lists will reload from the server

## Integration with Existing Components

### Sidebar Integration
- Admin link appears in main navigation sidebar
- Only visible to users with admin role
- Uses same navigation pattern as other pages

### Toast Notifications
- Success/error messages via ToastContext
- Automatic notification on user actions
- User-friendly feedback for all operations

### Authentication
- Protected by JWT token stored in localStorage
- Token automatically included in all API requests
- Inherits auth state from AuthContext

## Error Handling

The component handles various error scenarios:
- Failed API requests display error toast
- Network errors are caught and reported
- User actions gracefully handle failures
- Loading states prevent double submissions

## Performance Considerations

- Modals are conditionally rendered (not always in DOM)
- User lists use standard React keys for efficient rendering
- Pagination ready (current implementation shows all users)
- Future optimization: implement virtual scrolling for large lists

## Future Enhancements

1. **Pagination/Infinite Scroll** - Handle large user lists efficiently
2. **Search/Filter** - Find users by name, email, or role
3. **Bulk Actions** - Approve/reject/block multiple users at once
4. **User Details** - View full user profile and activity history
5. **Audit Log** - Track all admin actions
6. **Custom Reasons** - Predefined rejection/block reasons templates
7. **Export** - Export user lists to CSV/PDF
8. **Analytics** - Charts showing approval rates and trends

## Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Dependencies
- React 18+
- Bootstrap 5
- Bootstrap Icons
- Axios (for API calls)

## Notes
- All timestamps are displayed in local timezone
- User initials use first character of first name or email
- Role colors are predefined based on role type
- Modal animations use CSS transitions for smoothness
