# Changelog

All notable changes to this project will be documented in this file.

## [Future]

- ...

## [1.1.1] - 2026-11-23

Maintenance release. No new features.

### Fixed

- The live site now runs on gunicorn instead of Flask's debug development server.
- The Docker build works again: Poetry is pinned to 2.5.2 and dependencies install from `poetry.lock`.
- `POST /mark-visited/<id>` returns 404 for unknown ids instead of a 500 error.

### Security

- Flask 3.1.3, Werkzeug 3.1.9 and Jinja2 3.1.6; `pip-audit` reports 0 known vulnerabilities (was 37).
- The container runs as a non-root user.

### Changed

- CI now actually runs: workflow lint, `make check` and a Docker build with a smoke test.
- Removed the unused htmx script.
- README rewritten for visitors; developer notes moved to `docs/DEVELOPMENT.md`.

## [1.1.0] - 2024-11-24

- Technical enhancements.

## [1.0.0] - 2024-11-17

### Added

- Initial release of Museums Explorer.
- Mark museums as visited and track progress.
- Search and filter museums by name and country.
- Persistent state management with Local Storage.
