"""Language utilities for Hymnos application.

This module provides language data and utilities for managing languages in the database.
"""

import uuid
from typing import Dict, List, Optional
from models.openapi import Language

# Language definitions with all required properties
# Each language gets a unique UUID generated with uuid7()
LANGUAGES: List[Language] = [
    Language(
        id=uuid.uuid7(),
        language_code="ar",
        variant=None,
        name="العربية",
        is_rtl=True,
    ),
    Language(
        id=uuid.uuid7(),
        language_code="en",
        variant=None,
        name="English",
        is_rtl=False,
    ),
    Language(
        id=uuid.uuid7(),
        language_code="de",
        variant=None,
        name="Deutsch",
        is_rtl=False,
    ),
    Language(
        id=uuid.uuid7(),
        language_code="es",
        variant=None,
        name="Español",
        is_rtl=False,
    ),
    Language(
        id=uuid.uuid7(),
        language_code="fr",
        variant=None,
        name="Français",
        is_rtl=False,
    ),
    Language(
        id=uuid.uuid7(),
        language_code="cop",
        variant=None,
        name="Coptic",
        is_rtl=False,
    ),
    Language(
        id=uuid.uuid7(),
        language_code="la",
        variant=None,
        name="Latin",
        is_rtl=False,
    ),
    Language(
        id=uuid.uuid7(),
        language_code="el",
        variant=None,
        name="Ελληνικά",
        is_rtl=False,
    ),
    Language(
        id=uuid.uuid7(),
        language_code="he",
        variant=None,
        name="עברית",
        is_rtl=True,
    ),
    Language(
        id=uuid.uuid7(),
        language_code="nl",
        variant=None,
        name="Nederlands",
        is_rtl=False,
    ),
    Language(
        id=uuid.uuid7(),
        language_code="am",
        variant=None,
        name="አማርኛ",
        is_rtl=False,
    ),
    Language(
        id=uuid.uuid7(),
        language_code="syr",
        variant=None,
        name="ܣܘܪܝܝܐ",
        is_rtl=True,
    ),
    Language(
        id=uuid.uuid7(),
        language_code="zh",
        variant=None,
        name="中文",
        is_rtl=False,
    ),
]

# Create lookup dictionaries for easy access
LANGUAGE_BY_CODE: Dict[str, Language] = {lang.language_code: lang for lang in LANGUAGES}
LANGUAGE_BY_ID: Dict[uuid.UUID, Language] = {lang.id: lang for lang in LANGUAGES}


def get_language_id(language_code: str) -> Optional[uuid.UUID]:
    """Get the UUID for a language by its code.

    Args:
        language_code: ISO 639 language code (e.g., 'en', 'ar', 'cop')

    Returns:
        The UUID for the language, or None if not found
    """
    lang = LANGUAGE_BY_CODE.get(language_code)
    return lang.id if lang else None


def get_arabic_language_id() -> uuid.UUID:
    """Get the UUID for the Arabic language.

    Returns:
        The UUID for Arabic language
    """
    return LANGUAGE_BY_CODE["ar"].id


def get_english_language_id() -> uuid.UUID:
    """Get the UUID for the English language.

    Returns:
        The UUID for English language
    """
    return LANGUAGE_BY_CODE["en"].id


def get_coptic_language_id() -> uuid.UUID:
    """Get the UUID for the Coptic language.

    Returns:
        The UUID for Coptic language
    """
    return LANGUAGE_BY_CODE["cop"].id


def get_language_by_id(language_id: uuid.UUID) -> Optional[Language]:
    """Get a language object by its UUID.

    Args:
        language_id: The UUID of the language

    Returns:
        The Language object, or None if not found
    """
    return LANGUAGE_BY_ID.get(language_id)


def get_all_languages() -> List[Language]:
    """Get all defined languages.

    Returns:
        A list of all Language objects
    """
    return LANGUAGES.copy()
