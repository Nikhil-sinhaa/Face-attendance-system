from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse


app = FastAPI(
    title=settings.APP_NAME,
    version="2.0.0",
    description="Production-ready REST API for FaceVPlus Face & Voice Recognition Attendance System",
)
