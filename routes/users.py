from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas.user import UserCreate, UserUpdate
from auth import get_password_hash

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.post("/")
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = None
    if user_data.personnel_id:
        existing_user = (
            db.query(User)
            .filter(User.personnel_id == user_data.personnel_id)
            .first()
        )
    elif user_data.supabase_user_id:
        existing_user = (
            db.query(User)
            .filter(User.supabase_user_id == user_data.supabase_user_id)
            .first()
        )

    # User already exists
    if existing_user:
        # User is trying to log in with a different role
        if existing_user.role != user_data.role:
            raise HTTPException(
                status_code=409,
                detail={
                    "message": "User already exists with a different role",
                    "existing_role": existing_user.role,
                    "requested_role": user_data.role
                }
            )

        # User exists with the correct role
        return {
            "message": "User already exists",
            "user": {
                "id": existing_user.id,
                "supabase_user_id": existing_user.supabase_user_id,
                "first_name": existing_user.first_name,
                "last_name": existing_user.last_name,
                "email": existing_user.email,
                "role": existing_user.role,
                "profile_photo": existing_user.profile_photo
            }
        }

    # Hash the password
    hashed_pwd = get_password_hash(user_data.password)

    # Create new user
    user = User(
        supabase_user_id=user_data.supabase_user_id,
        hashed_password=hashed_pwd,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=user_data.email,
        role=user_data.role,
        phone=user_data.phone,
        personnel_id=user_data.personnel_id,
        unit=user_data.unit,
        profile_photo=user_data.profile_photo
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
            "role": user.role,
            "profile_photo": user.profile_photo
        }
    }


@router.put("/{supabase_user_id}")
def update_user(
    supabase_user_id: str,
    user_data: UserUpdate,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.supabase_user_id == supabase_user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    update_data = user_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)

    return {
        "message": "User updated successfully",
        "user": {
            "id": user.id,
            "supabase_user_id": user.supabase_user_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "role": user.role,
            "profile_photo": user.profile_photo
        }
    }