from sqlalchemy.orm import Session
from app.models.user import User


def get_user(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_default_user(db: Session) -> User | None:
    """Return the first user in the DB (used when no auth is present)."""
    return db.query(User).order_by(User.id).first()
