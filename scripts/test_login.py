import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app

client = TestClient(app)

def test_login():
    response = client.post(
        "/auth/login",
        json={"personnel_id": "HR-001", "password": "securepassword123"}
    )
    print("Login Response Status:", response.status_code)
    print("Login Response JSON:", response.json())
    
    if response.status_code == 200:
        print("Login endpoint works successfully!")
    else:
        print("Login endpoint failed.")

if __name__ == "__main__":
    test_login()
