# 📋 ShiftLog - Incident Management System

A premium, high-performance dashboard designed for tracking and resolving workplace incidents in real-time. This application features a custom glassmorphism UI, a robust status-tracking system, and deep integration with a PostgreSQL database.

---

## 🚀 Recent Feature: Custom Resolution Hub
We have deprecated standard browser `window.prompt` alerts in favor of a **Custom Centered Modal**. 
- **User Flow:** When an incident is marked as "Resolved," a custom UI window emerges to collect resolution details.
- **Persistence:** These details are sent via `PATCH` requests and stored in the PostgreSQL database, ensuring data is not lost on page refresh.

---

## 🛠️ Tech Stack
- **Frontend:** React.js (Vite)
- **Styling:** CSS3 with Custom Variables (Solid Blue Theme + Dark Mode)
- **Backend:** Python/Node.js API
- **Database:** PostgreSQL (Hosted on Railway)
- **Deployment:** Vercel (Production)

---

## ⚙️ Setup & Environment Variables

To run the project locally, create a `.env` file in your root directory and configure the following:

### Frontend (.env)
```env
VITE_API_URL=[http://127.0.0.1:5000](http://127.0.0.1:5000)


## 🔐 Permissions Matrix

| Feature | Operator | Supervisor | Admin |
| :--- | :---: | :---: | :---: |
| View Incidents | ✅ | ✅ | ✅ |
| Add/Edit Incidents | ✅ | ✅ | ✅ |
| Create Companies | ❌ | ✅ | ✅ |
| Create Categories | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |