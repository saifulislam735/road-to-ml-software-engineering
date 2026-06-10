# Dua Platform — Frontend Build Prompt

> **How to use this file:** Hand this entire file to an AI coding assistant (Claude, Cursor, GitHub Copilot, etc.) as the system/project prompt. Add new features to the relevant section before prompting. The assistant will have full context of the architecture, conventions, and current state.

---

## Project Overview

Build the frontend for **Dua Platform** — an anonymous dua-sending web app. Users register, get a public profile link (`/u/username`), share it on Instagram Stories or Messenger Day, and friends can anonymously send duas (prayers). The owner reads their inbox.

This is a **React SPA** — clean, fast, mobile-first. The design should feel warm, minimal, and approachable. Think clean white cards, soft shadows, and a calm color palette (greens, teals, or soft purples — fitting for a spiritual app). Ship Phase 1 first.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | React 18 + Vite | |
| Routing | React Router DOM v6 | |
| State (auth) | Zustand | Lightweight, no boilerplate |
| Server state | TanStack Query (React Query) v5 | For all API data fetching, caching, mutations |
| Styling | TailwindCSS v3 | Utility-first. No component libraries. |
| HTTP client | Axios | Single configured instance in `services/api.js` |
| Form handling | React Hook Form + Zod | Consistent validation matching backend |
| Icons | Lucide React | Clean, consistent icon set |
| Notifications | react-hot-toast | Simple toast notifications |

---

## Project Structure

Follow this exact structure.

```
apps/web/
├── src/
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── PublicProfile.jsx
│   │   ├── Inbox.jsx
│   │   ├── Settings.jsx
│   │   ├── Share.jsx
│   │   └── admin/
│   │       ├── AdminLayout.jsx      # sidebar + nav wrapper for all admin pages
│   │       ├── AdminDashboard.jsx   # /admin
│   │       ├── AdminUsers.jsx       # /admin/users
│   │       ├── AdminUserDetail.jsx  # /admin/users/:id
│   │       ├── AdminDuas.jsx        # /admin/duas
│   │       └── AdminReports.jsx     # /admin/reports
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Textarea.jsx
│   │   │   ├── Avatar.jsx
│   │   │   ├── Badge.jsx
│   │   │   └── Spinner.jsx
│   │   ├── admin/
│   │   │   ├── StatCard.jsx        # reusable metric card
│   │   │   ├── AdminTable.jsx      # paginated table wrapper with loading/empty/error states
│   │   │   ├── BanModal.jsx        # ban user modal with reason input
│   │   │   └── ConfirmModal.jsx    # generic confirm/danger dialog
│   │   ├── DuaCard.jsx
│   │   ├── DuaForm.jsx
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── AdminRoute.jsx          # Redirect non-admins away from /admin/*
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useDuas.js
│   │   └── useAdmin.js             # React Query hooks for all admin API calls
│   ├── services/
│   │   └── api.js               # Axios instance + all API call functions
│   ├── store/
│   │   └── authStore.js         # Zustand store: user, token, login(), logout()
│   ├── utils/
│   │   └── helpers.js           # formatDate, truncate, copyToClipboard, etc.
│   ├── App.jsx                  # Router + query client setup
│   └── main.jsx
├── public/
│   └── og-image.png             # Open Graph image for link previews
├── index.html
├── .env.example
├── tailwind.config.js
└── vite.config.js
```

---

## Routing Structure

```jsx
// App.jsx — route map

<BrowserRouter>
  <Routes>
    {/* Public */}
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/u/:username" element={<PublicProfile />} />

    {/* Protected */}
    <Route element={<ProtectedRoute />}>
      <Route path="/inbox" element={<Inbox />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/share" element={<Share />} />
    </Route>

    {/* Admin — requires role === 'ADMIN' */}
    <Route element={<AdminRoute />}>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/:id" element={<AdminUserDetail />} />
        <Route path="duas" element={<AdminDuas />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>
    </Route>

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
</BrowserRouter>
```

`ProtectedRoute` checks `authStore` — if no token, redirect to `/login`. If token exists, render `<Outlet />`.

---

## Auth Store (Zustand)

