from fastapi import APIRouter, Query
from app.utils.password_utils import generate_password

router = APIRouter()


@router.get("/generate")
def generate(
    length: int = Query(default=16, ge=8, le=128),
    symbols: bool = Query(default=True),
    numbers: bool = Query(default=True),
):
    return {"password": generate_password(length, symbols, numbers)}
