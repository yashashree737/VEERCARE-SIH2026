from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models.user import User
from schemas.user import UserLogin
from auth import verify_password

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


@router.post("/login")
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    # Look up user by HR assigned ID (personnel_id)
    user = db.query(User).filter(User.personnel_id == login_data.personnel_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User with this ID does not exist"}
        )
    
    # Check if a hashed password exists
    if not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "PASSWORD_NOT_SET", "message": "Password is not set for this user"}
        )
        
    # Verify password
    is_valid = verify_password(login_data.password, user.hashed_password)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_PASSWORD", "message": "Incorrect password"}
        )
        
    # If valid, return user data
    return {
        "message": "Login successful",
        "user": {
            "id": user.id,
            "supabase_user_id": user.supabase_user_id,
            "personnel_id": user.personnel_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "role": user.role,
            "profile_photo": user.profile_photo,
            "unit_id": user.unit_id,
        }
    }
