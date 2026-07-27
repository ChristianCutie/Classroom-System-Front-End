# Admin Dashboard - Visual Guide & Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      User Flow                              │
└─────────────────────────────────────────────────────────────┘

    Login as Admin User
           │
           ▼
    ┌──────────────────┐
    │  Authenticated?  │
    └──────────────────┘
           │
      YES  │
           ▼
    ┌──────────────────────┐
    │  Can see Admin link  │
    │   in Sidebar?        │
    └──────────────────────┘
           │
      YES  │
           ▼
    ┌──────────────────────┐
    │  Click Admin Link    │
    │  Navigate to /admin  │
    └──────────────────────┘
           │
           ▼
    ┌──────────────────────┐
    │  AdminPage Loads     │
    │  - Load all 4 lists  │
    │  - Show stats        │
    │  - Display tabs      │
    └──────────────────────┘
           │
           ├─────────────────────────────────────────┐
           │                                         │
           ▼                                         ▼
    ┌─────────────────┐                     ┌──────────────┐
    │  User Actions   │                     │  View Stats  │
    │  - Approve      │                     │  - Pending   │
    │  - Reject       │                     │  - Approved  │
    │  - Block        │                     │  - Rejected  │
    │  - Unblock      │                     │  - Blocked   │
    └─────────────────┘                     └──────────────┘
           │
           ▼
    ┌─────────────────────┐
    │  Make API Request   │
    │  (with JWT token)   │
    └─────────────────────┘
           │
           ▼
    ┌─────────────────────┐
    │  Backend Validates  │
    │  - Check role       │
    │  - Check permission │
    └─────────────────────┘
           │
      ┌────┴────┐
      │          │
   SUCCESS    ERROR
      │          │
      ▼          ▼
   Update     Show Error
   UI List    Toast
```

## Component Hierarchy

```
App
├── Navbar
├── Sidebar
│   └── Admin Link (if admin)
└── Routes
    └── /admin
        └── AdminPage
            ├── StatCard (x4)
            │   ├── Pending (yellow)
            │   ├── Approved (green)
            │   ├── Rejected (gray)
            │   └── Blocked (red)
            │
            ├── TabNavigation
            │   ├── Pending Tab (count: 5)
            │   ├── Approved Tab (count: 12)
            │   ├── Rejected Tab (count: 2)
            │   ├── Blocked Tab (count: 1)
            │   └── Refresh Button
            │
            ├── TabContent
            │   └── UserList
            │       ├── Table Header
            │       ├── Table Body
            │       │   └── TableRow (x many)
            │       │       ├── Avatar
            │       │       ├── Name & Email
            │       │       ├── Role Badge
            │       │       ├── Status Badge
            │       │       ├── Date
            │       │       └── Action Buttons
            │       └── Empty State (if no users)
            │
            ├── RejectUserModal
            │   ├── Header
            │   ├── Body
            │   │   ├── Confirmation Text
            │   │   └── Reason TextArea
            │   └── Footer
            │       ├── Cancel Button
            │       └── Reject Button
            │
            ├── BlockUserModal
            │   ├── Header
            │   ├── Body
            │   │   ├── Confirmation Text
            │   │   ├── Warning Alert
            │   │   └── Reason TextArea
            │   └── Footer
            │       ├── Cancel Button
            │       └── Block Button
            │
            └── UnblockConfirmModal
                ├── Header
                ├── Body
                │   ├── Confirmation Text
                │   └── Info Alert
                └── Footer
                    ├── Cancel Button
                    └── Unblock Button
```

## Data Flow Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                     AdminPage State                           │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  const [pendingUsers, setPendingUsers] = useState([])        │
│  const [approvedUsers, setApprovedUsers] = useState([])      │
│  const [rejectedUsers, setRejectedUsers] = useState([])      │
│  const [blockedUsers, setBlockedUsers] = useState([])        │
│  const [activeTab, setActiveTab] = useState('pending')       │
│  const [selectedUser, setSelectedUser] = useState(null)      │
│  const [showRejectModal, setShowRejectModal] = useState()    │
│  const [showBlockModal, setShowBlockModal] = useState()      │
│  const [isSubmittingAction, setIsSubmittingAction] = false   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
        │
        ├─────────────────────────────────────────┐
        │                                         │
        ▼                                         ▼
   API Calls                              User Interactions
   
   getPendingUsers()                   Click Approve Button
        │                                      │
        ▼                                      ▼
   setPendingUsers()                  handleApproveUser()
        │                                      │
        ├─── [User1, User2, ...]              ├─ approveUser(id)
        │                                      │      │
        │                                      └──→ API Request
        │                                              │
   getApprovedUsers()                                 ▼
        │                          API Response: {success: true}
        ▼                                      │
   setApprovedUsers()                         ├─ Update UI lists
        │                                      │   - Remove from pending
        └─── [User1, ...]                      │   - Add to approved
                                              │
                                              ▼
                                         Show Toast: "Success"
```

