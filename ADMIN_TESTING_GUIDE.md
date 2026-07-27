# Admin Dashboard - Testing & Setup Guide

## Setup Requirements

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- Laravel backend running and accessible
- Admin user account created in the system

## Environment Configuration

### 1. Set Backend URL
Create or update `.env` file:
```
VITE_API_URL=http://localhost:8000/public/api/
# or for production:
VITE_API_URL=https://your-api-domain.com/public/api/
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

The app will typically run at `http://localhost:5173/`

## Testing the Admin Dashboard

### Phase 1: Authentication Setup

**Step 1: Create Admin User**
In your Laravel backend, ensure an admin user exists:
```php
// In tinker or seeder
$user = User::create([
    'first_name' => 'Admin',
    'last_name' => 'User',
    'email' => 'admin@example.com',
    'password' => Hash::make('password'),
    'role_id' => 1,  // Admin role ID
    'approval_status' => 'Approved',
    'is_archived' => 0,
]);
```

**Step 2: Login as Admin**
1. Go to login page
2. Enter: `admin@example.com` / `password`
3. Verify you see "Admin" link in sidebar

### Phase 2: Navigation Testing

**Test 1: Admin Link Visibility**
- ✓ As admin user: "Admin" link visible in sidebar
- ✓ As non-admin user: "Admin" link hidden
- ✓ Click "Admin" link → Navigate to `/admin`

**Test 2: Tab Navigation**
- ✓ All 4 tabs are clickable
- ✓ Badge counts update correctly
- ✓ Tab content changes when clicking tabs
- ✓ "Refresh" button works

### Phase 3: User Management Testing

**Test 3: Approve Pending Users**

Prerequisites: Create pending users
```php
User::create([
    'first_name' => 'John',
    'last_name' => 'Doe',
    'email' => 'john@example.com',
    'password' => Hash::make('password'),
    'approval_status' => 'Pending',
    'role_id' => 3,  // Student
]);
```

Test Flow:
1. Navigate to Admin > Pending tab
2. See John Doe in pending list
3. Click green checkmark
4. Success toast appears
5. User disappears from Pending tab
6. User appears in Approved tab
7. Badge counts update

**Test 4: Reject Pending Users**

Prerequisites: Create another pending user

Test Flow:
1. Navigate to Admin > Pending tab
2. Click red X button
3. Modal dialog opens
4. Enter rejection reason: "Does not meet requirements"
5. Click "Reject User"
6. Success toast appears
7. User disappears from Pending tab
8. User appears in Rejected tab
9. Badge counts update
10. Navigate to Rejected tab
11. See user with status "Rejected"

**Test 5: Block Approved Users**

Prerequisites: Approve a user first (use Test 3)

Test Flow:
1. Navigate to Admin > Approved tab
2. Find approved user
3. Click shield lock button
4. Modal dialog opens with warning message
5. Enter block reason: "Violates community guidelines"
6. Click "Block User"
7. Success toast appears
8. User disappears from Approved tab
9. User appears in Blocked tab
10. Badge counts update

**Test 6: Unblock Blocked Users**

Prerequisites: Block a user first (use Test 5)

Test Flow:
1. Navigate to Admin > Blocked tab
2. Find blocked user
3. Click shield check button
4. Confirmation modal opens
5. Click "Unblock User"
6. Success toast appears
7. User disappears from Blocked tab
8. User appears in Approved tab
9. Badge counts update

### Phase 4: UI/UX Testing

**Test 7: Loading States**
1. Click any action button
2. Button shows loading spinner
3. Button is disabled
4. After completion, button returns to normal

**Test 8: Empty States**
1. In each tab, delete all users (if applicable)
2. Verify empty state message appears
3. Empty icon is displayed

**Test 9: Responsive Design**
1. View on desktop (1920px): All content visible
2. View on tablet (768px): Tables are responsive
3. View on mobile (375px): 
   - Sidebar toggles properly
   - Tables scroll horizontally
   - Buttons are touch-friendly

**Test 10: Modal Interactions**
1. Open any modal
2. Click outside modal: Should close (backdrop click)
3. Click X button: Should close
4. Click Cancel: Should close
5. Character counter updates in real-time
6. Submit button is disabled while loading

### Phase 5: Data Integrity Testing

**Test 11: Concurrent Operations**
1. Rapidly click approve/reject/block buttons
2. Verify only one request goes out at a time
3. UI updates correctly after each operation

**Test 12: Refresh Functionality**
1. Make some changes (approve/reject)
2. Click Refresh button
3. All data reloads from server
4. Changes are persisted

**Test 13: Pagination Ready** (Future enhancement)
1. Create 50+ users in system
2. Verify lists load without hanging
3. Performance remains acceptable

## API Testing

### Test Endpoints Directly

**Using cURL:**
```bash
# Get pending users
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/public/api/admin/users/pending

# Approve user
curl -X PUT -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/public/api/admin/users/1/approve

# Reject user with reason
curl -X PUT -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Does not meet requirements"}' \
  http://localhost:8000/public/api/admin/users/2/reject
```

