from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DATABASE_URL = "postgresql://greenchip@localhost/aura_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    org_name = Column(String(255), nullable=False)
    industry = Column(String(100))
    employees = Column(Integer)
    risk_score = Column(Float)
    risk_level = Column(String(20))
    financial_exposure = Column(Integer)
    has_mfa = Column(Boolean)
    mfa_coverage = Column(Integer)
    patch_days = Column(Integer)
    training_percent = Column(Integer)
    has_irp = Column(Boolean)
    vulnerabilities = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()