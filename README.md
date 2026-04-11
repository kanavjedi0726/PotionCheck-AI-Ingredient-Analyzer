# PotionCheck 🧪

AI-Powered Ingredient Intelligence System

PotionCheck is a full-stack web application that allows users to scan barcodes, upload ingredient labels, or manually paste ingredient lists to get a comprehensive safety analysis powered by Claude AI and Open Food Facts.

## Tech Stack
* **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide Icons
* **Backend**: Python, FastAPI, Anthropic API (Claude), Pytesseract (OCR)

## Prerequisites

1. **Node.js** (v18+)
2. **Python** (3.10+)
3. **Tesseract OCR Binary** (Required for the `Upload Label` feature to work)
    - **Windows**: Install from [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki).
    - Ensure it is in your system's PATH, or provide the path in the `.env` file (e.g. `TESSERACT_CMD_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe`).
4. **Anthropic API Key**: Required for the core analysis.

## Setup Instructions

### 1. Backend Setup

Open a terminal and navigate to the `backend` directory:
```bash
cd backend
python -m venv venv
# Activate the virtual environment:
# On Windows: venv\Scripts\activate
# On macOS/Linux: source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory based on `.env.example`:
```env
ANTHROPIC_API_KEY=your_api_key_here
TESSERACT_CMD_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe  # Only needed if not in PATH
```

Run the FastAPI server:
```bash
uvicorn main:app --reload
```
The backend will run on `http://localhost:8000`.

### 2. Frontend Setup

Open a new terminal and navigate to the `frontend` directory:
```bash
cd frontend
npm install
```

Run the Vite development server:
```bash
npm run dev
```
The frontend will run on `http://localhost:3000` (or another port if 3000 is taken, check terminal output).

## Features
- **Barcode Lookup**: Fetches ingredients from the Open Food Facts API natively.
- **Image OCR**: Extracts text from images of food labels utilizing Google's Tesseract Engine.
- **AI Analysis**: Uses Claude to cross-examine ingredients and score them on a 100-point scale, checking for bans, and providing healthy alternatives.
- **Persistence**: Results are saved to LocalStorage across reloads.
