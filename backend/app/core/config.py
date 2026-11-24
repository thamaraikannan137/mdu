from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    cors_origin: str = "http://localhost:5173"
    jwt_secret: str
    access_token_minutes: int = 30


settings = Settings()
