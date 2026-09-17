"""
Pytest configuration, fixtures, and mocks for testing the Rental Agreement Assistant.
"""

import os
from pathlib import Path
from typing import Generator
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.config import Settings, get_settings


FIXTURES_DIR = Path(__file__).parent / "fixtures"


def get_test_settings() -> Settings:
    """Return test settings with mocked key and lower limits."""
    return Settings(
        gemini_api_key="test-api-key-12345",
        gemini_model="gemini-2.5-flash",
        max_file_size_mb=5,
        rate_limit_per_minute=100,
        debug=True,
    )


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Provide a FastAPI TestClient with test settings override."""
    app = create_app()
    app.dependency_overrides[get_settings] = get_test_settings
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_lease_path() -> Path:
    """Path to sample lease fixture."""
    return FIXTURES_DIR / "sample_lease.txt"


@pytest.fixture
def sample_lease_text(sample_lease_path: Path) -> str:
    """Read sample lease fixture into string."""
    return sample_lease_path.read_text(encoding="utf-8")


@pytest.fixture
def safe_lease_path() -> Path:
    """Path to safe lease fixture."""
    return FIXTURES_DIR / "safe_lease.txt"


@pytest.fixture
def safe_lease_text(safe_lease_path: Path) -> str:
    """Read safe lease fixture into string."""
    return safe_lease_path.read_text(encoding="utf-8")


@pytest.fixture
def foreign_lease_path() -> Path:
    """Path to non-English lease fixture."""
    return FIXTURES_DIR / "foreign_lease.txt"


@pytest.fixture
def foreign_lease_text(foreign_lease_path: Path) -> str:
    """Read foreign lease fixture into string."""
    return foreign_lease_path.read_text(encoding="utf-8")


@pytest.fixture
def injection_lease_path() -> Path:
    """Path to prompt injection lease fixture."""
    return FIXTURES_DIR / "injection_lease.txt"


@pytest.fixture
def injection_lease_text(injection_lease_path: Path) -> str:
    """Read injection lease fixture into string."""
    return injection_lease_path.read_text(encoding="utf-8")


@pytest.fixture
def corrupted_pdf_path() -> Path:
    """Path to corrupted PDF fixture."""
    return FIXTURES_DIR / "corrupted_sample.pdf"
