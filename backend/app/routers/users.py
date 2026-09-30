from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.crud.user import get_user
from app.database import get_db
from app.schemas.user import UserOut

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(db: Session = Depends(get_db)):
    user = get_user(db, settings.default_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Default user not found. Run seed.")
    return user
