'use strict';
// 低模 Cube 样例扩展（开放世界线阶段 1 草稿）
// 从 Cube 拼出简单角色，供预览。不接入正式运行链。
(function () {
  const CHARS = {
    // ... previous chars ...
    gengfu: { name: '更夫', parts: [
      ['legL', -6, 0, 7, 7, 7, 15, '#3a3a42', 'legL'],
      ['legR', 6, 0, 7, 7, 7, 15, '#3a3a42', 'legR'],
      ['body', 0, 0, 26, 20, 13, 22, '#4a4a5a', ''],
      ['armL', -14, 0, 28, 6, 6, 16, '#4a4a5a', 'armL'],
      ['armR', 14, 0, 28, 6, 6, 16, '#4a4a5a', 'armR'],
      ['head', 0, 0, 50, 22, 20, 20, '#e0c8a8', ''],
      ['hat', 0, -1, 62, 26, 24, 6, '#2a2a32', ''],
      ['lantern', 16, 6, 28, 6, 6, 8, '#f0c070', ''],
      ['eyeL', -5, 10, 50, 3, 1, 4, '#1a1a22', ''],
      ['eyeR', 5, 10, 50, 3, 1, 4, '#1a1a22', ''],
      ['stick', 18, 8, 26, 3, 20, 3, '#8a6a4a', 'sword'],
    ] },
  };
  if (typeof window !== 'undefined') window.LowpolyExtra = CHARS;
  if (typeof module !== 'undefined' && module.exports) module.exports = CHARS;
})();
