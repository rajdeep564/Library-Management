# Library Management System — Full Codebase Audit

**Repository:** `Library-Management` (MERN)  
**Audit date:** June 3, 2026  
**Scope:** Read-only review of `frontend/` and `backend/`

---

## 1. Project Structure Overview

### 1.1 Repository root

| Path | Purpose |
|------|---------|
| [README.md](README.md) | Project docs, live demo URL, install steps, env var templates, test credentials |
| [.gitignore](.gitignore) | Git ignore rules |
| [.idea/](.idea/) | JetBrains IDE metadata (not part of runtime app) |

### 1.2 Backend (`backend/`) — 30 files

| Path | Purpose |
|------|---------|
| [backend/index.js](backend/index.js) | **Entry point** — Express app, CORS, route mounts, MongoDB connect, `app.listen` |
| [backend/package.json](backend/package.json) | Dependencies and `npm start` → `node index.js` |
| [backend/package-lock.json](backend/package-lock.json) | Lockfile |
| [backend/config/db.js](backend/config/db.js) | Async DB helper with error handling — **unused** (ESM export, never imported) |
| [backend/routes/user.js](backend/routes/user.js) | User/auth/contact/password routes |
| [backend/routes/books.js](backend/routes/books.js) | Book CRUD + borrow/return routes |
| [backend/routes/admin.js](backend/routes/admin.js) | Admin login + add librarian |
| [backend/routes/librarian.js](backend/routes/librarian.js) | Issue/return approval routes |
| [backend/routes/home.js](backend/routes/home.js) | Public homepage aggregate API |
| [backend/controller/user.js](backend/controller/user.js) | Register, login, profile, contact, OTP reset |
| [backend/controller/admin.js](backend/controller/admin.js) | Admin login, add librarian |
| [backend/controller/books.js](backend/controller/books.js) | Books + borrow lifecycle |
| [backend/controller/librarian.js](backend/controller/librarian.js) | Approve issue/return, list queues |
| [backend/controller/home.js](backend/controller/home.js) | Cached homepage stats |
| [backend/schemas/*.js](backend/schemas/) | Mongoose schema definitions |
| [backend/model/*.js](backend/model/) | `mongoose.model()` wrappers |
| [backend/middlewares/userAuth.js](backend/middlewares/userAuth.js) | JWT Bearer verification |
| [backend/middlewares/checkRole.js](backend/middlewares/checkRole.js) | Role authorization |
| [backend/utils/cloudConfig.js](backend/utils/cloudConfig.js) | Cloudinary + Multer upload |
| [backend/utils/cache.js](backend/utils/cache.js) | In-memory TTL cache (10 min) |
| [backend/utils/fineCalculator.js](backend/utils/fineCalculator.js) | ₹10/day overdue fine |
| [backend/utils/config.js](backend/utils/config.js) | Hardcoded `Server_URL` — **unused** in backend |

### 1.3 Frontend (`frontend/`) — 59 app files

| Path | Purpose |
|------|---------|
| [frontend/index.html](frontend/index.html) | HTML shell, Bootstrap 5.3 CDN |
| [frontend/src/main.jsx](frontend/src/main.jsx) | **React entry** — `createRoot`, `BrowserRouter`, mounts `App` |
| [frontend/src/App.jsx](frontend/src/App.jsx) | **Route table**, lazy-loaded pages, JWT redirect |
| [frontend/vite.config.js](frontend/vite.config.js) | Vite + React plugin |
| [frontend/package.json](frontend/package.json) | Frontend dependencies |
| [frontend/vercel.json](frontend/vercel.json) | SPA rewrite for Vercel |
| [frontend/eslint.config.js](frontend/eslint.config.js) | ESLint config |
| [frontend/src/layout/userlayout.jsx](frontend/src/layout/userlayout.jsx) | Public shell: Navbar + Outlet + Footer |
| [frontend/src/layout/adminlayout.jsx](frontend/src/layout/adminlayout.jsx) | Admin/librarian shell + auth gate |
| [frontend/src/components/](frontend/src/components/) | Navbar, footers, preloader |
| [frontend/src/pages/user/](frontend/src/pages/user/) | Member/public pages |
| [frontend/src/pages/admin/](frontend/src/pages/admin/) | Admin pages |
| [frontend/src/pages/librarian/](frontend/src/pages/librarian/) | Librarian workflows (under `/admin` routes) |
| [frontend/src/utils/](frontend/src/utils/) | API URL, auth helpers, toasts |

### 1.4 Entry points

| Layer | File | Lines (approx.) |
|-------|------|-----------------|
| Backend server | `backend/index.js` | L1–46 |
| Frontend bootstrap | `frontend/src/main.jsx` | L7–12 |
| Frontend routing | `frontend/src/App.jsx` | L59–94 |

### 1.5 Environment variables

**No `.env` files are committed** (correct). Create locally:

#### Backend `.env` (required for full functionality)

| Variable | Used in | Required |
|----------|---------|----------|
| `MONGO_URI` | `index.js` L39 | Yes |
| `PORT` | `index.js` L38 | No (default 5000) |
| `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET` | `utils/cloudConfig.js` L6–8 | Yes for image upload |
| `EMAIL_USER`, `EMAIL_PASS` | `controller/user.js` L120–121 | Yes for forgot-password |
| `EMAIL` | `controller/user.js` L141 | Yes (sender address) |
| `JWT_SECRET` | README only | **No — code uses hardcoded secret** |

README also lists `EMAIL_SERVICE` — **not used** (Gmail hardcoded at `user.js` L117–118).

#### Frontend `.env`

| Variable | Used in |
|----------|---------|
| `VITE_BACKEND_URL` | `frontend/src/utils/config.js` L2 (must include trailing `/` as used in concatenation) |

---

## 2. Backend Audit

### 2.1 Middleware stack

| Middleware | Location | Notes |
|------------|----------|-------|
| `express.json()` | `index.js` L17 | JSON bodies |
| `cors` | `index.js` L18–27 | Allowlist: `localhost:5173`, Vercel demo URL; `credentials: true` |
| `userAuth` | `middlewares/userAuth.js` | Bearer JWT |
| `checkRole` | `middlewares/checkRole.js` | **Bug:** string arg uses substring `.includes()` |
| `upload.single("coverImage")` | `routes/books.js` L8 | Cloudinary |

### 2.2 JWT authentication

- **Sign:** `user.js` L62, `admin.js` L62 — payload `{ id, email, name, role }`, `expiresIn: "24h"`.
- **Verify:** `userAuth.js` L15.
- **Secret:** Hardcoded `"12345@abcd12"` in `user.js` L5, `admin.js` L3, `userAuth.js` L2 — **not** `process.env.JWT_SECRET`.

### 2.3 bcrypt

- **Hash:** register (`user.js` L18), add librarian (`admin.js` L15), reset password (`user.js` L176) — cost **10**.
- **Compare:** user login L52, admin login L52.

### 2.4 API routes (complete)

Base: `http://localhost:5000/` (or `PORT`).

#### `GET /` — Health text (`index.js` L34–36)

#### `/users`

| Method | Path | Auth | Body/Params | Response |
|--------|------|------|-------------|----------|
| GET | `/users/` | None | — | All users (no password) — **public** |
| POST | `/users/register` | None | name, email, password, stream, year, **role** | 201 / 400 |
| POST | `/users/login` | None | email, password | token + user |
| GET | `/users/profile` | user + role `user` | — | Profile |
| POST | `/users/contact` | None | name, email, subject, message | 200 |
| POST | `/users/forgot-password` | None | email | OTP email |
| POST | `/users/verify-otp` | None | email, otp | 200 if valid |
| POST | `/users/reset-password` | None | email, newPassword | Reset — **no OTP session check** |

#### `/admin`

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/admin/login` | None | email, password | Admin-only JWT |
| POST | `/admin/addlibrarian` | admin | name, email, password, role | 201 |

#### `/books`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/books/add` | admin/librarian + file | Add book |
| GET | `/books/issued` | user | User's borrows + fine in JSON |
| GET | `/books/` | None | All books |
| GET | `/books/issuedrequest` | None | Pending requests — **public** |
| GET | `/books/new` | None | Latest + stats |
| GET | `/books/:id` | None | One book |
| DELETE | `/books/delete/:id` | admin/librarian | Delete + Cloudinary |
| PUT | `/books/update/:id` | admin/librarian | Partial update |
| POST | `/books/borrow/request-issue/:bookid` | user | Create `Requested` |
| PUT | `/books/return/:id` | user | **Direct return** (bypasses librarian) |
| PUT | `/books/returnrequest/:id` | user | `Requested Return` |

**Not mounted:** `issueBook` direct issue (`books.js` L199–242).

#### `/librarian`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/librarian/bookissued` | admin **or** librarian | Issued list |
| GET | `/librarian/issuerequest` | **librarian only** | Pending issue |
| GET | `/librarian/returnrequest` | **librarian only** | Pending return + fine |
| PUT | `/librarian/approverequest/:id` | **librarian only** | Approve issue |
| PUT | `/librarian/approvereturnrequest/:id` | **librarian only** | Approve return |

#### `/home`

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/home/` | None | stats, categories, newArrivals (cached) |

### 2.5 MongoDB models

| Model | Collection | Key fields |
|-------|------------|------------|
| User | `users` | name, email, password, role (admin/librarian/user), stream, year |
| Book | `books` | title, author, category, isbn, copies, addedBy, coverImage, cloudinaryId, price, description |
| Borrow | `borrowedbooks` | bookId, userId, issueDate, dueDate, returnDate, fineAmount, status, approvedBy |
| Contact | `contacts` | name, email, subject, message, date |
| Otp | `otps` | email, otp, createdAt |

### 2.6 Missing backend routes (typical library system)

Renewals, reservations, overdue reports, member CRUD, fines payment, bulk import, audit log, notifications, search API, pagination, librarian-only login endpoint, admin read contact messages, secure user listing.

---

## 3. Frontend Audit

### 3.1 React Router routes (`App.jsx`)

| Path | Layout | Page | Audience |
|------|--------|------|----------|
| `/` | Userlayout | Home | Public |
| `/books`, `/bookdetails/:id`, `/category` | Userlayout | Catalog | Public |
| `/login`, `/register` | Userlayout | Auth | Public |
| `/aboutus`, `/contactus` | Userlayout | Static | Public |
| `/forgetPassword`, `/verifyotp`, `/resetpass` | Userlayout | Password reset | Public |
| `/user` | Userlayout | Profile | Member (weak guard) |
| `/admin-login` | None | AdminLogin | Admin |
| `/admin` | AdminLayout | Dashboard | Admin/librarian |
| `/admin/addbook`, `/admin/viewbook` | AdminLayout | Book admin | Admin/librarian |
| `/admin/addlibrarian` | AdminLayout | Add librarian | Admin |
| `/admin/issuerequest`, `/admin/returnrequest`, `/admin/issued` | AdminLayout | Librarian ops | Librarian (nav); admin sees borrowed list |

### 3.2 State management

- **No** Redux, Context API (despite README claim), or Zustand.
- Per-component `useState` / `useEffect`.
- Auth: `localStorage` keys `authToken`, `role`; broken path uses `adminauthToken`.

### 3.3 API calls (axios → `VITE_BACKEND_URL`)

See frontend pages: `login`, `register`, `home`, `books`, `bookdetails`, `profile`, `addbook`, `viewbook`, `admindashboard`, `LibrarianRequest`, `ReturnRequest`, `BooksBorrowed`, `AddLibrarian`, `AdminLogin`, forgot-password flow, `ContactUs`.

### 3.4 Login / logout

- **Member login:** `authToken` + `role`; admin/librarian → `/admin`.
- **Admin login page:** stores `adminauthToken` only — **does not satisfy** `adminlayout.jsx` guard.
- **Logout:** user navbar clears `authToken` only; admin clears `authToken` + `role`.

### 3.5 Forms (react-hook-form unless noted)

Login, Register, AdminLogin, AddBook, AddLibrarian, Contact, Forgot/Verify/Reset password, ViewBook edit modal (controlled state).

### 3.6 UI libraries

- **Bootstrap 5.3** via CDN (`index.html`).
- Custom CSS per page.
- **chart.js** / react-chartjs-2 (admin dashboard pie).
- **framer-motion** (book details).
- **react-icons**.
- **react-toastify** — CSS import **missing**.
- **react-bootstrap** in package.json — **unused** in `src`.

---

## 4. Existing Features Checklist

| Feature | Status |
|---------|--------|
| Admin login | **Partial** (dedicated page broken; `/login` works) |
| Student/Member login | **Yes** |
| Add new book | **Yes** |
| Edit book | **Yes** |
| Delete book | **Yes** |
| Search books | **Partial** (client title + category only) |
| Issue book to member | **Yes** (request → approve) |
| Return book | **Yes** (request → approve) |
| Fine/penalty calculation | **Partial** (display only, ₹10/day) |
| Book reservation | **No** |
| Member registration | **Yes** |
| Member management | **Partial** (view + add librarian only) |
| Dashboard statistics | **Yes** |
| Reports generation | **No** |
| Notifications/Alerts | **Partial** (toasts + reset email) |
| Book categories | **Yes** |
| Barcode/QR support | **Partial** (ISBN display only) |
| Bulk import books | **No** |

---

## 5. Missing Features (Government Tender)

| Requirement | Status |
|-------------|--------|
| Fine auto-calculation persisted on return | **Partial** — calculator exists, `fineAmount` not updated |
| MIS dashboard with charts (issued, overdue, members) | **Partial** — basic pie/stats, no overdue chart |
| Export PDF/Excel | **No** |
| Audit log | **No** |
| Member ID card generation | **No** |
| QR per book | **No** |
| Bulk CSV/Excel import | **No** |
| Role-based access (Super Admin, Librarian, Member) | **Partial** — 3 roles, no Super Admin |
| Email/SMS notifications | **Partial** — OTP email only |
| Book renewal | **No** |
| Overdue tracking | **Partial** — due date + runtime fine, no overdue list |

---

## 6. Code Quality

### Critical issues

1. Hardcoded JWT secret (multiple files).
2. `POST /users/register` accepts client `role` — privilege escalation.
3. `GET /users/` unauthenticated.
4. `reset-password` without verified OTP binding.
5. Admin login `adminauthToken` vs layout `authToken`.
6. `checkRole("librarian")` blocks admin from approve routes.
7. `PUT /books/return/:id` allows direct return without librarian.
8. `GET /books/issuedrequest` public.

### Error handling / API consistency

- Mixed shapes: `{ error, message }` vs `{ message }` vs `{ error: "string" }`.
- No global Express error handler.
- Many `console.log` in production paths.

### Modularity

- Reasonable split routes/controllers/models; business logic heavy in controllers.
- Dead code: `config/db.js`, `issueBook`, unused npm deps.

### Hardcoded values → should be env

JWT secret, CORS origins, fine rate (₹10/day), allowlist URLs, college contact copy in frontend.

### CORS

Functional for listed origins; rejects others; allows requests with no `Origin`.

---

## 7. Database Analysis

### Collections created

`users`, `books`, `borrowedbooks`, `contacts`, `otps`

### Schema quality

- Adequate for MVP; weak for tender: no reservation, renewal, audit, payment, or member ID fields.
- `cloudinaryId` required in schema but can be empty string on add.
- `fineAmount` never updated in controllers.

### Relationships

- Book → User (`addedBy`)
- Borrow → Book, User (`userId`, `approvedBy`)

### Recommended indexes

- `users.email` (unique), `books.isbn` (unique)
- `books.category`, `books.createdAt`
- `borrowedbooks`: `{ userId, status }`, `{ status, createdAt }`, `{ bookId, status }`
- OTP TTL index on `createdAt`

---

## 8. UI/UX State

- **Look:** College library theme — blue (`#3498db`), dark navy (`#2c3e50`), Bootstrap components, custom cards/hero on home.
- **Framework:** Bootstrap 5 CDN + page-level CSS (not Tailwind/MUI).
- **Responsive:** Media queries on home, books, profile, admin dashboard; tables may overflow on mobile.
- **Incomplete:** Privacy/terms/accessibility footer links (no routes); About CTA links to self; Bootstrap Icons referenced but not loaded; placeholder contact/address data.
- **Admin login** separate from member login causes confusion.

---

## 9. Improvement Priority List

### Top 5 critical fixes

| # | Issue | Complexity |
|---|-------|------------|
| 1 | Move JWT to `process.env.JWT_SECRET`; unify auth storage | Easy |
| 2 | Fix admin login + `checkRole` strict equality + allow admin on approve routes | Easy |
| 3 | Lock down `GET /users`, `issuedrequest`; force `role: user` on register | Easy |
| 4 | Bind password reset to verified OTP; remove or protect direct `return` | Medium |
| 5 | Persist `fineAmount` on return approval; fix copy inventory races | Medium |

### Top 10 tender features

| Feature | Complexity |
|---------|------------|
| Overdue list + MIS charts | Medium |
| PDF/Excel reports | Medium–Hard |
| Audit log | Medium |
| Book renewal | Medium |
| Reservations | Hard |
| Bulk CSV import | Medium |
| QR from ISBN | Medium |
| Email due/overdue alerts | Medium |
| Member ID cards | Medium |
| Super Admin + granular RBAC | Hard |

### Top 5 UI improvements

| Improvement | Complexity |
|-------------|------------|
| Import toastify CSS; fix route casing `/forgetPassword` | Easy |
| Unified login portal by role | Medium |
| Government-style dashboard (neutral palette, data tables) | Medium |
| Route guards + axios interceptor for 401 | Medium |
| Load Bootstrap Icons; remove emoji-heavy admin UI | Easy |

---

## 10. Suggested Production Folder Structure

```
library-management/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── config/          # env, db, cors, cloudinary
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── books/
│   │   │   │   ├── circulation/   # issue, return, renew, reserve
│   │   │   │   ├── fines/
│   │   │   │   ├── reports/
│   │   │   │   ├── notifications/
│   │   │   │   └── audit/
│   │   │   ├── middlewares/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── services/        # business logic
│   │   │   ├── validators/
│   │   │   └── utils/
│   │   ├── tests/
│   │   └── index.js
│   └── web/
│       ├── src/
│       │   ├── app/             # router, providers
│       │   ├── features/        # admin, member, librarian
│       │   ├── shared/          # ui, api client, hooks
│       │   └── assets/
│       └── public/
├── packages/
│   └── shared-types/            # DTOs, enums (roles, statuses)
├── docs/                        # API, tender compliance matrix
├── scripts/                     # seed, bulk import CLI
├── .env.example
└── docker-compose.yml
```

---

*End of audit.*
