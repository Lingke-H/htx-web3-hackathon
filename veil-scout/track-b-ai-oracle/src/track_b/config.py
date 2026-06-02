from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

TRACK_B_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    github_token: str | None = Field(default=None, alias="GITHUB_TOKEN")
    rpc_url: str = Field(default="http://127.0.0.1:8545", alias="RPC_URL")
    private_key: str | None = Field(default=None, alias="PRIVATE_KEY")
    chain_id: int = Field(default=31337, alias="CHAIN_ID")
    deployment_json: Path = Field(default=Path("../track-a-contracts/deployment.json"), alias="DEPLOYMENT_JSON")
    contracts_dir: Path = Field(default=Path("../track-a-contracts"), alias="CONTRACTS_DIR")
    data_dir: Path = Field(default=Path("data"), alias="TRACK_B_DATA_DIR")
    openai_model: str = Field(default="gpt-4o-mini", alias="OPENAI_MODEL")


def load_settings() -> Settings:
    load_dotenv()
    settings = Settings()
    settings.deployment_json = resolve_project_path(settings.deployment_json)
    settings.contracts_dir = resolve_project_path(settings.contracts_dir)
    settings.data_dir = resolve_project_path(settings.data_dir)
    return settings


def resolve_project_path(path: Path) -> Path:
    if path.is_absolute():
        return path
    return (TRACK_B_ROOT / path).resolve()