## User Action Workflow

### Approve Flow
```
Admin clicks ✓ button
        │
        ▼
handleApproveUser(user)
        │
        ├─ Set isSubmitting = true
        │
        ├─ Call: approveUser(user.id)
        │       │
        │       └─ POST /admin/users/{id}/approve
        │
        └─ Response received
            │
            ├─ Update state:
            │   - Remove from pending
            │   - Add to approved
            │   - Update badge count
            │
            ├─ Show success toast
            │
            └─ Set isSubmitting = false
```

### Reject Flow
```
Admin clicks ✗ button
        │
        ▼
handleRejectUser(user)
        │
        ├─ Set selectedUser
        │
        └─ Show RejectUserModal
            │
            └─ User enters reason (optional)
                │
                ├─ Click Cancel
                │   └─ Close modal, reset state
                │
                └─ Click "Reject User"
                    │
                    ├─ Set isSubmitting = true
                    │
                    ├─ Call: rejectUser(user.id, reason)
                    │       │
                    │       └─ PUT /admin/users/{id}/reject
                    │
                    └─ Response received
                        │
                        ├─ Update state:
                        │   - Remove from pending
                        │   - Add to rejected
                        │   - Update badge count
                        │
                        ├─ Close modal
                        │
                        ├─ Show success toast
                        │
                        └─ Set isSubmitting = false
```

### Block Flow
```
Admin clicks shield-lock button
        │
        ▼
handleBlockUser(user)
        │
        ├─ Set selectedUser
        │
        └─ Show BlockUserModal
            │
            └─ User enters reason (optional)
                │
                ├─ Click Cancel
                │   └─ Close modal, reset state
                │
                └─ Click "Block User"
                    │
                    ├─ Set isSubmitting = true
                    │
                    ├─ Call: blockUser(user.id, reason)
                    │       │
                    │       └─ PUT /admin/users/{id}/block
                    │
                    └─ Response received
                        │
                        ├─ Update state:
                        │   - Remove from approved
                        │   - Add to blocked
                        │   - Update badge count
                        │
                        ├─ Close modal
                        │
                        ├─ Show success toast
                        │
                        └─ Set isSubmitting = false
```

### Unblock Flow
```
Admin clicks shield-check button
        │
        ▼
handleUnblockUser(user)
        │
        ├─ Set isSubmitting = true
        │
        ├─ Call: unblockUser(user.id)
        │       │
        │       └─ PUT /admin/users/{id}/unblock
        │
        └─ Response received
            │
            ├─ Update state:
            │   - Remove from blocked
            │   - Add to approved
            │   - Update badge count
            │
            ├─ Show success toast
            │
            └─ Set isSubmitting = false
```

## API Call Sequence

```
┌──────────────┐
│ Browser/App  │
└──────────────┘
       │
       │ 1. GET /admin/users/pending
       │    Header: Authorization: Bearer {token}
       ▼
┌──────────────────┐
│ Backend API      │
│ (Laravel)        │
└──────────────────┘
       │
       │ 2. Validate JWT token
       │    3. Check user role = 'admin'
       │    4. Query pending users
       │
       ▼
┌──────────────────┐
│ Database         │
│ (Users table)    │
└──────────────────┘
       │
       │ 5. Return users where approval_status='Pending'
       │
       ▼
┌──────────────────┐
│ JSON Response    │
│ 200 OK           │
└──────────────────┘
       │
       │ {
       │   success: true,
       │   data: [
       │     {id, first_name, email, role, ...},
       │     ...
       │   ]
       │ }
       │
       ▼
┌──────────────────┐
│ React Component  │
│ AdminPage        │
└──────────────────┘
       │
       └─ setPendingUsers(data)
           │
           └─ Re-render with new data
```

## CSS Layout Structure

```
AdminPage
├─ Container (fluid)
│
├─ Header Section
│  └─ Admin Dashboard Title
│
├─ Stats Row
│  ├─ Col (1/4) → StatCard (Pending)
│  ├─ Col (1/4) → StatCard (Approved)
│  ├─ Col (1/4) → StatCard (Rejected)
│  └─ Col (1/4) → StatCard (Blocked)
│
├─ Main Card
│  │
│  ├─ Tab Navigation
│  │  ├─ Button: Pending
│  │  ├─ Button: Approved
│  │  ├─ Button: Rejected
│  │  ├─ Button: Blocked
│  │  └─ Button: Refresh
│  │
│  └─ Tab Content (with padding)
│     ├─ Loading Spinner (if loading)
│     ├─ Empty State (if no users)
│     └─ UserList Component
│         └─ Responsive Table
│            ├─ Table Header
│            └─ Table Body
│               └─ Rows (one per user)
│
└─ Modals (fixed position)
   ├─ RejectUserModal
   ├─ BlockUserModal
   └─ UnblockConfirmModal
```