```js
// store/authStore.js

{
  user: null,        // { id, username, email, name, bio, avatarUrl, role }
  token: null,       // JWT string
  isAuthenticated: false,

  login(token, user)  // set token + user, persist to localStorage
  logout()            // clear store + localStorage, redirect to /login
  setUser(user)       // update user fields (after settings save)
  hydrate()           // on app load: read from localStorage, restore state
}
```

`role` is `"USER"` or `"ADMIN"`. The `AdminRoute` component reads this to allow or block access.

Call `hydrate()` once in `App.jsx` on mount. The token from localStorage is attached to all Axios requests via an interceptor in `services/api.js`.

---

## API Service Layer

```js
// services/api.js — single source of truth for all API calls

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token from store to every request
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401: auto logout
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) useAuthStore.getState().logout();
    return Promise.reject(err);
  }
);

// Export typed API functions — never call axios directly from components
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
};

export const userApi = {
  getProfile: (username) => api.get(`/users/${username}`),
  updateMe: (data) => api.patch('/users/me', data),
};

export const duaApi = {
  send: (username, data) => api.post(`/duas/send/${username}`, data),
  getInbox: (params) => api.get('/duas/inbox', { params }),
  markRead: (id) => api.patch(`/duas/${id}/read`),
  delete: (id) => api.delete(`/duas/${id}`),
  report: (id, data) => api.post(`/duas/${id}/report`, data),
};

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  banUser: (id, data) => api.patch(`/admin/users/${id}/ban`, data),
  unbanUser: (id) => api.patch(`/admin/users/${id}/unban`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getDuas: (params) => api.get('/admin/duas', { params }),
  hideDua: (id) => api.patch(`/admin/duas/${id}/hide`),
  deleteDua: (id) => api.delete(`/admin/duas/${id}`),
  getReports: (params) => api.get('/admin/reports', { params }),
  resolveReport: (id, data) => api.patch(`/admin/reports/${id}/resolve`, data),
  dismissReport: (id) => api.patch(`/admin/reports/${id}/dismiss`),
};
```

---

## Pages — Specs

### `/` — Landing

- Hero section: app name, tagline ("Receive duas from your loved ones, anonymously."), CTA buttons: "Get started" → `/register`, "Log in" → `/login`
- How it works: 3-step visual (Register → Share link → Receive duas)
- Clean, full-page layout. No navbar on this page — just the hero.
- Mobile-first. Should look great on a phone screen.

---

### `/u/:username` — Public Profile (most important page)

This is the page friends land on when they tap the shared link.

- Fetch user profile via `GET /api/users/:username`
- Show: avatar (or initials fallback), name, bio
- If `isPaused === true`: show "This user is not accepting duas right now." — no form.
- If `isPaused === false`: show the `DuaForm` component
- After successful submit: show a thank-you message. Do not clear the form immediately — add a short success animation first.
- No login required. This entire page works for anonymous visitors.
- **Meta tags**: Set `<title>Send a dua to {name}</title>` and Open Graph tags so the link previews well on Instagram/Facebook.

---

### `/login` and `/register`

- Clean centered card layout
- `register`: username, email, password fields + submit. On success: store token + user, redirect to `/inbox`.
- `login`: email, password + submit. On success: same.
- Show field-level validation errors from Zod (match backend error shape).
- Show loading spinner on submit button while request is in flight.
- Link between the two pages.

---

### `/inbox` — Authenticated

- Fetch duas via `GET /api/duas/inbox` with React Query
- Paginated list of `DuaCard` components
- Each card: message text, relative time ("2 hours ago"), unread indicator dot, delete button
- On mount: mark all visible cards as read (batch or individual — your choice)
- Empty state: encouraging illustration/message if no duas yet
- Infinite scroll or simple "Load more" button for pagination — your choice, keep it simple

---

### `/settings` — Authenticated

- Pre-fill form with current user data from store
- Fields: name, bio, username
- "Pause receiving duas" toggle (maps to `isPaused`)
- Save button — PATCH `/api/users/me` — update store on success
- Copy profile link section: show full URL + one-click copy button
- Show success toast on save

---

### `/share` — Authenticated

