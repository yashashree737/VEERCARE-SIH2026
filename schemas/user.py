from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    supabase_user_id: str

    first_name: str
    last_name: str | None = None

    email: EmailStr

    role: str

    phone: str | None = None
    personnel_id: str | None = None
    unit: str | None = None