// Runs the actual production bundle in a DOM environment. No layout engine or
// physical touch device is emulated: mobile geometry/Safari need browser QA.
const { JSDOM, VirtualConsole } = require('jsdom')
const { IDBFactory } = require('fake-indexeddb')
const { readFileSync } = require('node:fs')
const assert = require('node:assert/strict')
const path = require('node:path')
const html = readFileSync(
  path.join(__dirname, '../dist/index.html'),
  'utf8',
)
const entry = html.match(/<script[^>]+src="([^"]+)"/)[1]
const bundle = readFileSync(path.join(__dirname, '../dist', entry), 'utf8')
const pause = () => new Promise((resolve) => setTimeout(resolve, 100))
const key = 'map7e-reader:v1'
let checks = 0
function check(message, condition) {
  assert.ok(condition, message)
  checks++
  console.log(`PASS ${message}`)
}
async function launch(
  hash = '#/home',
  stored,
  blocked = false,
  database = new IDBFactory(),
  reducedMotion = false,
) {
  const errors = []
  const console = new VirtualConsole()
  console.on('jsdomError', (error) => errors.push(error.message))
  console.on('error', (...args) => errors.push(args.join(' ')))
  const dom = new JSDOM(
    '<!doctype html><html><head><meta name="theme-color" content="#9ccfe5"></head><body><div id="root"></div></body></html>',
    {
      url: `https://reader.example/${hash}`,
      runScripts: 'outside-only',
      pretendToBeVisual: true,
      virtualConsole: console,
    },
  )
  const w = dom.window
  w.indexedDB = database
  w.File = File
  w.Blob = Blob
  w.TextDecoder = TextDecoder
  Object.defineProperty(w, 'innerWidth', {
    configurable: true,
    writable: true,
    value: 390,
  })
  Object.defineProperty(w, 'innerHeight', {
    configurable: true,
    writable: true,
    value: 844,
  })
  require('./dom-layout-fixture.cjs')(w)
  w.scrollTo = () => {}
  w.matchMedia = () => ({ matches: reducedMotion })
  w.HTMLMediaElement.prototype.play = () => Promise.resolve()
  w.HTMLMediaElement.prototype.pause = () => {}
  w.ResizeObserver = class {
    observe() {}
    disconnect() {}
  }
  w.HTMLElement.prototype.scrollTo = function ({ left = 0, top = 0 }) {
    this.scrollLeft = left
    this.scrollTop = top
    // JSDOM has no layout. Do not invent a scroll event for a zero-sized box.
    if (this.clientWidth > 0) this.dispatchEvent(new w.Event('scroll'))
  }
  w.HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  w.HTMLDialogElement.prototype.close = function () {
    this.open = false
  }
  if (stored !== undefined) w.localStorage.setItem(key, stored)
  if (blocked)
    Object.defineProperty(w, 'localStorage', {
      get() {
        throw new Error('Storage unavailable')
      },
    })
  w.eval(bundle)
  for (
    let attempt = 0;
    attempt < 20 && !w.document.querySelector('main') && !errors.length;
    attempt++
  )
    await pause()
  await pause()
  assert.deepEqual(errors, [], 'Application mount runtime errors')
  return { dom, w, d: w.document, errors }
}
function button(t, text) {
  return [...t.d.querySelectorAll('button')].find(
    (b) =>
      b.textContent.trim() === text ||
      b.getAttribute('aria-label') === text,
  )
}
async function click(t, text) {
  const b = button(t, text)
  assert.ok(b, `Button exists: ${text}`)
  b.click()
  await pause()
}
async function input(t, value) {
  const field = t.d.querySelector('input')
  Object.getOwnPropertyDescriptor(
    t.w.HTMLInputElement.prototype,
    'value',
  ).set.call(field, value)
  field.dispatchEvent(new t.w.Event('input', { bubbles: true }))
  await pause()
}
async function go(t, hash) {
  t.w.location.hash = hash
  await pause()
}
function anchorOf(t, id = 'general-psychology-6') {
  const p = JSON.parse(t.w.localStorage.getItem(key)).positions[id]
  return {
    chapterId: p.chapterId,
    paragraphIndex: p.paragraphIndex,
    characterOffset: p.characterOffset,
    contentRevision: p.contentRevision,
  }
}
function anchorVisible(t, anchor) {
  const p = t.d.querySelector(`[data-paragraph="${anchor.paragraphIndex}"]`)
  const range = t.d.createRange()
  range.setStart(p.firstChild, anchor.characterOffset)
  range.setEnd(
    p.firstChild,
    Math.min(anchor.characterOffset + 1, p.textContent.length),
  )
  const rect = range.getClientRects()[0]
  const box = t.d.querySelector('.page-window').getBoundingClientRect()
  return rect.left >= box.left && rect.left < box.right
}
function assertAnchorVisible(t, anchor) {
  assert.ok(
    anchorVisible(t, anchor),
    'The saved character must be inside the displayed synthetic column',
  )
}
async function waitForAnchorVisible(t, anchor) {
  for (let attempt = 0; attempt < 20 && !anchorVisible(t, anchor); attempt++)
    await pause()
  assertAnchorVisible(t, anchor)
}
async function tap(t, ratio) {
  t.d
    .querySelector('.reader-stage')
    .dispatchEvent(
      new t.w.MouseEvent('click', {
        bubbles: true,
        clientX: t.w.innerWidth * ratio,
        clientY: 220,
        detail: 1,
      }),
    )
  await pause()
}
async function swipe(t, dx, dy = 0, cancel = false) {
  const stage = t.d.querySelector('.reader-stage')
  for (const [type, x, y] of [
    ['pointerdown', 190, 230],
    [cancel ? 'pointercancel' : 'pointerup', 190 + dx, 230 + dy],
  ]) {
    const e = new t.w.Event(type, { bubbles: true })
    Object.assign(e, {
      clientX: x,
      clientY: y,
      pointerId: 1,
      isPrimary: true,
      button: 0,
      pointerType: 'touch',
    })
    stage.dispatchEvent(e)
  }
  await pause()
}
;(async () => {
  let t = await launch()
  check(
    'Home has only four bubble entries and no carousel',
    t.d.querySelectorAll('.bubble').length === 4 &&
      !t.d.querySelector('.book-carousel') &&
      t.d.querySelector('meta[name="theme-color"]').content === '#9ccfe5' &&
      !t.d.documentElement.dataset.readerSurface,
  )
  await click(t, '我的书库')
  check(
    'Home opens an independent Library with no bubbles',
    !!t.d.querySelector('.library') && !t.d.querySelector('.bubble-nav'),
  )
  await click(t, '查看《普通心理学》')
  check(
    'Real book metadata and missing-content CTA render',
    t.d.querySelector('h1').textContent === '普通心理学' &&
      t.d.body.textContent.includes('彭聃龄、陈宝国') &&
      t.d.body.textContent.includes('第6版') &&
      !!button(t, '导入书籍开始学习'),
  )
  await go(t, '#/book/b03')
  check(
    'Demo detail still renders before Reader',
    t.w.location.hash === '#/book/b03' &&
      !!t.d.querySelector('.detail') &&
      !t.d.querySelector('.reader'),
  )
  await click(t, '继续阅读')
  check(
    'Resume maps the displayed 45% to demo chapter 2',
    t.w.location.hash === '#/reader/b03' &&
      t.d.querySelector('.reader-content h1').textContent ===
        '沿着风的方向',
  )
  if (!button(t, '目录')) await click(t, '显示阅读工具')
  await click(t, '目录')
  check(
    'Contents opens as a labelled modal',
    t.d.querySelector('dialog[aria-label="目录"]').open,
  )
  const chapters = t.d.querySelectorAll('.contents-list button')
  chapters[2].click()
  await pause()
  check(
    'Contents navigation changes the chapter and closes the panel',
    t.d.querySelector('.reader-content h1').textContent ===
      '把夜晚留给一页书' && !t.d.querySelector('dialog'),
  )
  await click(t, '字体')
  await click(t, '23')
  await click(t, '黑体 / 无衬线')
  await click(t, '简体')
  check(
    'Font size, font family and script setting change',
    t.d
      .querySelector('.reader')
      .style.getPropertyValue('--reading-size') === '23px' &&
      !!t.d.querySelector('.font-sans') &&
      JSON.parse(t.w.localStorage.getItem(key)).settings.script ===
        'simplified',
  )
  await click(t, '关闭面板')
  await click(t, '主题')
  await click(t, '字夜读')
  await click(t, '海洋')
  const readerOceanVideo = t.d.querySelector('.ocean-reader video')
  check(
    'Reader ocean ambience uses the MAP7E Blog underwater video without replacing reading content',
    !!t.d.querySelector('.reader.ambience-ocean') &&
      !!readerOceanVideo &&
      readerOceanVideo.autoplay &&
      readerOceanVideo.loop &&
      readerOceanVideo.playsInline &&
      t.d
        .querySelector('.ocean-reader source')
        .getAttribute('src')
        .includes('blog.map7e.com/videos/underwater.mp4') &&
      !!t.d.querySelector('.reader-content'),
  )
  await click(t, '山海')
  check(
    'Reader shanhai ambience previews immediately without replacing reading content',
    !!t.d.querySelector('.reader.ambience-shanhai') &&
      !!t.d.querySelector('.scenic-reader.scenic-shanhai .scenic-motion-video') &&
      t.d
        .querySelector('.scenic-reader.scenic-shanhai .scenic-motion-video')
        .getAttribute('src')
        .includes('5701094-uhd_3238_2160_25fps.mp4') &&
      !!t.d.querySelector('.reader-content'),
  )
  await click(t, '天空')
  check(
    'Reader sky ambience previews immediately with the illustrated scenic layer',
    !!t.d.querySelector('.reader.ambience-sky') &&
      !!t.d.querySelector('.scenic-reader.scenic-sky .scenic-base-video') &&
      t.d
        .querySelector('.scenic-reader.scenic-sky .scenic-base-video')
        .getAttribute('src')
        .includes('/ambience/sky.mp4') &&
      !!t.d.querySelector('.reader-content'),
  )
  await click(t, '暗夜')
  check(
    'Reader night has its own video, poster, and browser color',
    !!t.d.querySelector('.reader.ambience-night .reader-content') &&
      t.d.querySelector('.scenic-reader.scenic-night .scenic-base-video')
        .getAttribute('src').includes('/ambience/night.mp4') &&
      t.d.querySelector('.scenic-reader.scenic-night .scenic-poster')
        .getAttribute('style').includes('/ambience/night.webp') &&
      t.d.querySelector('meta[name="theme-color"]').content === '#0b1420' &&
      t.d.documentElement.dataset.ambience === 'night',
  )
  await click(t, '天空')
  await click(t, '关闭面板')
  check(
    'Night theme changes and persists',
    !!t.d.querySelector('.reader.theme-night') &&
      JSON.parse(t.w.localStorage.getItem(key)).settings.theme ===
        'night' &&
      t.d.querySelector('meta[name="theme-color"]').content === '#202b30' &&
      t.d.documentElement.dataset.readerSurface === 'night',
  )
  await click(t, '下一页')
  t.w.dispatchEvent(new t.w.Event('pagehide'))
  await pause()
  const stable = JSON.parse(t.w.localStorage.getItem(key)).positions.b03
  check(
    'Pagehide saves a content anchor rather than scroll fraction or page number',
    Number.isInteger(stable.paragraphIndex) &&
      Number.isInteger(stable.characterOffset) &&
      !('fraction' in stable) &&
      !('page' in stable),
  )
  const saved = t.w.localStorage.getItem(key)
  await click(t, '返回')
  check(
    'Reader back returns to detail and restores the sky browser color',
    !!t.d.querySelector('.detail') &&
      t.d.querySelector('meta[name="theme-color"]').content === '#9ccfe5' &&
      !t.d.documentElement.dataset.readerSurface,
  )
  await go(t, '#/history')
  check(
    'History contains only actually visited books',
    t.d.querySelectorAll('.history-list>button').length === 1,
  )
  await go(t, '#/library')
  check(
    'Library has 37 demos, a private title, and two readable public-domain titles',
    t.d.querySelectorAll('.book-slide').length === 40,
  )
  await click(t, '仙侠奇缘')
  check(
    'Category filtering shows seven matching books',
    t.d.querySelectorAll('.book-slide').length === 7,
  )
  await input(t, '不存在的书')
  check(
    'Search has a usable empty state',
    t.d.querySelector('.empty-state').textContent.includes('换一个关键词'),
  )
  await input(t, '忘语')
  check(
    'Author search works within the category',
    t.d.querySelectorAll('.book-slide').length === 1 &&
      t.d.querySelector('.cover-title').textContent === '凡人修仙传',
  )
  await click(t, '查看《凡人修仙传》')
  await click(t, '返回')
  check(
    'Returning to Library preserves search and category',
    t.d.querySelector('input').value === '忘语' &&
      button(t, '仙侠奇缘').getAttribute('aria-pressed') === 'true',
  )
  await go(t, '#/settings')
  await click(t, '海洋')
  check(
    'Settings previews ocean ambience immediately without leaving the page',
    !!t.d.querySelector('.personal-page') &&
      !!t.d.querySelector('.reading-space.ambience-ocean') &&
      !!t.d.querySelector('.ocean-space video') &&
      t.d.querySelector('meta[name="theme-color"]').content === '#143f55',
  )
  await click(t, '天空')
  check(
    'Settings previews sky ambience immediately without leaving the page',
    !!t.d.querySelector('.personal-page') &&
      !!t.d.querySelector('.reading-space.ambience-sky') &&
      !!t.d.querySelector('.scenic-space.scenic-sky .scenic-base-video') &&
      t.d
        .querySelector('.scenic-space.scenic-sky .scenic-base-video')
        .getAttribute('src')
        .includes('/ambience/sky.mp4') &&
      t.d.querySelector('meta[name="theme-color"]').content === '#9ccfe5',
  )
  await click(t, '山海')
  check(
    'Settings previews shanhai ambience immediately without leaving the page',
    !!t.d.querySelector('.personal-page') &&
      !!t.d.querySelector('.reading-space.ambience-shanhai') &&
      !!t.d.querySelector('.scenic-space.scenic-shanhai .scenic-motion-video') &&
      t.d
        .querySelector('.scenic-space.scenic-shanhai .scenic-motion-video')
        .getAttribute('src')
        .includes('5701094-uhd_3238_2160_25fps.mp4') &&
      t.d.querySelector('meta[name="theme-color"]').content === '#78989a',
  )
  await click(t, '暗夜')
  check(
    'Settings previews independent night video and poster immediately',
    !!t.d.querySelector('.reading-space.ambience-night') &&
      t.d.querySelector('.scenic-space.scenic-night .scenic-base-video')
        .getAttribute('src').includes('/ambience/night.mp4') &&
      t.d.querySelector('.scenic-space.scenic-night .scenic-poster')
        .getAttribute('style').includes('/ambience/night.webp') &&
      t.d.querySelector('meta[name="theme-color"]').content === '#0b1420',
  )
  const nightStored = t.w.localStorage.getItem(key)
  t.dom.window.close()
  t = await launch('#/settings', nightStored, false, new IDBFactory(), true)
  check(
    'Reduced motion keeps the night poster and removes the video',
    !!t.d.querySelector('.scenic-space.scenic-night .scenic-poster') &&
      !t.d.querySelector('.scenic-space.scenic-night video') &&
      t.d.querySelector('.scenic-space.scenic-night').dataset.animated === 'false',
  )
  t.dom.window.close()
  t = await launch('#/reader/b03', nightStored, false, new IDBFactory(), true)
  check(
    'Reader reduced motion uses the night poster without playback',
    !!t.d.querySelector('.scenic-reader.scenic-night .scenic-poster') &&
      !t.d.querySelector('.scenic-reader.scenic-night video') &&
      t.d.querySelector('meta[name="theme-color"]').content === '#0b1420',
  )
  t.dom.window.close()
  t = await launch('#/settings', nightStored)
  check(
    'Reload restores night ambience and animated playback',
    !!t.d.querySelector('.scenic-space.scenic-night video') &&
      JSON.parse(t.w.localStorage.getItem(key)).settings.ambience === 'night',
  )
  await click(t, '云层动态')
  check(
    'Disabling motion leaves the dedicated night poster visible',
    !!t.d.querySelector('.scenic-space.scenic-night .scenic-poster') &&
      !t.d.querySelector('.scenic-space.scenic-night video'),
  )
  await click(t, '云层动态')
  await click(t, '海洋')
  await go(t, '#/home')
  const homeOceanVideo = t.d.querySelector('.ocean-space video')
  check(
    'Home ocean ambience uses the existing underwater scene and blue Safari chrome',
    !!t.d.querySelector('.reading-space.ambience-ocean') &&
      !!homeOceanVideo &&
      t.d
        .querySelector('.ocean-space source')
        .getAttribute('src')
        .includes('blog.map7e.com/videos/underwater.mp4') &&
      t.d.querySelector('meta[name="theme-color"]').content === '#143f55' &&
      t.d.body.textContent.includes('A ROOM BENEATH THE WAVES'),
  )
  await go(t, '#/settings')
  await click(t, '山海')
  await go(t, '#/home')
  check(
    'Home shanhai ambience uses the illustrated animated scene and matching label',
    !!t.d.querySelector('.reading-space.ambience-shanhai') &&
      !!t.d.querySelector('.scenic-space.scenic-shanhai .scenic-motion-video') &&
      t.d.querySelector('meta[name="theme-color"]').content === '#78989a' &&
      t.d.body.textContent.includes('A ROOM BETWEEN MOUNTAINS AND SEA'),
  )
  await go(t, '#/settings')
  await click(t, '暗夜')
  await go(t, '#/home')
  check(
    'Home night uses a moonlit scene with matching Safari color',
    !!t.d.querySelector('.reading-space.ambience-night') &&
      !!t.d.querySelector('.scenic-space.scenic-night .scenic-base-video') &&
      t.d.querySelector('meta[name="theme-color"]').content === '#0b1420' &&
      t.d.body.textContent.includes('A ROOM UNDER THE NIGHT SKY'),
  )
  await go(t, '#/settings')
  await click(t, '天空')
  check(
    'Ambience choice persists and can return to sky mode',
    JSON.parse(t.w.localStorage.getItem(key)).settings.ambience === 'sky',
  )
  await click(t, '云层动态')
  check(
    'Motion switch stops ambient animation',
    !!t.d.querySelector('.motion-paused') &&
      t.d
        .querySelector('.scenic-space.scenic-sky')
        .getAttribute('data-animated') === 'false',
  )
  check(
    'Main interaction flow has no runtime errors',
    t.errors.length === 0,
  )
  t.dom.window.close()
  t = await launch('#/reader/b03', saved)
  check(
    'Refresh restores the chapter, font, and theme',
    t.d.querySelector('.reader-content h1').textContent ===
      '把夜晚留给一页书' &&
      !!t.d.querySelector('.theme-night') &&
      t.d
        .querySelector('.reader')
        .style.getPropertyValue('--reading-size') === '23px',
  )
  await click(t, '显示阅读工具')
  await click(t, '返回')
  check(
    'Direct reader link has a safe back fallback',
    t.w.location.hash === '#/home',
  )
  check('Refresh flow has no runtime errors', t.errors.length === 0)
  t.dom.window.close()
  t = await launch('#/book/missing', '{broken')
  check(
    'Unknown book and corrupted storage do not crash',
    t.d.querySelector('h1').textContent === '这本书不在书架上。' &&
      !t.errors.length,
  )
  await click(t, '回到书库')
  check(
    'Missing-book recovery opens Library',
    !!t.d.querySelector('.library'),
  )
  t.dom.window.close()
  t = await launch('#/reader/b03', undefined, true)
  check(
    'Unavailable localStorage does not crash Reader',
    !!t.d.querySelector('.reader') && !t.errors.length,
  )
  t.dom.window.close()
  t = await launch('#/book/%E0%A4%A')
  check(
    'Malformed URL safely falls back to Home',
    !!t.d.querySelector('.home') && !t.errors.length,
  )
  t.dom.window.close()

  const database = new IDBFactory()
  t = await launch(
    '#/reader/general-psychology-6',
    undefined,
    false,
    database,
  )
  check(
    'Missing real book never displays demo prose',
    t.d.body.textContent.includes('正文文件尚未导入') &&
      !t.d.querySelector('article') &&
      !t.d.body.textContent.includes('云停在窗边'),
  )
  await click(t, '导入私人书籍文件')
  check(
    'File input accepts TXT and EPUB',
    t.d.querySelector('input[type=file]').accept.includes('.epub') &&
      t.d.querySelector('input[type=file]').accept.includes('.txt'),
  )
  async function choose(t, file) {
    const element = t.d.querySelector('input[type=file]')
    Object.defineProperty(element, 'files', {
      configurable: true,
      value: [file],
    })
    element.dispatchEvent(new t.w.Event('change', { bubbles: true }))
    await pause()
    await pause()
  }
  await choose(t, new File([''], 'empty.txt'))
  check(
    'Empty file is rejected before saving',
    t.d.querySelector('[role=alert]').textContent.includes('非空'),
  )
  await choose(t, new File(['wrong'], 'wrong.pdf'))
  check(
    'Unsupported PDF is rejected',
    t.d.querySelector('[role=alert]').textContent.includes('TXT 或 EPUB'),
  )
  const fixture =
    '第一章 私人导入测试\n这不是教材原文，只是验证导入流程的测试文本。\n<script>window.injected=true</script>\n第二章 位置恢复测试\n' +
    '用于确认阅读进度的测试段落。\n'.repeat(100)
  await choose(
    t,
    new File([fixture], 'map7e-test-only.txt', { type: 'text/plain' }),
  )
  check(
    'TXT preview includes only the selected file',
    t.d
      .querySelector('.import-preview')
      .textContent.includes('这不是教材原文') &&
      t.d
        .querySelector('.import-preview')
        .textContent.includes('2 个阅读分段'),
  )
  await click(t, '关闭面板')
  check(
    'Cancelling a preview leaves the book missing',
    !t.d.querySelector('article') &&
      t.d.body.textContent.includes('正文文件尚未导入'),
  )
  await go(t, '#/book/general-psychology-6')
  check(
    'Preview cancellation creates no saved file',
    !!button(t, '导入书籍开始学习') && !button(t, '移除已导入文件'),
  )
  await click(t, '导入书籍开始学习')
  await choose(t, new File([fixture], 'map7e-test-only.txt'))
  await click(t, '确认导入并开始阅读')
  check(
    'TXT opens as private content and renders markup as text',
    t.d
      .querySelector('.reader-content')
      .textContent.includes('<script>window.injected=true</script>') &&
      !t.w.injected &&
      !t.d.body.textContent.includes('演示正文 · 非原著内容'),
  )
  if (!button(t, '目录')) await click(t, '显示阅读工具')
  await click(t, '目录')
  const entries = t.d.querySelectorAll('.contents-list button')
  check(
    'Reader TOC comes from this file',
    entries.length === 2 &&
      entries[1].textContent.includes('第二章 位置恢复测试'),
  )
  entries[1].click()
  await pause()
  await click(t, '下一页')
  await click(t, '下一页')
  t.w.dispatchEvent(new t.w.Event('pagehide'))
  await pause()
  const privatePosition = JSON.parse(t.w.localStorage.getItem(key))
    .positions['general-psychology-6']
  check(
    'Pagination advances the stable paragraph or character offset',
    privatePosition.paragraphIndex > 0 ||
      privatePosition.characterOffset > 0,
  )
  const checkpoint = t.w.localStorage.getItem(key)
  check(
    'Large body never enters localStorage',
    !checkpoint.includes('这不是教材原文') &&
      !checkpoint.includes('用于确认阅读进度'),
  )
  const beforeTap = anchorOf(t)
  await tap(t, 0.1)
  check(
    'Left 25% tap moves to the previous measured page',
    JSON.stringify(anchorOf(t)) !== JSON.stringify(beforeTap),
  )
  await tap(t, 0.9)
  check(
    'Right 25% tap returns to the next measured page',
    JSON.stringify(anchorOf(t)) === JSON.stringify(beforeTap),
  )
  await tap(t, 0.5)
  check(
    'Central tap hides controls but keeps progress visible',
    !t.d.querySelector('.reader-top-controls') &&
      !!t.d.querySelector('.reader-persistent-progress progress'),
  )
  await tap(t, 0.5)
  check(
    'Central tap reveals controls and current page count',
    !!t.d.querySelector('.reader-top-controls') &&
      t.d.querySelector('.reader-page-status').textContent.includes('页'),
  )
  const beforeSelection = anchorOf(t)
  const selectionRange = t.d.createRange()
  selectionRange.selectNodeContents(t.d.querySelector('[data-paragraph]'))
  t.w.getSelection().removeAllRanges()
  t.w.getSelection().addRange(selectionRange)
  assert.ok(
    t.w.getSelection().toString(),
    'Selection fixture must actually select text',
  )
  await tap(t, 0.1)
  check(
    'Text selection prevents accidental tap navigation',
    JSON.stringify(anchorOf(t)) === JSON.stringify(beforeSelection),
  )
  t.w.getSelection().removeAllRanges()
  await click(t, '目录')
  t.d.querySelectorAll('.contents-list button')[1].click()
  await pause()
  const beforeSwipe = anchorOf(t)
  check(
    'Selecting the current chapter resets its runtime page as well as anchor',
    t.d.querySelector('.reader-columns').style.transform ===
      'translateX(0px)',
  )
  await swipe(t, -100)
  check(
    'Synthetic left swipe advances a page',
    JSON.stringify(anchorOf(t)) !== JSON.stringify(beforeSwipe),
  )
  await swipe(t, 100)
  check(
    'Synthetic right swipe restores the previous page',
    JSON.stringify(anchorOf(t)) === JSON.stringify(beforeSwipe),
  )
  await swipe(t, -70, 180)
  check(
    'Vertical gesture does not turn a page',
    JSON.stringify(anchorOf(t)) === JSON.stringify(beforeSwipe),
  )
  await swipe(t, -100, 0, true)
  check(
    'Cancelled pointer gesture does not turn a page',
    JSON.stringify(anchorOf(t)) === JSON.stringify(beforeSwipe),
  )
  await click(t, '下一页')
  const beforeReflow = anchorOf(t)
  await click(t, '字体')
  for (const setting of ['25', '黑体 / 无衬线', '行距 2.05', '边距 34']) {
    await click(t, setting)
    t.w.dispatchEvent(new t.w.Event('pagehide'))
    assertAnchorVisible(t, beforeReflow)
    check(
      `Reflow retains semantic anchor after ${setting}`,
      JSON.stringify(anchorOf(t)) === JSON.stringify(beforeReflow),
    )
  }
  await click(t, '关闭面板')
  for (const width of [360, 375, 390, 430]) {
    t.w.innerWidth = width
    t.w.dispatchEvent(new t.w.Event('resize'))
    await pause()
    t.w.dispatchEvent(new t.w.Event('pagehide'))
    assertAnchorVisible(t, beforeReflow)
    check(
      `Synthetic ${width}px resize retains anchor and paginated DOM`,
      JSON.stringify(anchorOf(t)) === JSON.stringify(beforeReflow) &&
        !!t.d.querySelector('.reader-columns') &&
        !t.d.querySelector('.reader-scroll'),
    )
  }
  t.w.innerWidth = 844
  t.w.innerHeight = 390
  t.w.dispatchEvent(new t.w.Event('resize'))
  await waitForAnchorVisible(t, beforeReflow)
  check(
    'Synthetic landscape resize retains the content anchor',
    JSON.stringify(anchorOf(t)) === JSON.stringify(beforeReflow),
  )
  // Return to original dimensions and position before checking full re-open below.
  t.w.innerWidth = 390
  t.w.innerHeight = 844
  t.w.dispatchEvent(new t.w.Event('resize'))
  await pause()
  await click(t, '目录')
  t.d.querySelectorAll('.contents-list button')[1].click()
  await pause()
  await click(t, '字体')
  await click(t, '19')
  await click(t, '宋体 / 衬线')
  await click(t, '行距 1.85')
  await click(t, '边距 26')
  await click(t, '关闭面板')
  await click(t, '下一页')
  await click(t, '下一页')
  await go(t, '#/home')
  await click(t, '继续阅读')
  check(
    'Continue Reading goes directly to the saved private chapter',
    t.w.location.hash === '#/reader/general-psychology-6' &&
      t.d.querySelector('h1').textContent === '第二章 位置恢复测试' &&
      !t.d.querySelector('.detail'),
  )
  check(
    'Continue Reading restores the saved content anchor',
    JSON.parse(t.w.localStorage.getItem(key)).positions[
      'general-psychology-6'
    ].paragraphIndex === privatePosition.paragraphIndex &&
      JSON.parse(t.w.localStorage.getItem(key)).positions[
        'general-psychology-6'
      ].characterOffset === privatePosition.characterOffset,
  )
  t.dom.window.close()
  // No localStorage checkpoint: prove metadata, chapters and position persist in IDB.
  t = await launch(
    '#/reader/general-psychology-6',
    undefined,
    false,
    database,
  )
  check(
    'Refresh recovers private text and position from IndexedDB alone',
    t.d.querySelector('h1').textContent === '第二章 位置恢复测试' &&
      JSON.parse(t.w.localStorage.getItem(key)).positions[
        'general-psychology-6'
      ].paragraphIndex === privatePosition.paragraphIndex,
  )
  await go(t, '#/book/general-psychology-6')
  check(
    'Imported book detail shows readable state and file TOC',
    !!button(t, '继续阅读') &&
      t.d
        .querySelector('.detail-contents')
        .textContent.includes('第二章 位置恢复测试'),
  )
  const beforeFailedReplace = anchorOf(t)
  await click(t, '替换私人书籍文件')
  await choose(t, new File(['invalid'], 'wrong.pdf'))
  await click(t, '关闭面板')
  check(
    'Invalid replacement leaves the old position unchanged',
    JSON.stringify(anchorOf(t)) === JSON.stringify(beforeFailedReplace),
  )
  await click(t, '替换私人书籍文件')
  await choose(
    t,
    new File(['第一章 保存失败测试\n仅测试保存事务。'], 'fail-replace.txt'),
  )
  const saveOpen = t.w.indexedDB.open.bind(t.w.indexedDB)
  t.w.indexedDB.open = () => {
    throw Error('QuotaExceededError')
  }
  await click(t, '确认导入并开始阅读')
  check(
    'Failed replacement reports failure and preserves old checkpoint',
    t.d.querySelector('[role=alert]').textContent.includes('保存失败') &&
      JSON.stringify(anchorOf(t)) === JSON.stringify(beforeFailedReplace),
  )
  t.w.indexedDB.open = saveOpen
  await click(t, '关闭面板')
  await click(t, '继续阅读')
  check(
    'Old text remains readable after failed replacement',
    t.d.querySelector('h1').textContent === '第二章 位置恢复测试',
  )
  await go(t, '#/book/general-psychology-6')
  await click(t, '替换私人书籍文件')
  await choose(
    t,
    new File(
      ['第一章 新文件\n这是一份新的导入测试文本。'],
      'replacement-test.txt',
    ),
  )
  check(
    'Replacement explicitly warns about progress reset',
    !!t.d.querySelector('.import-warning'),
  )
  await click(t, '确认导入并开始阅读')
  check(
    'Replacement resets old chapter and shows only new text',
    t.d.querySelector('h1').textContent === '第一章 新文件' &&
      Number(t.d.querySelector('progress').value) === 0 &&
      !t.d.body.textContent.includes('用于确认阅读进度'),
  )
  await go(t, '#/book/general-psychology-6')
  await click(t, '替换私人书籍文件')
  await choose(
    t,
    new File([new Uint8Array([80, 75, 3, 4, 0, 0])], 'container-test.epub'),
  )
  check(
    'EPUB preview clearly states no parser is available',
    !!button(t, '仅保存 EPUB 文件') &&
      t.d
        .querySelector('.import-preview')
        .textContent.includes('等待后续解析支持'),
  )
  await click(t, '仅保存 EPUB 文件')
  await go(t, '#/reader/general-psychology-6')
  check(
    'Stored EPUB never renders previous TXT or demo content',
    t.d.body.textContent.includes('EPUB 文件已保存在本机') &&
      !t.d.querySelector('article'),
  )
  await go(t, '#/book/general-psychology-6')
  await click(t, '移除已导入文件')
  check(
    'Removal requires an explicit second confirmation',
    !!button(t, '确认移除私人文件'),
  )
  await click(t, '保留文件')
  check(
    'Cancelling removal keeps the saved file',
    !!button(t, '移除已导入文件'),
  )
  await click(t, '移除已导入文件')
  const deleteOpen = t.w.indexedDB.open.bind(t.w.indexedDB)
  t.w.indexedDB.open = () => {
    throw Error('Storage unavailable')
  }
  await click(t, '确认移除私人文件')
  check(
    'Failed removal reports failure without changing the book',
    t.d.querySelector('[role=alert]').textContent.includes('移除失败') &&
      !!button(t, '移除已导入文件'),
  )
  t.w.indexedDB.open = deleteOpen
  await click(t, '确认移除私人文件')
  check(
    'Removal retains metadata and restores the missing-file CTA',
    t.d.querySelector('h1').textContent === '普通心理学' &&
      !!button(t, '导入书籍开始学习') &&
      !button(t, '移除已导入文件'),
  )
  check(
    'Removal clears the localStorage position checkpoint',
    !JSON.parse(t.w.localStorage.getItem(key)).positions[
      'general-psychology-6'
    ],
  )
  t.dom.window.close()
  t = await launch(
    '#/reader/general-psychology-6',
    undefined,
    false,
    database,
  )
  check(
    'Fresh launch confirms removed file and body stay missing',
    !t.d.querySelector('article') &&
      t.d.body.textContent.includes('正文文件尚未导入') &&
      !t.d.body.textContent.includes('EPUB 文件已保存在本机'),
  )
  check('Private import flow has no runtime errors', !t.errors.length)
  t.dom.window.close()
  t = await launch(
    '#/reader/general-psychology-6',
    undefined,
    false,
    undefined,
  )
  // Simulate quota denial after successful opening/preview, without a real upload.
  await click(t, '导入私人书籍文件')
  await choose(
    t,
    new File(['第一章 失败测试\n仅用于模拟保存失败。'], 'quota-test.txt'),
  )
  const originalOpen = t.w.indexedDB.open.bind(t.w.indexedDB)
  t.w.indexedDB.open = () => {
    throw new Error('QuotaExceededError')
  }
  await click(t, '确认导入并开始阅读')
  check(
    'Storage failure keeps the preview and reports failure instead of success',
    !!t.d.querySelector('.import-preview') &&
      t.d.querySelector('[role=alert]').textContent.includes('保存失败') &&
      !t.d.querySelector('article'),
  )
  t.w.indexedDB.open = originalOpen
  t.dom.window.close()

  for (const spec of [
    {
      id: 'crowd-psychology-1920',
      title: '群众心理',
      count: 15,
      minimum: 80000,
      edition: '1920年中文译本',
      author: 'Gustave Le Bon（黎朋）',
      translator: '吴旭初、杜师业',
    },
    {
      id: 'psychology-and-mechanics',
      title: '心理与力学',
      count: 14,
      minimum: 55000,
      edition: '1942年',
      author: '李宗吾',
    },
  ]) {
    const file = path.join(
      __dirname,
      `../src/data/books/${spec.id}/chapters.ts`,
    )
    const chapters = JSON.parse(
      readFileSync(file, 'utf8').split('export const chapters: Chapter[] = ')[1],
    )
    const body = chapters.flatMap((chapter) => chapter.paragraphs).join('\n')
    check(
      `${spec.title} contains the original full chapter sequence`,
      chapters.length === spec.count &&
        chapters.every((chapter) => chapter.paragraphs.length > 0) &&
        body.length > spec.minimum &&
        chapters.some((chapter) => chapter.title.includes('第一章')) ===
          (spec.id === 'crowd-psychology-1920'),
    )
    check(
      `${spec.title} body excludes website navigation`,
      !/跳转到内容|页面工具|姊妹计划|下载按钮|本译文与其原文有分别的版权许可/.test(body),
    )
    t = await launch('#/library', undefined, false, new IDBFactory())
    await input(t, spec.title)
    check(
      `${spec.title} appears in Library without a private import`,
      t.d.querySelectorAll('.book-slide').length === 1 &&
        t.d.querySelector('.cover-title').textContent === spec.title,
    )
    await click(t, `查看《${spec.title}》`)
    const details = t.d.querySelector('.detail').textContent
    check(
      `${spec.title} shows edition, author, public-domain status and source`,
      details.includes(spec.author) &&
        details.includes(spec.edition) &&
        details.includes('公有领域') &&
        details.includes(spec.translator || spec.author) &&
        t.d.querySelector('.detail-contents a[href*="zh.wikisource.org"]') &&
        !!button(t, '开始阅读'),
    )
    await click(t, '开始阅读')
    check(
      `${spec.title} opens bundled text directly in the paginated Reader`,
      !!t.d.querySelector('.reader-columns') &&
        !!t.d.querySelector('.reader-content p') &&
        t.d.body.textContent.includes('公版原文') &&
        !t.d.body.textContent.includes('正文文件尚未导入'),
    )
    await click(t, '显示阅读工具')
    await click(t, '目录')
    const entries = t.d.querySelectorAll('.contents-list button')
    check(
      `${spec.title} TOC contains all original reading segments`,
      entries.length === spec.count,
    )
    entries[3].click()
    await pause()
    check(
      `${spec.title} TOC jumps to the chosen real chapter`,
      t.d.querySelector('.reader-content h1').textContent ===
        chapters[3].title &&
        t.d.querySelector('.reader-content p').textContent ===
          chapters[3].paragraphs[0],
    )
    check(
      `${spec.title} progress reflects the selected chapter`,
      Number(t.d.querySelector('.reader-persistent-progress progress').value) > 0,
    )
    t.w.dispatchEvent(new t.w.Event('pagehide'))
    await pause()
    const checkpoint = t.w.localStorage.getItem(key)
    const position = anchorOf(t, spec.id)
    check(
      `${spec.title} stores a stable content anchor without private body`,
      position.chapterId === chapters[3].id &&
        position.contentRevision.includes('wikisource-') &&
        !checkpoint.includes(chapters[3].paragraphs[0]),
    )
    check(`${spec.title} has no runtime errors`, t.errors.length === 0)
    t.dom.window.close()
    t = await launch(`#/reader/${spec.id}`, checkpoint, false, new IDBFactory())
    check(
      `${spec.title} reopens at the same chapter without IndexedDB`,
      t.d.querySelector('.reader-content h1').textContent ===
        chapters[3].title &&
        JSON.stringify(anchorOf(t, spec.id)) === JSON.stringify(position),
    )
    await go(t, '#/home')
    await click(t, '继续阅读')
    check(
      `${spec.title} Continue Reading returns directly to Reader`,
      t.w.location.hash === `#/reader/${spec.id}` &&
        t.d.querySelector('.reader-content h1').textContent ===
          chapters[3].title,
    )
    t.dom.window.close()
  }
  t = await launch('#/reader/general-psychology-6', undefined, false, new IDBFactory())
  check(
    'Psychology textbook still has no bundled body after adding public-domain books',
    !t.d.querySelector('.reader-content') &&
      t.d.body.textContent.includes('正文文件尚未导入'),
  )
  t.dom.window.close()
  console.log(
    `\n${checks} checks passed. JSDOM + synthetic geometry only; no real browser layout, touch, safe-area or FPS verification.`,
  )
})().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
