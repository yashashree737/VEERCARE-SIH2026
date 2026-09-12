from fastapi import FastAPI
from routes.users import router as users_router
from database import engine, Base
import models.user

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(users_router)