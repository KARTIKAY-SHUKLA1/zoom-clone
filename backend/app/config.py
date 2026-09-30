from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./zoom.db"

    # Used to build invite links that guests can click
    frontend_url: str = "http://localhost:3000"

    # Comma-separated list of allowed CORS origins.
    # Example on Render: CORS_ORIGINS=https://zoom-clone.vercel.app,https://zoom-clone-git-main.vercel.app
    cors_origins: str = "http://localhost:3000"

    default_user_id: int = 1

    @property
    def allowed_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
