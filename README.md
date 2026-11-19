# 🧠 ProjectAI — AI-Powered Project Management System

**AI-Powered Project Management System with Automatic Task Prioritization**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://project-management-ai-one.vercel.app)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github)](https://github.com/tushargautam681/AI-Powered-Project-Management-System)
[![Tests Passing](https://img.shields.io/badge/Tests-32%2F32%20Passing-success?style=for-the-badge)](https://github.com/tushargautam681/AI-Powered-Project-Management-System)

> 🔗 **Live Demo URL:** [https://project-management-ai-one.vercel.app](https://project-management-ai-one.vercel.app)  
> 📂 **GitHub Repository:** [https://github.com/tushargautam681/AI-Powered-Project-Management-System](https://github.com/tushargautam681/AI-Powered-Project-Management-System)

A full-stack web application that answers: **"What should the team work on next, and why?"**

Built as a B.Tech 7th Semester / Final-Year Engineering Project demonstrating full-stack development, algorithmic prioritization, AI-assisted task analysis, risk detection, and Kanban project management.

---

## 📋 Problem Statement

Traditional project management tools require manual prioritization, which is subjective and error-prone. Teams struggle to identify which tasks truly matter most when balancing deadlines, dependencies, business impact, and developer workload.

**ProjectAI** solves this by combining:
- A **deterministic priority scoring engine** (weighted formula)
- **Rule-based intelligent task analysis** (AI-assisted)
- **Automated risk detection** (deterministic rules)
- **Real-time workload calculation** (from database)

---

## ✨ Features

### Core Features (Level 1 — All Working)
- ✅ JWT Authentication with role-based access control
- ✅ Dashboard with AI-recommended next tasks
- ✅ Project CRUD with team member management
- ✅ Task CRUD with assignment, deadlines, dependencies
- ✅ **Kanban Board** with drag-and-drop (5 columns)
- ✅ **Automatic Priority Score** (0–100, weighted formula)
- ✅ Priority categories (LOW / MEDIUM / HIGH / CRITICAL)
- ✅ **Human-readable priority explanations**
- ✅ **Deterministic risk detection** (6 factors)
- ✅ **Team workload calculation** (from real DB data)
- ✅ Business impact & complexity settings
- ✅ Task dependencies tracking
- ✅ **AI-assisted task analysis** (local rule-based engine)
- ✅ **AI task breakdown** (template-based subtask generation)
- ✅ Project analytics with Recharts
- ✅ Smart Kanban ordering (priority → deadline → risk)
- ✅ Seed data for immediate demonstration
- ✅ Responsive UI

### AI Architecture (3-Tier Fallback)
- **Level A**: Local deterministic intelligence engine (DEFAULT — always works)
- **Level B**: Optional local Ollama LLM (if installed)
- **Level C**: Optional external AI API (future configuration)

> The application works perfectly at Level A — no API key, no internet, no LLM required.

---

## 🏗️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v4, React Router v6, Recharts |
| Backend | Node.js, Express.js, Mongoose, JWT, bcrypt |
| Database | MongoDB |
| AI Engine | Local rule-based intelligence (keyword detection + templates) |
| Drag & Drop | @hello-pangea/dnd |
| Testing | Jest |

**NOT used**: Docker, Redis, Kafka, TensorFlow, PyTorch, paid APIs, cloud services.

---

## 🏛️ Architecture

```
┌──────────────────────┐
│    React Frontend     │
│   Dashboard / Kanban  │
│   Port: 5173          │
└──────────┬────────────┘
           │ REST API
           ▼
┌──────────────────────┐
│   Express Backend     │
│   REST APIs + Auth    │
│   Port: 5000          │
└──────────┬────────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌──────────┐ ┌─────────────────┐
│ MongoDB  │ │ Local AI Engine  │
│ Database │ │ Priority Engine  │
└──────────┘ │ Risk Detection   │
             └─────────────────┘
```

---

## 📊 Priority Algorithm

**Deterministic weighted formula** — always reproducible, no randomness:

```
Priority Score = 0.30 × Urgency + 0.25 × BusinessImpact + 0.20 × DependencyImpact + 0.15 × Workload + 0.10 × Complexity
```

All factors normalized to 0–100. Final score: 0–100.

| Score | Category |
|---|---|
| 0–30 | LOW |
| 31–60 | MEDIUM |
| 61–80 | HIGH |
| 81–100 | CRITICAL |

**Weights stored in**: `server/src/config/priority.config.js`

Each priority calculation generates a human-readable explanation derived from actual factor values.

---

## 🤖 AI Architecture

The local AI engine uses:
- **Keyword-to-skill mapping** (50+ patterns) for required skills detection
- **Rule-based complexity estimation** from task description analysis
- **Template-based subtask generation** for common task types (auth, CRUD, payment, dashboard, etc.)
- **Risk pattern detection** from keywords and task properties
- **Deterministic effort estimation** based on complexity and skill count

> **Academic accuracy**: This is described as "AI-assisted intelligent task analysis using rule-based classification" — NOT a trained machine learning model.

---

## 🗄️ Database Design

**5 Collections**:
- `users` — Name, email, passwordHash, role, skills
- `projects` — Name, description, owner, members, dates, status
- `tasks` — Title, description, priority, score, risk, dependencies, AI analysis
- `activities` — Action log for audit trail
- `aianalyses` — Stored AI analysis results with provider tracking

---

## 🚀 Local Setup

### Prerequisites
- **Node.js** v18+ (you have v24 ✅)
- **MongoDB** — Install one of:
  - [MongoDB Community Server](https://www.mongodb.com/try/download/community) (local, recommended)
  - [MongoDB Atlas](https://www.mongodb.com/atlas) free tier (cloud, 512MB free)

### Step 1: Clone / Navigate to project
```bash
cd d:\B.TECH\SEMESTER-7\project-management-ai
```

### Step 2: Install all dependencies
```bash
npm run install:all
```

Or manually:
```bash
npm install
cd server && npm install
cd ../client && npm install
```

### Step 3: Configure environment
```bash
# Copy the example and edit if needed
copy server\.env.example server\.env
```

The `.env` file contains:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/project_management_ai
JWT_SECRET=project_ai_dev_secret_key_2024
JWT_EXPIRES_IN=7d
AI_PROVIDER=local
CLIENT_URL=http://localhost:5173
```

### Step 4: Start MongoDB
Make sure MongoDB is running locally on port 27017.

### Step 5: Seed demo data
```bash
npm run seed
```

### Step 6: Start the application
```bash
npm run dev
```

This starts both:
- **Backend** → http://localhost:5000
- **Frontend** → http://localhost:5173

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Project Manager | admin@projectai.local | Demo@123 |
| Developer | developer@projectai.local | Demo@123 |
| Developer | likha@projectai.local | Demo@123 |
| Developer | uma@projectai.local | Demo@123 |

---

## 🎤 Demo Flow (5–10 minutes)

1. **Login** as Project Manager (`admin@projectai.local`)
2. **Dashboard** — see AI recommended next tasks, stats, activity
3. **Open** "School Management System" project
4. **Kanban Board** — see tasks sorted by priority with drag-and-drop
5. **Create task** "Implement Payment Gateway" (Critical impact, High complexity, near deadline)
6. Click **"Analyze with AI"** — see estimated hours, skills, risks, subtasks
7. Click **"Calculate Priority"** — see score, category, factor breakdown, explanation
8. **Drag** task across columns — status persists
9. **Open Analytics** — see charts for status, priority, risk distribution
10. **Team page** — see workload per developer
11. **Explain**: "What should the team work on next, and why?"

---

## 📁 Project Structure

```
project-management-ai/
├── client/                      # React + Vite Frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── context/             # Auth context
│   │   ├── layouts/             # App layout (sidebar + content)
│   │   ├── pages/               # Route pages
│   │   ├── services/            # API service layer
│   │   └── utils/               # Helpers, constants
│   └── package.json
├── server/                      # Node.js + Express Backend
│   ├── src/
│   │   ├── config/              # DB, priority weights, AI config
│   │   ├── controllers/         # Route handlers
│   │   ├── middleware/          # Auth, error handling
│   │   ├── models/              # Mongoose schemas (5)
│   │   ├── routes/              # Express routes
│   │   ├── services/
│   │   │   ├── ai/              # AI service layer
│   │   │   └── priority/        # Priority engine
│   │   └── utils/               # Seed script
│   ├── tests/                   # Jest unit tests
│   └── package.json
├── .env.example
├── package.json                 # Root scripts
└── README.md
```

---

## 🧪 Testing

```bash
npm test
```

**32 tests** covering:
- Deadline urgency calculation (10 tests)
- Priority weight configuration validation
- Business impact & complexity mapping
- Deterministic priority score verification
- Risk detection logic (4 levels)
- Local AI engine (analysis, breakdown, explanation)

---

## 🔒 Security

- bcrypt password hashing (12 salt rounds)
- JWT authentication with expiry
- Protected API routes
- Role-based access control (PM / Developer / Viewer)
- Password never returned in API responses
- Environment variables for secrets
- CORS configured
- Input validation

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | No | Register user |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | Yes | Current user |
| GET | /api/projects | Yes | List projects |
| POST | /api/projects | PM | Create project |
| GET | /api/projects/:id | Yes | Project detail |
| PUT | /api/projects/:id | PM | Update project |
| DELETE | /api/projects/:id | PM | Delete project |
| GET | /api/tasks | Yes | List tasks |
| POST | /api/tasks | PM | Create task |
| PUT | /api/tasks/:id | PM/Dev | Update task |
| PATCH | /api/tasks/:id/status | PM/Dev | Change status |
| POST | /api/tasks/:id/prioritize | PM | Calculate priority |
| POST | /api/ai/analyze-task | Yes | AI task analysis |
| POST | /api/ai/breakdown-task | Yes | AI task breakdown |
| GET | /api/analytics/dashboard | Yes | Dashboard stats |
| GET | /api/analytics/project/:id | Yes | Project analytics |
| GET | /api/analytics/workload | Yes | Team workload |

---

## ⚠️ Known Limitations

- No real-time collaboration (WebSocket)
- No email notifications
- No sprint management
- No file attachments
- Local AI engine uses pattern matching (not trained ML)
- Single project demo data (can create more)

---

## 🔮 Future Scope

- Sprint management and velocity tracking
- Real-time collaboration with WebSocket
- Email/push notifications
- GitHub integration for commits and PRs
- Predictive analytics using historical data
- Mobile-responsive PWA
- CI/CD pipeline integration
- Advanced ML-based priority prediction

---

## 🎓 Academic Features Demonstrated

1. Full-stack development (React + Node.js + MongoDB)
2. REST API design with proper error handling
3. JWT authentication and authorization
4. Role-based access control
5. Database design with Mongoose ODM
6. Kanban methodology implementation
7. Algorithmic task prioritization (weighted formula)
8. AI-assisted analysis (rule-based classification)
9. Deterministic risk detection
10. Real-time workload calculation
11. Data visualization (Recharts)
12. Unit testing (Jest)
13. Software architecture (layered, modular)
14. Drag-and-drop UI implementation

---

## 👥 Team

- **Tushar Gautam** — Project Lead
- **Dipti Saini** — Developer
- **Likha Gummiku** — Developer
- **Uma Shankar** — Developer

---

*Built as a local-first academic project. No cloud deployment, Docker, or paid APIs required.*
