import io
from typing import Any, Dict, List, Optional, Tuple
import dlib
import numpy as np
from PIL import Image
from sklearn.svm import SVC
from backend.app.core.config import settings

_detector = None
_shape_predictor = None
_face_rec_model = None


def get_dlib_models():
    """Lazy-load and cache dlib models."""
    global _detector, _shape_predictor, _face_rec_model
    if _detector is None or _shape_predictor is None or _face_rec_model is None:
        # Import the model package only when face recognition is actually used.
        # This keeps health checks, authentication, and the rest of the API
        # usable in installations where the optional model package is absent.
        try:
            import face_recognition_models
        except ImportError as exc:
            raise RuntimeError(
                "Face recognition models are not installed. Install the backend requirements."
            ) from exc
        _detector = dlib.get_frontal_face_detector()
        _shape_predictor = dlib.shape_predictor(
            face_recognition_models.pose_predictor_model_location()
        )
        _face_rec_model = dlib.face_recognition_model_v1(
            face_recognition_models.face_recognition_model_location()
        )
    return _detector, _shape_predictor, _face_rec_model

