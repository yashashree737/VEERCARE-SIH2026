import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database import SessionLocal
from models.user import User
from auth import get_password_hash

def run():
    db = SessionLocal()
    try:
        # Create user
        personnel_id = "HR-001"
        password = "securepassword123"
        
        existing = db.query(User).filter(User.personnel_id == personnel_id).first()
        if existing:
            print("User already exists!")
            return
            
        hashed_password = get_password_hash(password)
        
        new_user = User(
            first_name="Dummy",
            last_name="HR",
            email="dummy.hr@veercare.com",
            role="hr_officer",
            personnel_id=personnel_id,
            hashed_password=hashed_password,
            supabase_user_id=None
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"Created user with ID: {new_user.id} and personnel_id: {new_user.personnel_id}")
    finally:
        db.close()

if __name__ == "__main__":
    run()
