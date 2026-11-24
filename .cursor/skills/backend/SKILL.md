---
name: backend
description: >-
  Builds and changes the FastAPI backend with Pydantic v2 schemas,
  SQLAlchemy 2 models, Alembic migrations, and bearer-token auth. Use when
  working in backend/, or when the user mentions FastAPI, Pydantic,
  SQLAlchemy, Alembic, routes, schemas, models, migrations, JWT, or the API.
---

# Backend

All backend code lives in `backend/`. FastAPI serves the API. Pydantic validates input and output. SQLAlchemy 2 talks to the database. A route function does not own a query or a table definition.

## Stack

- FastAPI, run with Uvicorn from `backend/` as `uvicorn app.main:app --reload`
- Pydantic v2 (`BaseModel`, `Field`, `ConfigDict`, `field_validator`, `EmailStr` via `email-validator`)
- `pydantic-settings` for environment config
- SQLAlchemy 2 async (`DeclarativeBase`, `Mapped`, `mapped_column`, `AsyncSession`, `select`)
- `asyncpg` through the URL `postgresql+asyncpg://...`
- Alembic for schema migrations
- `pwdlib` with Argon2 for password hashes
- PyJWT (`HS256`) for access tokens

Do not add Flask, Django, SQLModel, Pydantic v1 `orm_mode`, or the SQLAlchemy 1.x `Query` API. Do not use a sync `Session` inside an `async def` route.

## Layers

| Layer | File | Owns |
|---|---|---|
| Route | `app/api/routes/<resource>.py` | HTTP status, path, and calling one service |
| Schema | `app/schemas/<resource>.py` | Request and response bodies |
| Service | `app/services/<resource>.py` | Queries and writes |
| Model | `app/models/<resource>.py` | One table |

- Models do not import schemas. Schemas do not import models.
- Routes do not call `session.execute`. Services do not raise `HTTPException`.
- A service raises a domain exception. The route maps that exception to an HTTP status.

## Pydantic

- One schema per action: `<Resource>Create`, `<Resource>Update`, `<Resource>Read`.
- `Create` lists only fields the client may send. `Read` lists only fields the client may see.
- `Update` fields are optional. Apply `model_dump(exclude_unset=True)` and assign only those keys. A missing field stays as it is. Do not write `None` over a column the client did not send.
- A collection route returns `Page[Read]`: `items`, `total`, `limit`, `offset`. Query params are `limit` (default 20, max 100) and `offset` (default 0).
- `Read` sets `model_config = ConfigDict(from_attributes=True)` and is built with `Model.model_validate(row)`.
- Use `EmailStr`, `Field`, and `field_validator` in the schema. Do not re-check those rules in the service.
- Never put `password` or `password_hash` on a `Read` schema. `Create` accepts `password`. The service stores `password_hash`.

## SQLAlchemy

- One `DeclarativeBase` in `app/models/base.py`. Every model subclasses it.
- Type columns with `Mapped[...]` and `mapped_column`. Table names are plural snake_case.
- Primary keys are UUID, generated in the application with `uuid4`.
- Every model inherits `created_at`, `updated_at`, `created_by`, and `updated_by` from `Base`.
- `created_at` and `updated_at` are timezone-aware timestamps. The database sets both to `now()` on insert. A later write sets `updated_at` again.
- `created_by` and `updated_by` are nullable UUIDs referencing `users.id`, with `ON DELETE SET NULL`.
- When the request has an acting user, the service sets `created_by` and `updated_by` on insert, and `updated_by` on update. Register has no acting user, so both stay null.
- `Read` includes the four fields. `Create` and `Update` do not accept them.
- Open one `AsyncSession` per request in `get_db`. The dependency yields it and rolls back on exception. It does not commit.
- Services `await session.commit()` after a successful write, then `await session.refresh(row)` before returning the row.
- Read with `select()`. Update and delete with the same statement style. Do not build SQL by concatenating strings.
- New or changed columns ship as an Alembic revision. `alembic/env.py` imports `app.models` and runs migrations with `async_engine_from_config` and `connection.run_sync`. Do not use the synchronous env Alembic generates by default. Review every autogenerate file before applying it.

## FastAPI

- `app/main.py` creates the app and includes `app/api/router.py`.
- Paths match the frontend client. The frontend calls `VITE_API_URL` plus a path such as `/auth/login`. Do not add a second global prefix.
- Declare `response_model` on every route that returns JSON. One object uses the `Read` schema, a collection uses `Page[Read]`, and login uses `Token`.
- `get_db` is the only way a route obtains a session: `session: AsyncSession = Depends(get_db)`.
- Settings come from `app/core/config.py`. Read `DATABASE_URL` from the environment. Do not hardcode a connection string.
- Allow the Vite origin through `CORSMiddleware`. `CORS_ORIGIN` is one origin, or several separated by commas. Do not use `*`.
- Return `201` for creates, `204` for deletes with no body, and `404` when a lookup misses. A uniqueness conflict is `409`.
- Errors use `HTTPException(detail="<message>")`. `detail` is a string. The frontend reads that string.

## App entry

`app/main.py` creates the app, adds `CORSMiddleware` with `settings.cors_origin`, and includes `api_router`. `app/api/router.py` includes each route module and adds no prefix of its own. See [examples.md](examples.md).

## Auth

`POST /auth/login` returns `Token`: `access_token`, `token_type` (`"bearer"`), and `user`. The service checks the password. The route signs the token with `create_access_token`. The JWT `sub` is the user id, `exp` comes from `settings.access_token_minutes` (default 30), and the secret is `settings.jwt_secret`.

A route that needs a user depends on `get_current_user` in `app/api/deps.py`. That dependency reads `Authorization: Bearer` and loads the user. A missing or invalid token is `401` with `detail` `"Not authenticated"` or `"Invalid token"`.

## Lists and updates

Collection routes use the `Page` schema and the `limit` / `offset` params above. Update routes take `<Resource>Update` and persist `exclude_unset` only.

## Add a resource

1. Add the model in `app/models/<resource>.py` and export it from `app/models/__init__.py`.
2. Add `Create`, `Update`, and `Read` schemas.
3. Add service functions that accept an `AsyncSession` and the schema.
4. Add the route and register it in `app/api/router.py`.
5. Generate an Alembic revision for the table change and review it.

## Examples

See [examples.md](examples.md) for the app entry, session, model, schemas, login token, current user, a page, and a partial update.

See [folder-structure.md](folder-structure.md) for the tree, async Alembic env, and the run command.
