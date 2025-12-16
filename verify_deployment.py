import requests
import sys

def verify_deployment(backend_url):
    print(f"Testing connection to: {backend_url}")
    
    # Remove trailing slash if present
    if backend_url.endswith('/'):
        backend_url = backend_url[:-1]
        
    try:
        # Test the score endpoint
        response = requests.get(f"{backend_url}/api/score?lat=34.754&lon=-78.789")
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ SUCCESS: Backend is reachable and responding!")
            print("-" * 40)
            print(f"Score: {data['score']}")
            print(f"Classification: {data['classification']}")
            print(f"Details: {data['details']}")
            print("-" * 40)
            print("\nNext Step: Ensure this URL is set as NEXT_PUBLIC_API_URL in Vercel.")
        else:
            print(f"\n❌ ERROR: Backend returned status code {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"\n❌ ERROR: Could not connect to backend.")
        print(f"Details: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 verify_deployment.py <YOUR_RENDER_URL>")
        print("Example: python3 verify_deployment.py https://project-genesis-backend.onrender.com")
    else:
        verify_deployment(sys.argv[1])
