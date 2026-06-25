.PHONY: run dev migrate test

run:
	poetry run gunicorn -c gunicorn_conf.py app.main:app

dev:
	poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

migrate:
	poetry run alembic upgrade head

test:
	poetry run pytest
