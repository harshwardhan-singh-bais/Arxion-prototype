import google.generativeai as genai
import os

try:
    genai.configure(api_key=os.environ.get('GEMINI_API_KEY', 'AIzaSyCZX0IX7ct35Z_OblDANiYQdE24d_c-onQ'))
    models = genai.list_models()
    print("ALL MODELS:")
    for m in models:
        print(f" - {m.name} | Supported Gen Methods: {m.supported_generation_methods}")
except Exception as e:
    print(f"ERROR: {e}")
