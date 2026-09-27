# VEERCARE-SIH2026
🇮🇳 Smart India Hackathon 2026

Problem Statement: AI-Based Predictive Personnel Stress and Welfare Monitoring System for Uniformed Forces

Problem Statement ID: SIH26186

Organization: Ministry of Home Affairs

Project: VEER CARE

VEER CARE — Smart India Hackathon 2026
VEER CARE is a privacy-preserving AI-powered stress and welfare decision-support system for uniformed forces. It combines operational, wellbeing, cognitive and optional wellness signals with an individual's personal baseline to identify meaningful changes and support timely, human-led welfare interventions.

DETECT THE CHANGE. UNDERSTAND THE CONTEXT. SUPPORT THE PERSON.

📁 Repository Structure

This repository follows a monorepo architecture:

frontend/ — Next.js web application and role-based dashboards
backend/ — FastAPI REST API, database, feature engineering and ML services
🚀 Getting Started
Prerequisites
Node.js 18+
Python 3.10+
Git
PostgreSQL (optional; SQLite is supported for local development)
Frontend
cd frontend
npm install
npm run dev
Backend
cd backend
python -m venv venv

Windows:

venv\Scripts\activate

macOS/Linux:

source venv/bin/activate

Install dependencies and start the API:

pip install -r requirements.txt
uvicorn main:app --reload
🛠️ Tech Stack
Layer	Technologies
Frontend	Next.js, React, TypeScript, Tailwind CSS
Backend	Python, FastAPI, SQLAlchemy, Pydantic
Database	PostgreSQL, SQLite
ML & Analytics	Scikit-learn, Pandas, Joblib
Authentication	Bearer Token Authentication, bcrypt
API Server	Uvicorn
Version Control	Git, GitHub
🧠 Key Features
Personal Baseline — Detects meaningful changes relative to an individual's normal pattern.
Multi-Signal Analysis — Combines operational, wellbeing, cognitive and optional wellness signals.
Wellbeing Assessment — WHO-5-based wellbeing tracking.
Cognitive Assessments — PVT, Stroop and N-Back for complementary cognitive signals.
AI Contextual Scenarios — Scenario-based assessments using operational context.
Wellness Signals — Sleep, recovery, resting heart rate, HRV and activity indicators where available and consented.
VEER AI Companion — Private conversational welfare companion supporting English, Hindi and Roman Hindi.
Explainable Insights — Provides contextual factors behind detected changes for human review.
Role-Based Dashboards — Personnel, Welfare Officer, Commander and HR/Admin interfaces.
Human-in-the-Loop Welfare — AI supports decision-making while authorized personnel remain responsible for welfare actions.
Intervention & Follow-Up — Connects welfare insights with support actions and follow-up.
🔄 Core Workflow
Data Collection
      ↓
Personal Baseline
      ↓
Change & Trend Detection
      ↓
Predictive Analysis
      ↓
Explainable Insight
      ↓
Human Welfare Review
      ↓
Support / Intervention
      ↓
Follow-Up
🔐 Privacy & Responsible AI
Role-based access to sensitive information
Consent-controlled voluntary wellbeing and wellness inputs
Pseudonymous analytics where applicable
Aggregate-first visibility for commanders
Human review before welfare intervention
AI outputs are decision-support signals, not clinical diagnoses
👥 Stakeholder Roles
Personnel — Personal wellbeing, assessments, trends, VEER and support resources
Welfare Officer — Authorized individual welfare review and intervention tracking
Commander — Aggregate unit-level wellbeing, workload and operational trends
HR/Admin — Workforce-level trends and organizational insights

💡 Innovation
Personal Baseline — Detects change relative to the individual's normal pattern
Multi-Signal Fusion — Combines operational, wellbeing, cognitive and wellness context
Prediction → Action — Connects detection to human-led welfare support and follow-up
VEER AI Companion — Provides a private conversational space for personnel
Privacy by Design — Role-based and welfare-focused data visibility
Offline-Ready — Designed with low-connectivity environments in mind

👥 Team
Atharv Jagtap
Ishaan Topkar
Chirag Mandhane
Mohana Rupa Bandaru
Yashashree Dalvi

⚠️ Disclaimer
VEER CARE is a Smart India Hackathon prototype intended for welfare decision support. It is not a clinical diagnostic system and does not replace qualified mental-health professionals or authorized human welfare decisions.