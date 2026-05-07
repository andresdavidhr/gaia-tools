import pytest
from fastapi.testclient import TestClient
from app.main import app


def pytest_configure(config):
    config.addinivalue_line("markers", "integration: tests que requieren red y dependencias externas")


@pytest.fixture(scope="session")
def client():
    return TestClient(app)
