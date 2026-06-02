from __future__ import annotations

import json
from pathlib import Path
from typing import TypeVar

from pydantic import BaseModel

from .models import AIReport, CreatedMarket, ProjectConfig, VerificationReport

ModelT = TypeVar("ModelT", bound=BaseModel)


def read_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload: BaseModel | dict) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    if isinstance(payload, BaseModel):
        data = payload.model_dump(mode="json")
    else:
        data = payload
    with path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, sort_keys=False)
        handle.write("\n")
    return path


def load_project(path: Path) -> ProjectConfig:
    return ProjectConfig.model_validate(read_json(path))


def load_report(path: Path) -> AIReport:
    return AIReport.model_validate(read_json(path))


def load_verification(path: Path) -> VerificationReport:
    return VerificationReport.model_validate(read_json(path))


def load_created_market(path: Path) -> CreatedMarket:
    return CreatedMarket.model_validate(read_json(path))

