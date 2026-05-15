"""
ai_helper.py — Unified AI generation helper using Groq (primary).

Get a free Groq API key at: https://console.groq.com/keys
Set GROQ_API_KEY in backend/.env
"""

import os
from typing import Optional


def _try_groq(prompt: str, model: str) -> Optional[str]:
    """Attempt Groq generation. Returns text or None on failure."""
    groq_key = os.environ.get("GROQ_API_KEY", "").strip()
    if not groq_key:
        return None
    try:
        from groq import Groq
        client = Groq(api_key=groq_key)
        completion = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1024,
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"[ai_helper] Groq error ({model}): {str(e)[:120]}")
        return None


def generate_text(prompt: str) -> tuple[str, str]:
    """
    Generate text using Groq.
    Returns (response_text, provider_name).
    Raises RuntimeError if all models fail.
    """
    groq_models = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "mixtral-8x7b-32768",
    ]
    for model in groq_models:
        result = _try_groq(prompt, model)
        if result:
            return result, f"groq/{model}"

    raise RuntimeError(
        "Groq AI is unavailable. "
        "Check your GROQ_API_KEY in backend/.env or visit https://console.groq.com/keys"
    )


async def generate_text_async(prompt: str) -> tuple[str, str]:
    """Async wrapper around generate_text (runs in thread pool)."""
    import asyncio
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, generate_text, prompt)
