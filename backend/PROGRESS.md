# VeerCare Backend — System Implementation & Progress Report

**Project**: VeerCare (Military & Armed Forces Health, Burnout, Stress & Welfare Platform API - SIH 2026)  
**Architecture**: FastAPI + SQLAlchemy ORM (SQLite) + Scikit-Learn ML Suite  
**Last Updated**: September 15, 2026  

---

## 🚀 Executive Summary

The **VeerCare Backend API** is a domain-tailored, multi-role web platform designed for military personnel health monitoring, stress prediction, burnout detection, duty load management, and welfare interventions.

All primary backend layers—including database models, FastAPI modular routers, role-based privacy controls, and a multi-target machine learning pipeline—have been implemented, refined, and validated.

---

## 🛠️ Key Milestones & Accomplishments

### 1. Database & Core Infrastructure (`database.py`, `models/`, `schemas/`)
- **SQLAlchemy ORM Setup**: Configured `Engine`, `SessionLocal`, and declarative base with SQLite database (`veercare.db`).
- **Comprehensive Domain Models**:
  - `User`: System user management with role designations (Soldier, Commander, Welfare Officer, HR Admin).
  - `PersonnelProfile`: Military personnel information (rank, unit, deployment zone, years of service).
  - `Unit`: Battalion unit structure linked to commanding officers.
  - `HealthVitalsLog`: Physiological metrics (resting heart rate, HRV ms, sleep duration hours).
  - `WHO5Assessment`: Standardized WHO-5 well-being index scoring.
  - `DutyHRLog`: Operational duty metrics (duty hours per week, night shift counts, continuous duty days).
  - `LeaveRecord` & `DisciplineLog`: Administrative leave approvals/rejections and disciplinary incident tracking.
  - `CognitiveTest`: Reaction time, vigilance, and spatial awareness test logs.
  - `MLPrediction`: Stored inference results (burnout score/severity, PSS stress score/level, strain index, welfare risk label).
  - `Intervention`: Actionable welfare officer assignment tracking (leave recommendation, counselling, workload reduction).
- **Pydantic Validation Schemas**: Standardized request/response validation schemas across all user roles (`schemas/`).

---

### 2. Multi-Target ML Engine (`/ml`, `routes/ml_routes.py`)
- **4 Specialized Trained Models**:
  - `model_welfare.joblib`: Multi-class welfare risk status prediction.
  - `model_pss.joblib`: Perceived Stress Scale score estimation.
  - `model_burnout.joblib`: Burnout risk index score & severity classification.
  - `model_strain.joblib`: Cumulative operational strain index calculation.
- **Data Leakage Elimination**: Identified and removed 7 leaky target-derived columns from the feature set to ensure unbiased, robust evaluation.
- **Person-Level Train-Test Split**: Implemented `GroupShuffleSplit` on `personnel_id` to prevent data leakage between training and testing sets.
- **Unified Pipeline (`ml/ml.py` & `ml/datapipeline.py`)**:
  - `encode_dataframe()` and `process_db_records()` transform DB records directly into model-ready numerical feature arrays.
  - Efficient single-sample and batch prediction methods returning structured JSON responses.

---

### 3. Role-Scoped Portals & Routers (`routes/`)

| Portal / Module | File Path | Scope & Functionality |
| :--- | :--- | :--- |
| **Authentication & Users** | [users.py](file:///d:/hackathon/sih%202026/internal%20sih%20prototype/backend/routes/users.py) | User login, token verification, role routing |
| **Soldier Portal** | [soldier.py](file:///d:/hackathon/sih%202026/internal%20sih%20prototype/backend/routes/soldier.py) | Vitals logging, WHO-5 assessment submission, personal risk status dashboard |
| **Commander Portal** | [commander.py](file:///d:/hackathon/sih%202026/internal%20sih%20prototype/backend/routes/commander.py) | Unit operational load overview, duty shift & hour management, leave application tracking |
| **Welfare Officer Portal** | [welfare.py](file:///d:/hackathon/sih%202026/internal%20sih%20prototype/backend/routes/welfare.py) | **Strict privacy filtering**: High-risk alerts, restricted detailed vitals/WHO-5 access (high-risk only), intervention creation & tracking |
| **HR & Admin Portal** | [hr.py](file:///d:/hackathon/sih%202026/internal%20sih%20prototype/backend/routes/hr.py) | Operational analytics, personnel profile management |
| **ML Inference API** | [ml_routes.py](file:///d:/hackathon/sih%202026/internal%20sih%20prototype/backend/routes/ml_routes.py) | On-demand stress & burnout prediction execution for personnel |

---

### 4. Privacy & Authorization Protocols
- **Strict High-Risk Isolation**: Medical vitals, PSS assessment details, and WHO-5 scores are restricted. Welfare Officers can access detailed personal vitals **only** for personnel classified as `is_high_risk`.
- **Unit Scoping**: Unit Commanders can access operational duty hours and leave records strictly within their assigned battalion unit.

---

## 📊 Current System Status

```
[ FastAPI App (main.py) ] 
       │
       ├──► /api/users        (User Management & Auth)
       ├──► /api/soldier      (Vitals & Self-Assessment)
       ├──► /api/commander    (Duty & Shift Management)
       ├──► /api/welfare      (High-Risk Alerts & Interventions)
       ├──► /api/hr           (Personnel Admin & Analytics)
       └──► /api/ml           (Real-time Predictive Inference)
```

- **Health Check**: Endpoint `/health` functioning.
- **Database Status**: `veercare.db` populated with tables & schema metadata.
- **ML Models**: Trained, serialized via `joblib`, and verified against feature columns.

---

## 📋 Recommended Next Steps

1. **Frontend Integration**: Connect frontend components to backend FastAPI endpoints.
2. **Automated Testing**: Add end-to-end API integration tests using `pytest` & `TestClient`.
3. **Authentication Hardening**: Expand HTTPBearer token validation into JWT session management.
4. **WebSocket / Live Alert Notifications**: Real-time pushing of high-risk soldier flags to Welfare Officer dashboards.
