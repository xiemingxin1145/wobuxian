'use strict';
// ======================= v3.2 新 BGM / 音效注册 =======================
// 沿用 audio.js 动态文件名约定（bgm_<name>.ogg / sfx_<name>.ogg）：
// 新增 ogg 放入 www/assets/audio/ 后即可被 Audio2.bgm()/Sfx.play() 按名调用。
// 本文件职责：
//   1) 登记 3.2 新增音频清单（manifest）；
//   2) 前向接线：仙界 4 图 / 万宝楼 / 宗门战争 / 九州大地图 / 秘境深层的主题 BGM。
// 新资源由 tools/audio/synth32.py 程序化合成（五声音阶国风，原创）。
(function () {
  const MANIFEST = {
    bgm: ['wanbao', 'jiuct', 'xianfang', 'yaochi', 'lingxiao', 'sectwar', 'world', 'dungeon'],
    sfx: ['auction', 'war', 'fly', 'bell', 'meditate', 'duel'],
  };
  window.Audio32 = { manifest: MANIFEST };

  // 新地图主题 BGM（maps25/maps31 登记后即使未写 bgm 也对味）
  const MAP_BGM = {
    wanbao: 'wanbao', jiuct: 'jiuct', xianfang: 'xianfang',
    yaochi: 'yaochi', lingxiao: 'lingxiao',
  };
  if (typeof Game !== 'undefined' && Game.enterMap) {
    const _enter = Game.enterMap;
    Game.enterMap = async function (id) {
      await _enter.call(this, id);
      try {
        if (MAP_BGM[id]) Audio2.bgm(MAP_BGM[id]);
      } catch (e) { }
    };
  }

  // 宗门战争开战时播战歌（war29 调用 War29.startWar 时切 BGM，结束后回地图主题）
  if (typeof War29 !== 'undefined' && War29.startWar) {
    const _sw = War29.startWar;
    War29.startWar = async function (g, a, b) {
      try { Audio2.bgm('sectwar'); } catch (e) { }
      return _sw.call(this, g, a, b);
    };
  }
  if (typeof War29 !== 'undefined' && War29.endWar) {
    const _ew = War29.endWar;
    War29.endWar = function (g, win) {
      const r = _ew.call(this, g, win);
      try { const m = (g && g.map) || (R && R.mapId); if (m) Audio2.bgm(m); } catch (e) { }
      return r;
    };
  }

  // 九州大地图模式（world28）播大地主题
  if (typeof World28 !== 'undefined' && World28.enter) {
    const _en = World28.enter;
    World28.enter = function () {
      const r = _en.apply(this, arguments);
      try { Audio2.bgm('world'); } catch (e) { }
      return r;
    };
    const _ex = World28.exit;
    if (_ex) {
      World28.exit = function () {
        const r = _ex.apply(this, arguments);
        try { const m = (R && R.mapId) || 'village'; Audio2.bgm(m); } catch (e) { }
        return r;
      };
    }
  }

  // 秘境深层（dungeon26 第 3 层起）换幽暗 BGM：第 1 层用 mijing，更深层用 dungeon
  if (typeof Dng !== 'undefined' && Dng.enter) {
    const _de = Dng.enter;
    Dng.enter = async function (src) {
      const r = await _de.call(this, src);
      try { Audio2.bgm('mijing'); } catch (e) { }
      return r;
    };
  }
  if (typeof Dng !== 'undefined' && Dng._floor && !Dng._floor._wrapped32) {
    const _fl = Dng._floor;
    Dng._floor = function () {
      const r = _fl.apply(this, arguments);
      try {
        const f = (this && this.cur) || (G && G.dungeon && G.dungeon.floor) || 1;
        if (f >= 3) Audio2.bgm('dungeon');
      } catch (e) { }
      return r;
    };
    Dng._floor._wrapped32 = true;
  }
})();
