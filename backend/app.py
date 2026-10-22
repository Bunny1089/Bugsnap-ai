import os
import httpx
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

from models import BugDraft, AnalyzeResponse
from analyzer import (
    validate_and_encode_image,
    analyze_screenshot_with_ollama,
    ImageValidationError,
    OllamaConnectionError,
    OllamaTimeoutError,
    OllamaServiceError,
    MAX_UPLOAD_SIZE_BYTES,
)

# Configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
TARGET_MODEL = os.getenv("BUG_MODEL", "gemma4:e2b")

app = FastAPI(
    title="BugSnap AI API",
    description="Local-first API converting bug screenshots into structured GitHub issue drafts using Gemma 4 E2B via Ollama.",
    version="0.1.0",
)

# CORS setup for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", summary="Service Information")
async def root():
    return {
        "service": "BugSnap AI API",
        "status": "running",
        "version": "0.1.0",
        "inference_engine": "Local Ollama",
        "target_model": TARGET_MODEL,
        "docs_url": "/docs",
        "health_url": "/health",
        "analyze_url": "/analyze",
        "privacy": "100% local processing; screenshots are not transmitted to external or cloud AI APIs.",
    }


@app.get("/health", summary="System Health & Ollama Status")
async def health_check():
    ollama_reachable = False
    model_available = False
    installed_models: List[str] = []
    message = "Service running."

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                ollama_reachable = True
                data = resp.json()
                raw_models = data.get("models", [])
                installed_models = [m.get("name", "") for m in raw_models if isinstance(m, dict)]
                
                # Check for target model
                for name in installed_models:
                    if name == TARGET_MODEL or name.startswith(f"{TARGET_MODEL}:") or TARGET_MODEL in name:
                        model_available = True
                        break

                if not model_available:
                    message = f"Ollama is reachable, but model '{TARGET_MODEL}' was not found in installed models."
                else:
                    message = f"Local inference engine and model '{TARGET_MODEL}' are ready."
            else:
                message = f"Ollama returned HTTP status {resp.status_code}."
    except httpx.ConnectError:
        message = f"Cannot connect to Ollama at {OLLAMA_BASE_URL}. Ensure Ollama is running (`ollama serve`)."
    except httpx.TimeoutException:
        message = f"Connection to Ollama timed out at {OLLAMA_BASE_URL}."
    except Exception as exc:
        message = f"Ollama health check encountered an error: {str(exc)}"

    overall_status = "ok" if (ollama_reachable and model_available) else "degraded"

    return {
        "status": overall_status,
        "service": "bugsnap-ai-backend",
        "ollama_reachable": ollama_reachable,
        "model_available": model_available,
        "target_model": TARGET_MODEL,
        "installed_models": installed_models,
        "message": message,
    }


@app.post(
    "/analyze",
    response_model=AnalyzeResponse,
    summary="Analyze bug screenshot with local Gemma 4 E2B",
    description="Processes an uploaded screenshot (PNG, JPEG, WebP) and returns a structured GitHub issue draft.",
)
async def analyze_screenshot(
    file: UploadFile = File(..., description="Screenshot image file (PNG, JPEG, WebP, max 10MB)"),
    context: Optional[str] = Form(None, description="Optional description of what the user was doing"),
    mode: str = Form("standard", description="Analysis mode ('standard' or 'beginner')"),
):
    if mode not in ("standard", "beginner"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid mode. Allowed values are 'standard' or 'beginner'.",
        )

    # Validate and read file in-memory
    try:
        file_bytes = await file.read()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(exc)}",
        )

    # Image validation
    try:
        image_b64, img_format, width, height = validate_and_encode_image(
            file_bytes, declared_content_type=file.content_type
        )
    except ImageValidationError as exc:
        err_msg = str(exc)
        status_code = (
            413
            if "exceeds maximum allowed size" in err_msg
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=status_code, detail=err_msg)

    # Perform local vision inference via Ollama
    try:
        draft, was_retried = await analyze_screenshot_with_ollama(
            image_base64=image_b64,
            context=context,
            mode=mode,
            base_url=OLLAMA_BASE_URL,
            model=TARGET_MODEL,
            timeout=120.0,
        )
        return AnalyzeResponse(
            status="success",
            draft=draft,
            model=TARGET_MODEL,
            retried=was_retried,
        )
    except OllamaConnectionError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        )
    except OllamaTimeoutError as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=str(exc),
        )
    except OllamaServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during screenshot analysis: {str(exc)}",
        )
