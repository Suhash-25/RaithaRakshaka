"""
routes/__init__.py — makes routes a package and exports a single aggregated router.
"""

from fastapi import APIRouter

from .analyze  import router as analyze_router
from .explain  import router as explain_router
from .local_explanation import router as local_explanation_router
from .syllabus import router as syllabus_router
from .validate import router as validate_router

api_router = APIRouter()

api_router.include_router(analyze_router)
api_router.include_router(explain_router)
api_router.include_router(local_explanation_router)
api_router.include_router(syllabus_router)
api_router.include_router(validate_router)

__all__ = ["api_router"]
