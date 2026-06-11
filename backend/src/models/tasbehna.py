"""
Pydantic models for Tasbehna database schema.
Generated from tasbe7na_20251226_124147.db
"""

from __future__ import annotations

from enum import IntEnum
from typing import Optional

from pydantic import BaseModel, Field


class ItemType(IntEnum):
    """Type of content item."""
    SONG = 1
    VERSE = 2
    BIBLE_CHAPTER = 3


class Testament(IntEnum):
    """Bible testament type."""
    OLD_TESTAMENT = 1
    NEW_TESTAMENT = 2


class VerseType(IntEnum):
    """Type of verse/stanza."""
    CHORUS = 1
    VERSE = 2
    BRIDGE = 3
    INTRO = 4
    OUTRO = 5


# Core Models

class Item(BaseModel):
    """Base item that can be a song, verse, or bible chapter."""
    id: Optional[int] = None
    item_id: int
    type: int
    metadata: Optional[str] = None


class Language(BaseModel):
    """Language definition."""
    id: Optional[int] = None
    native_name: str
    ar_name: str
    en_name: str
    metadata: Optional[str] = None


class Dialect(BaseModel):
    """Dialect of a language."""
    id: Optional[int] = None
    language: int = Field(..., description="Foreign key to languages.id")
    native_name: str
    ar_name: str
    en_name: str
    metadata: Optional[str] = None


# Song-related Models

class Song(BaseModel):
    """Song/hymn definition."""
    id: Optional[int] = None
    item_id: int = Field(..., description="Foreign key to items.item_id")
    title: str
    language: int = Field(..., description="Foreign key to languages.id")
    dialect: Optional[int] = Field(None, description="Foreign key to dialects.id")
    media_url: Optional[str] = None
    info_url: Optional[str] = None
    notes: Optional[str] = None
    metadata: Optional[str] = None


class SongScale(BaseModel):
    """Musical scale of a song."""
    id: Optional[int] = None
    song: int = Field(..., description="Foreign key to songs.id")
    scale: Optional[int] = None


class Category(BaseModel):
    """Song category."""
    id: Optional[int] = None
    ar_name: str
    en_name: str
    notes: Optional[str] = None
    metadata: Optional[str] = None


class SongCategory(BaseModel):
    """Many-to-many relationship between songs and categories."""
    id: Optional[int] = None
    song: int = Field(..., description="Foreign key to songs.id")
    category: int = Field(..., description="Foreign key to categories.id")


class Author(BaseModel):
    """Song author/lyricist."""
    id: Optional[int] = None
    ar_name: str
    en_name: str
    notes: Optional[str] = None
    metadata: Optional[str] = None


class SongAuthor(BaseModel):
    """Many-to-many relationship between songs and authors."""
    id: Optional[int] = None
    song: int = Field(..., description="Foreign key to songs.id")
    author: int = Field(..., description="Foreign key to authors.id")


class Composer(BaseModel):
    """Song composer."""
    id: Optional[int] = None
    ar_name: str
    en_name: str
    notes: Optional[str] = None
    metadata: Optional[str] = None


class SongComposer(BaseModel):
    """Many-to-many relationship between songs and composers."""
    id: Optional[int] = None
    song: int = Field(..., description="Foreign key to songs.id")
    composer: int = Field(..., description="Foreign key to composers.id")


class Translator(BaseModel):
    """Song translator."""
    id: Optional[int] = None
    ar_name: str
    en_name: str
    notes: Optional[str] = None
    metadata: Optional[str] = None


class SongTranslator(BaseModel):
    """Many-to-many relationship between songs and translators."""
    id: Optional[int] = None
    song: int = Field(..., description="Foreign key to songs.id")
    translator: int = Field(..., description="Foreign key to translators.id")


class Album(BaseModel):
    """Music album."""
    id: Optional[int] = None
    native_name: str
    ar_name: str
    en_name: str
    notes: Optional[str] = None
    metadata: Optional[str] = None


class SongAlbum(BaseModel):
    """Many-to-many relationship between songs and albums."""
    id: Optional[int] = None
    song: int = Field(..., description="Foreign key to songs.id")
    album: int = Field(..., description="Foreign key to albums.id")


class Team(BaseModel):
    """Performance team/choir."""
    id: Optional[int] = None
    native_name: str
    ar_name: str
    en_name: str
    notes: Optional[str] = None
    metadata: Optional[str] = None


class SongTeam(BaseModel):
    """Many-to-many relationship between songs and teams."""
    id: Optional[int] = None
    song: int = Field(..., description="Foreign key to songs.id")
    team: int = Field(..., description="Foreign key to teams.id")


