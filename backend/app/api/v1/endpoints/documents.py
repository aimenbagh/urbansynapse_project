"""Gestion des documents (Word/Excel/PDF).

- Upload et suppression : administrateurs uniquement.
- Consultation (liste, aperçu, téléchargement) : tout utilisateur connecté.
Les fichiers sont stockés en base (BLOB) pour fonctionner sans stockage externe.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import require_admin, get_current_user

router = APIRouter(prefix="/documents", tags=["documents"])

# Types autorisés
_ALLOWED = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "word",
    "application/msword": "word",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "excel",
    "application/vnd.ms-excel": "excel",
}
# Fallback par extension
_EXT = {".pdf": "pdf", ".docx": "word", ".doc": "word", ".xlsx": "excel", ".xls": "excel"}

MAX_SIZE = 25 * 1024 * 1024  # 25 Mo


def _meta(d) -> dict:
    return {
        "id": d.id, "title": d.title, "filename": d.filename,
        "file_type": d.file_type, "content_type": d.content_type,
        "size_bytes": d.size_bytes, "uploaded_by": d.uploaded_by,
        "created_at": d.created_at.isoformat() if d.created_at else None,
    }


@router.get("")
def list_documents(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Liste tous les documents (accessible à tout utilisateur connecté)."""
    from app.models.document import Document
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    return [_meta(d) for d in docs]


@router.post("")
async def upload_document(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin=Depends(require_admin),  # ADMIN uniquement
):
    from app.models.document import Document
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(413, "Fichier trop volumineux (max 25 Mo)")

    # Déterminer le type
    ftype = _ALLOWED.get(file.content_type or "")
    if not ftype:
        ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
        ftype = _EXT.get(ext)
    if not ftype:
        raise HTTPException(400, "Type non autorisé. Seuls Word, Excel et PDF sont acceptés.")

    doc = Document(
        title=title, filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
        file_type=ftype, size_bytes=len(content),
        data=content, uploaded_by=admin.email,
    )
    db.add(doc); db.commit(); db.refresh(doc)
    return _meta(doc)


@router.get("/{doc_id}/content")
def get_document_content(doc_id: int, download: bool = False,
                         db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Renvoie le fichier (aperçu inline par défaut, ou téléchargement)."""
    from app.models.document import Document
    d = db.get(Document, doc_id)
    if not d:
        raise HTTPException(404, "Document introuvable")
    disp = "attachment" if download else "inline"
    return Response(
        content=d.data, media_type=d.content_type,
        headers={"Content-Disposition": f'{disp}; filename="{d.filename}"'},
    )


@router.delete("/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    """Supprime un document (ADMIN uniquement)."""
    from app.models.document import Document
    d = db.get(Document, doc_id)
    if not d:
        raise HTTPException(404, "Document introuvable")
    db.delete(d); db.commit()
    return {"message": "Document supprimé", "id": doc_id}
