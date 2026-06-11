"""
Tests for Tasbe7na database download and caching functionality.
"""
import pytest
from pathlib import Path
import tempfile
import shutil
from utils.tasbehna import get_tasbe7na_sqlite_db


@pytest.fixture
def clean_temp_dir():
    """Fixture to clean up temp directory before and after test."""
    temp_dir = Path(tempfile.gettempdir()) / "hymnos_tasbe7na"

    # Clean up before test
    if temp_dir.exists():
        shutil.rmtree(temp_dir)

    yield temp_dir

    # Clean up after test
    if temp_dir.exists():
        shutil.rmtree(temp_dir)


@pytest.mark.slow
def test_download_creates_temp_directory(clean_temp_dir):
    """Test that download creates the temp directory."""
    db_path = get_tasbe7na_sqlite_db()

    assert clean_temp_dir.exists(), "Temp directory should be created"
    assert db_path.parent == clean_temp_dir, "Database should be in temp directory"


@pytest.mark.slow
def test_downloaded_file_is_sqlite_database(clean_temp_dir):
    """Test that downloaded file is a valid SQLite database."""
    db_path = get_tasbe7na_sqlite_db()

    assert db_path.exists(), "Database file should exist"
    assert db_path.suffix == ".db", "Database should have .db extension"

    # Check SQLite magic bytes
    with open(db_path, 'rb') as f:
        header = f.read(16)
        assert header[:15] == b'SQLite format 3', "File should be a valid SQLite database"


@pytest.mark.slow
def test_caching_works(clean_temp_dir):
    """Test that subsequent calls use cached database."""
    # First download
    db_path1 = get_tasbe7na_sqlite_db()
    mtime1 = db_path1.stat().st_mtime

    # Second call should use cache
    db_path2 = get_tasbe7na_sqlite_db()
    mtime2 = db_path2.stat().st_mtime

    assert db_path1 == db_path2, "Should return same cached file"
    assert mtime1 == mtime2, "File should not be re-downloaded"


@pytest.mark.slow
def test_force_download_bypasses_cache(clean_temp_dir):
    """Test that force_download=True downloads fresh database."""
    import time

    # First download
    db_path1 = get_tasbe7na_sqlite_db()

    # Wait a moment to ensure different timestamp
    time.sleep(1)

    # Force new download
    db_path2 = get_tasbe7na_sqlite_db(force_download=True)

    assert db_path1 != db_path2, "Should create new file when forcing download"
    assert db_path1.exists(), "Old cached file should still exist"
    assert db_path2.exists(), "New downloaded file should exist"


@pytest.mark.slow
def test_old_cached_files_are_cleaned_up(clean_temp_dir):
    """Test that only 3 most recent cached files are kept."""
    import time

    # Download 5 databases
    for i in range(5):
        get_tasbe7na_sqlite_db(force_download=True)
        if i < 4:  # Don't sleep after last one
            time.sleep(1)

    # Check that only 3 files remain
    cached_files = list(clean_temp_dir.glob("tasbe7na_*.db"))
    assert len(cached_files) == 3, f"Should keep only 3 cached files, found {len(cached_files)}"


@pytest.mark.slow
def test_database_has_expected_tables(clean_temp_dir):
    """Test that downloaded database has expected schema."""
    import sqlite3

    db_path = get_tasbe7na_sqlite_db()

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get list of tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = {row[0] for row in cursor.fetchall()}

    # Check for key tables
    expected_tables = {'songs', 'verses', 'slides', 'segments', 'authors', 'composers'}
    assert expected_tables.issubset(tables), \
        f"Database should have expected tables. Missing: {expected_tables - tables}"

    conn.close()
