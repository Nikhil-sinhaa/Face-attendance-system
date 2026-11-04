# FaceVPlus — Face & Voice Recognition Attendance System (v2.0)

FaceVPlus is a multi-modal attendance management system engineered for modern classrooms. It provides automated student attendance tracking using face recognition (Dlib 128D descriptors) and voice recognition (Resemblyzer acoustic embeddings), backed by a hosted Supabase PostgreSQL database.

---

## Quick Start Guide (Step-by-Step)

### Prerequisites

Make sure you have installed on your computer:
- **Python**: Version 3.10, 3.11, or 3.12
- **Node.js**: Version 18.0 or higher (v20+ recommended)
- **Git**: Installed on your system
- **Supabase Account**: An active project with database credentials
- **Webcam & Microphone**: For live biometric capture

---

### Phase 1: Clone the Repository

Open your terminal or command prompt and run:

```bash
git clone https://github.com/RamanKumar-Dev/Face-recognition-based-attendance-system.git
cd Face-recognition-based-attendance-system
```

---

### Phase 2: Backend Setup (FastAPI & Python)

#### Step 1: Open terminal in the backend directory
```bash
cd backend
```

#### Step 2: Create a Virtual Environment
```bash
# Windows
python -m venv venv

# Linux / macOS
python3 -m venv venv
```

#### Step 3: Activate the Virtual Environment
```bash
# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Windows (Command Prompt)
.\venv\Scripts\activate.bat

# Linux / macOS
source venv/bin/activate
```

#### Step 4: Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### Step 5: Set Up Environment Variables
Create a `.env` file inside the `backend/` folder by copying the example template:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Linux / macOS
cp .env.example .env
```

Open `.env` in any text editor and fill in your credentials:
```ini
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-or-service-key
JWT_SECRET=your-random-32-character-secret-key
```

#### Step 6: Start the Backend Server
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
> **Success Check**: Open your browser to `http://127.0.0.1:8000/docs` to view the interactive API documentation.

---

### Phase 3: Frontend Setup (React & Vite)

Open a **new terminal window** (keep the backend server running in the first terminal).

#### Step 1: Navigate to the frontend directory
```bash
cd frontend
```

#### Step 2: Install Node Dependencies
```bash
npm install
```

#### Step 3: Set Up Environment Variables
Create a `.env` file inside the `frontend/` folder by copying the template:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Linux / macOS
cp .env.example .env
```

Ensure `.env` contains:
```ini
VITE_API_URL=http://127.0.0.1:8000
```

#### Step 4: Start the Frontend Development Server
```bash
npm run dev
```
> **Success Check**: Open your browser to `http://localhost:5173` to access the FaceVPlus application portal.

---

## Features Summary

### Teacher Portal
- **Teacher Authentication**: Secure registration and password login using bcrypt hashing and JWT tokens.
- **Subject Management**: Create, view, and delete courses with real-time student counts.
- **Dynamic QR & Share Links**: Generate printable QR codes and shareable links (`/student/enroll?code=CS101`) for instant enrollment.
- **Batch Face Attendance**: Live camera snapshots or photo uploads analyzed simultaneously by Dlib against student facial descriptors.
- **Acoustic Voice Attendance**: Segment speech recordings using Resemblyzer to identify matching student voiceprints.
- **Interactive Review & History**: Toggle student statuses before saving logs and export historical attendance records to CSV.

### Student Portal
- **Face-ID Authentication**: Live camera facial recognition login against registered 128D descriptors.
- **Biometric Enrollment**: One-time registration for face snapshots and voice utterances.
- **Course Management**: Join classes via code/QR code and view real-time course attendance percentages.

---

## System Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   React 18 + Vite                      │
│   Tailwind CSS • Lucide React • React Router • Axios   │
└───────────────────────────┬────────────────────────────┘
                            │ REST API (JSON / FormData)
┌───────────────────────────▼────────────────────────────┐
│                  FastAPI Backend                       │
│    Uvicorn • Pydantic v2 • PyJWT • Bcrypt Security     │
├───────────────────────────┬────────────────────────────┤
│     Biometric Pipelines   │     Data Access Layer      │
│  • Dlib 128D Face Embed   │  • Supabase Python Client  │
│  • Resemblyzer 256D Voice │  • PostgreSQL Relational   │
└───────────────────────────┴────────────────────────────┘
```

---

## Folder Structure

```text
facevplus-v2/
├── backend/                  # FastAPI Backend
│   ├── app/
│   │   ├── main.py           # Entrypoint, CORS, route imports
│   │   ├── core/             # Configuration & security (JWT, Bcrypt)
│   │   ├── api/              # Route handlers & authentication deps
│   │   ├── schemas/          # Pydantic request/response models
│   │   └── services/         # Supabase, Face, and Voice processing logic
│   ├── requirements.txt      # Backend dependencies
│   ├── .env.example          # Environment variables template
│   └── .env                  # Local secret configuration
├── frontend/                 # React Frontend
│   ├── src/
│   │   ├── App.jsx           # App layout & routing logic
│   │   ├── context/          # React AuthContext
│   │   ├── pages/            # Teacher & Student views
│   │   └── components/       # UI elements and dialogs
│   ├── package.json          # Node dependencies
│   ├── vite.config.js        # Vite configuration
│   └── .env.example          # Frontend environment template
├── tests/                    # Backend automated tests
└── README.md
```

---

## Database Schema (Supabase PostgreSQL)

Set up the following relational tables in your Supabase SQL Editor:

1. **`teachers`**: `teacher_id` (PK), `username`, `password` (bcrypt hash), `name`.
2. **`students`**: `student_id` (PK), `name`, `face_embedding` (128D array), `voice_embedding` (256D array).
3. **`subjects`**: `subject_id` (PK), `subject_code`, `name`, `section`, `teacher_id` (FK → `teachers`).
4. **`subject_students`**: `subject_id` (FK), `student_id` (FK).
5. **`attendance_logs`**: `id` (PK), `timestamp`, `subject_id` (FK), `student_id` (FK), `is_present` (boolean).

---

## Running Backend Tests

To verify that authentication tokens, route handlers, and QR code generations are working properly:

1. Make sure your virtual environment is active in the `backend` folder.
2. Run pytest:
   ```bash
   pytest tests/test_backend.py -v
   ```

---

## Troubleshooting & FAQ

- **Camera / Microphone Access Denied**:  
  Browsers require secure origins (`localhost` or `https://`) for camera/microphone access. Ensure you access the web interface via `http://localhost:5173`.
- **`pkg_resources` Deprecation Warning**:  
  This is an upstream warning from `face_recognition_models` and can be safely ignored.
- **Face Detection Fails**:  
  Ensure sufficient room lighting and position a single face clearly within the camera frame during registration.

---

## Contributors

Contributions, issues, and feature requests are welcome!

* **Vikash Kumar** — https://github.com/vikashb24k-beep
* **Raman Kumar** — https://github.com/RamanKumar-Dev
* **Nikhil Kumar Sinha** — https://github.com/Nikhil-sinhaa
* **R D** — https://github.com/rd6260
* **Saksham Kushwah** — https://github.com/shhadowpdf
* Feel free to open a Pull Request or Issue to contribute to FaceVPlus.

## License

All rights reserved © 2026 FaceVPlus.
