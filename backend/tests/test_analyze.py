import io
import json
import pytest
import httpx
from PIL import Image
from fastapi.testclient import TestClient
from unittest.mock import patch

from app import app
from analyzer import generate_markdown, parse_and_validate_response

client = TestClient(app)


def create_test_image(format_name: str = "PNG", size=(100, 100), color="blue") -> bytes:
    """Helper to generate in-memory valid image bytes."""
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format=format_name)
    return buf.getvalue()


def test_analyze_invalid_format():
    """Verify upload of non-image file is rejected with 400."""
    response = client.post(
        "/analyze",
        files={"file": ("test.txt", b"this is not an image", "text/plain")},
        data={"context": "Testing invalid file"},
    )
    assert response.status_code == 400
    assert "corrupted" in response.json()["detail"].lower() or "unsupported" in response.json()["detail"].lower()


def test_analyze_corrupted_image():
    """Verify upload of fake PNG header with garbage content is rejected with 400."""
    corrupted_bytes = b"\x89PNG\r\n\x1a\n" + b"garbage_random_bytes_corrupted_file"
    response = client.post(
        "/analyze",
        files={"file": ("corrupted.png", corrupted_bytes, "image/png")},
    )
    assert response.status_code == 400
    assert "failed" in response.json()["detail"].lower() or "corrupted" in response.json()["detail"].lower()


def test_analyze_too_small_dimensions():
    """Verify tiny images (e.g. 4x4 px) are rejected."""
    tiny_img = create_test_image(format_name="PNG", size=(4, 4))
    response = client.post(
        "/analyze",
        files={"file": ("tiny.png", tiny_img, "image/png")},
    )
    assert response.status_code == 400
    assert "too small" in response.json()["detail"].lower()


def test_analyze_oversized_upload():
    """Verify uploads exceeding 10MB are rejected with 413."""
    oversized_bytes = b"0" * (10 * 1024 * 1024 + 1024)
    response = client.post(
        "/analyze",
        files={"file": ("huge.png", oversized_bytes, "image/png")},
    )
    assert response.status_code == 413
    assert "exceeds maximum allowed size" in response.json()["detail"].lower()


