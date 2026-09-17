# Antigravity Prompt: Build React Frontend Baseline & Core Module Test Views

Copy and paste the prompt below directly into the Antigravity chat window:

```text
Build the Phase 1 frontend test application in `frontend/` using Vite, React, React Router, and Tailwind CSS. Follow the exact project directory layout and specifications below.

### 1. Dependencies & Styling Setup
- Ensure `react-router-dom`, `axios`, and `lucide-react` are installed in `frontend/package.json`.
- Configure `index.html` and Tailwind/CSS to use 'Poppins', sans-serif as the primary font family.

### 2. API & Authentication Context
- Create `frontend/src/api/client.js`:
  - Axios instance targeting `http://localhost:8080/api/v1`.
  - Request interceptor attaching `Authorization: Bearer <token>` from `localStorage`.
- Create `frontend/src/context/AuthContext.jsx`:
  - Manage state: `user`, `token`, `isAuthenticated`.
  - Provide `login(email, password)`, `register(fullName, email, password)`, and `logout()` methods.
  - Sync tokens with `localStorage`.

### 3. Components
- Create `frontend/src/components/Navbar.jsx`:
  - Display brand name: **MediOrder**.
  - Show live backend health status badge (fetching `/api/v1/health` or `/api/health`).
  - Show conditional auth actions:
    - If unauthenticated: "Login" and "Sign Up" links.
    - If authenticated: "Profile" link/button.
- Create `frontend/src/components/ProtectedRoute.jsx`:
  - Restrict access to authenticated users, redirecting unauthenticated visitors to `/login`.

### 4. Pages to Implement
- `frontend/src/pages/HomePage.jsx`:
  - Clean hero section with greeting and system status.
  - A responsive 6-button card grid with lucide icons directing to the 6 core module test pages:
    1. "Prescription Test" -> `/modules/prescription`
    2. "Inventory & Expiry Management" -> `/modules/inventory`
    3. "Real-Time Order Processing" -> `/modules/orders`
    4. "Cold Chain Tagging & Logistics Security" -> `/modules/cold-chain`
    5. "Automatic Medicine Refill & Subscription Management" -> `/modules/subscriptions`
    6. "Delivery Management & Notification Engine" -> `/modules/delivery`
- `frontend/src/pages/LoginPage.jsx`:
  - Form with email and password fields connecting to `POST /api/v1/auth/login`.
  - Link to `/register`.
- `frontend/src/pages/RegisterPage.jsx`:
  - Form with full name, email, and password fields connecting to `POST /api/v1/auth/register`.
  - Link to `/login`.
- `frontend/src/pages/ProfilePage.jsx` (Protected Route):
  - Displays user profile info (name, email, role).
  - Contains a single primary "Logout" button that calls `logout()` and redirects to `/login`.
- `frontend/src/pages/modules/`:
  - Create the 6 separate test pages:
    - `PrescriptionPage.jsx` (Title: "Prescription Test")
    - `InventoryPage.jsx` (Title: "Inventory & Expiry Management")
    - `OrderProcessingPage.jsx` (Title: "Real-Time Order Processing")
    - `ColdChainPage.jsx` (Title: "Cold Chain Tagging & Logistics Security")
    - `SubscriptionsPage.jsx` (Title: "Automatic Medicine Refill & Subscription Management")
    - `DeliveryPage.jsx` (Title: "Delivery Management & Notification Engine")
  - Each page must display its respective title, a "Back to Dashboard" button, and a status tag: `"Module Under Construction - Phase 2"`.

### 5. Application Routing (`frontend/src/App.jsx`)
- Wire all pages into a `BrowserRouter` with `Navbar` persistent across views.
- Ensure route paths match all buttons and navigation links.

Generate and write all files directly into the frontend workspace. remove the old files add only the new files (remove the index.html file)