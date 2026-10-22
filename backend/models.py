from pydantic import BaseModel, Field
from typing import List, Optional


class BugDraft(BaseModel):
    title: str = Field(description="Descriptive issue title, e.g. [Bug]: Button overlaps header")
    summary: str = Field(description="High-level 1-2 sentence summary of what is seen")
    actual_behavior: str = Field(description="Observed behavior based strictly on visible or supplied evidence")
    expected_behavior: str = Field(default="Unknown", description="Expected behavior, or 'Unknown' if not provided")
    steps_to_reproduce: List[str] = Field(default_factory=list, description="Ordered steps; 'Unknown' if missing")
    environment: str = Field(default="Unknown", description="Environment info visible or supplied, or 'Unknown'")
    visible_evidence: List[str] = Field(default_factory=list, description="Concrete visible UI elements, error codes, text")
    user_context: Optional[str] = Field(default=None, description="Context explicitly supplied by user, or None")
    hypotheses: List[str] = Field(default_factory=list, description="Potential root causes labeled as hypotheses")
    missing_information: List[str] = Field(default_factory=list, description="Follow-up questions for the reporter")
    suggested_severity: Optional[str] = Field(default="Medium (Suggested)", description="Suggested severity level labeled as suggestion")
    suggested_category: Optional[str] = Field(default="Functional (Suggested)", description="Suggested bug category labeled as suggestion")
    sensitive_data: List[str] = Field(default_factory=list, description="Descriptions of any visible secrets or personal data, without copying values")
    beginner_notes: Optional[str] = Field(default=None, description="Beginner contributor notes if mode is beginner")
    fix_hints: List[str] = Field(default_factory=list, description="Up to 3 short speculative fix hints or guesses")
    markdown_draft: str = Field(default="", description="Complete GitHub-flavored Markdown text")


class AnalyzeResponse(BaseModel):
    status: str
    draft: BugDraft
    model: str
    disclaimer: str = (
        "This is an automated issue draft generated locally by Gemma 4 E2B from a screenshot. "
        "It is not proof that the bug has been verified or reproduced."
    )
    retried: bool = False
