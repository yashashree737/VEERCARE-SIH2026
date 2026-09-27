from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    supabase_user_id: str | None = None
    password: str

    first_name: str
    last_name: str | None = None

    email: EmailStr

    role: str

    phone: str | None = None
    personnel_id: str | None = None
    unit: str | None = None
    profile_photo: str | None = None


class UserLogin(BaseModel):
    personnel_id: str
    password: str


class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    profile_photo: str | None = None