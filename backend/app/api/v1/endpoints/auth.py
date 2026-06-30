"""Endpoints d'authentification : login, inscription, profil courant."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import verify_password, hash_password, create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginIn(BaseModel):
    email: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class RegisterIn(BaseModel):
    email: str
    full_name: str
    password: str
    role: str = "analyst"


def _user_public(u) -> dict:
    return {"id": u.id, "email": u.email, "full_name": u.full_name, "role": u.role}


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    from app.models.user import User
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Compte désactivé")
    token = create_access_token(user.email)
    return TokenOut(access_token=token, user=_user_public(user))


@router.post("/register", response_model=TokenOut)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    from app.models.user import User
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    user = User(email=payload.email, full_name=payload.full_name,
                hashed_password=hash_password(payload.password),
                role=payload.role if payload.role in ("admin", "planner", "analyst") else "analyst")
    db.add(user); db.commit(); db.refresh(user)
    token = create_access_token(user.email)
    return TokenOut(access_token=token, user=_user_public(user))


@router.get("/me")
def me(user=Depends(get_current_user)):
    return _user_public(user)
