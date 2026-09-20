// Synthetic geometry for interaction tests ONLY. JSDOM does not render columns.
// These deterministic rectangles exercise Range-based page/anchor mapping;
// they are not evidence of browser wrapping, safe-area, touch or visual layout.
module.exports = function installGeometry(w) {
  function metrics(el) {
    const reader =
      el.closest?.('.paged-reader') ||
      w.document.querySelector('.paged-reader')
    const font =
      parseFloat(reader?.style.getPropertyValue('--reading-size')) || 19
    const line =
      parseFloat(reader?.style.getPropertyValue('--reading-line-height')) ||
      1.85
    const margin =
      parseFloat(reader?.style.getPropertyValue('--reading-margin')) || 26
    const width = w.innerWidth - margin * 2,
      height = w.innerHeight - 76
    const columns = Math.max(
      1,
      Math.floor(
        width / (font * (reader?.querySelector('.font-sans') ? 1.05 : 1)),
      ),
    )
    const capacity =
      columns * Math.max(1, Math.floor(height / (font * line)))
    return { width, height, font, columns, capacity, margin }
  }
  function offset(p) {
    const m = metrics(p)
    let n = m.columns * 4 // deterministic heading space
    for (const sibling of p.parentElement.querySelectorAll(
      '[data-paragraph]',
    )) {
      if (sibling === p) break
      n += sibling.textContent.length + m.columns
    }
    return n
  }
  function rect(left, top, width, height) {
    return {
      x: left,
      y: top,
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      toJSON() {
        return this
      },
    }
  }
  const proto = w.HTMLElement.prototype
  const oldWidth = Object.getOwnPropertyDescriptor(
    w.Element.prototype,
    'clientWidth',
  ).get
  const oldHeight = Object.getOwnPropertyDescriptor(
    w.Element.prototype,
    'clientHeight',
  ).get
  const oldScrollWidth = Object.getOwnPropertyDescriptor(
    w.Element.prototype,
    'scrollWidth',
  ).get
  Object.defineProperty(proto, 'clientWidth', {
    configurable: true,
    get() {
      return this.matches('.page-window')
        ? metrics(this).width
        : oldWidth.call(this)
    },
  })
  Object.defineProperty(proto, 'clientHeight', {
    configurable: true,
    get() {
      return this.matches('.page-window')
        ? metrics(this).height
        : oldHeight.call(this)
    },
  })
  Object.defineProperty(proto, 'scrollWidth', {
    configurable: true,
    get() {
      if (!this.matches('.reader-columns')) return oldScrollWidth.call(this)
      const m = metrics(this),
        ps = this.querySelectorAll('[data-paragraph]'),
        last = ps[ps.length - 1]
      const total = last ? offset(last) + last.textContent.length : 0
      return (
        Math.max(1, Math.ceil(total / m.capacity)) * (m.width + 32) - 32
      )
    },
  })
  const originalRect = proto.getBoundingClientRect
  proto.getBoundingClientRect = function () {
    if (this.matches('.reader-stage'))
      return rect(0, 0, w.innerWidth, w.innerHeight - 44)
    if (this.matches('.page-window,.reader-columns')) {
      const m = metrics(this),
        shift =
          parseFloat(
            this.style.transform?.match(/translateX\(([-.\d]+)/)?.[1],
          ) || 0
      return rect(m.margin + shift, 18, m.width, m.height)
    }
    return originalRect.call(this)
  }
  w.Range.prototype.getClientRects = function () {
    const node = this.startContainer,
      p = node.parentElement
    if (!p?.matches('[data-paragraph]')) return []
    const m = metrics(p),
      n = offset(p) + this.startOffset,
      page = Math.floor(n / m.capacity)
    const origin = p.parentElement.getBoundingClientRect().left
    return [
      rect(
        origin + page * (m.width + 32) + (n % m.columns) * m.font,
        18,
        m.font,
        m.font,
      ),
    ]
  }
  w.Range.prototype.getBoundingClientRect = function () {
    return this.getClientRects()[0] || rect(0, 0, 0, 0)
  }
}