**Using Postman:**
1. Create new collection
2. Add environment variable: `{{API_URL}}`, `{{TOKEN}}`
3. Create requests for each endpoint
4. Set Authorization header to Bearer {{TOKEN}}
5. Test with different scenarios

## Sample Test Data Setup

### SQL Commands (Laravel Tinker)
```php
// Create admin user
User::factory()->create([
    'email' => 'admin@test.com',
    'role_id' => 1,  // Admin
    'approval_status' => 'Approved'
]);

// Create pending users
User::factory()->count(5)->create([
    'approval_status' => 'Pending',
    'role_id' => 3  // Student
]);

// Create approved users
User::factory()->count(10)->create([
    'approval_status' => 'Approved',
    'role_id' => 3
]);

// Create rejected users
User::factory()->count(3)->create([
    'approval_status' => 'Rejected',
    'role_id' => 3
]);

// Create blocked users
User::factory()->count(2)->create([
    'is_blocked' => 1,
    'blocked_reason' => 'Test block',
    'role_id' => 3
]);
```

## Performance Testing

### Metrics to Monitor

**Load Time:**
- Initial page load: < 2 seconds
- Tab switch: < 500ms
- Action completion: < 1 second

**Browser DevTools:**
1. Open DevTools (F12)
2. Go to Performance tab
3. Record page load
4. Analyze:
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Cumulative Layout Shift (CLS)

**Network Tab:**
1. Check API response times
2. Verify request/response sizes
3. Monitor concurrent requests

## Browser Testing Checklist

| Browser | Desktop | Mobile | Status |
|---------|---------|--------|--------|
| Chrome | Latest | Latest | ✓ Test |
| Firefox | Latest | Latest | ✓ Test |
| Safari | Latest | 14+ | ✓ Test |
| Edge | Latest | N/A | ✓ Test |

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all buttons
- [ ] Enter/Space to activate buttons
- [ ] Escape to close modals
- [ ] Tab order is logical

### Screen Reader Testing
- [ ] Page title is clear
- [ ] Headings are semantic
- [ ] Buttons have accessible labels
- [ ] Icon buttons have aria-labels
- [ ] Form inputs have labels

### Color Contrast
- [ ] All text meets WCAG AA standards
- [ ] Status badges are distinguishable
- [ ] Icons don't rely only on color

## Error Scenario Testing

### Network Errors
1. Disconnect internet
2. Try to perform action
3. Error toast appears
4. UI doesn't break
5. Reconnect and retry works

### Invalid Token
1. Open DevTools
2. Delete auth_token from localStorage
3. Refresh page
4. Should redirect to login

### Server Errors (400, 500)
1. Simulate 500 error from backend
2. Toast shows "Try again later"
3. UI remains functional

### Timeout Errors
1. Set slow network in DevTools
2. Perform action
3. Loading state visible
4. Eventually completes or times out gracefully

## Security Testing

### Authentication
- [ ] JWT token is included in headers
- [ ] Token refreshes when needed
- [ ] Logout clears token

### Authorization
- [ ] Non-admin users can't access `/admin`
- [ ] API endpoints require admin role
- [ ] Backend validates permissions

### Input Validation
- [ ] Reason text fields have max length
- [ ] Special characters are handled
- [ ] XSS attempts are sanitized

## Deployment Checklist

Before deploying to production:

- [ ] Environment variables configured
- [ ] API URL points to production backend
- [ ] Build completes without errors: `npm run build`
- [ ] Bundle size is acceptable
- [ ] All tests pass
- [ ] Error handling works
- [ ] Loading states display correctly
- [ ] Toast notifications work
- [ ] Mobile responsive tested
- [ ] Cross-browser tested
- [ ] Accessibility tested
- [ ] Performance acceptable
- [ ] Security review completed
- [ ] Documentation updated

## Troubleshooting Common Issues

### Issue: "Admin link not showing"
**Solution:**
```javascript
// Check in browser console
localStorage.getItem('auth_user')  // Should show role as 'admin'
```

### Issue: "API requests return 403 Unauthorized"
**Solution:**
```javascript
// Check token exists
localStorage.getItem('auth_token')  // Should have JWT

// Check header is sent
// In DevTools > Network > request > Headers > Authorization
```

### Issue: "Page is blank after clicking Admin"
**Solution:**
- Check console for errors
- Verify API_URL is correct
- Check CORS headers from backend
- Verify role_id in user data

### Issue: "Modal won't close"
**Solution:**
- Check browser console for JavaScript errors
- Verify onClick handlers are properly bound
- Check z-index conflicts

### Issue: "Lists not updating after action"
**Solution:**
- Check API response is valid JSON
- Verify state update logic
- Check React keys are unique

## Support Resources

- [React Documentation](https://react.dev)
- [Bootstrap Documentation](https://getbootstrap.com/docs)
- [Axios Documentation](https://axios-http.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [Laravel API Documentation](https://laravel.com/docs)

## Quick Reference Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check for errors
npm run lint  # if configured

# View source maps
# Enable in DevTools
```

## Notes

- Keep test data minimal (5-10 users per status)
- Delete test data after testing
- Don't commit .env with real credentials
- Document any bugs found
- Create test cases for edge cases
