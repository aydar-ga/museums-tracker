.PHONY: install run test lint format format-check type-check check pre-commit-check

install:
	poetry install --no-root

run:
	FLASK_DEBUG=1 poetry run python app.py

test:
	poetry run pytest

lint:
	poetry run flake8 .

format:
	poetry run black .

format-check:
	poetry run black --check .

type-check:
	poetry run mypy app.py tests

# The full local sweep; CI runs exactly this.
check: format-check lint type-check test

pre-commit-check:
	poetry run pre-commit run --all-files
