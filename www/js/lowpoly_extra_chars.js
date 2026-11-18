'use strict';
// 低模 Cube 样例扩展（开放世界线阶段 1 草稿）
// 从 Cube 拼出简单角色，供预览。不接入正式运行链。
(function () {
  const CHARS = {
    // ... (previous characters omitted for brevity in this example; full content would include all prior + new)
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
  };
  if (typeof window !== 'undefined') window.LowpolyExtra = CHARS;
  if (typeof module !== 'undefined' && module.exports) module.exports = CHARS;
})();
