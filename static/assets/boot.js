(function () {
  var root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');

  // Theme restoration (zero FOUC before first paint)
  var theme = 'orchard';
  try {
    var savedTheme = window.localStorage.getItem('theme:v1');
    if (
      savedTheme === 'orchard' ||
      savedTheme === 'dmg' ||
      savedTheme === 'amber' ||
      savedTheme === 'mac1bit'
    ) {
      theme = savedTheme;
    }
  } catch (e) {
    theme = 'orchard';
  }

  root.dataset.theme = theme;
  var colors = { orchard: '#08080a', dmg: '#0d150c', amber: '#0c0804', mac1bit: '#f2f1ec' };
  var scheme = theme === 'mac1bit' ? 'light' : 'dark';
  root.style.colorScheme = scheme;

  var tc = document.querySelector('meta[name="theme-color"]');
  if (tc) tc.setAttribute('content', colors[theme]);
  var cs = document.querySelector('meta[name="color-scheme"]');
  if (cs) cs.setAttribute('content', scheme);

  // Backwards-compatible ?lang=pt / ?lang=en redirect + first-visit PT home redirect
  try {
    var loc = window.location;
    var path = loc.pathname;
    var isPtPath = path === '/pt' || path.indexOf('/pt/') === 0;
    var params = new URLSearchParams(loc.search);
    var q = params.get('lang');
    var qNorm = q ? q.slice(0, 2).toLowerCase() : '';

    if (qNorm === 'pt' || qNorm === 'en') {
      try {
        window.localStorage.setItem('lang:v2', qNorm);
      } catch (e) {
        /* non-fatal */
      }
      params.delete('lang');
      var qs = params.toString();
      var suffix = (qs ? '?' + qs : '') + loc.hash;

      if (qNorm === 'pt' && !isPtPath) {
        var ptTarget = path === '/' ? '/pt' : '/pt' + path;
        loc.replace(ptTarget + suffix);
        return;
      }
      if (qNorm === 'en' && isPtPath) {
        var enTarget = path === '/pt' ? '/' : path.slice(3) || '/';
        loc.replace(enTarget + suffix);
        return;
      }
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', path + suffix);
      }
      return;
    }

    // Auto-route bare root / to /pt if user saved PT or has a Portuguese browser locale (skip crawlers)
    if (path === '/' && !/bot|crawl|spider|slurp|facebookexternalhit|linkedinbot/i.test(navigator.userAgent || '')) {
      var savedLang = null;
      try {
        savedLang = window.localStorage.getItem('lang:v2');
      } catch (e) {
        savedLang = null;
      }

      var wantsPt = savedLang === 'pt';
      if (!savedLang) {
        var langs =
          navigator.languages && navigator.languages.length
            ? navigator.languages
            : [navigator.language || ''];
        for (var i = 0; i < langs.length; i++) {
          if (/^pt\b/i.test(langs[i])) {
            wantsPt = true;
            break;
          }
        }
      }

      if (wantsPt) {
        loc.replace('/pt' + loc.search + loc.hash);
      }
    }
  } catch (e) {
    /* keep current route cleanly */
  }
})();
