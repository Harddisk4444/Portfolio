import { defineConfig, type Plugin } from 'vite';
import { SKILLS } from './src/data/skills';
import { TRIALS } from './src/data/trials';
import { CERTS } from './src/data/certs';
import {
  renderCertDetail,
  renderCertShelf,
  renderRingLegend,
  renderSkillList,
  renderSkillViews,
  renderTrials
} from './src/render/markup';

const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'";

/**
 * Renders every content section into index.html at build (and dev) time, so the page
 * is complete static HTML before any JavaScript runs: instant LCP, zero CLS, indexable.
 */
function staticContent(): Plugin {
  const slots: Record<string, () => string> = {
    '<!--@ring-legend-->': renderRingLegend,
    '<!--@skill-list-->': () => renderSkillList(SKILLS, SKILLS[0].id),
    '<!--@skill-views-->': () => renderSkillViews(SKILLS, SKILLS[0].id),
    '<!--@trials-->': () => renderTrials(TRIALS),
    '<!--@cert-shelf-->': () => renderCertShelf(CERTS, CERTS[0].id),
    '<!--@cert-detail-->': () => renderCertDetail(CERTS[0])
  };
  return {
    name: 'ggsk-static-content',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        for (const [slot, render] of Object.entries(slots)) {
          if (!html.includes(slot)) throw new Error(`[static-content] missing slot ${slot} in index.html`);
          html = html.replace(slot, render());
        }
        return html.replaceAll('{{cert-count}}', String(CERTS.length));
      }
    }
  };
}

/** Preloads the hashed display font so the hero title can use it on first paint. */
function preloadFont(): Plugin {
  return {
    name: 'ggsk-preload-font',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const font = Object.keys(ctx.bundle ?? {}).find(f => /cinzel.*\.woff2$/.test(f));
        if (!font) throw new Error('[preload-font] Cinzel woff2 was not emitted');
        return [{
          tag: 'link',
          attrs: { rel: 'preload', href: `./${font}`, as: 'font', type: 'font/woff2', crossorigin: '' },
          injectTo: 'head'
        }];
      }
    }
  };
}

export default defineConfig({
  base: './',
  // Unknown paths 404 like on GitHub Pages instead of falling back to index.html.
  appType: 'mpa',
  plugins: [staticContent(), preloadFont()],
  esbuild: {
    drop: ['console', 'debugger']
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: ({ name }) => {
          if (/\.(gif|jpe?g|png|svg|webp)$/.test(name ?? '')) {
            return 'assets/img/[name]-[hash][extname]';
          }
          if (/\.css$/.test(name ?? '')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(name ?? '')) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  server: {
    port: 5173,
    headers: { 'Content-Security-Policy': CSP }
  }
});
