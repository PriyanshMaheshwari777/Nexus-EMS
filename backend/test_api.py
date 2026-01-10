"""
Quick test script for API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_login():
    """Test login endpoint"""
    print("Testing /auth/login endpoint...")
    
    # Test admin login
    admin_data = {
        "email": "admin@nexus.com",
        "password": "admin",
        "role": "ADMIN"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=admin_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("[OK] Login endpoint is working!")
        else:
            print(f"[ERROR] Login failed with status {response.status_code}")
    except Exception as e:
        print(f"[ERROR] {e}")
        print("Make sure the backend server is running on port 8000")

def test_root():
    """Test root endpoint"""
    print("\nTesting root endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"[ERROR] {e}")

if __name__ == "__main__":
    test_root()
    test_login()

