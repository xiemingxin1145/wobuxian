'use strict';
// ======================= v2.6 新 BGM / 音效注册（④） =======================
// audio.js 采用动态文件名约定（bgm_<name>.ogg / sfx_<name>.ogg，见 audio.js:8/22），
// 并非静态注册表——因此新增 ogg 文件放入 www/assets/audio/ 后即可被 Audio2.bgm()/Sfx.play()
// 直接按名调用，无需改动 audio.js 本体。本文件职责：
//   1) 登记 2.6 新增音频清单（manifest，便于打包/核对）；
//   2) 前向接线：当美术链 maps26 登记剑冢/问道崖等新图后，即便 MAPINFO 尚未写 bgm 字段，
//      也优先用 2.6 主题 BGM（包裹 Game.enterMap，链式叠加，不改 game.js）。
// 新资源由 tools/audio/synth26.py 程序化合成（五声音阶国风，原创）。
(function () {
  const MANIFEST = {
    bgm: ['jianzhong', 'mijing', 'daotong'],   // 剑冢 / 秘境 / 传承问道
    sfx: ['door', 'trap', 'chest', 'chuanjian', 'merchant'],
  };
  window.Audio26 = { manifest: MANIFEST };

  // 前向接线：新地图主题 BGM（maps26 登记后即使未写 bgm 也对味）
  const MAP_BGM = { jianzhong: 'jianzhong', luanxing: 'mijing', wendao: 'daotong' };
  if (typeof Game !== 'undefined' && Game.enterMap) {
    const _enter = Game.enterMap;
    Game.enterMap = async function (id) {
      await _enter.call(this, id);
      try {
        if (MAP_BGM[id]) Audio2.bgm(MAP_BGM[id]);
      } catch (e) { }
    };
  }
})();
