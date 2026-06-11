"""
Tests for Tasbe7na URL availability and API endpoints.
"""
import pytest
import requests


TASBE7NA_SECRET_URL = "https://tasbe7na.com/get-secret"
TASBE7NA_DATABASE_URL = "https://tasbe7na.com/get-database"


def test_secret_endpoint_is_available():
    """Test that the Tasbe7na secret endpoint is accessible."""
    response = requests.get(TASBE7NA_SECRET_URL, timeout=10)

    assert response.status_code == 200, f"Secret endpoint returned status {response.status_code}"
    assert response.text, "Secret endpoint returned empty response"
    assert len(response.text.strip()) > 0, "Secret is empty"

    print(f"✓ Secret endpoint is accessible")
    print(f"  Secret length: {len(response.text.strip())} characters")


def test_database_endpoint_is_available():
    """Test that the Tasbe7na database endpoint is accessible with a valid secret."""
    # First get the secret
    secret_response = requests.get(TASBE7NA_SECRET_URL, timeout=10)
    assert secret_response.status_code == 200, "Failed to get secret"

    secret = secret_response.text.strip()

    # Test database endpoint with secret
    headers = {"X-Db-Secret": secret}
    response = requests.get(TASBE7NA_DATABASE_URL, headers=headers, timeout=30)

    assert response.status_code == 200, f"Database endpoint returned status {response.status_code}"
    assert response.content, "Database endpoint returned empty response"

    # Verify it's actually a SQLite database
    # SQLite databases start with "SQLite format 3\x00"
    assert response.content[:15] == b'SQLite format 3', "Response is not a valid SQLite database"

    print(f"✓ Database endpoint is accessible")
    print(f"  Database size: {len(response.content)} bytes ({len(response.content) / 1024 / 1024:.2f} MB)")


def test_database_endpoint_requires_secret():
    """Test that the database endpoint requires a valid secret."""
    # Try without secret header
    response = requests.get(TASBE7NA_DATABASE_URL, timeout=10)

    # Should fail without secret (expecting 401 or 403)
    assert response.status_code in [401, 403, 400], \
        f"Expected unauthorized status, got {response.status_code}"

    print(f"✓ Database endpoint properly requires authentication")


@pytest.mark.parametrize("url,timeout", [
    (TASBE7NA_SECRET_URL, 10),
    (TASBE7NA_DATABASE_URL, 10),
])
def test_endpoints_respond_quickly(url, timeout):
    """Test that endpoints respond within reasonable time."""
    import time

    if url == TASBE7NA_DATABASE_URL:
        # Need secret for database endpoint
        secret_response = requests.get(TASBE7NA_SECRET_URL, timeout=10)
        headers = {"X-Db-Secret": secret_response.text.strip()}
    else:
        headers = {}

    start = time.time()
    response = requests.get(url, headers=headers, timeout=timeout)
    elapsed = time.time() - start

    assert response.status_code == 200, f"Endpoint failed with status {response.status_code}"
    print(f"✓ {url} responded in {elapsed:.2f}s")
