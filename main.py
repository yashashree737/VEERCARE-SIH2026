from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from routes.users import router as users_router
from database import engine, Base
import models.user

Base.metadata.create_all(bind=engine)

app = FastAPI()
security = HTTPBearer()

API_TOKEN = os.getenv("API_KEY")

def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    if credentials.credentials != API_TOKEN:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    return credentials.credentials

app.include_router(users_router, dependencies=[Depends(verify_token)])