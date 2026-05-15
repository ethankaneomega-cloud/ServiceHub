# ServiceHub – Home Service Booking Platform

A full-stack capstone project built with React, Node.js, Express, and MongoDB.

---

## 📁 Project Structure

```
servicehub/
├── backend/                   # Node.js + Express API
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── workerController.js
│   │   ├── bookingController.js
│   │   ├── adminController.js
│   │   └── serviceController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT + role-based middleware
│   │   ├── upload.js          # Multer file upload
│   │   └── errorHandler.js    # Global error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Worker.js
│   │   └── Booking.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── workerRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── adminRoutes.js
│   │   └── serviceRoutes.js
│   ├── scripts/
│   │   └── seedAdmin.js       # Creates default admin account
│   ├── uploads/               # Uploaded worker credential files
│   ├── .env.example
│   ├── render.yaml
│   └── server.js
│
└── frontend/                  # React + Vite + Tailwind CSS
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── common/        # Reusable UI, ProtectedRoute, Notifications
    │   │   └── layout/        # Sidebar, DashboardLayout
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── NotificationContext.jsx
    │   ├── pages/
    │   │   ├── auth/          # Login, Register, RegisterWorker
    │   │   ├── user/          # Dashboard, Services, Workers, Bookings, Profile
    │   │   ├── worker/        # Dashboard, Jobs, Profile
    │   │   └── admin/         # Dashboard, Users, Workers, Bookings
    │   ├── services/
    │   │   └── api.js         # Axios instance
    │   ├── App.jsx            # Routes
    │   └── main.jsx
    ├── .env.example
    ├── vercel.json
    └── vite.config.js
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### 1. Clone & Setup

```bash
git clone https://github.com/yourusername/servicehub.git
cd servicehub
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env and fill in your values (see below)
npm install
node scripts/seedAdmin.js   # Creates admin@servicehub.com / admin123
npm run dev
```

Backend runs at: `http://localhost:5000`

### 3. Frontend Setup

```bash
cd ../frontend
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🔐 Environment Variables

### Backend `.env`

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/servicehub
JWT_SECRET=your_super_secret_key_at_least_32_characters
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
MAX_FILE_SIZE=5242880
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🗄️ MongoDB Atlas Setup

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and sign up
2. Create a new **Free Cluster** (M0 Sandbox)
3. Under **Database Access**, create a user with read/write permissions
4. Under **Network Access**, add `0.0.0.0/0` (allow all IPs) for development
5. Click **Connect → Connect your application** and copy the connection string
6. Replace `<username>` and `<password>` in your `.env` MONGO_URI

---

## 🌐 Deployment

### Backend → Render.com

1. Push your `backend/` folder to a GitHub repository
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Set these:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Add all environment variables from `.env`
6. Deploy — your API URL will be `https://your-app.onrender.com`

### Frontend → Vercel

1. Push your `frontend/` folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your repo
4. Set environment variable: `VITE_API_URL=https://your-render-backend.onrender.com/api`
5. Deploy — your app URL will be `https://your-app.vercel.app`

6. **Important:** Update your backend's `CLIENT_URL` to your Vercel URL

---

## 📡 API Reference

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register as user |
| POST | `/api/auth/register-worker` | Public | Register as worker (multipart/form-data) |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Private | Get current user |
| PUT | `/api/auth/profile` | Private | Update profile |
| PUT | `/api/auth/change-password` | Private | Change password |

### Workers
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/workers` | Public | List approved workers |
| GET | `/api/workers/:id` | Public | Get worker by ID |
| GET | `/api/workers/me/profile` | Worker | Get own profile |
| PUT | `/api/workers/me/profile` | Worker | Update own profile |

### Bookings
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/bookings` | User | Create booking |
| GET | `/api/bookings/my-bookings` | User | Get user's bookings |
| GET | `/api/bookings/worker-bookings` | Worker | Get worker's jobs |
| GET | `/api/bookings/:id` | Private | Get single booking |
| PUT | `/api/bookings/:id/status` | Worker/Admin | Update status |
| PUT | `/api/bookings/:id/cancel` | User | Cancel booking |

### Admin
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/admin/stats` | Admin | System statistics |
| GET | `/api/admin/users` | Admin | All users |
| PUT | `/api/admin/users/:id/toggle-status` | Admin | Activate/deactivate user |
| GET | `/api/admin/workers` | Admin | All workers |
| PUT | `/api/admin/workers/:id/status` | Admin | Approve/reject/suspend |
| GET | `/api/admin/bookings` | Admin | All bookings |

### Services
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/services` | Public | List service types |

---

## 👥 User Roles & Flows

### Customer (User)
1. Register at `/register`
2. Login → redirected to `/dashboard`
3. Browse services → Find workers → Book
4. Track bookings in `/my-bookings`
5. Cancel pending/accepted bookings

### Worker
1. Register at `/register-worker` (uploads credentials file)
2. Account is **PENDING** until admin approves
3. Once approved: Login → `/worker` dashboard
4. Accept/start/complete job requests
5. Manage profile & rates

### Admin
1. Login with seeded credentials (admin@servicehub.com / admin123)
2. Dashboard shows real-time stats
3. Approve/reject/suspend worker applications
4. View all users, workers, bookings
5. Deactivate/reactivate user accounts

---

## 🔒 Security Features

- Passwords hashed with **bcrypt** (salt rounds: 12)
- **JWT** tokens with 7-day expiry
- Role-based access control on all protected routes
- File upload validation (JPEG, PNG, PDF only; max 5MB)
- Input validation with **express-validator**
- Global error handling (no stack traces in production)
- CORS configured to allow only your frontend URL

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Routing | React Router DOM v6 |
| HTTP Client | Axios |
| State | Context API |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| File Upload | Multer |
| Deployment | Vercel (frontend) + Render (backend) |

---

## 🐛 GitHub Upload Instructions

```bash
# Initialize git in the root servicehub/ folder
cd servicehub
git init

# Create a .gitignore at root level
echo "node_modules/" >> .gitignore
echo ".env" >> .gitignore
echo "uploads/*" >> .gitignore
echo "!uploads/.gitkeep" >> .gitignore

# Add and commit
git add .
git commit -m "Initial commit: ServiceHub capstone project"

# Create repo on GitHub then push
git remote add origin https://github.com/yourusername/servicehub.git
git branch -M main
git push -u origin main
```

---

## 📋 Capstone Defense Q&A

**Q: Why did you choose this architecture?**  
A: We used MVC on the backend for separation of concerns, making each layer independently maintainable. React + Context API on the frontend provides component reusability without the overhead of Redux.

**Q: How does JWT authentication work?**  
A: On login, the server signs a token containing the user's ID with a secret key. The frontend stores this in localStorage and sends it in every request's Authorization header. The middleware verifies the signature — if valid, the user is authenticated.

**Q: How is worker approval handled?**  
A: Workers register with status="pending". Admin reviews their uploaded credentials and approves or rejects via the admin dashboard. Only approved workers appear in the public workers listing and can accept bookings.

**Q: How does file upload work?**  
A: Multer middleware intercepts multipart/form-data requests, validates file type (JPEG/PNG/PDF) and size (max 5MB), and saves to the `uploads/` folder. The filename is stored in the Worker document.

**Q: How does role-based access control work?**  
A: The `protect` middleware verifies the JWT. The `authorize(...roles)` middleware checks if the user's role is in the allowed list. Routes like `/api/admin/*` require `authorize('admin')`.

---

## 📄 License

MIT — Free to use for educational purposes.

Built with ❤️ as a BSIT Capstone Project.
