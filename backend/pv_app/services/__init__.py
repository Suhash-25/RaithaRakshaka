"""Backend service modules.

Textbook extraction pulls in optional PDF dependencies, so expose those helpers
without importing them during lightweight analysis/explanation requests.
"""

__all__ = [
    "extract_dataset",
    "extract_pdf_document",
    "write_extracted_document",
]


def __getattr__(name):
    if name in __all__:
        from .textbook_extraction import extract_dataset, extract_pdf_document, write_extracted_document

        exports = {
            "extract_dataset": extract_dataset,
            "extract_pdf_document": extract_pdf_document,
            "write_extracted_document": write_extracted_document,
        }
        return exports[name]
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
