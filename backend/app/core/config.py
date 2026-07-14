from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://distriapp:distriapp@localhost:5432/distriapp"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    invitation_expire_days: int = 7
    order_send_max_retries: int = 5
    kyiv_tz: str = "Europe/Kyiv"


settings = Settings()
