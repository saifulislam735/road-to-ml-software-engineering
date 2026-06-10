# Dua Platform — Admin Panel Build Prompt

---

## What the Admin Panel Is

A protected section of the main React app, accessible only to users with `role === 'ADMIN'`. It lives under `/admin/*` routes and is rendered inside `AdminLayout.jsx` — a sidebar + topbar shell that wraps all admin pages.

Admins are created via the Prisma seed script only. There is no self-registration for admin accounts.

---

## Tech Stack

Same as the main frontend — no new packages needed except:

| Package      | Purpose                                                      |
| ------------ | ------------------------------------------------------------ |
| `recharts` | Simple charts on the dashboard (duas over time, user growth) |
| `date-fns` | Relative/formatted dates in tables                           |

Both are lightweight and already in the ecosystem.

---

## File Structure

All admin files live inside `apps/web/src/`:

```
src/
├── pages/
│   └── admin/
│       ├── AdminLayout.jsx        # sidebar + topbar shell, renders <Outlet />
│       ├── AdminDashboard.jsx     # /admin — stats + recent activity
│       ├── AdminUsers.jsx         # /admin/users — user table
│       ├── AdminUserDetail.jsx    # /admin/users/:id — single user view
│       ├── AdminDuas.jsx          # /admin/duas — all duas table
│       └── AdminReports.jsx       # /admin/reports — report queue
├── hooks/
│   └── useAdmin.js                # React Query hooks for all admin API calls
├── components/
│   └── admin/
│       ├── StatCard.jsx           # reusable metric card
│       ├── AdminTable.jsx         # reusable paginated table wrapper
│       ├── BanModal.jsx           # ban user modal with reason input
│       └── ConfirmModal.jsx       # generic confirm/danger dialog
```

---

## Route Setup (add to `App.jsx`)

```jsx
import AdminRoute from './components/AdminRoute';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminDuas from './pages/admin/AdminDuas';
import AdminReports from './pages/admin/AdminReports';

// Inside <Routes>:
<Route element={<AdminRoute />}>
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<AdminDashboard />} />
    <Route path="users" element={<AdminUsers />} />
    <Route path="users/:id" element={<AdminUserDetail />} />
    <Route path="duas" element={<AdminDuas />} />
    <Route path="reports" element={<AdminReports />} />
  </Route>
</Route>
```

---

## AdminRoute Guard

```jsx
// components/AdminRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function AdminRoute() {
  const user = useAuthStore(s => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/inbox" replace />;
  return <Outlet />;
}
```

---

## API Calls (`services/api.js` — already in base frontend)

```js
export const adminApi = {
  // Dashboard
  getStats: () =>
    api.get('/admin/stats'),

  // Users
  getUsers: (params) =>
    api.get('/admin/users', { params }),         // ?page=&limit=&search=&banned=
  getUser: (id) =>
    api.get(`/admin/users/${id}`),
  banUser: (id, data) =>
    api.patch(`/admin/users/${id}/ban`, data),   // body: { reason }
  unbanUser: (id) =>
    api.patch(`/admin/users/${id}/unban`),
  deleteUser: (id) =>
    api.delete(`/admin/users/${id}`),

  // Duas
  getDuas: (params) =>
    api.get('/admin/duas', { params }),           // ?page=&hidden=&reported=
  hideDua: (id) =>
    api.patch(`/admin/duas/${id}/hide`),
  unhideDua: (id) =>
    api.patch(`/admin/duas/${id}/unhide`),
  deleteDua: (id) =>
    api.delete(`/admin/duas/${id}`),

  // Reports
  getReports: (params) =>
    api.get('/admin/reports', { params }),        // ?status=pending|resolved|dismissed&page=
  resolveReport: (id, data) =>
    api.patch(`/admin/reports/${id}/resolve`, data), // body: { hideDua: true|false }
  dismissReport: (id) =>
    api.patch(`/admin/reports/${id}/dismiss`),
};
```

---

## React Query Hooks (`hooks/useAdmin.js`)

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/api';

// Dashboard
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats().then(r => r.data),
    refetchInterval: 60_000,   // refresh every 60s
  });
}

// Users
export function useAdminUsers(params) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminApi.getUsers(params).then(r => r.data),
    placeholderData: (prev) => prev,   // v5 replacement for keepPreviousData
  });
}

export function useAdminUser(id) {
  return useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => adminApi.getUser(id).then(r => r.data),
    enabled: !!id,
  });
}

export function useBanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => adminApi.banUser(id, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useUnbanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminApi.unbanUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminApi.deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

// Duas
export function useAdminDuas(params) {
  return useQuery({
    queryKey: ['admin', 'duas', params],
    queryFn: () => adminApi.getDuas(params).then(r => r.data),
    placeholderData: (prev) => prev,   // v5 replacement for keepPreviousData
  });
}

export function useHideDua() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hidden }) => hidden ? adminApi.hideDua(id) : adminApi.unhideDua(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'duas'] }),
  });
}

