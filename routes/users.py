from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schemas.user import UserCreate

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.post("/")
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter(User.supabase_user_id == user_data.supabase_user_id)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="User already exists"
        )

    user = User(
        supabase_user_id=user_data.supabase_user_id,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=user_data.email,
        role=user_data.role,
        phone=user_data.phone,
        personnel_id=user_data.personnel_id,
        unit=user_data.unit
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "User created successfully",
        "user": {
            "id": user.id,
            "supabase_user_id": user.supabase_user_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "role": user.role
        }
    }