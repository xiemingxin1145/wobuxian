#!/usr/bin/env python3
"""Stage 2 isolated encounter: browser controls, read-only state assertions."""
import asyncio
import functools
import http.server
import os
import socketserver
import time
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
WWW = ROOT / "www"
CHROME = os.environ.get("CHROME", "/usr/bin/chromium")
SCREENSHOT = Path(os.environ.get("ENCOUNTER_SCREENSHOT", "/tmp/wobuxian-encounter-win.png"))
VIEWPORT = {"width": 412, "height": 915}


class QuietServer(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


async def main():
    server = socketserver.ThreadingTCPServer(
        ("127.0.0.1", 0), functools.partial(QuietServer, directory=str(WWW))
    )
    server.daemon_threads = True
    import threading
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_address[1]}/prototypes/encounter/"
    print(f"TEST_URL {url}", flush=True)
    checks = []
    page_errors = []
    console_errors = []
    http_errors = []
    started = time.monotonic()

    def passed(message):
        checks.append(message)
        print(f"PASS {message}", flush=True)

    try:
        async with async_playwright() as p:
            print(f"BROWSER Chromium executable={CHROME} viewport=412x915", flush=True)
            browser = await p.chromium.launch(executable_path=CHROME, headless=True, args=["--no-sandbox"])
            context = await browser.new_context(viewport=VIEWPORT, is_mobile=True, has_touch=True)
            page = await context.new_page()
            page.on("pageerror", lambda err: page_errors.append(str(err)))
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
            page.on("response", lambda response: http_errors.append(f"{response.status} {response.url}") if response.status >= 400 else None)
            await page.goto(url, wait_until="domcontentloaded")
            await page.get_by_role("heading", name="两只山魈挡住了去路").wait_for()
            assert await page.locator("#screen-badge").inner_text() == "安全地图"
            passed("独立入口载入安全地图，无正式游戏脚本依赖")

            # Idle play-through proves enemy warning, projectile, collision damage, defeat and retry.
            await page.locator("#start-encounter").click()
            assert (await page.evaluate("() => EncounterPrototype.inspect()"))["screen"] == "battle"
            t0 = time.monotonic()
            loss = None
            while time.monotonic() - t0 < 32:
                loss = await page.evaluate("() => EncounterPrototype.inspect()")
                if loss["screen"] == "result":
                    break
                await page.wait_for_timeout(100)
            assert loss and loss["screen"] == "result" and loss["result"] == "lose", f"idle run did not lose: {loss}"
            assert loss["shotsFired"] >= 1, f"enemy never fired: {loss}"
            assert loss["damageReceived"] > 0 and loss["hero"]["hp"] == 0, f"no damage/death: {loss}"
            assert await page.locator("#retry-btn").is_visible() and await page.locator("#return-map-btn").is_visible()
            passed(f"敌方预警/弹道造成真实伤害并触发失败结算（弹道 {loss['shotsFired']} 发，受伤 {loss['damageReceived']}）")

            await page.locator("#retry-btn").click()
            retry_state = await page.evaluate("() => EncounterPrototype.inspect()")
            assert retry_state["screen"] == "battle" and retry_state["hero"]["hp"] == retry_state["hero"]["maxHp"]
            passed("失败后的重新挑战重置战斗与生命值")

            # Mouse-synthesized pointer drag, not a real-touch test.
            before = (await page.evaluate("() => EncounterPrototype.inspect()"))["hero"]
            box = await page.locator("#move-pad").bounding_box()
            assert box, "virtual movement pad is not visible"
            cx, cy = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
            await page.mouse.move(cx, cy)
            await page.mouse.down()
            await page.mouse.move(cx + box["width"] * .31, cy, steps=4)
            await page.wait_for_timeout(430)
            await page.mouse.up()
            after = (await page.evaluate("() => EncounterPrototype.inspect()"))["hero"]
            assert after["x"] > before["x"] + 18, f"virtual pad did not move player: {before} -> {after}"
            await page.locator("#dodge-btn").click()
            dodge_state = await page.evaluate("() => EncounterPrototype.inspect()")
            assert dodge_state["dodgeCount"] >= 1 and dodge_state["hero"]["dodgeInvuln"] > 0
            passed("鼠标模拟指针拖动摇杆可移动，闪避按钮触发位移与短暂无敌")

            # Visible buttons and keyboard operate the game; snapshots only read state to aim.
            held = set()

            async def release_all():
                for key in list(held):
                    await page.keyboard.up(key)
                    held.discard(key)

            win = None
            last_attack = 0.0
            battle_deadline = time.monotonic() + 35
            while time.monotonic() < battle_deadline:
                snap = await page.evaluate("() => EncounterPrototype.inspect()")
                if snap["screen"] == "result":
                    win = snap
                    break
                alive = [e for e in snap["enemies"] if e["alive"]]
                if not alive:
                    await page.wait_for_timeout(60)
                    continue
                h = snap["hero"]
                target = min(alive, key=lambda e: (e["x"] - h["x"]) ** 2 + (e["y"] - h["y"]) ** 2)
                dx, dy = target["x"] - h["x"], target["y"] - h["y"]
                dist = (dx * dx + dy * dy) ** .5
                if any(0 < e["telegraphTime"] < .27 for e in alive) and h["dodgeCooldown"] <= .02:
                    await release_all()
                    await page.locator("#dodge-btn").click()
                if dist < 178 and h["skillCooldown"] <= .02:
                    await release_all()
                    await page.locator("#skill-btn").click()
                now = time.monotonic()
                if dist < 112 and now - last_attack > .31:
                    await release_all()
                    await page.locator("#attack-btn").click()
                    last_attack = now
                elif dist >= 86:
                    xkey = "d" if dx > 0 else "a"
                    ykey = "s" if dy > 0 else "w"
                    desired = {xkey if abs(dx) > 12 else None, ykey if abs(dy) > 12 else None} - {None}
                    for key in held - desired:
                        await page.keyboard.up(key)
                        held.remove(key)
                    for key in desired - held:
                        await page.keyboard.down(key)
                        held.add(key)
                else:
                    await release_all()
                await page.wait_for_timeout(70)
            await release_all()
            assert win and win["result"] == "win", f"visible-input playthrough did not win within 35s: {win}"
            assert win["attackCount"] > 0 and win["skillCount"] > 0, f"basic attack/skill not used: {win}"
            assert all(not e["alive"] for e in win["enemies"])
            SCREENSHOT.parent.mkdir(parents=True, exist_ok=True)
            await page.screenshot(path=str(SCREENSHOT), full_page=True)
            passed(f"普攻与雷击击败全部敌人并触发胜利（普攻 {win['attackCount']} 次，技能 {win['skillCount']} 次，承伤 {win['damageReceived']}）")

            # Victory retry must also reset; then verify the result screen's map return.
            await page.locator("#retry-btn").click()
            reset = await page.evaluate("() => EncounterPrototype.inspect()")
            assert reset["screen"] == "battle" and reset["hero"]["hp"] == reset["hero"]["maxHp"]
            passed("胜利后的重新挑战也可用且重置生命值")
            t1 = time.monotonic()
            final_loss = None
            while time.monotonic() - t1 < 32:
                final_loss = await page.evaluate("() => EncounterPrototype.inspect()")
                if final_loss["screen"] == "result":
                    break
                await page.wait_for_timeout(100)
            assert final_loss and final_loss["screen"] == "result" and final_loss["result"] == "lose"
            await page.locator("#return-map-btn").click()
            final = await page.evaluate("() => EncounterPrototype.inspect()")
            assert final["screen"] == "map" and await page.locator("#start-encounter").is_visible()
            passed("从失败结算返回安全练习地图")

            assert not page_errors and not console_errors and not http_errors, f"browser pageerror={page_errors}, console.error={console_errors}, HTTP errors={http_errors}"
            passed(f"浏览器无JS/page/console/HTTP错误（pageerror={len(page_errors)}, console.error={len(console_errors)}, HTTP错误={len(http_errors)}）")
            await browser.close()
    finally:
        server.shutdown()
        server.server_close()
    elapsed = time.monotonic() - started
    print(f"SUMMARY {len(checks)}/{len(checks)} checks passed in {elapsed:.1f}s")
    print(f"RESULT PASS={len(checks)} FAIL=0 EXIT_CODE=0")
    print(f"BROWSER_ERRORS pageerror={len(page_errors)} console.error={len(console_errors)} HTTP_errors={len(http_errors)} details={http_errors}")
    print(f"SCREENSHOTS=1 WIN_SCREENSHOT={SCREENSHOT}")


if __name__ == "__main__":
    asyncio.run(main())
