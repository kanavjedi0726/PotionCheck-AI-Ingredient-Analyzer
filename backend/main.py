import os
import io
import json

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any

import pytesseract
from PIL import Image
from dotenv import load_dotenv
from google import genai

# Load environment variables
load_dotenv()

# Tesseract OCR configuration
tesseract_cmd = os.getenv("TESSERACT_CMD_PATH")
if tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

# Initialize FastAPI
app = FastAPI(title="PotionCheck API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing!")

client = genai.Client(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-3.5-flash-lite"


# Request models
class AnalyzeRequest(BaseModel):
    ingredients_text: str
    user_profile: Optional[Dict[str, Any]] = None


class ProduceRequest(BaseModel):
    produce_name: str
    user_profile: Optional[Dict[str, Any]] = None


# Ingredient analysis prompt
SYSTEM_PROMPT = """You are a strict, medically-focused food regulatory safety analyst. You will be given a list of food ingredients. The user may also provide their specific Health Profile (Allergies, Medical Conditions, Diet Type).
ADHERE TO THE FOLLOWING STRICT GUIDELINES:
1. Flag ANY ingredient with known health controversies as 'caution' minimum. Be extremely aggressive in marking synthetic additives, artificial preservatives, colors, and sweeteners as 'harmful'.
2. If an ingredient is banned/restricted in EVEN ONE major country/region, mark it as 'caution' minimum, typically 'harmful', and list the specific countries.
3. Provide detailed medical and scientific reasons highlighting physiological risks.
4. Suggest a healthier, natural alternative for each ingredient.
5. If the user provides a Health Profile, evaluate if any ingredient directly impacts or violates their conditions/allergies/diet. Set "user_conflict" to true for those specific ingredients.
6. Provide a personalized_verdict string declaring if the overall product is safe or unsafe specifically for the user based on their profile.
7. Calculate a strict overall_safety_score (0-100). Punish processed foods with chemical additives severely.
8. Suggest a REAL product_alternative: a specific, real-world better product (with actual brand name) that the user could switch to instead of the analyzed product, chosen based on their health profile. Explain concisely why it is better for them and where to find it.
9. Provide a consumption_frequency: how many times per day/week/month this product can be safely consumed given the user's health profile. Be strict. Examples: "Max once per week", "Avoid entirely — not safe for diabetics", "Occasional use only (max 1-2x/month)", "Safe for daily moderate use".
Respond ONLY in valid JSON with this exact structure — no preamble:
{ "ingredients": [ { "name": "", "status": "safe or caution or harmful", "reason": "Detailed risks", "banned_in": [""], "alternative": "", "user_conflict": false } ], "overall_safety_score": 0-100, "summary": "Medical report summary", "personalized_verdict": "Specific verdict for this user", "product_alternative": { "name": "Product Name", "brand": "Brand Name", "why_better": "Why this is safer for the user's profile", "where_to_find": "Supermarkets / Amazon / Health stores" }, "consumption_frequency": "Max X times per week" }"""


# Fresh produce analysis prompt
PRODUCE_SYSTEM_PROMPT = """You are a strict, medically-focused agricultural toxicologist. You will be given the name of a fresh fruit or vegetable. The user may also provide their Health Profile (Allergies, Medical Conditions, Diet Type).
Your task is to identify the common synthetic pesticides, chemical fertilizers, wax coatings, fungicides, and preservatives typically used in conventional farming and post-harvest processing for this specific produce.
ADHERE TO THE FOLLOWING STRICT GUIDELINES:
1. Be extremely aggressive in marking pesticides, waxes, and synthetic chemicals as 'harmful' or 'caution'.
2. If banned in EVEN ONE major country/region, mark it 'caution' minimum. List all countries.
3. Provide detailed toxicological risks.
4. Suggest organic alternatives or washing recommendations.
5. If the user provides a Health Profile, evaluate if any chemical poses a unique risk to their conditions. Set "user_conflict" to true for those chemicals.
6. Provide a personalized_verdict declaring if this conventional produce poses outsized risk for their specific profile.
7. Calculate a strict overall_safety_score (0-100).
8. Suggest a product_alternative: a real organic or safer brand/product alternative for this produce (e.g. specific organic brand), chosen with the user's health profile in mind.
9. Provide a consumption_frequency: how often this conventional produce can be safely consumed given the user health profile. Be strict and honest.
Respond ONLY in valid JSON with this exact structure — no preamble:
{ "ingredients": [ { "name": "", "status": "safe or caution or harmful", "reason": "Detailed toxicology risk", "banned_in": [""], "alternative": "", "user_conflict": false } ], "overall_safety_score": 0-100, "summary": "Clinical toxicology summary", "personalized_verdict": "Specific verdict for this user", "product_alternative": { "name": "Organic Product Name", "brand": "Brand Name", "why_better": "Why this is safer for the user", "where_to_find": "Health stores / Online" }, "consumption_frequency": "Max X times per week" }"""


# Helper function to clean Gemini JSON responses
def parse_gemini_response(response):
    if not response.text:
        raise ValueError("Gemini returned an empty response.")

    response_text = response.text.strip()

    if response_text.startswith("```json"):
        response_text = response_text[7:]

    elif response_text.startswith("```"):
        response_text = response_text[3:]

    if response_text.endswith("```"):
        response_text = response_text[:-3]

    return json.loads(response_text.strip())


# Extract text from uploaded food labels
@app.post("/api/extract-text")
async def extract_text(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        extracted_text = pytesseract.image_to_string(image)

        return {
            "extracted_text": extracted_text.strip()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Analyze food ingredients using Gemini
@app.post("/api/analyze")
async def analyze_ingredients(request: AnalyzeRequest):

    if not request.ingredients_text or not request.ingredients_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Ingredients text cannot be empty."
        )

    try:
        user_msg = f"Ingredients: {request.ingredients_text}"

        if request.user_profile:
            user_msg = (
                f"User Profile: {json.dumps(request.user_profile)}\n\n"
                + user_msg
            )

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=SYSTEM_PROMPT + "\n\n" + user_msg
        )

        return parse_gemini_response(response)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Analyze fresh fruits and vegetables using Gemini
@app.post("/api/analyze-produce")
async def analyze_produce(request: ProduceRequest):

    if not request.produce_name or not request.produce_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Produce name cannot be empty."
        )

    try:
        user_msg = f"Produce: {request.produce_name}"

        if request.user_profile:
            user_msg = (
                f"User Profile: {json.dumps(request.user_profile)}\n\n"
                + user_msg
            )

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=PRODUCE_SYSTEM_PROMPT + "\n\n" + user_msg
        )

        return parse_gemini_response(response)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Backend health check
@app.get("/api/health")
def health_check():
    return {
        "status": "ok"
    }