def test_analyze_successful_mocked():
    """Verify full successful flow with mocked Ollama vision response."""
    valid_png = create_test_image(format_name="PNG", size=(200, 150))
    mock_model_output = {
        "title": "[Bug]: 404 error when clicking Profile settings",
        "summary": "The profile page shows an HTTP 404 error banner.",
        "actual_behavior": "A red 404 Not Found error box is rendered in the center.",
        "expected_behavior": "Profile edit form should be visible.",
        "steps_to_reproduce": ["Navigate to Dashboard", "Click Profile in top navigation"],
        "environment": "Chrome 120 on macOS",
        "visible_evidence": ["Banner reads '404: Route /user/profile not found'", "Status code 404"],
        "hypotheses": ["API route might be misconfigured in reverse proxy"],
        "missing_information": ["Were any errors logged in browser console?"],
        "markdown_draft": "# [Bug]: 404 error when clicking Profile settings\n\n## 📝 Summary\n...",
    }

    mock_resp = httpx.Response(
        status_code=200,
        json={"message": {"content": json.dumps(mock_model_output)}},
        request=httpx.Request("POST", "http://127.0.0.1:11434/api/chat"),
    )

    async def mock_post(*args, **kwargs):
        return mock_resp

    with patch("httpx.AsyncClient.post", new=mock_post):
        response = client.post(
            "/analyze",
            files={"file": ("screenshot.png", valid_png, "image/png")},
            data={"context": "I clicked on profile settings"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["model"] == "gemma4:e2b"
        assert "disclaimer" in data
        assert data["draft"]["title"] == "[Bug]: 404 error when clicking Profile settings"
        assert len(data["draft"]["visible_evidence"]) == 2
        assert len(data["draft"]["steps_to_reproduce"]) == 2
        assert "markdown_draft" in data["draft"]


def test_analyze_ollama_unreachable():
    """Verify 503 is returned when Ollama server is unreachable."""
    valid_png = create_test_image(format_name="PNG")

    async def mock_post(*args, **kwargs):
        raise httpx.ConnectError("Connection refused")

    with patch("httpx.AsyncClient.post", new=mock_post):
        response = client.post(
            "/analyze",
            files={"file": ("screenshot.png", valid_png, "image/png")},
        )
        assert response.status_code == 503
        assert "could not connect to ollama" in response.json()["detail"].lower()


def test_analyze_ollama_timeout():
    """Verify 504 is returned when Ollama inference times out."""
    valid_png = create_test_image(format_name="PNG")

    async def mock_post(*args, **kwargs):
        raise httpx.TimeoutException("Read timed out")

    with patch("httpx.AsyncClient.post", new=mock_post):
        response = client.post(
            "/analyze",
            files={"file": ("screenshot.png", valid_png, "image/png")},
        )
        assert response.status_code == 504
        assert "timed out" in response.json()["detail"].lower()


def test_analyze_malformed_model_output_fallback():
    """Verify parser gracefully handles non-JSON model output."""
    raw_garbage = "I looked at the image. Here is the bug: The submit button is disabled. I think it is broken."
    draft = parse_and_validate_response(raw_garbage)
    assert draft.title.startswith("[Bug]")
    assert draft.actual_behavior != ""
    assert draft.expected_behavior == "Unknown"
    assert draft.steps_to_reproduce == ["Unknown - exact reproduction steps not supplied"]
    assert "## 📝 Summary" in draft.markdown_draft
    assert "Gemma 4 E2B" in draft.markdown_draft


def test_generate_markdown_formatting():
    """Verify markdown generator produces all required GitHub issue sections."""
    sample = {
        "title": "[Bug]: Modal dialog cannot be closed",
        "summary": "Closing X button does not dismiss modal",
        "actual_behavior": "Modal remains on screen after clicking close",
        "expected_behavior": "Modal dismisses",
        "steps_to_reproduce": ["Open modal", "Click X"],
        "environment": "Unknown",
        "visible_evidence": ["Modal visible", "Close button visible"],
        "hypotheses": ["Event listener not attached"],
        "missing_information": ["Browser version"],
    }
    md = generate_markdown(sample)
    assert "# [Bug]: Modal dialog cannot be closed" in md
    assert "## 📝 Summary" in md
    assert "## 🔍 Actual Behavior (Observed)" in md
    assert "## 🎯 Expected Behavior" in md
    assert "## 🔁 Suggested Reproduction Steps (Requires Verification)" in md
    assert "## 💻 Environment" in md
    assert "## 📸 Visible Evidence (Directly Observed)" in md
    assert "## 💡 Hypotheses (Unverified Possible Causes)" in md
    assert "## ❓ Missing Information / Follow-up Questions" in md
    assert "Note:" in md


def test_regression_unsupported_reproduction_steps_defaults_to_unknown():
    """Regression test: Ensure empty or missing reproduction steps never invent facts."""
    incomplete_json = json.dumps({
        "title": "[Bug]: Blank white screen on checkout",
        "summary": "Page is blank",
        "actual_behavior": "White viewport with no elements",
        "expected_behavior": "Checkout form",
        "steps_to_reproduce": [],
        "environment": "Unknown",
        "visible_evidence": ["Completely blank screen"],
        "hypotheses": ["JavaScript bundle failed to mount"],
        "missing_information": ["URL visited", "Console errors"],
    })
    draft = parse_and_validate_response(incomplete_json)
    assert draft.steps_to_reproduce == ["Unknown - exact reproduction steps not supplied"]
    assert "Unknown - exact reproduction steps not supplied" in draft.markdown_draft


def test_regression_evidence_vs_user_context_separation():
    """Regression test: Ensure user context is cleanly segregated from directly observed evidence."""
    mock_model_output = json.dumps({
        "title": "[Bug]: 500 Internal Server Error banner",
        "summary": "500 banner is displayed",
        "actual_behavior": "Red banner with error code 500",
        "expected_behavior": "Dashboard loads",
        "steps_to_reproduce": ["Unknown - exact reproduction steps not supplied"],
        "environment": "Unknown",
        "visible_evidence": ["Error 500: Internal Server Error"],
        "hypotheses": ["Backend service failed to respond"],
        "missing_information": ["Were there errors in network tab?"],
    })
    user_context = "I was testing the search endpoint with special characters"
    draft = parse_and_validate_response(mock_model_output, user_context=user_context)

    assert draft.user_context == user_context
    assert "## 👤 Reporter Context" in draft.markdown_draft
    assert user_context in draft.markdown_draft
    assert "## 📸 Visible Evidence (Directly Observed)" in draft.markdown_draft
    # Visible evidence must not be polluted by user context
    assert draft.visible_evidence == ["Error 500: Internal Server Error"]


def test_regression_ambiguous_screenshot_handling():
    """Regression test: Ambiguous screenshot with no visible error code leaves environment Unknown and asks for info."""
    ambiguous_json = json.dumps({
        "title": "[Bug]: Layout shift on navbar elements",
        "summary": "Navbar items overlap search bar",
        "actual_behavior": "Elements positioned at overlapping coordinates",
        "expected_behavior": "Unknown",
        "steps_to_reproduce": ["Unknown - exact reproduction steps not supplied"],
        "environment": "Unknown",
        "visible_evidence": ["Search input overlaps navigation links"],
        "hypotheses": ["CSS flexbox wrapping rule missing", "Viewport media query breakpoint misconfigured"],
        "missing_information": ["What browser and viewport width was used?", "Did resizing window change the layout?"],
    })
    draft = parse_and_validate_response(ambiguous_json)
    assert draft.environment == "Unknown"
    assert draft.expected_behavior == "Unknown"
    assert len(draft.hypotheses) == 2
    assert len(draft.missing_information) == 2


def test_regression_prefixed_and_fenced_json_parsing():
    """Regression test: Model conversational preamble or trailing explanation is safely extracted."""
    wrapped_content = (
        "Here is the issue analysis based on the uploaded image:\n\n"
        "```json\n"
        "{\n"
        '  "title": "[Bug]: Null pointer exception in payment modal",\n'
        '  "summary": "Exception stack trace visible",\n'
        '  "actual_behavior": "Uncaught NullPointerException displayed in modal",\n'
        '  "expected_behavior": "Payment form should render",\n'
        '  "steps_to_reproduce": ["Click Pay Now"],\n'
        '  "environment": "Unknown",\n'
        '  "visible_evidence": ["NullPointerException at PaymentService.process (line 104)"],\n'
        '  "hypotheses": ["paymentMethod object is null"],\n'
        '  "missing_information": ["Which payment method was selected?"]\n'
        "}\n"
        "```\n\n"
        "Hope this issue report is helpful!"
    )
    draft = parse_and_validate_response(wrapped_content)
    assert draft.title == "[Bug]: Null pointer exception in payment modal"
    assert "PaymentService.process" in draft.visible_evidence[0]
    assert draft.environment == "Unknown"


def test_regression_suggested_severity_and_category_labeling():
    """Regression test: Ensure suggested severity and category always retain the '(Suggested)' suffix."""
    raw_json = json.dumps({
        "title": "[Bug]: CSS overflow on mobile screen",
        "summary": "Horizontal scrollbar appears",
        "actual_behavior": "Page overflows horizontally by 30px",
        "expected_behavior": "No horizontal scroll",
        "steps_to_reproduce": ["Unknown - exact reproduction steps not supplied"],
        "environment": "Unknown",
        "visible_evidence": ["Horizontal scrollbar at bottom"],
        "hypotheses": ["Container width set to 100vw instead of 100%"],
        "missing_information": ["Device screen resolution"],
        "suggested_severity": "Low",
        "suggested_category": "UI / Layout",
    })
    draft = parse_and_validate_response(raw_json)
    assert "(Suggested)" in draft.suggested_severity
    assert "(Suggested)" in draft.suggested_category
    assert "Suggested Severity:" in draft.markdown_draft
    assert "Suggested Category:" in draft.markdown_draft


def test_analyze_invalid_mode():
    """Verify invalid mode returns HTTP 400."""
    valid_png = create_test_image(format_name="PNG")
    response = client.post(
        "/analyze",
        files={"file": ("screenshot.png", valid_png, "image/png")},
        data={"mode": "advanced_hacker"},
    )
    assert response.status_code == 400
    assert "invalid mode" in response.json()["detail"].lower()


def test_analyze_beginner_mode_and_sensitive_data():
    """Verify beginner mode passes beginner_notes and sensitive_data is populated and sanitized."""
    valid_png = create_test_image(format_name="PNG")
    mock_model_output = {
        "title": "[Bug]: Cart drawer item counter broken",
        "summary": "Item count shows NaN when adding item",
        "actual_behavior": "Counter displays NaN",
        "expected_behavior": "Counter displays 1",
        "steps_to_reproduce": ["Click add to cart"],
        "environment": "Unknown",
        "visible_evidence": ["NaN visible inside badge"],
        "hypotheses": ["item.quantity is undefined before increment"],
        "missing_information": [],
        "suggested_severity": "Medium",
        "suggested_category": "Functional",
        "sensitive_data": [
            "API key visible in header banner",
            "sk-proj-1234567890abcdef1234567890",  # Raw secret: must be dropped
            "User email visible in footer",
        ],
        "beginner_notes": "Difficulty: Easy. Look at cart/counter.js and verify that quantity is initialized to 0.",
    }

    mock_resp = httpx.Response(
        status_code=200,
        json={"message": {"content": json.dumps(mock_model_output)}},
        request=httpx.Request("POST", "http://127.0.0.1:11434/api/chat"),
    )

    async def mock_post(*args, **kwargs):
        return mock_resp

    with patch("httpx.AsyncClient.post", new=mock_post):
        response = client.post(
            "/analyze",
            files={"file": ("screenshot.png", valid_png, "image/png")},
            data={"mode": "beginner"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["retried"] is False
        draft = data["draft"]
        assert draft["beginner_notes"] is not None
        assert "Easy" in draft["beginner_notes"]
        assert "Contributor Notes (Good First Issue)" in draft["markdown_draft"]
        # Sensitive data check
        assert len(draft["sensitive_data"]) == 2
        assert "API key visible in header banner" in draft["sensitive_data"]
        assert "User email visible in footer" in draft["sensitive_data"]
        assert "sk-proj-1234567890abcdef1234567890" not in draft["sensitive_data"]


def test_analyze_retry_on_malformed_json():
    """Verify backend automatically retries when the first model output is malformed JSON."""
    valid_png = create_test_image(format_name="PNG")
    malformed_resp = httpx.Response(
        status_code=200,
        json={"message": {"content": "I am not returning JSON today. Just text."}},
        request=httpx.Request("POST", "http://127.0.0.1:11434/api/chat"),
    )

    valid_output = {
        "title": "[Bug]: Recovered on retry",
        "summary": "Recovered from retry",
        "actual_behavior": "Actual bug",
        "expected_behavior": "Expected bug fix",
        "steps_to_reproduce": ["Unknown"],
        "environment": "Unknown",
        "visible_evidence": ["Evidence"],
        "hypotheses": [],
        "missing_information": [],
    }

    success_resp = httpx.Response(
        status_code=200,
        json={"message": {"content": json.dumps(valid_output)}},
        request=httpx.Request("POST", "http://127.0.0.1:11434/api/chat"),
    )

    call_count = 0

    async def mock_post(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return malformed_resp
        return success_resp

    with patch("httpx.AsyncClient.post", new=mock_post):
        response = client.post(
            "/analyze",
            files={"file": ("screenshot.png", valid_png, "image/png")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["retried"] is True
        assert call_count == 2
        assert data["draft"]["title"] == "[Bug]: Recovered on retry"



