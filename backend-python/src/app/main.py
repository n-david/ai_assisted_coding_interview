from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import accounts
from .database.seed import seed_database
from .database.session import SessionLocal, engine
from .models.base import Base
from .models.transfer import Transfer  # noqa: F401  # registers the transfers table for create_all

# Drop and recreate database tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

# Seed the database
db = SessionLocal()
try:
    seed_database(db)
except Exception as e:
    print(f"Error seeding database: {e}")
finally:
    db.close()

app = FastAPI(title="Brex Interview Playground")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include REST API routers
app.include_router(accounts.router, prefix="/api")
