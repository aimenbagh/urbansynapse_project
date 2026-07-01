"""Dépendances d'authentification et d'autorisation FastAPI."""
from datetime import datetime
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme),
                     db: Session = Depends(get_db)):
    from app.models.user import User
    email = decode_access_token(token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Compte bloqué. Contactez un administrateur.")
    if user.suspended_until and user.suspended_until > datetime.utcnow():
        raise HTTPException(
            status_code=403,
            detail=f"Compte suspendu jusqu'au {user.suspended_until.strftime('%d/%m/%Y %H:%M')}.")
    return user


def require_admin(user=Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    return user
