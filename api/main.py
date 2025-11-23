# api/views.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

# ADD THIS CORS BLOCK — allows ALL origins (perfect for portfolio)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],              # Change to your actual domain later if you want
    allow_credentials=True,
    allow_methods=["*"],              # GET, POST, etc.
    allow_headers=["*"],              # Allows Authorization, Content-Type, etc.
)

COUNTER_URL = "https://api.counterapi.dev/v2/muzamil-sulemans-team-1761/portfolio-views-1023"
API_KEY = "ut_jht5rqbJ9MVvmo3ygJa6lnk1jq3n6ny762d42nAs"
headers = {"Authorization": f"Bearer {API_KEY}"}

@app.get("/get_views")
async def getViews():
    try:
        resp = requests.get(f"{COUNTER_URL}/up", headers=headers)
        data= resp.json()
        print(data["data"])
        return {"count": data["data"]["up_count"] + 1}

    except Exception as e:
        print(e)  # optional: see errors in Vercel logs
        return {"count": -1}
    

