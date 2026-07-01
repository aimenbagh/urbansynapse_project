"""Gestion des utilisateurs — réservée aux administrateurs."""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import require_admin, get_current_user
from app.core.security import hash_password

router = APIRouter(prefix="/users", tags=["users"])


def _public(u) -> dict:
    return {
        "id": u.id, "email": u.email, "full_name": u.full_name,
        "role": u.role, "is_active": u.is_active,
        "suspended_until": u.suspended_until.isoformat() if u.suspended_until else None,
        "status": ("bloqué" if not u.is_active
                   else "suspendu" if (u.suspended_until and u.suspended_until > datetime.utcnow())
                   else "actif"),
    }


@router.get("")
def list_users(db: Session = Depends(get_db), admin=Depends(require_admin)):
    from app.models.user import User
    return [_public(u) for u in db.query(User).order_by(User.id).all()]


class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str
    role: str = "user"


@router.post("")
def create_user(payload: UserCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    from app.models.user import User
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(400, "Cet email est déjà utilisé")
    role = payload.role if payload.role in ("admin", "user") else "user"
    u = User(email=payload.email, full_name=payload.full_name,
             hashed_password=hash_password(payload.password), role=role)
    db.add(u); db.commit(); db.refresh(u)
    return _public(u)


class SuspendPayload(BaseModel):
    days: int = 7


@router.post("/{user_id}/suspend")
def suspend_user(user_id: int, payload: SuspendPayload,
                 db: Session = Depends(get_db), admin=Depends(require_admin)):
    from app.models.user import User
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(404, "Utilisateur introuvable")
    if u.id == admin.id:
        raise HTTPException(400, "Vous ne pouvez pas vous suspendre vous-même")
    u.suspended_until = datetime.utcnow() + timedelta(days=payload.days)
    db.commit(); db.refresh(u)
    return _public(u)


@router.post("/{user_id}/unsuspend")
def unsuspend_user(user_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    from app.models.user import User
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(404, "Utilisateur introuvable")
    u.suspended_until = None
    db.commit(); db.refresh(u)
    return _public(u)


@router.post("/{user_id}/block")
def block_user(user_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    from app.models.user import User
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(404, "Utilisateur introuvable")
    if u.id == admin.id:
        raise HTTPException(400, "Vous ne pouvez pas vous bloquer vous-même")
    u.is_active = False
    db.commit(); db.refresh(u)
    return _public(u)


@router.post("/{user_id}/unblock")
def unblock_user(user_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    from app.models.user import User
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(404, "Utilisateur introuvable")
    u.is_active = True
    db.commit(); db.refresh(u)
    return _public(u)


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    from app.models.user import User
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(404, "Utilisateur introuvable")
    if u.id == admin.id:
        raise HTTPException(400, "Vous ne pouvez pas vous supprimer vous-même")
    db.delete(u); db.commit()
    return {"message": "Utilisateur supprimé", "id": user_id}