## Status Badge Color Mapping

```
┌─────────────┬───────────┬────────────────┬─────────────┐
│ Status      │ Badge     │ Color          │ Icon        │
├─────────────┼───────────┼────────────────┼─────────────┤
│ Pending     │ bg-warning│ #ffc107        │ clock       │
│ Approved    │ bg-success│ #28a745        │ check-circle│
│ Rejected    │ bg-secondary│ #6c757d      │ x-circle    │
│ Blocked     │ bg-danger │ #dc3545        │ shield-lock │
└─────────────┴───────────┴────────────────┴─────────────┘
```

## Role Color Mapping

```
┌────────────┬───────────┬────────────────┐
│ Role       │ Badge     │ Color          │
├────────────┼───────────┼────────────────┤
│ admin      │ bg-primary│ #1a73e8        │
│ teacher    │ bg-info   │ #0dcaf0        │
│ student    │ bg-success│ #198754        │
│ parent     │ bg-warning│ #ffc107        │
└────────────┴───────────┴────────────────┘
```

## Error Handling Flow

```
API Request
    │
    ├─ Success (200)
    │   │
    │   ├─ Check response.success
    │   │
    │   ├─ YES → Update state, show success toast
    │   │
    │   └─ NO → Show error toast with message
    │
    ├─ Client Error (4xx)
    │   │
    │   ├─ 401 → Redirect to login
    │   ├─ 403 → Show "Access denied"
    │   └─ 400 → Show validation error
    │
    ├─ Server Error (5xx)
    │   │
    │   └─ Show "Try again later"
    │
    └─ Network Error
        │
        └─ Show "Connection failed"
```

## Mobile Responsive Breakpoints

```
┌──────────┬─────────────┬──────────────────────────┐
│ Device   │ Width       │ Adjustments              │
├──────────┼─────────────┼──────────────────────────┤
│ Mobile   │ < 576px     │ Single column stat cards │
│          │             │ Horizontal table scroll  │
│          │             │ Smaller font sizes       │
│          │             │ Touch-sized buttons      │
├──────────┼─────────────┼──────────────────────────┤
│ Tablet   │ 576-768px   │ 2 column stat cards      │
│          │             │ Adjusted padding         │
│          │             │ Smaller sidebar          │
├──────────┼─────────────┼──────────────────────────┤
│ Desktop  │ > 768px     │ 4 column stat cards      │
│          │             │ Full width tables        │
│          │             │ Standard sizing          │
└──────────┴─────────────┴──────────────────────────┘
```

## State Transition Diagram

```
                    ┌──────────────┐
                    │  Initial     │
                    │  State       │
                    └──────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
    Load Pending      Load Approved      Load Rejected
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Ready       │
                    │  (displaying)│
                    └──────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
    Click Tab         Click Action      Click Refresh
         │                 │                 │
         ├─ Approve        └─ Show Modal     └─ Reload All
         ├─ Reject
         ├─ Block
         └─ Unblock
         │
         ▼
    API Request → Response → Update State → Re-render
```

## Performance Optimization Points

```
┌─────────────────────────────────────────────────────┐
│ Performance Considerations                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ✓ Conditional modal rendering                      │
│   - Only renders when show={true}                   │
│   - Not in DOM when hidden                          │
│                                                     │
│ ✓ Efficient list rendering                         │
│   - Uses key={user.id} for React reconciliation     │
│   - No unnecessary re-renders                       │
│                                                     │
│ ✓ Loading states prevent double-submission         │
│   - Buttons disabled while isSubmittingAction=true  │
│                                                     │
│ ✓ API call batching on page load                   │
│   - Uses Promise.all() for parallel requests        │
│   - Not sequential loading                          │
│                                                     │
│ ✓ Minimal state updates                            │
│   - Only updates affected arrays                    │
│   - No full page re-renders                         │
│                                                     │
│ ✓ CSS animations use GPU                           │
│   - Smooth 60fps transitions                        │
│   - No layout thrashing                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

This visual guide should help you understand:
- How data flows through the application
- How users interact with the system
- Component structure and hierarchy
- API request/response cycle
- Responsive design approach
- Error handling strategy
- Performance optimizations

For detailed code examples, see `ADMIN_COMPONENT_REFERENCE.md`
