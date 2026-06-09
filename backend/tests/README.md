# Tasbe7na Tests

This directory contains tests for the Tasbe7na database conversion functionality.

## Test Files

- **`test_tasbehna_conversion.py`** - Tests for converting Tasbe7na database to Hymnos format
- **`test_tasbehna_urls.py`** - Tests for Tasbe7na API endpoints availability
- **`test_tasbehna_download.py`** - Tests for database download and caching (marked as slow)

## Running Tests

### Prerequisites

Make sure you have the virtual environment activated:
```bash
source .venv/bin/activate
```

### Run All Tests

```bash
pytest tests/
```

### Run Specific Test File

```bash
pytest tests/test_tasbehna_conversion.py -v
```

### Run Tests Excluding Slow Ones

```bash
pytest tests/ -m "not slow"
```

### Run Only Slow Tests

```bash
pytest tests/ -m "slow"
```

### Run with Verbose Output

```bash
pytest tests/ -v -s
```

## Test Markers

- `slow` - Tests that take longer to run (e.g., downloading database)
- `network` - Tests that require network access
- `integration` - Integration tests

## Test Coverage

The test suite covers:

✅ **Conversion Tests** (16 tests)
- Data structure validation
- Arabic numbering (١, ٢, ٣, ق)
- Unique ID constraints
- Foreign key integrity
- Sequential slide positions
- Content presence validation

✅ **URL Tests** (5 tests)
- Secret endpoint availability
- Database endpoint availability
- Authentication requirements
- Response time validation

✅ **Download Tests** (6 tests - marked as slow)
- Temp directory creation
- SQLite format validation
- Caching mechanism
- Force download functionality
- Old file cleanup
- Schema validation

## Example Output

```
============================= test session starts ==============================
collected 21 items

tests/test_tasbehna_conversion.py::test_conversion_completes PASSED      [  4%]
tests/test_tasbehna_conversion.py::test_result_has_required_fields PASSED [  9%]
...
tests/test_tasbehna_urls.py::test_secret_endpoint_is_available PASSED    [ 80%]
...

====================== 21 passed in 57.26s ======================
```

## Notes

- The conversion tests use a fixture that loads the database once and reuses it across all tests for efficiency
- URL tests make actual HTTP requests to Tasbe7na servers
- Download tests are marked as `slow` and can be skipped with `-m "not slow"`
- The database is cached in the system temp directory (`/tmp/hymnos_tasbe7na/`)
