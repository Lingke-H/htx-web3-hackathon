from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import requests

from .models import GitHubSnapshot


class GitHubClient:
    def __init__(self, token: str | None = None, timeout: int = 15) -> None:
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "Accept": "application/vnd.github+json",
            "User-Agent": "veil-scout-track-b/0.1",
        })
        if token:
            self.session.headers["Authorization"] = f"Bearer {token}"

    def snapshot(
        self,
        repo: str,
        lookback_days: int = 30,
        as_of: datetime | None = None,
    ) -> GitHubSnapshot:
        try:
            repo_json = self._get(f"/repos/{repo}")
            window_end = as_of or datetime.now(timezone.utc)
            if window_end.tzinfo is None:
                window_end = window_end.replace(tzinfo=timezone.utc)
            window_end = window_end.astimezone(timezone.utc)
            since = window_end - timedelta(days=lookback_days)
            commits = self._get(
                f"/repos/{repo}/commits",
                params={"since": since.isoformat(), "per_page": 100},
            )
            prs = self._get(
                f"/repos/{repo}/pulls",
                params={"state": "closed", "per_page": 100, "sort": "updated", "direction": "desc"},
            )
            contributors = self._get(f"/repos/{repo}/contributors", params={"per_page": 100})
            release = self._get_optional(f"/repos/{repo}/releases/latest")
            tags = self._get_optional(f"/repos/{repo}/tags", params={"per_page": 1})

            merged_prs = [
                pr
                for pr in prs
                if pr.get("merged_at")
                and since <= self._parse_time(pr["merged_at"]) <= window_end
            ]
            last_activity = self._latest_activity(repo_json, commits, merged_prs)
            return GitHubSnapshot(
                repo=repo,
                stars=repo_json.get("stargazers_count"),
                forks=repo_json.get("forks_count"),
                open_issues=repo_json.get("open_issues_count"),
                recent_commits=len(commits),
                merged_prs=len(merged_prs),
                contributors=len(contributors),
                latest_release=release.get("tag_name") if isinstance(release, dict) else None,
                latest_tag=tags[0].get("name") if isinstance(tags, list) and tags else None,
                last_activity_at=last_activity,
                window_start=since.isoformat(),
                window_end=window_end.isoformat(),
            )
        except requests.RequestException as exc:
            return GitHubSnapshot(repo=repo, data_unavailable=True, error=str(exc))

    def _get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        response = self.session.get(f"https://api.github.com{path}", params=params, timeout=self.timeout)
        response.raise_for_status()
        return response.json()

    def _get_optional(self, path: str, params: dict[str, Any] | None = None) -> Any:
        response = self.session.get(f"https://api.github.com{path}", params=params, timeout=self.timeout)
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json()

    @staticmethod
    def _parse_time(value: str) -> datetime:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)

    @staticmethod
    def _latest_activity(repo: dict[str, Any], commits: list[dict], merged_prs: list[dict]) -> str | None:
        candidates: list[str] = []
        for key in ("pushed_at", "updated_at"):
            if repo.get(key):
                candidates.append(repo[key])
        for commit in commits[:5]:
            date = commit.get("commit", {}).get("committer", {}).get("date")
            if date:
                candidates.append(date)
        for pr in merged_prs[:5]:
            if pr.get("merged_at"):
                candidates.append(pr["merged_at"])
        return max(candidates) if candidates else None