export function useAdminDeleteDua() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminApi.deleteDua(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'duas'] });
      qc.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });
}

// Reports
export function useAdminReports(params) {
  return useQuery({
    queryKey: ['admin', 'reports', params],
    queryFn: () => adminApi.getReports(params).then(r => r.data),
    placeholderData: (prev) => prev,   // v5 replacement for keepPreviousData
  });
}

export function useResolveReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hideDua }) => adminApi.resolveReport(id, { hideDua }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'reports'] });
      qc.invalidateQueries({ queryKey: ['admin', 'duas'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useDismissReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminApi.dismissReport(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  });
}
```

---

## Page Specs

### `AdminLayout.jsx`

**Structure:**

```
┌─────────────────────────────────────────────┐
│ Topbar: "Admin Panel"         [Admin Name ▾] │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Sidebar  │   <Outlet /> (page content)      │
│          │                                  │
│ Dashboard│                                  │
│ Users    │                                  │
│ Duas     │                                  │
│ Reports  │                                  │
│          │                                  │
│ ─────    │                                  │
│ ← Back   │                                  │
│   to app │                                  │
└──────────┴──────────────────────────────────┘
```

- Sidebar width: `w-56` (224px), `bg-gray-900 text-white` or use Tailwind's slate palette
- Active link: highlighted with brand color left border + slightly lighter background
- Reports nav link: show a red badge with pending count if > 0 (fetch from stats)
- "← Back to app" link at bottom of sidebar → navigates to `/inbox`
- On mobile (< 768px): sidebar collapses, show hamburger button in topbar

---

### `AdminDashboard.jsx` — `/admin`

**Stat cards row (4 cards):**

| Card            | Value from                | Color                |
| --------------- | ------------------------- | -------------------- |
| Total Users     | `stats.users.total`     | Blue                 |
| Duas Today      | `stats.duas.today`      | Green                |
| Pending Reports | `stats.reports.pending` | Orange (warn if > 0) |
| Banned Users    | `stats.users.banned`    | Red                  |

**Charts (below cards):**

- Line chart: "Duas per day — last 7 days" (fetch from `GET /admin/stats?chart=duas_daily`)
- Bar chart: "New users per day — last 7 days" (fetch from `GET /admin/stats?chart=users_daily`)
- Use `recharts` `<LineChart>` and `<BarChart>`. Keep them simple, no fancy animations.

**Recent activity (two columns):**

- Left: Last 5 pending reports (message preview + "View →" link)
- Right: Last 5 new users (username + join time + "View →" link)

---

### `AdminUsers.jsx` — `/admin/users`

**Toolbar:**

- Search input (debounced 300ms, updates `?search=` query param)
- Filter dropdown: All | Active | Banned
- Refresh button

**Table columns:**

| Column        | Notes                                      |
| ------------- | ------------------------------------------ |
| User          | Avatar circle + username + email           |
| Joined        | Relative time ("3 days ago")               |
| Duas received | Number                                     |
| Status        | Green "Active" badge or Red "Banned" badge |
| Actions       | "View" button, "Ban" / "Unban" button      |

- Clicking "Ban" opens `BanModal` with a reason text input
- Clicking "Unban" shows inline confirm (not a modal — just a button state change: "Confirm unban?" Yes / No)
- Row click → navigate to `/admin/users/:id`
- Pagination: standard prev/next with page number display

---

### `AdminUserDetail.jsx` — `/admin/users/:id`

**Profile section (top):**

- Avatar (large), name, username, email, join date, role badge, status badge
- Stats row: Total duas received, Reports filed against them

**Duas section:**

- Title: "Duas received (last 20)"
- Table: message preview | date | hidden? | actions (hide/unhide, delete)
- Expandable row: click message to see full text

**Danger zone (bottom, separated by a red border):**

- Ban User: text input for reason + "Ban" button → calls ban API
- If already banned: "Unban" button
- Delete Account: "Delete permanently" button → opens `ConfirmModal` with warning text: "This will delete the user and all their duas. This cannot be undone."
- After delete: navigate back to `/admin/users`

---

### `AdminDuas.jsx` — `/admin/duas`

**Filter tabs:** All | Reported | Hidden

**Table columns:**

| Column  | Notes                                       |
| ------- | ------------------------------------------- |
| Message | Truncated to 60 chars. Expandable on click. |
| Sent to | Username link →`/admin/users/:id`        |
| Date    | Relative time                               |
| Reports | Count badge (red if > 0)                    |
| Status  | "Visible" or "Hidden" badge                 |
| Actions | "Hide" / "Show", "Delete"                   |

- Clicking delete shows inline confirm before calling API
- Pagination

---

### `AdminReports.jsx` — `/admin/reports`

**Tabs:** Pending (`n`) | Resolved | Dismissed

**Report card layout (card-per-report, not a table):**

```
┌─────────────────────────────────────────────────────┐
│ Reported dua:                              [2h ago]  │
│ "May Allah forgive you for what you did..."          │
│                                                      │
│ Reason: "This message is hurtful"                    │
│ Sent to: @username                                   │
│                                                      │
│ [Resolve + hide dua]  [Dismiss]                      │
└─────────────────────────────────────────────────────┘
```

- "Resolve + hide dua" button: calls `resolveReport(id, { hideDua: true })`. On success: card disappears from Pending tab, pending count badge decrements.
- "Dismiss" button: calls `dismissReport(id)`. Card disappears.
- Resolved/Dismissed tabs show the same card layout but with a status badge and no action buttons.
- Empty state for Pending: green checkmark icon + "All clear — no pending reports."

---

## Reusable Components

### `StatCard.jsx`

```jsx
// Props: title, value, color ('blue'|'green'|'orange'|'red'), icon (Lucide component)

// Layout:
// ┌────────────────────────┐
// │ icon    TITLE          │
// │         42             │
// └────────────────────────┘
```

- `value` should animate from 0 to the actual number on mount (use a simple counter animation with `requestAnimationFrame`)
- Color maps to Tailwind ring/icon color — do not use inline hex

### `AdminTable.jsx`

Wrapper that handles the common pattern:

- Loading skeleton (5 rows of gray pulses)
- Empty state (centered message + icon)
- Error state (red alert box with retry button)
- Pagination controls (prev / page X of Y / next)

Props: `isLoading`, `error`, `isEmpty`, `emptyMessage`, `pagination`, `onPageChange`, `children` (the actual `<table>`)

### `BanModal.jsx`

```jsx
// Props: isOpen, onClose, onConfirm(reason), username, isLoading

// Layout: centered modal (not fixed — use faux viewport div)
// Title: "Ban @username"
// Body: "This user will no longer be able to log in."
// Textarea: reason (required, min 10 chars)
// Buttons: [Cancel] [Ban user] (red)
```

### `ConfirmModal.jsx`

```jsx
// Props: isOpen, onClose, onConfirm, title, message, confirmLabel, isDanger, isLoading

// Generic confirm dialog for destructive actions
// isDanger: confirm button is red
```

---

## Design Notes

- Admin panel uses the **same Tailwind config** as the main app — no separate theme
- Sidebar: `bg-slate-900` with `text-slate-100` links — visually distinct from the user-facing app so admins always know they're in the admin area
- Tables: `text-sm`, alternating `bg-gray-50` rows (light mode), tight row padding `py-2 px-4`
- Destructive actions (delete, ban): always require a second confirmation — either a modal or inline "Are you sure?" state
- No decorative illustrations — this is a tool, keep it clean and functional
- Mobile: tables scroll horizontally on small screens (`overflow-x-auto` on wrapper)

---

## Security Notes (for the AI assistant)

- The `AdminRoute` component is the frontend guard — it checks `user.role === 'ADMIN'` from the Zustand store
- The real security is on the backend — `adminAuth.middleware.js` verifies both JWT and role on every `/api/admin/*` request
- Never show admin routes in the regular app navbar — only accessible by direct URL or from the admin sidebar
- Do not expose internal IDs, raw database fields, or passwords anywhere in the admin UI
- Ban reason should be stored but **not** shown to the banned user — only in the admin panel

---

## Phase 1 Admin Checklist

- [ ] `AdminRoute` guard component
- [ ] `AdminLayout` with sidebar + topbar
- [ ] Sidebar nav with active state + pending reports badge
- [ ] `AdminDashboard` with 4 stat cards and recent activity lists
- [ ] `AdminUsers` with search, filter, paginated table, ban/unban actions
- [ ] `AdminUserDetail` with profile, duas list, ban/delete danger zone
- [ ] `AdminDuas` with filter tabs, paginated table, hide/delete actions
- [ ] `AdminReports` with pending/resolved/dismissed tabs + resolve/dismiss actions
- [ ] `StatCard`, `AdminTable`, `BanModal`, `ConfirmModal` reusable components
- [ ] All mutations show loading state on action button
- [ ] All mutations show toast on success and error
- [ ] Mobile: sidebar collapses correctly, tables scroll horizontally

---

## Phase 2 Admin Features (add when ready)

<!-- Add new admin features below with page/component changes needed -->

- [ ] **Activity log** — `GET /admin/logs` — table showing admin actions (who banned whom, who deleted what dua, timestamps). New `AdminLog` model in DB.
- [ ] **Broadcast message** — `POST /admin/broadcast` — send a system notification/email to all users. Simple textarea + send button on dashboard.
- [ ] **Export data** — Download CSV of users or duas from the admin tables. Frontend: add "Export CSV" button that triggers download.
- [ ] **Dashboard charts** — Add recharts line charts to dashboard for duas per day and new users per day. Requires `GET /admin/stats?chart=duas_daily` endpoint.

---

## Phase 3 Admin Features (do not build yet)

- Role management (multiple admin levels: super admin, moderator)
- Automated spam detection flagging
- Per-user analytics view
- Bulk actions (ban multiple users at once)
