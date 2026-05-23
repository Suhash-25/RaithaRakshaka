import os
import httpx
from fastapi import APIRouter
from pydantic import BaseModel
import json
import re
from typing import List

router = APIRouter()
TRANSLATION_CACHE = {}

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "kn": "Kannada",
}

class TranslateRequest(BaseModel):
    text: str
    target_lang: str
    source_lang: str = "en"

class TranslateBatchRequest(BaseModel):
    texts: List[str]
    target_lang: str
    source_lang: str = "en"

def cache_key(text: str, source_lang: str, target_lang: str) -> str:
    return f"{source_lang}:{target_lang}:{text}"

def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()

def extract_json_array(raw: str):
    if not raw:
        return None
    text = raw.strip()
    if text.startswith("```"):
        text = text.strip("`").strip()
        if text.startswith("json"):
            text = text[4:].strip()
    start = text.find("[")
    end = text.rfind("]")
    if start == -1 or end == -1:
        return None
    try:
        parsed = json.loads(text[start : end + 1])
        return parsed if isinstance(parsed, list) else None
    except Exception:
        return None

def should_skip(text: str) -> bool:
    value = clean_text(text)
    return not value or not re.search(r"[A-Za-z]", value)

def detect_language(text: str, preferred: str = "auto") -> str:
    value = text or ""
    if re.search(r"[\u0C80-\u0CFF]", value):
        return "kn"
    if re.search(r"[\u0900-\u097F]", value):
        return "hi"
    preferred = preferred if preferred in LANGUAGE_NAMES else "auto"
    if preferred != "auto":
        return preferred
    kannada_latin = [
        "ragi", "bisi", "bele", "holige", "mannu", "neeru", "soppu", "jola", "akki",
        "raita", "raitha", "krushi", "huli", "gidda", "tengu", "adike",
    ]
    hindi_latin = [
        "kisan", "fasal", "kheti", "mitti", "paani", "beej", "khad", "rog", "daam",
        "mandi", "gehu", "chawal", "pyaz", "tamatar", "aloo",
    ]
    lowered = value.lower()
    kn_score = sum(1 for word in kannada_latin if re.search(rf"\b{re.escape(word)}\b", lowered))
    hi_score = sum(1 for word in hindi_latin if re.search(rf"\b{re.escape(word)}\b", lowered))
    if kn_score > hi_score and kn_score:
        return "kn"
    if hi_score > kn_score and hi_score:
        return "hi"
    return "en"

def has_kannada(text: str) -> bool:
    return bool(re.search(r"[\u0C80-\u0CFF]", text or ""))

def has_devanagari(text: str) -> bool:
    return bool(re.search(r"[\u0900-\u097F]", text or ""))

def has_wrong_script(target_lang: str, text: str) -> bool:
    if target_lang == "hi":
        return has_kannada(text)
    if target_lang == "kn":
        return has_devanagari(text)
    return False

def valid_translation_list(target_lang: str, translated: List[str], expected: int) -> bool:
    return len(translated) == expected and not any(has_wrong_script(target_lang, item) for item in translated)

async def translate_with_niutrans(texts: List[str], target_lang: str) -> List[str] | None:
    api_key = os.getenv("NIUTRANS_API_KEY", "")
    if not api_key:
        return None
    translated = []
    try:
        async with httpx.AsyncClient(timeout=6) as client:
            for text in texts:
                res = await client.get(
                    "http://api.niutrans.com/NiuTransServer/translation",
                    params={"apikey": api_key, "src_text": text, "from": "en", "to": target_lang},
                )
                data = res.json()
                if "tgt_text" not in data:
                    return None
                translated.append(data.get("tgt_text") or text)
        return translated if valid_translation_list(target_lang, translated, len(texts)) else None
    except Exception:
        return None

async def translate_with_chat_provider(texts: List[str], target_lang: str) -> List[str] | None:
    target_name = LANGUAGE_NAMES.get(target_lang, target_lang)
    source_name = "English"
    system = (
        "You are a professional agriculture product UI translator for Indian farmers. "
        "Translate from English to the requested Indian language with natural, accurate wording. "
        "Preserve brand names like RaithaRakshak/KrishiRakshak, API names, crop names when commonly used, numbers, units, prices, URLs, and emojis. "
        "Return ONLY a valid JSON array of strings, in the exact same order and length as the input."
    )
    prompt = json.dumps(
        {
            "source_language": source_name,
            "target_language": target_name,
            "texts": texts,
        },
        ensure_ascii=False,
    )

    groq_key = os.getenv("GROQ_API_KEY", "")
    if groq_key:
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                res = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
                    json={
                        "model": os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
                        "messages": [
                            {"role": "system", "content": system},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.05,
                        "max_tokens": 4096,
                    },
                )
                res.raise_for_status()
                parsed = extract_json_array(res.json()["choices"][0]["message"]["content"])
                if parsed and valid_translation_list(target_lang, [str(item) for item in parsed], len(texts)):
                    return [str(item) for item in parsed]
        except Exception:
            pass

    openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
    if openrouter_key:
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                res = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {openrouter_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "http://localhost:5173",
                        "X-Title": "RaithaRakshaka AI",
                    },
                    json={
                        "model": os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.1-8b-instruct:free"),
                        "messages": [
                            {"role": "system", "content": system},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.05,
                        "max_tokens": 4096,
                    },
                )
                res.raise_for_status()
                parsed = extract_json_array(res.json()["choices"][0]["message"]["content"])
                if parsed and valid_translation_list(target_lang, [str(item) for item in parsed], len(texts)):
                    return [str(item) for item in parsed]
        except Exception:
            pass

    return None

async def translate_many(texts: List[str], target_lang: str, source_lang: str = "en") -> List[str]:
    if target_lang == source_lang or target_lang == "en":
        return texts

    results = list(texts)
    pending = []
    pending_indexes = []
    for index, text in enumerate(texts):
        if should_skip(text):
            continue
        key = cache_key(text, source_lang, target_lang)
        if key in TRANSLATION_CACHE:
            results[index] = TRANSLATION_CACHE[key]
        else:
            pending.append(text)
            pending_indexes.append(index)

    if not pending:
        return results

    translated = None
    if len(pending) <= 20:
        translated = await translate_with_niutrans(pending, target_lang)
    translated = translated or await translate_with_chat_provider(pending, target_lang)

    if translated and len(translated) == len(pending):
        for index, translated_text in zip(pending_indexes, translated):
            value = translated_text.strip() or texts[index]
            if has_wrong_script(target_lang, value):
                value = texts[index]
            TRANSLATION_CACHE[cache_key(texts[index], source_lang, target_lang)] = value
            results[index] = value

    return results

@router.post("/api/translate")
async def translate_text(req: TranslateRequest):
    translated = await translate_many([req.text], req.target_lang, req.source_lang)
    return {"translated": translated[0]}

@router.post("/api/translate/batch")
async def translate_batch(req: TranslateBatchRequest):
    texts = [text or "" for text in req.texts[:120]]
    translated = await translate_many(texts, req.target_lang, req.source_lang)
    return {"translated": translated}