- Display the user's profile URL prominently
- "Copy link" button
- Text prompting them to share on Instagram Stories or Messenger Day with instructions
- Optional Phase 2: generate a shareable image card with their name and link

---

## Components — Specs

### `DuaCard.jsx`

```jsx
// Props: dua { id, message, isRead, createdAt }, onDelete

// Layout:
// [ unread dot ] Message text (truncated at 3 lines, expand on click)
//               "2 hours ago"                        [ delete icon ]
```

- Unread dot: small colored circle, hidden when `isRead === true`
- Delete: show confirmation (`window.confirm` or inline confirm button) before calling API
- Animate in on first render (simple fade, not heavy)

### `DuaForm.jsx`

```jsx
// Props: username (string)

// Layout:
// Textarea: "Write a dua for {name}..." placeholder, max 500 chars
// Character counter (e.g. "240 / 500")
// Submit button: "Send dua 🤲"
// Note below form: "Your message is anonymous"
```

- Validate: required, min 10 chars, max 500 chars
- On submit: call `duaApi.send(username, { message })`
- On success: show success state (replace form with thank-you message)
- On rate limit (429): show "You've sent too many duas recently. Try again later."

### `ProtectedRoute.jsx`

```jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
```

### `AdminRoute.jsx`

```jsx
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

## Admin Pages — Specs

> Admin pages live under `/admin/*`. They use `AdminLayout.jsx` which provides a sidebar with nav links. These pages are only reachable by users with `role === 'ADMIN'`. Style them cleanly but they don't need to be fancy — functional and readable is the goal.

### `AdminLayout.jsx`

- Fixed left sidebar (240px) with nav links: Dashboard, Users, Duas, Reports
- Each link shows an icon + label + active state
- Top bar shows "Admin Panel" title and logged-in admin name
- Main content area renders `<Outlet />`
- Sidebar collapses to icon-only on mobile

### `AdminDashboard.jsx` — `/admin`

- 4 stat cards in a grid: Total Users, Duas Today, Pending Reports, Banned Users
- Each card fetches from `GET /api/admin/stats`
- Recent activity: last 5 reports (pending), last 5 new users
- Quick-action buttons: "View pending reports →", "View all users →"

### `AdminUsers.jsx` — `/admin/users`

- Searchable, paginated table of all users
- Columns: Avatar + Username, Email, Duas received, Joined date, Status (Active / Banned), Actions
- Actions per row: "View", "Ban" / "Unban"
- Search bar filters by username or email (`?search=` query param)
- Filter toggle: Show banned only
- Banned users shown with a red badge

### `AdminUserDetail.jsx` — `/admin/users/:id`

- User profile card: avatar, name, email, username, join date, role, status
- Stats: total duas received, reports on their account
- Last 20 duas they received (with hide/delete buttons per dua)
- Danger zone: Ban User (with reason input), Delete Account (confirm dialog)

### `AdminDuas.jsx` — `/admin/duas`

- Paginated table of all duas in the system
- Columns: Message (truncated), Sent to (username), Date, Status (visible / hidden), Reports count, Actions
- Actions: "Hide" / "Unhide", "Delete"
- Filter tabs: All | Reported | Hidden
- Clicking a row expands to show full message

### `AdminReports.jsx` — `/admin/reports`

- Tabbed view: Pending | Resolved | Dismissed
- Each report card shows: reported dua message, reason given, date reported
- Action buttons: "Resolve + hide dua", "Dismiss"
- Resolving a report should update the report status and optionally call hide dua in one action
- Badge count on "Pending" tab showing unresolved count

---

## React Query Hooks

```js
// hooks/useDuas.js
// TanStack Query v5 — note: keepPreviousData was removed in v5.
// Use placeholderData: (prev) => prev  to keep stale data while refetching.

export function useInbox(page = 1) {
  return useQuery({
    queryKey: ['inbox', page],
    queryFn: () => duaApi.getInbox({ page, limit: 20 }).then(r => r.data),
    placeholderData: (prev) => prev,   // replaces keepPreviousData from v4
  });
}

export function useSendDua(username) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => duaApi.send(username, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });
}

export function useDeleteDua() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => duaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });
}
```

---

## Design System

### Colors (Tailwind config)

Use a calm, spiritual color palette. Suggested:

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      brand: {
        50:  '#f0fdf4',
        100: '#dcfce7',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        900: '#14532d',
      }
    }
  }
}
```

Or teal: `teal-500` as primary. Choose one and be consistent.

### Typography

- Font: Inter (Google Fonts) or system-ui
- Headings: `font-semibold`
- Body: `font-normal text-gray-700`
- Muted text: `text-gray-400`

### Spacing and layout

- Page max-width: `max-w-lg mx-auto` (mobile-first — content never stretches too wide)
- Card padding: `p-4` or `p-6`
- Button height: `h-10` or `h-11`
- Border radius: `rounded-xl` for cards, `rounded-lg` for inputs/buttons

### Tone

The app is for duas (Islamic prayers). Keep the UI calm, respectful, and warm. Avoid flashy animations. Use 🤲 emoji sparingly but it fits here.

---

## Environment Variables

```env
# apps/web/.env.example

VITE_API_URL=http://localhost:5000/api
VITE_APP_URL=http://localhost:5173
```

---

## Dockerfile (frontend)

Create `apps/web/nginx.conf` — this file must exist in the repo before building:

```nginx
# apps/web/nginx.conf
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  # Serve pre-compressed files if available
  gzip_static on;

  location / {
    try_files $uri $uri/ /index.html;
    # React Router: fall back to index.html for all routes
  }

  # Cache static assets aggressively
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

```dockerfile
# apps/web/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Phase 1 Checklist

- [ ] Vite + React + Tailwind scaffold
- [ ] Zustand auth store with localStorage persistence
- [ ] Axios instance with token interceptor + 401 auto-logout
- [ ] All routes wired up
- [ ] `ProtectedRoute` working
- [ ] Landing page
- [ ] Register + Login pages with validation
- [ ] Public Profile page (`/u/:username`) with DuaForm
- [ ] Inbox page with DuaCard list, pagination
- [ ] Settings page with profile edit + isPaused toggle
- [ ] Share page with copy link
- [ ] Toast notifications on success/error
- [ ] Loading states on all async actions
- [ ] Empty states on inbox
- [ ] Mobile-responsive on all pages
- [ ] `AdminRoute` guard (role check)
- [ ] `AdminLayout` with sidebar nav
- [ ] Admin Dashboard with stat cards
- [ ] Admin Users table with search, ban/unban
- [ ] Admin User Detail page with dua list + ban/delete actions
- [ ] Admin Duas table with hide/delete
- [ ] Admin Reports with pending/resolved/dismissed tabs

---

## Phase 2 Features (add here when ready)

<!-- Add new frontend features below with component specs, API calls needed, and page changes. -->

- [ ] **Share image kit** — On `/share`, generate a canvas image (using `html2canvas` or a pre-designed static card) with the user's name and link. "Download for Story" button.
- [ ] **Push notifications** — PWA service worker. Request notification permission after login. Show browser notification when new dua arrives (poll every 60s or use WebSocket).
- [ ] **Reaction emojis** — On each DuaCard in inbox, show emoji reaction buttons (❤️ آمین). Call `PATCH /duas/:id/react` with emoji type.
- [ ] **Unread badge** — Show count of unread duas on the inbox nav link.

---

## Phase 3 Features (do not build yet)

- Custom domain settings page
- Public duas feed page
- User analytics dashboard
- Mobile app (React Native, shared services layer)

---

## Notes for the AI Assistant

- Always use TanStack Query for server state. Never use `useState` + `useEffect` for API calls.
- Keep pages thin — move any logic heavier than a few lines into a hook or the service layer.
- All API calls go through `services/api.js`. Never use `fetch` or raw `axios` in components.
- Forms always use React Hook Form + Zod resolver. No uncontrolled inputs.
- Mobile-first Tailwind — design for 375px screen width, then scale up.
- If a component needs more than ~100 lines, consider splitting it.
- Do not add any UI component library (no shadcn, no MUI, no Chakra). Build UI components from scratch in `components/ui/`.
- When in doubt about a design decision, ask rather than guess.
