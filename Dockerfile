FROM python:3.9-slim

WORKDIR /app

# Copy requirements first for better caching
COPY api/requirements.txt api/backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the API code
COPY api ./api

# Expose port 8080 (Fly.io prefers this port)
EXPOSE 8080

# Start the FastAPI app with uvicorn
CMD ["uvicorn", "api.backend.main:app", "--host", "0.0.0.0", "--port", "8080"] 