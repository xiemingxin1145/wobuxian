'use strict';
// 启动时检查 GitHub 最新发布版本；离线或出错时静默失败
const Updater = {
  REPO: 'xiemingxin1145/wobuxian',
  _best: null,
  // 旧版兜底下载地址（正式 latest）
  latestURL(lite) {
    return 'https://github.com/' + this.REPO + '/releases/latest/download/' + (lite ? 'wobuxian-lite.apk' : 'wobuxian.apk');
  },
  // 解析某个 release 的 versionCode/versionName 及安装包直链
  parse(rel) {
    const t = (rel.body || '') + ' ' + (rel.name || '');
    const m = t.match(/versionCode[:：=\s]*(\d+)/i);
    const n = t.match(/versionName[:：=\s]*([\d.]+)/i) || (rel.tag_name || '').match(/(\d+\.\d+\.\d+)/);
    const apks = {};
    for (const a of (rel.assets || [])) apks[a.name] = a.browser_download_url;
    const tag = rel.tag_name || '';
    return {
      code: m ? +m[1] : 0,
      name: n ? n[1] : tag,
      tag,
      apk: apks['wobuxian.apk'] || (tag ? `https://github.com/${this.REPO}/releases/download/${tag}/wobuxian.apk` : ''),
      liteApk: apks['wobuxian-lite.apk'] || (tag ? `https://github.com/${this.REPO}/releases/download/${tag}/wobuxian-lite.apk` : ''),
    };
  },
  async check(force) {
    try {
      if (!window.fetch || !window.APP_VERSION) return;
      if (!force && !window.AndroidApp && !/[?&]update=1/.test(location.search)) return; // 只在 App 内检查
      const ctl = new AbortController();
      const to = setTimeout(() => ctl.abort(), 8000);
      // 查 latest 和最新几个 release（含预发布），取 versionCode 更高的
      const [latestRes, preRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${this.REPO}/releases/latest`, { signal: ctl.signal, headers: { Accept: 'application/vnd.github+json' } }),
        fetch(`https://api.github.com/repos/${this.REPO}/releases?per_page=8`, { signal: ctl.signal, headers: { Accept: 'application/vnd.github+json' } }),
      ]);
      clearTimeout(to);
      let best = null;
      if (latestRes.ok) {
        const v = this.parse(await latestRes.json());
        if (v.code > 0) best = v;
      }
      if (preRes.ok) {
        for (const j of await preRes.json()) {
          if (j.draft) continue;
          const v = this.parse(j);
          if (v.code > (best ? best.code : 0)) best = v;
        }
      }
      if (best && best.code > APP_VERSION.code) { this._best = best; this.show(best); }
      return best;
    } catch (e) { /* 离线：静默 */ }
  },
  // 当前安装包对应的下载直链（标清装标清，高清装高清）
  dlUrl(v) {
    const lite = !!(window.APP_VERSION && APP_VERSION.lite);
    return (lite ? (v.liteApk || v.apk) : (v.apk || v.liteApk)) || this.latestURL(lite);
  },
  show(v) {
    if (sessionStorage.getItem('wbx_upd_skip') === String(v.code)) return;
    UI.card('发现新版本', `新版本 v${v.name} 已发布（当前 v${APP_VERSION.name}）。\n点击“立即下载”在浏览器中下载最新安装包，安装时直接覆盖即可，存档不会丢失。`, 'i:sk_light', ['立即下载', '稍后再说']).then(c => {
      if (c === 0) { const u = this.dlUrl(v); if (window.AndroidApp && AndroidApp.openUrl) AndroidApp.openUrl(u); else window.open(u, '_blank'); }
      else sessionStorage.setItem('wbx_upd_skip', String(v.code));
    });
  },
};
