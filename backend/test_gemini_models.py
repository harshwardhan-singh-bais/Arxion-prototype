import os
from google import genai
from dotenv import load_dotenv

# Load the environment variables from .env
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ Error: GEMINI_API_KEY is not set in the .env file or environment.")
    exit(1)

try:
    print("🔄 Initializing Google GenAI Client...")
    client = genai.Client(api_key=api_key)
    
    print("📡 Fetching available models for this specific API Key...")
    models = client.models.list()
    
    print("\n✅ AVAILABLE MODELS:")
    print("=" * 40)
    for m in models:
        # Print the model name (which is exactly what should be used in the code)
        print(f" - {m.name}")
        
    print("=" * 40)
    print("\n💡 Use the exact names above (e.g., 'gemini-1.5-flash' or 'text-embedding-004') in your app/core/gemini.py!")

except Exception as e:
    print(f"\n❌ FAILED TO FETCH MODELS: {e}")
    print("Ensure your API Key is valid and active on Google AI Studio.")
