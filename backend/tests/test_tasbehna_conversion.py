"""
Tests for Tasbe7na to Hymnos conversion functionality.
"""
import pytest
from utils.tasbehna import convert_tasbe7na_to_hymnos, get_tasbe7na_sqlite_db


@pytest.fixture(scope="module")
def test_db_path():
    """Fixture to provide test database path.

    Downloads database if not cached, or uses cached version.
    """
    try:
        db_path = get_tasbe7na_sqlite_db()
        return str(db_path)
    except Exception as e:
        pytest.skip(f"Could not get Tasbe7na database: {e}")


@pytest.fixture(scope="module")
def conversion_result(test_db_path):
    """Fixture to perform conversion once and reuse across tests."""
    return convert_tasbe7na_to_hymnos(test_db_path)


def test_conversion_completes(conversion_result):
    """Test that conversion completes successfully."""
    assert conversion_result is not None


def test_result_has_required_fields(conversion_result):
    """Test that result has all required fields."""
    assert conversion_result.hymn is not None, "Hymns list should not be None"
    assert conversion_result.slide is not None, "Slides list should not be None"
    assert conversion_result.slide_row is not None, "Slide rows list should not be None"
    assert conversion_result.pack is not None, "Packs list should not be None"
    assert conversion_result.content is not None, "Content list should not be None"


def test_conversion_produces_data(conversion_result):
    """Test that conversion produces actual data."""
    assert len(conversion_result.hymn) > 0, "Should have at least one hymn"
    assert len(conversion_result.slide) > 0, "Should have at least one slide"
    assert len(conversion_result.slide_row) > 0, "Should have at least one slide row"
    assert len(conversion_result.pack) > 0, "Should have at least one pack"
    assert len(conversion_result.content) > 0, "Should have at least one content item"

    print(f"\n✓ Conversion produced:")
    print(f"  - Hymns: {len(conversion_result.hymn)}")
    print(f"  - Slides: {len(conversion_result.slide)}")
    print(f"  - Slide Rows: {len(conversion_result.slide_row)}")
    print(f"  - Packs: {len(conversion_result.pack)}")
    print(f"  - Content items: {len(conversion_result.content)}")


def test_first_hymn_structure(conversion_result):
    """Test that first hymn has expected structure."""
    first_hymn = conversion_result.hymn[0]

    assert first_hymn.id is not None, "Hymn should have an ID"
    assert first_hymn.name is not None, "Hymn should have a name"

    print(f"\n✓ First hymn:")
    print(f"  - Name: {first_hymn.name}")
    print(f"  - Author: {first_hymn.author}")
    print(f"  - Composer: {first_hymn.composer}")


def test_hymn_has_slides(conversion_result):
    """Test that hymns have associated slides."""
    first_hymn = conversion_result.hymn[0]
    hymn_slides = [s for s in conversion_result.slide if s.content_id == first_hymn.id]

    assert len(hymn_slides) > 0, "Hymn should have at least one slide"

    print(f"\n✓ First hymn has {len(hymn_slides)} slides")


def test_slides_have_rows(conversion_result):
    """Test that slides have associated rows."""
    first_slide = conversion_result.slide[0]
    slide_rows = [r for r in conversion_result.slide_row if r.slide_id == first_slide.id]

    assert len(slide_rows) > 0, "Slide should have at least one row"


def test_arabic_numbering(conversion_result):
    """Test that Arabic numbering is present in headers."""
    headers_found = set()
    for row in conversion_result.slide_row:
        if row.header:
            headers_found.add(row.header)

    # Should have at least chorus (ق) and some verse numbers
    assert "(ق)" in headers_found, "Should have chorus header (ق)"

    arabic_verse_headers = [h for h in headers_found if h.startswith("(") and h != "(ق)"]
    assert len(arabic_verse_headers) > 0, "Should have Arabic verse number headers"

    print(f"\n✓ Found headers: {sorted(headers_found)[:10]}")


def test_unique_hymn_ids(conversion_result):
    """Test that all hymn IDs are unique."""
    hymn_ids = [h.id for h in conversion_result.hymn]
    assert len(hymn_ids) == len(set(hymn_ids)), "Duplicate hymn IDs found"


def test_unique_slide_ids(conversion_result):
    """Test that all slide IDs are unique."""
    slide_ids = [s.id for s in conversion_result.slide]
    assert len(slide_ids) == len(set(slide_ids)), "Duplicate slide IDs found"


def test_unique_row_ids(conversion_result):
    """Test that all row IDs are unique."""
    row_ids = [r.id for r in conversion_result.slide_row]
    assert len(row_ids) == len(set(row_ids)), "Duplicate row IDs found"


def test_unique_content_ids(conversion_result):
    """Test that all content IDs are unique."""
    content_ids = [c.id for c in conversion_result.content]
    assert len(content_ids) == len(set(content_ids)), "Duplicate content IDs found"


def test_foreign_key_integrity_slides_to_content(conversion_result):
    """Test that all slides reference valid content IDs."""
    content_ids = {c.id for c in conversion_result.content}

    for slide in conversion_result.slide:
        assert slide.content_id in content_ids, \
            f"Slide {slide.id} references non-existent content ID: {slide.content_id}"


def test_foreign_key_integrity_rows_to_slides(conversion_result):
    """Test that all rows reference valid slide IDs."""
    slide_ids = {s.id for s in conversion_result.slide}

    for row in conversion_result.slide_row:
        assert row.slide_id in slide_ids, \
            f"Row {row.id} references non-existent slide ID: {row.slide_id}"


def test_pack_contains_all_hymns(conversion_result):
    """Test that pack items reference all content."""
    assert len(conversion_result.pack) == 1, "Should have exactly one pack"

    pack = conversion_result.pack[0]
    pack_item_content_ids = {pi.content_id for pi in conversion_result.pack_item}
    content_ids = {c.id for c in conversion_result.content}

    assert pack_item_content_ids == content_ids, \
        "Pack items should reference all content items"


def test_slide_positions_are_sequential(conversion_result):
    """Test that slides have sequential positions within each content."""
    first_hymn = conversion_result.hymn[0]
    hymn_slides = sorted(
        [s for s in conversion_result.slide if s.content_id == first_hymn.id],
        key=lambda s: s.position
    )

    positions = [s.position for s in hymn_slides]
    expected_positions = list(range(len(hymn_slides)))

    assert positions == expected_positions, \
        f"Slide positions should be sequential starting from 0, got {positions[:10]}"


def test_slide_rows_have_content(conversion_result):
    """Test that slide rows have non-empty content."""
    for row in conversion_result.slide_row[:10]:  # Check first 10
        assert row.content is not None, f"Row {row.id} has None content"
        assert len(row.content.strip()) > 0, f"Row {row.id} has empty content"
