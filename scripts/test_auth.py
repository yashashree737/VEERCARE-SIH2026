import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database import SessionLocal
from models.user import User
from schemas.user import UserLogin
from auth import verify_password

def test_login(login_data: UserLogin, db):
    user = db.query(User).filter(User.personnel_id == login_data.personnel_id).first()
    
    if not user:
        return {"error": "User with this ID does not exist"}
    
    if not user.hashed_password:
        return {"error": "Password is not set for this user"}
        
    is_valid = verify_password(login_data.password, user.hashed_password)
    
    if not is_valid:
        return {"error": "Incorrect password"}
        
    return {
        "message": "Login successful",
        "user_id": user.id
    }

def run():
    db = SessionLocal()
    try:
        login_data = UserLogin(personnel_id="HR-001", password="securepassword123")
        response = test_login(login_data, db)
        print("Test 1 (Valid Login) Response:", response)
        
        login_data_bad = UserLogin(personnel_id="HR-001", password="wrongpassword")
        response_bad = test_login(login_data_bad, db)
        print("Test 2 (Invalid Login) Response:", response_bad)
    except Exception as e:
        print("Failed! Error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    run()
