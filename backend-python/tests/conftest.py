import os
from collections.abc import Iterator
from pathlib import Path
from tempfile import TemporaryDirectory

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# The starter app resets and seeds its database when imported. Point that import
# at a temporary file before importing the app, so tests never touch dummy.db.
_startup_db_dir = TemporaryDirectory(prefix="brex-pytest-")
os.environ["DATABASE_URL"] = f"sqlite:///{Path(_startup_db_dir.name) / 'startup.db'}"

from src.app.database.session import get_db  # noqa: E402
from src.app.main import app  # noqa: E402
from src.app.models.base import Base  # noqa: E402


@pytest.fixture
def client(tmp_path: Path) -> Iterator[TestClient]:
    engine = create_engine(
        f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=engine)
    testing_session = sessionmaker(bind=engine, autocommit=False, autoflush=False)

    def test_db():
        with testing_session() as db:
            yield db

    app.dependency_overrides[get_db] = test_db
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()
        engine.dispose()
