# backend/services/ml_service.py
# ML service stub — no vehicle cost prediction in academic domain.
# Kept for structural compatibility.


class MLService:
    def __init__(self):
        self.model = None

    def is_ready(self) -> bool:
        return False


# Single shared instance
ml_service = MLService()
