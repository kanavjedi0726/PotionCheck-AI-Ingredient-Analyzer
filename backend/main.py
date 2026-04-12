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

SYSTEM_PROMPT = """You are a strict, medically-focused food regulatory safety analyst. You will be given a list of food ingredients. For each ingredient, identify whether it is safe, requires caution, or is harmful to human health. ADHERE TO THE FOLLOWING STRICT GUIDELINES: 1. Flag ANY ingredient with known health controversies as 'caution' minimum. 2. Be extremely aggressive in marking synthetic additives, artificial preservatives, artificial colors, and artificial sweeteners as 'harmful'. 3. If an ingredient is banned or restricted in EVEN ONE major country/region (e.g., EU, UK, Canada, Japan), it must be marked as 'caution' minimum, and typically 'harmful'. Exhaustively list every specific country where it is banned or restricted. 4. Provide detailed medical and scientific reasons highlighting physiological risks (e.g., microbiome disruption, endocrine disruption, carcinogenicity, neurotoxicity). 5. Calculate a strict overall_safety_score (0-100). Punish processed foods with chemical additives severely—most standard processed foods should score below 50. 6. Suggest a healthier, natural alternative. 7. The summary should read like a serious, authoritative medical/regulatory warning report. Respond ONLY in valid JSON with this exact structure — no preamble, no markdown: { "ingredients": [ { "name": "", "status": "safe or caution or harmful", "reason": "Detailed medical/scientific risks", "banned_in": ["Country 1", "Country 2"], "alternative": "" } ], "overall_safety_score": 0-100, "summary": "Medical/regulatory report summary" }"""

PRODUCE_SYSTEM_PROMPT = """You are a strict, medically-focused agricultural toxicologist. You will be given the name of a fresh fruit or vegetable. Your task is to identify the common synthetic pesticides, chemical fertilizers, wax coatings, fungicides, and preservatives typically used in conventional farming and post-harvest processing for this specific produce. Treat these chemicals as 'ingredients'. ADHERE TO THE FOLLOWING STRICT GUIDELINES: 1. Be extremely aggressive in marking pesticides, waxes, and synthetic chemicals as 'harmful' or 'caution' based on medical literature. Flag anything with known health controversies. 2. If a pesticide/chemical is banned in EVEN ONE major country/region (e.g., EU, UK, Canada, Brazil), mark it as 'caution' minimum, usually 'harmful'. Exhaustively list all countries where it is banned. 3. Provide detailed medical and scientific reasons detailing exact physiological and toxicological risks (e.g., neurotoxic to developing brains, endocrine disruptor, probable carcinogen). 4. Calculate a strict overall_safety_score (0-100). Conventionally grown produce with high typical pesticide loads MUST score severely low. 5. Suggest organic alternatives or clinically proven washing recommendations (e.g. baking soda wash). 6. The summary must read like a serious toxicological and medical regulatory report warning consumers about typical exposures. Respond ONLY in valid JSON with this exact structure — no preamble, no markdown: { "ingredients": [ { "name": "Chemical Name", "status": "safe or caution or harmful", "reason": "Detailed medical/toxicology risk", "banned_in": ["Country 1"], "alternative": "Avoidance strategy" } ], "overall_safety_score": 0-100, "summary": "Clinical toxicology warning summary" }"""

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
