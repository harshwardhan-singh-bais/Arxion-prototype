"""
Simple in-memory paper store.
Keys are paper_id (str). Values are PaperInDB dicts (serialized).
This acts as our lightweight state layer before we add a persistent SQL/Mongo DB.
"""
from app.models.paper import PaperInDB, PaperStatus

_store: dict[str, dict] = {}


def save_paper(paper: PaperInDB) -> None:
    _store[paper.id] = paper.model_dump()


def get_paper(paper_id: str) -> PaperInDB | None:
    data = _store.get(paper_id)
    if data is None:
        return None
    return PaperInDB(**data)


def update_paper(paper: PaperInDB) -> None:
    _store[paper.id] = paper.model_dump()


def list_papers() -> list[PaperInDB]:
    return [PaperInDB(**d) for d in _store.values()]


def delete_paper(paper_id: str) -> bool:
    if paper_id in _store:
        del _store[paper_id]
        return True
    return False
