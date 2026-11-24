# Backend folder structure

Canonical tree for `backend/`. Match it when adding files.

```
backend/
├── pyproject.toml
├── alembic.ini
├── .env.example
├── alembic/
│   ├── env.py
│   └── versions/
└── app/
    ├── main.py
    ├── core/
    │   ├── config.py          # Settings
    │   ├── database.py        # engine, SessionLocal, get_db
    │   └── security.py        # create_access_token, read_user_id
    ├── models/
    │   ├── base.py            # DeclarativeBase
    │   ├── user.py
    │   └── __init__.py        # imports every model for Alembic
    ├── schemas/
    │   ├── page.py            # Page[T]
    │   └── user.py            # Create, Update, Read, Token
    ├── services/
    │   └── users.py
    └── api/
        ├── deps.py            # get_current_user
        ├── router.py
        └── routes/
            ├── auth.py
            └── users.py
```

## Run

From `backend/`:

```bash
uvicorn app.main:app --reload
```

## App wiring

`app/main.py` creates the FastAPI app, adds `CORSMiddleware` with `settings.cors_origin`, and includes `api.router`.

`app/api/router.py` includes each route module. Route modules set their own prefix, such as `/auth`.

## Alembic

`alembic/env.py` uses the async engine. Import models so autogenerate sees `Base.metadata`.

```python
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.core.config import settings
from app.models import Base

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

`app/models/__init__.py` imports `Base` and every model.

After a model change:

```bash
alembic revision --autogenerate -m "add users"
alembic upgrade head
```

Read the generated revision. Autogenerate misses some renames and server defaults.

## Placement

- `models/` — SQLAlchemy tables only.
- `schemas/` — Pydantic request and response models only.
- `services/` — queries, commits, and domain exceptions.
- `api/routes/` — status codes and `response_model`.
- `api/deps.py` — `get_current_user`.
- `core/` — settings, the session dependency, and access tokens.
