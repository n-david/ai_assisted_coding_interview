import os

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dummy.db")


def configure_sqlite_immediate_transactions(engine: Engine) -> None:
    """Make every transaction on this SQLite engine acquire a write lock up front.

    Applied to both the app's engine and each test's isolated engine (see
    tests/conftest.py), so tests actually exercise the same locking behavior
    as production instead of silently running against unprotected SQLite.
    """

    @event.listens_for(engine, "connect")
    def _disable_pysqlite_implicit_transactions(dbapi_connection, connection_record):
        # pysqlite normally opens its own transaction (via an implicit BEGIN) the
        # moment a statement runs, and only lets us pick DEFERRED/IMMEDIATE/EXCLUSIVE
        # for that. Disabling it lets the "begin" hook below issue a real
        # `BEGIN IMMEDIATE` for every SQLAlchemy transaction instead.
        dbapi_connection.isolation_level = None

    @event.listens_for(engine, "begin")
    def _begin_immediate_transaction(conn):
        # Acquire SQLite's reserved write lock at the start of every transaction,
        # so concurrent transfers serialize instead of racing on a
        # read-balance-then-write-balance check (SQLite has no row-level
        # SELECT ... FOR UPDATE). The `timeout` connect_arg makes a blocked
        # transaction wait for the lock rather than immediately raising
        # "database is locked".
        conn.exec_driver_sql("BEGIN IMMEDIATE")


engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 30},
)
configure_sqlite_immediate_transactions(engine)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
