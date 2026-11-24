from fastapi import APIRouter

from app.api.routes import attendance, auth, employees, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(attendance.router)
api_router.include_router(employees.router)
api_router.include_router(users.router)
