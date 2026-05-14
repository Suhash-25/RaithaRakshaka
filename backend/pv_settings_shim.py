"""
pv_settings_shim.py
Bridges PV's pydantic-settings config into CarpulseAI backend.
Since CarpulseAI doesn't use pydantic-settings, this file provides
the Settings class that pv_app expects, reading from environment
variables / CarpulseAI's .env file.
"""
import os
from pathlib import Path
from functools import lru_cache

# Root of CarpulseAI backend (where this file lives)
CARPULSE_BACKEND_ROOT = Path(__file__).resolve().parent


class Settings:
    """Drop-in replacement for PV's pydantic-based Settings."""

    # App
    app_env: str      = os.getenv("APP_ENV", "development")
    app_host: str     = os.getenv("APP_HOST", "0.0.0.0")
    app_port: int     = int(os.getenv("APP_PORT", "8000"))
    app_title: str    = "Unified AI Learning Platform"
    app_version: str  = "1.0.0"

    # CORS (inherited from CarpulseAI's main.py which sets allow_origins=["*"])
    cors_origins: list = ["*"]

    # AI Providers
    openai_api_key: str | None    = os.getenv("OPENAI_API_KEY")
    google_ai_api_key: str | None = os.getenv("GOOGLE_API_KEY")
    deepseek_api_key: str | None  = os.getenv("DEEPSEEK_API_KEY")
    deepseek_base_url: str  = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    deepseek_model: str     = os.getenv("DEEPSEEK_MODEL", "deepseek-v4-flash")
    deepseek_timeout: float = float(os.getenv("DEEPSEEK_TIMEOUT", "6.0"))
    deepseek_enabled: bool  = os.getenv("DEEPSEEK_ENABLED", "true").lower() == "true"

    # Ollama (local model)
    ollama_base_url: str    = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    ollama_model: str       = os.getenv("OLLAMA_MODEL", "mistral")
    ollama_timeout: float   = float(os.getenv("OLLAMA_TIMEOUT", "8.0"))
    ollama_enabled: bool    = os.getenv("OLLAMA_ENABLED", "true").lower() == "true"

    # Textbook data paths (relative to CarpulseAI backend root)
    textbook_dataset_root: Path = CARPULSE_BACKEND_ROOT / "textbook_dataset"
    textbook_extracted_root: Path = CARPULSE_BACKEND_ROOT / "generated" / "textbooks"

    @property
    def is_development(self) -> bool:
        return self.app_env.lower() == "development"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Returns a cached Settings singleton."""
    return Settings()
