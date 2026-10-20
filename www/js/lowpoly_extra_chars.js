'use strict';
// 低模 Cube 样例扩展（开放世界线阶段 1 草稿）
// 从 Cube 拼出简单角色，供预览。不接入正式运行链。
(function () {
  const CHARS = {
    luren: { name: '路人甲', parts: [
      ['legL', -6, 0, 8, 7, 7, 16, '#5a4a3a', 'legL'],
      ['legR', 6, 0, 8, 7, 7, 16, '#5a4a3a', 'legR'],
      ['body', 0, 0, 28, 20, 12, 22, '#8a6a4a', ''],
      ['armL', -14, 0, 30, 6, 6, 16, '#8a6a4a', 'armL'],
      ['armR', 14, 0, 30, 6, 6, 16, '#8a6a4a', 'armR'],
      ['head', 0, 0, 52, 22, 20, 20, '#f0d0b0', ''],
      ['hair', 0, -2, 62, 24, 18, 6, '#3a2a20', ''],
      ['eyeL', -5, 10, 52, 3, 1, 4, '#1a1a22', ''],
      ['eyeR', 5, 10, 52, 3, 1, 4, '#1a1a22', ''],
    ] },
    // 主角男：短发青衫、腰挂小剑，比路人甲更高更宽肩
    nanzhu: { name: '主角男', parts: [
      ['legL', -7, 0, 9, 8, 8, 18, '#3a4a5a', 'legL'],
      ['legR', 7, 0, 9, 8, 8, 18, '#3a4a5a', 'legR'],
      ['robe', 0, 0, 30, 28, 16, 28, '#3a6a8a', ''],
      ['belt', 0, 0, 34, 29, 17, 4, '#c0a060', ''],
      ['armL', -18, 0, 36, 7, 7, 20, '#3a6a8a', 'armL'],
      ['armR', 18, 0, 36, 7, 7, 20, '#3a6a8a', 'armR'],
      ['head', 0, 0, 60, 26, 24, 24, '#f0d2b0', ''],
      ['hair', 0, -2, 72, 26, 20, 8, '#2a3040', ''],
      ['eyeL', -6, 12, 60, 4, 1, 5, '#1a1a22', ''],
      ['eyeR', 6, 12, 60, 4, 1, 5, '#1a1a22', ''],
      ['sword', 16, 10, 28, 3, 28, 3, '#d0e0f0', 'sword'],
    ] },
  };
  // 简单导出，可与 lowpoly_box_chars.js 合并使用
  if (typeof window !== 'undefined') window.LowpolyExtra = CHARS;
  if (typeof module !== 'undefined' && module.exports) module.exports = CHARS;
})();
