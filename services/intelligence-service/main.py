from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class AnalysisRequest(BaseModel):
    title: str
    description: str

@app.post("/analyze")
async def analyze(req: AnalysisRequest):
    text = (req.title + " " + req.description).lower()
    
    category = "General"
    if any(x in text for x in ["wifi", "login", "software", "laptop"]):
        category = "IT"
    elif any(x in text for x in ["leak", "light", "ac", "furniture"]):
        category = "Facilities"
    
    priority = "Low"
    if any(x in text for x in ["urgent", "broken", "emergency", "immediately"]):
        priority = "High"
    
    return {
        "suggestedCategory": category,
        "suggestedPriority": priority,
        "sentiment": "Urgent" if priority == "High" else "Neutral"
    }
