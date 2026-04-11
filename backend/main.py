import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pytesseract
from PIL import Image
import io
import json
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

# Optionally set tesseract path if provided in .env
tesseract_cmd = os.getenv("TESSERACT_CMD_PATH")
if tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

app = FastAPI(title="PotionCheck API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000", 
        "http://localhost:3001", 
        "http://127.0.0.1:3001",
        "https://hackawarts-project.vercel.app"
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(
    api_key=os.getenv("GROQ_API_KEY"),
)

class AnalyzeRequest(BaseModel):
    ingredients_text: str

SYSTEM_PROMPT = """You are an expert food safety analyst. You will be given a list of food ingredients. For each ingredient, identify whether it is safe, requires caution, or is harmful to human health. Explain why harmful or cautionary ingredients are flagged, list countries where they are banned or restricted, and suggest a healthier alternative where applicable. Respond ONLY in valid JSON with this exact structure — no preamble, no markdown: { "ingredients": [ { "name": "", "status": "safe or caution or harmful", "reason": "", "banned_in": [], "alternative": "" } ], "overall_safety_score": 0-100, "summary": "" }"""

@app.post("/api/extract-text")
async def extract_text(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # We might want to perform some basic image preprocessing here, but we will pass it directly for now.
        extracted_text = pytesseract.image_to_string(image)
        
        return {"extracted_text": extracted_text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze")
async def analyze_ingredients(request: AnalyzeRequest):
    if not request.ingredients_text or not request.ingredients_text.strip():
        raise HTTPException(status_code=400, detail="Ingredients text cannot be empty.")
        
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": request.ingredients_text
                }
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
        )
        
        # Extract the json text from the response
        response_text = chat_completion.choices[0].message.content
        
        # Clean up in case there's any markdown formatting accidentally returned
        response_text = response_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        parsed_json = json.loads(response_text)
        return parsed_json
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
