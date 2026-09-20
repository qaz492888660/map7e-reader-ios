// Pure position and synthetic DOM rectangle checks; not browser layout evidence.
const assert = require('node:assert/strict')
const { buildSync } = require('esbuild')
const { Module } = require('node:module')
const { JSDOM } = require('jsdom')
const { readFileSync } = require('node:fs')
function load(entry) {
  const source = buildSync({
    entryPoints: [entry],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
  }).outputFiles[0].text
  const mod = new Module(entry, module)
  mod._compile(source, entry)
  return mod.exports
}
const { measurePages, pageForAnchor } = load('src/services/pagination.ts')
const {
  clampAnchor,
  resolvePosition,
  positionAtProgress,
  readingProgress,
} = load('src/services/readingPosition.ts')
const {
  convertText,
  displayOffsetToSource,
} = load('src/services/textScript.ts')
let count = 0
function check(name, run) {
  run()
  count++
  console.log('PASS ' + name)
}
check('Chinese script display converts without mutating the source string', () => {
  const source = '群眾心理與學習'
  assert.equal(convertText(source, 'original'), source)
  assert.equal(convertText(source, 'simplified'), '群众心理与学习')
  assert.equal(convertText('群众心理与学习', 'traditional'), '群眾心理與學習')
  assert.equal(source, '群眾心理與學習')
})
check('Display offsets map back to stable original-text offsets', () => {
  assert.equal(displayOffsetToSource('群眾心理', '群众心理', 2), 2)
  assert.equal(displayOffsetToSource('abcdef', 'abc', 2), 4)
  assert.equal(displayOffsetToSource('🍁字', '枫字', 1), 2)
})
const content = {
  bookId: 'fixture',
  revision: 'v2',
  format: 'txt',
  chapters: [
    { id: 'a', title: '原创测试甲', paragraphs: ['甲乙丙丁', '🍁戊己'] },
    { id: 'b', title: '原创测试乙', paragraphs: ['庚辛壬癸'] },
  ],
}
const position = {
  chapterId: 'a',
  paragraphIndex: 1,
  characterOffset: 2,
  contentRevision: 'v2',
  updatedAt: 123,
}
check(
  'Progress is weighted by original text offsets, not page or equal chapter counts',
  () => {
    assert.equal(readingProgress(content, position), 0.5)
    const middle = positionAtProgress(content, 0.75)
    assert.equal(middle.chapterId, 'b')
    assert.equal(middle.characterOffset, 1)
    assert.equal(readingProgress(content, middle), 0.75)
  },
)
check(
  'Stable positions round-trip without persisted runtime page numbers',
  () => {
    assert.deepEqual(resolvePosition(content, position), {
      ...position,
      completed: false,
    })
    assert.ok(!('page' in resolvePosition(content, position)))
  },
)
check(
  'Legacy chapter/fraction is migrated once to an approximate text anchor',
  () => {
    const migrated = resolvePosition(content, {
      chapter: 0,
      fraction: 0.75,
      updatedAt: 1,
      contentRevision: 'v2',
    })
    assert.equal(migrated.paragraphIndex, 1)
    assert.equal(migrated.characterOffset, 2)
    assert.ok(!('fraction' in migrated))
  },
)
check('A replaced revision resets the anchor and completion state', () => {
  const reset = resolvePosition(content, {
    ...position,
    contentRevision: 'v1',
    completed: true,
  })
  assert.equal(reset.chapterId, 'a')
  assert.equal(reset.paragraphIndex, 0)
  assert.equal(reset.characterOffset, 0)
  assert.equal(reset.completed, false)
})
check(
  'Clamping avoids negative offsets, overflowing paragraphs and split surrogate pairs',
  () => {
    assert.deepEqual(
      clampAnchor(['🍁字'], { paragraphIndex: 999, characterOffset: 1 }),
      { paragraphIndex: 0, characterOffset: 0 },
    )
    assert.deepEqual(
      clampAnchor(['字'], { paragraphIndex: -1, characterOffset: 999 }),
      { paragraphIndex: 0, characterOffset: 1 },
    )
    assert.deepEqual(
      clampAnchor([], { paragraphIndex: NaN, characterOffset: NaN }),
      { paragraphIndex: 0, characterOffset: 0 },
    )
  },
)
check('Book completion remains explicit and progress stays bounded', () => {
  assert.equal(
    readingProgress(content, { ...position, completed: true }),
    1,
  )
  assert.equal(readingProgress(content, positionAtProgress(content, -2)), 0)
  assert.equal(readingProgress(content, positionAtProgress(content, 2)), 1)
})
const dom = new JSDOM(
  '<article><p data-paragraph="0">甲乙丙丁戊己庚辛壬癸</p><p data-paragraph="1">天地玄黄宇宙</p></article>',
)
global.document = dom.window.document
const article = document.querySelector('article')
let origin = 24
let mapping = [
  [0, 0, 0, 1, 1, 1, 1, 1, 2, 2],
  [2, 2, 2, 2, 2, 2],
]
Object.defineProperty(article, 'scrollWidth', { get: () => 364 }) // three 100px columns + two 32px gaps
article.getBoundingClientRect = () => ({ left: origin })
dom.window.Range.prototype.getClientRects = function () {
  const paragraph = Number(
    this.startContainer.parentElement.dataset.paragraph,
  )
  return [{ left: origin + 132 * mapping[paragraph][this.startOffset] }]
}
check(
  'Actual Range rectangles determine irregular page boundaries within a paragraph',
  () => {
    assert.deepEqual(measurePages(article, 100), [
      { paragraphIndex: 0, characterOffset: 0 },
      { paragraphIndex: 0, characterOffset: 3 },
      { paragraphIndex: 0, characterOffset: 8 },
    ])
  },
)
check(
  'Column measurement is invariant under the current translateX offset',
  () => {
    const before = measurePages(article, 100)
    origin = -240
    assert.deepEqual(measurePages(article, 100), before)
  },
)
check('Reflow resolves the same anchor to a different runtime page', () => {
  const anchor = { paragraphIndex: 0, characterOffset: 6 }
  assert.equal(pageForAnchor(measurePages(article, 100), anchor), 1)
  mapping = [
    [0, 0, 1, 1, 2, 2, 2, 2, 2, 2],
    [2, 2, 2, 2, 2, 2],
  ]
  assert.equal(pageForAnchor(measurePages(article, 100), anchor), 2)
  assert.deepEqual(anchor, { paragraphIndex: 0, characterOffset: 6 })
})
check('Page lookup handles paragraph boundaries and exact starts', () => {
  mapping = [
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 2, 2, 2, 2],
  ]
  const pages = measurePages(article, 100)
  assert.deepEqual(pages[2], { paragraphIndex: 1, characterOffset: 2 })
  assert.equal(
    pageForAnchor(pages, { paragraphIndex: 1, characterOffset: 1 }),
    1,
  )
  assert.equal(pageForAnchor(pages, pages[2]), 2)
  assert.equal(pageForAnchor(pages, pages[0]), 0)
})
dom.window.close()
delete global.document
check(
  'Static CSS includes dynamic viewport, safe-area, clipped columns and reduced motion',
  () => {
    const css = readFileSync('src/index.css', 'utf8')
    assert.match(css, /100dvh/)
    for (const side of ['top', 'bottom', 'left', 'right'])
      assert.ok(css.includes(`env(safe-area-inset-${side}`))
    assert.match(css, /column-fill:\s*auto/)
    assert.match(css, /\.page-window\s*\{[^}]*overflow:\s*hidden/s)
    assert.match(css, /transform 180ms/)
    assert.match(css, /prefers-reduced-motion:\s*reduce/)
    assert.ok(
      !readFileSync('src/components/reader/Home.tsx', 'utf8').includes(
        'BookCarousel',
      ),
    )
  },
)
console.log(
  `\n${count} position/pagination/static checks passed. Rectangles are synthetic, not browser measurements.`,
)
