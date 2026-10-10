'use strict';
// 启动时检查 GitHub 最新发布版本；离线或出错时静默失败
const Updater = {
  REPO: 'xiemingxin1145/wobuxian',
  get URL() { return 'https://github.com/xiemingxin1145/wobuxian/releases/latest/download/' + (window.APP_VERSION && APP_VERSION.lite ? 'wobuxian-lite.apk' : 'wobuxian.apk'); },
  parse(rel) {
    const t = (rel.body || '') + ' ' + (rel.name || '');
    const m = t.match(/versionCode[:：=\s]*(\d+)/i);
    const n = t.match(/versionName[:：=\s]*([\d.]+)/i) || (rel.tag_name || '').match(/(\d+\.\d+\.\d+)/);
    return { code: m ? +m[1] : 0, name: n ? n[1] : (rel.tag_name || '') };
  },
  async check(force) {
    try {
      if (!window.fetch || !window.APP_VERSION) return;
      if (!force && !window.AndroidApp && !/[?&]update=1/.test(location.search)) return; // 只在 App 内检查
      const ctl = new AbortController();
      const to = setTimeout(() => ctl.abort(), 8000);
      // 查 latest 和 latest prerelease，取 versionCode 更高的
      const [latestRes, preRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${this.REPO}/releases/latest`, { signal: ctl.signal, headers: { Accept: 'application/vnd.github+json' } }),
        fetch(`https://api.github.com/repos/${this.REPO}/releases?per_page=5`, { signal: ctl.signal, headers: { Accept: 'application/vnd.github+json' } }),
      ]);
      clearTimeout(to);
      let best = null;
      if (latestRes.ok) {
        const j = await latestRes.json();
        const v = this.parse(j);
        if (v.code > 0) best = v;
      }
      if (preRes.ok) {
        const arr = await preRes.json();
        for (const j of arr) {
          if (j.draft) continue;
          const v = this.parse(j);
          if (v.code > (best ? best.code : 0)) best = v;
        }
      }
      if (best && best.code > APP_VERSION.code) this.show(best);
      return best;
    } catch (e) { /* 离线：静默 */ }
  },
  show(v) {
    if (sessionStorage.getItem('wbx_upd_skip') === String(v.code)) return;
    UI.card('发现新版本', `新版本 v${v.name} 已发布（当前 v${APP_VERSION.name}）。\n点击“立即下载”在浏览器中下载最新安装包，安装时直接覆盖即可，存档不会丢失。`, 'i:sk_light', ['立即下载', '稍后再说']).then(c => {
      if (c === 0) { if (window.AndroidApp && AndroidApp.openUrl) AndroidApp.openUrl(this.URL); else window.open(this.URL, '_blank'); }
      else sessionStorage.setItem('wbx_upd_skip', String(v.code));
    });
  },
};
