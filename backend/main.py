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
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(
    api_key=os.getenv("GROQ_API_KEY"),
)

class AnalyzeRequest(BaseModel):
    ingredients_text: str

class ProduceRequest(BaseModel):
    produce_name: str

SYSTEM_PROMPT = """You are an expert food safety analyst. You will be given a list of food ingredients. For each ingredient, identify whether it is safe, requires caution, or is harmful to human health. Explain why harmful or cautionary ingredients are flagged, list countries where they are banned or restricted, and suggest a healthier alternative where applicable. Respond ONLY in valid JSON with this exact structure — no preamble, no markdown: { "ingredients": [ { "name": "", "status": "safe or caution or harmful", "reason": "", "banned_in": [], "alternative": "" } ], "overall_safety_score": 0-100, "summary": "" }"""

PRODUCE_SYSTEM_PROMPT = """You are an expert in agriculture and food science. You will be given the name of a fresh fruit or vegetable. Your task is to identify the common synthetic pesticides, chemical fertilizers, wax coatings, and preservatives typically used in conventional farming and post-harvest processing for this specific produce. Treat these chemicals as "ingredients". For each chemical/pesticide, identify if it is harmful, requires caution, or is generally safe. Provide a thoughtful analysis, list countries if any typical chemicals are banned or restricted, and suggest organic alternatives or washing recommendations (e.g. "Buy Organic", "Wash with baking soda solution"). Respond ONLY in valid JSON with this exact structure — no preamble, no markdown: { "ingredients": [ { "name": "Chemical/Pesticide/Wax Name", "status": "safe or caution or harmful", "reason": "Function and risks", "banned_in": [], "alternative": "Avoidance/Washing strategy" } ], "overall_safety_score": 0-100 (where 100 means zero pesticide risk, and lower means higher typical chemical residue/risk), "summary": "General overview of the typical chemical load for conventionally grown versions of this produce." }"""

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

@app.post("/api/analyze-produce")
async def analyze_produce(request: ProduceRequest):
    if not request.produce_name or not request.produce_name.strip():
        raise HTTPException(status_code=400, detail="Produce name cannot be empty.")
        
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": PRODUCE_SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": request.produce_name
                }
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
        )
        
        response_text = chat_completion.choices[0].message.content
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
