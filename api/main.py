# api/views.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

import os
API_KEY = os.getenv("API_KEY")

COUNTER_URL = "https://api.counterapi.dev/v2/muzamil-sulemans-team-1761/portfolio-views-1023"


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
    


@app.get("/get_leetcode_stats")
async def stats():
    try:
        resp = requests.get(f"https://alfa-leetcode-api.onrender.com/KYFmk4en0i/solved")
        data= resp.json()
        # print(data)
        return {"data": data}

    except Exception as e:
        print(e)  # optional: see errors in Vercel logs
        data = {"totalSolved":"undefined"}
        return {"data": data}
    