from datetime import datetime, timezone
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = Field(default="ONLINE", description="Health status of the AI service")
    service: str = Field(default="AgentHire AI Service", description="Service identifier")
    version: str = Field(default="1.0.0-PROD-READY", description="Service version")
    environment: str = Field(default="development", description="Execution environment")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="UTC timestamp of the check")
    details: Optional[Dict[str, Any]] = Field(default=None, description="System diagnostics")
