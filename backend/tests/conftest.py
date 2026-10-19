"""
Project JEEVAN — Pytest Configuration & Shared Fixtures
Configures an isolated in-memory SQLite database using StaticPool for consistent test isolation.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
import models
from main import app

# Shared in-memory SQLite with StaticPool so all threads/sessions share the same tables
TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=test_engine
)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_test_db():
    """Ensure database tables exist before each test and clear them afterwards."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    """Provides a fresh FastAPI TestClient."""
    return TestClient(app)


@pytest.fixture
def test_db():
    """Provides a direct database session for testing."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
