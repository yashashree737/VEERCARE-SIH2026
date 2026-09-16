import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from database import engine, Base
import models

from routes.users import router as users_router
from routes.soldier import router as soldier_router
from routes.commander import router as commander_router
from routes.hr import router as hr_router
from routes.welfare import router as welfare_router
from routes.ml_routes import router as ml_router
from routes.auth_routes import router as auth_router
from routes.ui_bridge import router as ui_bridge_router
from fastapi.middleware.cors import CORSMiddleware

from seed_db import init_db_and_seed

# Initialize DB tables and seed default demo records if missing
init_db_and_seed()

app = FastAPI(
    title="VeerCare Backend API",
    description="Military & Armed Forces Health, Burnout, Stress & Welfare Platform API (SIH 2026)",
    version="1.0.0"
)

# Enable CORS for frontend applications (Next.js).
# Auth is carried in the Authorization header (Bearer), not cookies, so we do NOT
# need credentialed CORS. allow_credentials=True together with allow_origins=["*"]
# is rejected by browsers per spec; keeping credentials off lets "*" work for LAN
# demo machines without that footgun. Lock allow_origins to your frontend origin(s)
# for production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)
API_TOKEN = os.getenv("API_KEY")


def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    if API_TOKEN:
        if not credentials or credentials.credentials != API_TOKEN:
            raise HTTPException(
                status_code=401,
                detail="Invalid or missing token"
            )
    return credentials.credentials if credentials else None


# Include Routers
app.include_router(auth_router)  # Authentication route does not require API key token
app.include_router(ui_bridge_router)  # UI Bridge routes
app.include_router(users_router, dependencies=[Depends(verify_token)])
app.include_router(soldier_router, dependencies=[Depends(verify_token)])
app.include_router(commander_router, dependencies=[Depends(verify_token)])
app.include_router(hr_router, dependencies=[Depends(verify_token)])
app.include_router(welfare_router, dependencies=[Depends(verify_token)])
app.include_router(ml_router, dependencies=[Depends(verify_token)])


@app.get("/health", dependencies=[Depends(verify_token)])
def health_check():
    return {"status": "healthy", "service": "VeerCare Backend API"}