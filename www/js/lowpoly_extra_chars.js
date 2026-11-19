'use strict';
// 低模 Cube 样例扩展（开放世界线阶段 1 草稿）
// 从 Cube 拼出简单角色，供预览。不接入正式运行链。
(function () {
  const CHARS = {
    // ... (all previous characters unchanged, ending with huolang) ...
    huolang: { name: '货郎', parts: [
      ['legL', -6, 0, 7, 7, 7, 15, '#5a4a3a', 'legL'],
      ['legR', 6, 0, 7, 7, 7, 15, '#5a4a3a', 'legR'],
      ['body', 0, 0, 26, 20, 13, 22, '#7a5a3a', ''],
      ['armL', -14, 0, 28, 6, 6, 16, '#7a5a3a', 'armL'],
      ['armR', 14, 0, 28, 6, 6, 16, '#7a5a3a', 'armR'],
      ['head', 0, 0, 50, 22, 20, 20, '#e8d0b0', ''],
      ['hat', 0, -1, 62, 26, 24, 6, '#a07040', ''],
      ['load', 0, -8, 38, 18, 8, 12, '#6a4a2a', ''],
      ['goods', 8, 2, 36, 6, 4, 6, '#c0a060', ''],
      ['eyeL', -5, 10, 50, 3, 1, 4, '#1a1a22', ''],
      ['eyeR', 5, 10, 50, 3, 1, 4, '#1a1a22', ''],
      ['pole', 16, 8, 26, 3, 18, 3, '#8a6a4a', 'sword'],
    ] },
    qiaofu: { name: '槙夫', parts: [
      ['legL', -6, 0, 8, 7, 7, 16, '#3a4a2a', 'legL'],
      ['legR', 6, 0, 8, 7, 7, 16, '#3a4a2a', 'legR'],
      ['body', 0, 0, 28, 20, 13, 24, '#5a6a3a', ''],
      ['armL', -14, 0, 30, 6, 6, 18, '#5a6a3a', 'armL'],
      ['armR', 14, 0, 30, 6, 6, 18, '#5a6a3a', 'armR'],
      ['head', 0, 0, 54, 22, 20, 20, '#e0c8a8', ''],
      ['hat', 0, -2, 66, 26, 24, 6, '#4a5a2a', ''],
      ['bundle', 0, -8, 40, 10, 6, 14, '#6a5a3a', ''],
      ['eyeL', -5, 10, 54, 3, 1, 4, '#1a1a22', ''],
      ['eyeR', 5, 10, 54, 3, 1, 4, '#1a1a22', ''],
      ['axe', 16, 10, 28, 4, 18, 4, '#8a6a4a', 'sword'],
    ] },
    chake: { name: '茶客', parts: [
      ['legL', -5, 0, 7, 6, 6, 15, '#4a3a2a', 'legL'],
      ['legR', 5, 0, 7, 6, 6, 15, '#4a3a2a', 'legR'],
      ['body', 0, 0, 26, 20, 13, 22, '#6a5a3a', ''],
      ['armL', -13, 0, 28, 5, 5, 16, '#6a5a3a', 'armL'],
      ['armR', 13, 0, 28, 5, 5, 16, '#6a5a3a', 'armR'],
      ['head', 0, 0, 50, 20, 18, 18, '#f0d0b0', ''],
      ['hat', 0, -1, 60, 24, 20, 5, '#a07040', ''],
      ['cup', 12, 4, 28, 5, 4, 5, '#c0a070', ''],
      ['eyeL', -4, 9, 50, 2, 1, 3, '#1a1a22', ''],
      ['eyeR', 4, 9, 50, 2, 1, 3, '#1a1a22', ''],
      ['fan', -10, 6, 26, 3, 12, 2, '#8a6a4a', 'sword'],
    ] },
  };
  if (typeof window !== 'undefined') window.LowpolyExtra = CHARS;
  if (typeof module !== 'undefined' && module.exports) module.exports = CHARS;
})();
