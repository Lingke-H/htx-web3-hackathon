from track_b.github_client import GitHubClient


class FakeResponse:
    def __init__(self, payload, status_code=200):
        self.payload = payload
        self.status_code = status_code

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError("bad response")

    def json(self):
        return self.payload


class FakeSession:
    headers = {}

    def get(self, url, params=None, timeout=15):
        if url.endswith("/repos/owner/repo"):
            return FakeResponse({"stargazers_count": 4, "forks_count": 2, "open_issues_count": 1, "pushed_at": "2026-01-01T00:00:00Z"})
        if url.endswith("/commits"):
            return FakeResponse([{"commit": {"committer": {"date": "2026-01-02T00:00:00Z"}}}])
        if url.endswith("/pulls"):
            return FakeResponse([{"merged_at": "2026-01-03T00:00:00Z"}, {"merged_at": None}])
        if url.endswith("/contributors"):
            return FakeResponse([{"login": "a"}, {"login": "b"}])
        if url.endswith("/releases/latest"):
            return FakeResponse({"tag_name": "v1"})
        if url.endswith("/tags"):
            return FakeResponse([{"name": "v1"}])
        return FakeResponse({})


def test_github_snapshot_parses_counts() -> None:
    client = GitHubClient()
    client.session = FakeSession()
    snapshot = client.snapshot("owner/repo")
    assert snapshot.stars == 4
    assert snapshot.recent_commits == 1
    assert snapshot.merged_prs == 1
    assert snapshot.contributors == 2