class Country(BaseModel):
    """Country of origin."""
    id: Optional[int] = None
    ar_name: str
    en_name: str
    notes: Optional[str] = None
    metadata: Optional[str] = None


class SongCountry(BaseModel):
    """Many-to-many relationship between songs and countries."""
    id: Optional[int] = None
    song: int = Field(..., description="Foreign key to songs.id")
    country: int = Field(..., description="Foreign key to countries.id")


class SongVersion(BaseModel):
    """Relationship between original song and its versions."""
    id: Optional[int] = None
    original_item_id: int = Field(..., description="Foreign key to items.item_id")
    item_id: int = Field(..., description="Foreign key to items.item_id")


# Verse and Slide Models

class Verse(BaseModel):
    """Verse/stanza of a song."""
    id: Optional[int] = None
    item_id: int = Field(..., description="Foreign key to items.item_id")
    type: Optional[int] = None
    notes: Optional[str] = None
    metadata: Optional[str] = None


class Slide(BaseModel):
    """Presentation slide for a verse."""
    id: Optional[int] = None
    heading: Optional[str] = None
    verse: int = Field(..., description="Foreign key to verses.id")
    metadata: Optional[str] = None


class Segment(BaseModel):
    """Text segment within a slide."""
    id: Optional[int] = None
    slide: int = Field(..., description="Foreign key to slides.id")
    content: str
    metadata: Optional[str] = None


class Repetition(BaseModel):
    """Repetition marker for segments."""
    id: Optional[int] = None
    start_segment: int = Field(..., description="Foreign key to segments.id")
    end_segment: int = Field(..., description="Foreign key to segments.id")
    opening_position: int
    closing_position: int = Field(..., ge=1)
    repetitions: int = Field(..., ge=2)
    metadata: Optional[str] = None


class Comment(BaseModel):
    """Comment annotation on a segment."""
    id: Optional[int] = None
    segment: int = Field(..., description="Foreign key to segments.id")
    position: int = Field(..., ge=0)
    content: str
    metadata: Optional[str] = None


class Reference(BaseModel):
    """Cross-reference between segments."""
    id: Optional[int] = None
    target_segment: int = Field(..., description="Foreign key to segments.id")
    position: int = Field(..., ge=0)
    reference_segment: int = Field(..., description="Foreign key to segments.id")
    content: str
    metadata: Optional[str] = None


class ChordsPosition(BaseModel):
    """Chord notation at specific position in segment."""
    id: Optional[int] = None
    segment: int = Field(..., description="Foreign key to segments.id")
    position: int = Field(..., ge=0)
    chord: str
    metadata: Optional[str] = None


# Bible Models

class BibleTranslation(BaseModel):
    """Bible translation metadata."""
    id: Optional[int] = None
    copyrights: str
    publisher: str
    notes: Optional[str] = None
    url: Optional[str] = None
    language: int = Field(..., description="Foreign key to languages.id")
    dialect: Optional[int] = Field(None, description="Foreign key to dialects.id")
    metadata: Optional[str] = None


class BibleBook(BaseModel):
    """Bible book definition."""
    id: Optional[int] = None
    name: str
    testament: int
    notes: Optional[str] = None
    metadata: Optional[str] = None


class Book(BaseModel):
    """Bible book in a specific translation."""
    id: Optional[int] = None
    book: int = Field(..., description="Foreign key to bible_books.id")
    translation: int = Field(..., description="Foreign key to bible_translations.id")
    intro: Optional[str] = None
    title: str
    abbr: str
    notes: Optional[str] = None
    metadata: Optional[str] = None


class BibleChapter(BaseModel):
    """Chapter in a bible book."""
    id: Optional[int] = None
    book: int = Field(..., description="Foreign key to books.id")
    number: int
    metadata: Optional[str] = None


class Chapter(BaseModel):
    """Chapter content linked to item."""
    id: Optional[int] = None
    item_id: int = Field(..., description="Foreign key to items.item_id")
    bible_chapter: int = Field(..., description="Foreign key to bible_chapters.id")
    superscription: Optional[str] = None
    intro: Optional[str] = None
    notes: Optional[str] = None
    alias: Optional[str] = None
    metadata: Optional[str] = None


# Metadata

class DbMetadata(BaseModel):
    """Database metadata key-value pairs."""
    key: str
    value: str


# Search Models (FTS5 virtual table - not directly modeled as it's a virtual table)

class SearchItemsFTS(BaseModel):
    """Full-text search index for items."""
    title: Optional[str] = None
    keywords: Optional[str] = None
    content: Optional[str] = None
    type: Optional[str] = None
    item_id: Optional[int] = None
