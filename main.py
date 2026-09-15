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

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VeerCare Backend API",
    description="Military & Armed Forces Health, Burnout, Stress & Welfare Platform API (SIH 2026)",
    version="1.0.0"
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
app.include_router(users_router)
app.include_router(soldier_router)
app.include_router(commander_router)
app.include_router(hr_router)
app.include_router(welfare_router)
app.include_router(ml_router)


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "VeerCare Backend API"}