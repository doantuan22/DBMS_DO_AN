// Wait for real remote images; retry the same page once if a CDN request stalls.
// No URL substitution or transport mocking. Reload is only for readonly capture/audit.
import { wait } from '../db/seed-browser-support.mjs';
export async function readyImages(b, { reload = false } = {}) {
  const retries = [];
  for (let attempt = 0; attempt < (reload ? 2 : 1); attempt++) {
    await b.evaluate('[...document.images].forEach(i=>i.loading="eager")');
    try {
      await b.poll(
        () => b.evaluate('[...document.images].every(i=>i.complete)'),
        'real image transport',
        30000,
      );
      const images = await b.evaluate(
        '[...document.images].map(i=>({url:i.currentSrc||i.src,complete:i.complete,width:i.naturalWidth}))',
      );
      if (images.some((i) => !i.width))
        throw new Error('Broken image: ' + JSON.stringify(images.filter((i) => !i.width)));
      return { images, retries };
    } catch (error) {
      if (!reload || attempt) throw error;
      retries.push(
        await b.evaluate(
          '[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>({url:i.currentSrc||i.src,complete:i.complete,width:i.naturalWidth}))',
        ),
      );
      await b.cdp('Page.reload', { ignoreCache: false });
      await wait(700);
      await b.poll(
        () =>
          b.evaluate(
            "Boolean(document.querySelector('main'))&&!document.body.textContent.includes('Đang tải')&&!document.body.textContent.includes('Đang khôi phục phiên đăng nhập')",
          ),
        'readonly image reload',
        30000,
      );
      await b.evaluate('document.fonts.ready.then(()=>true)');
    }
  }
}
