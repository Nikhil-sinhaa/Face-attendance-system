"""Supabase client singleton — shared across all repository modules."""
from typing import Optional

from supabase import Client, create_client

from backend.app.core.config import settings

_supabase_client: Optional[Client] = None


def get_supabase() -> Client:
    """Return a lazy-initialised singleton Supabase client."""
    global _supabase_client
    if _supabase_client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            raise ValueError(
                "Supabase credentials missing. "
                "Ensure SUPABASE_URL and SUPABASE_KEY are set in the environment."
            )
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return _supabase_client
