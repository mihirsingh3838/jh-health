# 📶 JH Health WiFi Complaint Portal

A full-stack MERN complaint management system for the Jharkhand Health Department's public WiFi infrastructure across 666 health facilities.

---

## 🏗️ Architecture

```
complaint-portal/
├── backend/              # Node.js + Express + MongoDB
│   ├── models/
│   │   ├── User.js       # Admin, Engineer roles
│   │   ├── Complaint.js  # Complaint tickets with activity log
│   │   └── Facility.js   # Health facility data
│   ├── routes/
│   │   ├── auth.js       # Login, register, /me
│   │   ├── complaints.js # CRUD + assign + status update
│   │   ├── facilities.js # District/type/facility dropdowns + seed
│   │   └── users.js      # User management (admin)
│   ├── middleware/
│   │   └── auth.js       # JWT verify + role guard
│   ├── seed.js           # One-time DB seed script
│   └── server.js         # Express app entry point
│
└── frontend/             # React 18 + React Router 6
    └── src/
        ├── pages/
        │   ├── Home.jsx            # Public complaint form (4-step)
        │   ├── TrackTicket.jsx     # Public ticket tracker
        │   ├── Login.jsx           # Staff login
        │   ├── AdminDashboard.jsx  # Admin panel
        │   └── EngineerDashboard.jsx # Engineer panel
        ├── components/
        │   ├── Navbar.jsx
        │   └── StatusBadge.jsx
        ├── context/
        │   └── AuthContext.jsx     # Global auth state
        └── api.js                  # Axios API layer
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Clone & Install
```bash
git clone <your-repo>
cd complaint-portal
npm run install-all
```

### 2. Configure Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/complaint_portal
JWT_SECRET=your_super_secret_key_change_me
```

### 3. Seed Database
```bash
npm run seed
```
This creates:
- **Admin:** `admin@jhhealthwifi.gov.in` / `Admin@1234`
- **Engineer:** `engineer1@jhhealthwifi.gov.in` / `Eng@1234`

### 4. Load Facility Data
After starting the app, log in as admin → **Seed Facilities** tab.
Paste your full 666-facility JSON array and click "Upload Facilities".

Alternatively, add your facilities to `backend/seed.js` in the `facilities` array and run `npm run seed`.

### 5. Run Development
```bash
# From root directory
npm run dev
```
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

---

## 👥 User Roles

### 🧑 End User (Public)
- No login required
- **Step 1:** Enter Name, Mobile, Email
- **Step 2:** Select District → Facility Type → Health Facility
- **Step 3:** Choose from 9 common WiFi issues
- **Step 4:** Review & submit → Get Ticket ID
- Track status anytime at `/track`

### 🛡️ Admin
- Login at `/login`
- **Dashboard:** Stats (total, open, in-progress, resolved), district breakdown, issue categories
- **All Complaints:** Filter by status/district, paginated table
- **Assign:** Assign any complaint to an engineer
- **Update Status:** Change status + priority + add notes
- **Manage Engineers:** View all engineers, add new users (admin or engineer)
- **Seed Facilities:** Upload facility JSON via the UI

### 👷 Engineer
- Login at `/login`
- Sees complaints from their **assigned districts** only
- Card-based view filtered by status
- **Update Ticket:** Change status (open → in_progress → resolved → closed) + add work notes
- **Resolved status:** Requires OTP verification — OTP is emailed to complainant; engineer enters the code to confirm resolution
- Activity log maintained on every update

---

## 📧 OTP Verification for Resolution

When marking a ticket as **Resolved**, the system sends a 6-digit OTP to the complainant's email. The engineer must obtain this OTP from the complainant (e.g. via phone) and enter it to confirm resolution.

**Email configuration** (optional): Add to `backend/.env` for real email delivery. If not set, OTP is logged to the console (useful for development).

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=JH Health WiFi <noreply@jhhealthwifi.gov.in>
```

For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) (not your regular password).

---

## 📡 API Reference

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/complaints` | Submit new complaint |
| GET | `/api/complaints/track/:ticketId` | Track by ticket ID |
| GET | `/api/facilities/districts` | Get all districts |
| GET | `/api/facilities/types?district=X` | Get facility types |
| GET | `/api/facilities?district=X&type=Y` | Get facilities |

### Protected Endpoints (JWT required)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | All | Login |
| GET | `/api/auth/me` | All | Get current user |
| POST | `/api/auth/register` | Admin | Create user |
| GET | `/api/complaints` | Admin/Engineer | List complaints |
| GET | `/api/complaints/stats` | Admin | Dashboard stats |
| PATCH | `/api/complaints/:id/assign` | Admin | Assign engineer |
| PATCH | `/api/complaints/:id/status` | Admin/Engineer | Update status (resolved requires OTP) |
| POST | `/api/facilities/seed` | Admin | Bulk seed facilities |
| GET | `/api/users` | Admin | List all users |
| GET | `/api/users/engineers` | Admin/Engineer | List engineers |

---

## 🎫 Ticket ID Format

Auto-generated: `JH-YYMM-NNNNN`

Example: `JH-2412-00001` → December 2024, ticket #1

---

## 🔧 Common WiFi Issues Covered
1. No Internet Connectivity
2. Slow Internet Speed
3. Frequent Disconnections
4. WiFi Not Visible / SSID Not Broadcasting
5. Unable to Connect to WiFi
6. Limited Connectivity (Connected but No Internet)
7. Router / Access Point Not Working
8. Power Issue at Equipment
9. Other

---

## 📦 Production Deployment

### Deploy on Render (GitHub)

**Backend (Web Service):**
- New → Web Service → Connect repo
- Root Directory: `backend`
- Build: `npm install`
- Start: `npm start`
- Env: `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`, `CLIENT_URL` (frontend URL, e.g. `https://jharkhand-wifi-complain.onrender.com`), `SMTP_*` (optional)

**Frontend (Static Site):**
- New → Static Site → Connect repo
- Root Directory: `frontend`
- Build: `npm install && npm run build`
- Publish: `build`
- **Required Env:** `REACT_APP_API_URL` = backend URL (e.g. `https://your-api.onrender.com`) — without this, facility dropdowns and API calls will fail in production.

Set `CLIENT_URL` on backend to your frontend URL (e.g. `https://jharkhand-wifi-complain.onrender.com`). If not set in production, the backend allows `*.onrender.com` origins by default.

---

### Backend (PM2 / self-hosted)
```bash
cd backend
npm install -g pm2
pm2 start server.js --name complaint-portal-api
pm2 save
```

### Frontend (Build + Nginx)
```bash
cd frontend
npm run build
# Serve /build with Nginx
```

### Nginx config snippet
```nginx
server {
    listen 80;
    server_name your-domain.gov.in;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    location / {
        root /path/to/frontend/build;
        try_files $uri /index.html;
    }
}
```

---

## 🛡️ Security Notes
- JWT tokens expire in 7 days
- Passwords hashed with bcrypt (12 rounds)
- Role-based middleware on all protected routes
- Mobile number validated with Indian mobile regex (`[6-9]\d{9}`)
- Resolution OTP: 6 digits, 15-min expiry, hashed before storage
- Change `JWT_SECRET` in `.env` before production!

---

Built for **Jharkhand Health Department** WiFi Infrastructure Management
