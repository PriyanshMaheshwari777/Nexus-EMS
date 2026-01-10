import requests
import sys

try:
    print("Attempting to connect to http://localhost:8000/...")
    response = requests.get("http://localhost:8000/", timeout=5)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    if response.status_code == 200:
        print("Backend is responding correctly!")
        sys.exit(0)
    else:
        print("Backend responded with error.")
        sys.exit(1)
except requests.exceptions.Timeout:
    print("Backend connection timed out (HANGING).")
    sys.exit(1)
except requests.exceptions.ConnectionError:
    print("Backend connection refused (NOT RUNNING).")
    sys.exit(1)
except Exception as e:
    print(f"An error occurred: {e}")
    sys.exit(1)
