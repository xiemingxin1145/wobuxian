#!/usr/bin/env python3
"""Minimal path assertions for www/prototypes/encounter_chain (no browser)."""

from __future__ import annotations

CHAINS = [
    {
        "id": "debt_merchant_1",
        "choices": [
            {"effects": {"debt": -30, "aff": {"merchant": 15}}, "next": "debt_merchant_2_help"},
            {"effects": {"debt": 0, "aff": {"merchant": -10}}, "next": "debt_merchant_2_delay"},
            {"effects": {"debt": 40, "aff": {"merchant": -25}}, "next": "debt_chase_warning"},
        ],
    },
    {
        "id": "debt_merchant_2_help",
        "choices": [
            {"effects": {"debt": -10}, "next": None},
        ],
    },
    {
        "id": "debt_merchant_2_delay",
        "choices": [
            {"effects": {"debt": 10, "aff": {"merchant": -5}}, "next": None},
            {"effects": {"debt": 20, "aff": {"merchant": -15}}, "next": "debt_chase_warning"},
        ],
    },
    {
        "id": "debt_chase_warning",
        "choices": [
            {"effects": {"debt": -50, "aff": {"merchant": 5}}, "next": None},
            {"effects": {"debt": 15, "aff": {"merchant": -10}}, "next": None},
        ],
    },
]


def apply_path(choice_indices: list[int]) -> dict:
    """Replay a sequence of choice indices starting from debt_merchant_1."""
    by_id = {c["id"]: c for c in CHAINS}
    state = {"debt": 80, "aff": {"merchant": 0}, "current": "debt_merchant_1"}
    for idx in choice_indices:
        node = by_id.get(state["current"])
        if node is None:
            raise AssertionError(f"path continued after end: {choice_indices}")
        if idx < 0 or idx >= len(node["choices"]):
            raise AssertionError(f"choice index {idx} out of range on {state['current']}")
        ch = node["choices"][idx]
        effects = ch.get("effects") or {}
        if "debt" in effects:
            state["debt"] += effects["debt"]
        if "aff" in effects:
            for k, v in effects["aff"].items():
                state["aff"][k] = state["aff"].get(k, 0) + v
        state["current"] = ch.get("next")
    return state


def main() -> None:
    checks = []

    def passed(msg: str) -> None:
        checks.append(msg)
        print(f"PASS {msg}")

    # Path A: help stall -> thank
    s = apply_path([0, 0])
    assert s["current"] is None
    assert s["debt"] == 40, s  # 80 -30 -10
    assert s["aff"]["merchant"] == 15, s
    passed("帮摆摊路径：债务 40，好感 15")

    # Path B: delay -> promise next month
    s = apply_path([1, 0])
    assert s["current"] is None
    assert s["debt"] == 90, s  # 80 +0 +10
    assert s["aff"]["merchant"] == -15, s  # -10 -5
    passed("推说下回→承诺下月：债务 90，好感 -15")

    # Path C: delay -> delay again -> chase -> pay partial
    s = apply_path([1, 1, 0])
    assert s["current"] is None
    assert s["debt"] == 50, s  # 80 +0 +20 -50
    assert s["aff"]["merchant"] == -20, s  # -10 -15 +5
    passed("推说→再拖→还一部分：债务 50，好感 -20")

    # Path D: direct renege -> chase -> hide
    s = apply_path([2, 1])
    assert s["current"] is None
    assert s["debt"] == 135, s  # 80 +40 +15
    assert s["aff"]["merchant"] == -35, s  # -25 -10
    passed("直接赖账→藏起来：债务 135，好感 -35")

    print(f"SUMMARY {len(checks)}/{len(checks)} path assertions passed")
    print("RESULT PASS=4 FAIL=0 EXIT_CODE=0")


if __name__ == "__main__":
    main()
