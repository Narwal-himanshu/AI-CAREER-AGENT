import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

# Configuration Settings
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "0.0.0.0")

if not GEMINI_API_KEY:
    # Print a warning but don't crash immediately so user can set it later
    print("WARNING: GEMINI_API_KEY is not set in environment or .env file.")
