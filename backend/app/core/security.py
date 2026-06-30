"""JWT auth & password hashing helpers.

Utilise directement la lib `bcrypt` (et non passlib, devenu incompatible
avec bcrypt >= 5). bcrypt limite les mots de passe à 72 octets : on tronque
proprement pour éviter toute erreur.
"""
from datetime import datetime, timedelta, timezone
import bcrypt
from jose import jwt
from app.core.config import settings

ALGORITHM = "HS256"
_MAX_BCRYPT_BYTES = 72


def _to_bytes(password: str) -> bytes:
    return password.encode("utf-8")[:_MAX_BCRYPT_BYTES]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_to_bytes(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_to_bytes(plain), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return jwt.encode(
        {"sub": subject, "exp": expire}, settings.SECRET_KEY, algorithm=ALGORITHM
    )


def decode_access_token(token: str) -> str | None:
    """Retourne le 'sub' (email) si le token est valide, sinon None."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except Exception:
        return None
