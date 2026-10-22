import pytest
import httpx
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from app import app, TARGET_MODEL

client = TestClient(app)


def test_root_endpoint():
    """Verify that root endpoint returns service info and privacy notice."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "BugSnap AI API"
    assert data["status"] == "running"
    assert data["target_model"] == TARGET_MODEL
    assert "privacy" in data
    assert "local" in data["privacy"].lower()


def test_health_endpoint_live():
    """Verify health endpoint against currently running local Ollama environment."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "bugsnap-ai-backend"
    assert data["target_model"] == TARGET_MODEL
    # Ollama is running on this machine with gemma4:e2b
    assert data["ollama_reachable"] is True
    assert data["model_available"] is True
    assert data["status"] == "ok"


def test_health_endpoint_offline_simulation():
    """Verify health endpoint gracefully degrades when Ollama is unreachable."""
    async def mock_get(*args, **kwargs):
        raise httpx.ConnectError("Connection refused")

    with patch("httpx.AsyncClient.get", new=mock_get):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "degraded"
        assert data["ollama_reachable"] is False
        assert data["model_available"] is False
        assert "Cannot connect to Ollama" in data["message"]


def test_health_endpoint_missing_model_simulation():
    """Verify health endpoint degrades gracefully when target model is not installed."""
    mock_resp = httpx.Response(
        status_code=200,
        json={"models": [{"name": "some-other-model:latest"}]},
        request=httpx.Request("GET", "http://127.0.0.1:11434/api/tags"),
    )

    async def mock_get(*args, **kwargs):
        return mock_resp

    with patch("httpx.AsyncClient.get", new=mock_get):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "degraded"
        assert data["ollama_reachable"] is True
        assert data["model_available"] is False
        assert "was not found" in data["message"]
