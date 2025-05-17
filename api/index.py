from backend.main import app

# api/index.py
from mangum import Mangum            # ASGI-to-AWS-Lambda adapter
from api.backend.main import app     # your FastAPI instance

handler = Mangum(app)                # Vercel looks for “handler”