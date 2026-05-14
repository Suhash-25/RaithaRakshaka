"""
pv_app/config.py — redirects to the unified settings shim.
This replaces PV's original pydantic-settings config so that
pv_app modules work inside CarpulseAI backend without needing
a separate .env file or pydantic-settings inheritance chain.
"""
from pv_settings_shim import Settings, get_settings  # noqa: F401

__all__ = ["Settings", "get_settings"]
