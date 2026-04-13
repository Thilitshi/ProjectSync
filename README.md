# 🚀 ProjectSync

**Work Smarter, Together** - A developer collaboration platform where developers share projects, get feedback, and celebrate completions.

## 📸 Screenshots

### 🔐 Authentication

| Login | Register | Forgot Password |
|-------|----------|-----------------|
| ![Login](login-page.jpeg) | ![Register](register-page.jpeg) | Forgot password email sent |

### 📧 Password Reset

| Reset Email Received | Reset Password Form |
|---------------------|---------------------|
| ![Reset Email](reset-email.jpeg) | ![Reset Form](reset-password-form.jpeg) |

### 🏠 Main Application

| Dashboard | Live Feed | My Projects |
|-----------|-----------|-------------|
| ![Dashboard](dashboard.jpeg) | ![Live Feed](live-feed.jpeg) | ![My Projects](my-projects.jpeg) |

## ✨ Features

- 📡 **Live Feed** - Real-time project updates from other developers
- 📁 **Project Management** - Create, track, and manage your projects
- 🎯 **Milestones** - Add achievements as you make progress
- 🤝 **Collaboration** - Request help and collaborate with other developers
- 🏆 **Celebration Wall** - Get recognized when you ship your project
- 🔐 **Secure Authentication** - JWT-based login and registration
- 📧 **Password Reset** - Email-based password recovery

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Tailwind CSS |
| **Backend** | Node.js, Express |
| **Database** | MongoDB with Mongoose |
| **Real-time** | Socket.IO |
| **Authentication** | JWT, Bcrypt |
| **Email** | Nodemailer |

## 🚀 Live Demo

- **Frontend**: https://projectsync.vercel.app
- **Backend API**: https://projectsync-aevd.onrender.com

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Clone and Setup

```bash
# Clone the repository
git clone https://github.com/Thilitshi/ProjectSync.git
cd ProjectSync

# Backend setup
cd backend
npm install
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm start
