from track_b.chain_client import ChainClient


def test_release_milestone_command_preview_quotes_summary_safely() -> None:
    client = ChainClient.__new__(ChainClient)
    client.deployment = {
        "incubationVault": "0x000000000000000000000000000000000000c0de",
        "deployer": "0x000000000000000000000000000000000000b0b0",
    }

    preview = client.release_milestone_command_preview(
        4,
        2,
        "line one\nand Bob's review said: release it",
    )

    assert "releaseMilestone(uint256,uint256,string)" in preview
    assert "0x000000000000000000000000000000000000c0de" in preview
    assert "--unlocked --from 0x000000000000000000000000000000000000b0b0" in preview
    assert "\n" not in preview
    assert "Bob'\"'\"'s" in preview
