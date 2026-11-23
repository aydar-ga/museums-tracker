# Development notes

Technical notes for Museums Explorer. The visitor-facing overview is in the
[README](../README.md).

## Stack

- Python 3.13, Flask 3.1, served by gunicorn 23 in production.
- One Jinja template (`templates/index.html`), plain JavaScript
  (`static/js/scripts.js`) and CSS (`static/css/styles.css`).
- Data: the 50 museums are a hard-coded list in `app.py`; images are in
  `static/images/`.
- Visited state lives only in the visitor's browser (`localStorage` key
  `visitedMuseums`). The server stores nothing.

## Routes

| Method | Path                 | Purpose                                                                 |
| ------ | -------------------- | ----------------------------------------------------------------------- |
| GET    | `/`                  | The whole app.                                                          |
| GET    | `/static/...`        | CSS, JS, images, favicons.                                              |
| POST   | `/mark-visited/<id>` | Legacy endpoint, not called by the UI. 204 for ids 0–49, 404 otherwise. |

## Branches

- `master` is the live app. It is the default branch and the one Render deploys.
- `main` holds the May 2026 Next.js rewrite. That work continues as
  [museums-eu-atlas](https://github.com/aydar-ga/museums-eu-atlas) (ArtMuse);
  `main` is not deployed.

## Local setup

Requires Python 3.13 and Poetry 2.x (the lock file is Poetry 2 format).

```bash
poetry install --no-root
make run            # http://127.0.0.1:5000 with Flask debug on (PORT=... to change)
```

`make run` sets `FLASK_DEBUG=1`. Without it, `python app.py` starts with debug
off.

## Checks

```bash
make check          # black --check, flake8, mypy, pytest
make pre-commit-check
```

`make check` is the single entry point. CI runs the same target.

## CI

`.github/workflows/ci.yml` runs on pushes to `master` and on pull requests:

1. **Workflow lint**: actionlint on the workflow files.
2. **Format, lint, type-check, test**: `make check` on Python 3.13 with
   Poetry 2.5.2.
3. **Docker build + smoke test**: builds the production image, starts it, and
   checks that `/` renders 50 museums and the static files return 200.

## Docker

```bash
docker build -t museums-explorer .
docker run --rm -e PORT=5000 -p 5000:5000 museums-explorer
```

The image installs runtime dependencies from `poetry.lock` with a pinned
Poetry, then runs gunicorn as a non-root user, bound to `$PORT`.

## Deployment

- Host: Render web service `museums-explorer` (Docker runtime, free plan,
  Frankfurt).
- Every push to `master` triggers a build from `Dockerfile` and a deploy.
- Render injects `PORT`; no other environment variables are needed.
- Rollback: in the Render dashboard, open the service's deploy list and
  roll back to the previous deploy, or `git revert` the commit and push.

## Dependency maintenance

```bash
poetry update                 # patch/minor within pyproject constraints
poetry show --outdated
pip-audit --path "$(poetry env info --path)/lib/python3.13/site-packages"
```

`pip-audit` is not a project dependency; install it separately (for example
`pipx install pip-audit`).

Bump `poetry==` in both `Dockerfile` and `.github/workflows/ci.yml` together.
