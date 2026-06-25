import multiprocessing
import os

from app.settings import get_settings

settings = get_settings()

port = os.environ.get("PORT", "8000")
bind = f"0.0.0.0:{port}"
workers = settings.gunicorn_workers or max(2, multiprocessing.cpu_count() * 2 + 1)
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120
keepalive = 5
accesslog = "-"
errorlog = "-"
loglevel = settings.log_level.lower()
