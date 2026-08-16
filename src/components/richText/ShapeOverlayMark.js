import { Mark, mergeAttributes } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'

const ALLOWED_SHAPES = new Set([
  'triangle',
  'circle',
  'box',
  'cloud',
  'x-overlay',
  'cross-underline',
  'swoop-underline',
  'dash-underline',
  'wavy-underline',
  'custom-symbol',
  'custom-drawing',
])

const normalizeShape = (shape) => (ALLOWED_SHAPES.has(shape) ? shape : 'triangle')
const normalizeColor = (color) => (/^#[0-9a-fA-F]{6}$/.test(color) ? color : '')
const normalizeSymbol = (symbol) => String(symbol || '').trim().slice(0, 4)
const normalizeSize = (size) => {
  const parsed = Number(size)
  if (!Number.isFinite(parsed)) return 1.6
  return Math.min(Math.max(parsed, 0.8), 3)
}
const normalizeOpacity = (opacity) => {
  const parsed = Number(opacity)
  if (!Number.isFinite(parsed)) return 0.58
  return Math.min(Math.max(parsed, 0.15), 1)
}
const normalizeOffsetY = (offsetY) => {
  const parsed = Number(offsetY)
  if (!Number.isFinite(parsed)) return 0
  return Math.min(Math.max(parsed, -0.6), 0.6)
}
const normalizeDrawingPath = (path) => String(path || '').replace(/[^MmLlHhVvCcSsQqTtAaZz0-9,.\-\s]/g, '').slice(0, 6000)
const normalizeDrawingViewBox = (viewBox) =>
  /^\s*-?\d+(\.\d+)?\s+-?\d+(\.\d+)?\s+\d+(\.\d+)?\s+\d+(\.\d+)?\s*$/.test(String(viewBox || ''))
    ? String(viewBox).trim()
    : '0 0 120 60'
const normalizeStrokeWidth = (strokeWidth) => {
  const parsed = Number(strokeWidth)
  if (!Number.isFinite(parsed)) return 5
  return Math.min(Math.max(parsed, 1), 12)
}

const svgDataUrl = ({ path, color, opacity, strokeWidth, viewBox }) => {
  if (!path) return ''

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><path d="${path}" fill="none" stroke="${color || '#dc2626'}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

const appendStyle = (existingStyle, declaration) =>
  [existingStyle, declaration]
    .filter(Boolean)
    .map((style) => style.trim().replace(/;$/, ''))
    .join('; ')

export const ShapeOverlayMark = Mark.create({
  name: 'shapeOverlay',
  inclusive: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      shape: {
        default: 'triangle',
        parseHTML: (element) => normalizeShape(element.getAttribute('data-shape-overlay')),
        renderHTML: (attributes) => ({
          'data-shape-overlay': normalizeShape(attributes.shape),
        }),
      },
      color: {
        default: '',
        parseHTML: (element) => normalizeColor(element.getAttribute('data-shape-overlay-color')),
        renderHTML: (attributes) => {
          const color = normalizeColor(attributes.color)
          return color
            ? {
                'data-shape-overlay-color': color,
                style: `--shape-overlay-color: ${color}`,
              }
            : {}
        },
      },
      symbol: {
        default: '',
        parseHTML: (element) => normalizeSymbol(element.getAttribute('data-shape-overlay-symbol')),
        renderHTML: (attributes) => {
          const symbol = normalizeSymbol(attributes.symbol)
          return symbol ? { 'data-shape-overlay-symbol': symbol } : {}
        },
      },
      size: {
        default: 1.6,
        parseHTML: (element) => normalizeSize(element.getAttribute('data-shape-overlay-size')),
        renderHTML: (attributes) => ({ 'data-shape-overlay-size': normalizeSize(attributes.size) }),
      },
      opacity: {
        default: 0.58,
        parseHTML: (element) => normalizeOpacity(element.getAttribute('data-shape-overlay-opacity')),
        renderHTML: (attributes) => ({ 'data-shape-overlay-opacity': normalizeOpacity(attributes.opacity) }),
      },
      offsetY: {
        default: 0,
        parseHTML: (element) => normalizeOffsetY(element.getAttribute('data-shape-overlay-offset-y')),
        renderHTML: (attributes) => ({ 'data-shape-overlay-offset-y': normalizeOffsetY(attributes.offsetY) }),
      },
      drawingPath: {
        default: '',
        parseHTML: (element) => normalizeDrawingPath(element.getAttribute('data-shape-overlay-drawing-path')),
        renderHTML: (attributes) => {
          const drawingPath = normalizeDrawingPath(attributes.drawingPath)
          return drawingPath ? { 'data-shape-overlay-drawing-path': drawingPath } : {}
        },
      },
      drawingViewBox: {
        default: '0 0 120 60',
        parseHTML: (element) => normalizeDrawingViewBox(element.getAttribute('data-shape-overlay-drawing-view-box')),
        renderHTML: (attributes) => ({
          'data-shape-overlay-drawing-view-box': normalizeDrawingViewBox(attributes.drawingViewBox),
        }),
      },
      strokeWidth: {
        default: 5,
        parseHTML: (element) => normalizeStrokeWidth(element.getAttribute('data-shape-overlay-stroke-width')),
        renderHTML: (attributes) => ({
          'data-shape-overlay-stroke-width': normalizeStrokeWidth(attributes.strokeWidth),
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-shape-overlay]' }]
  },

  renderHTML({ mark, HTMLAttributes }) {
    const shape = normalizeShape(mark.attrs.shape)
    const color = normalizeColor(mark.attrs.color)
    const symbol = normalizeSymbol(mark.attrs.symbol)
    const size = normalizeSize(mark.attrs.size)
    const opacity = normalizeOpacity(mark.attrs.opacity)
    const offsetY = normalizeOffsetY(mark.attrs.offsetY)
    const drawingPath = normalizeDrawingPath(mark.attrs.drawingPath)
    const drawingViewBox = normalizeDrawingViewBox(mark.attrs.drawingViewBox)
    const strokeWidth = normalizeStrokeWidth(mark.attrs.strokeWidth)
    const drawingImage = shape === 'custom-drawing'
      ? svgDataUrl({ path: drawingPath, color, opacity, strokeWidth, viewBox: drawingViewBox })
      : ''
    const styleDeclarations = [
      color ? `--shape-overlay-color: ${color}` : '',
      `--shape-overlay-size: ${size}em`,
      `--shape-overlay-opacity: ${opacity}`,
      `--shape-overlay-offset-y: ${offsetY}em`,
      drawingImage ? `--shape-overlay-drawing: ${drawingImage}` : '',
    ].filter(Boolean)
    const overlayAttributes = {
      ...(color ? { 'data-shape-overlay-color': color } : {}),
      ...(symbol ? { 'data-shape-overlay-symbol': symbol } : {}),
      ...(drawingPath ? { 'data-shape-overlay-drawing-path': drawingPath } : {}),
      'data-shape-overlay-drawing-view-box': drawingViewBox,
      'data-shape-overlay-stroke-width': strokeWidth,
      'data-shape-overlay-size': size,
      'data-shape-overlay-opacity': opacity,
      'data-shape-overlay-offset-y': offsetY,
      style: appendStyle(HTMLAttributes.style, styleDeclarations.join('; ')),
    }

    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-shape-overlay': shape,
        class: `shape-overlay shape-overlay--${shape}`,
      }, overlayAttributes),
      0,
    ]
  },

  addCommands() {
    return {
      setShapeOverlay: (attributes) => ({ commands }) =>
        commands.setMark(this.name, {
          shape: normalizeShape(attributes?.shape),
          color: normalizeColor(attributes?.color),
          symbol: normalizeSymbol(attributes?.symbol),
          size: normalizeSize(attributes?.size),
          opacity: normalizeOpacity(attributes?.opacity),
          offsetY: normalizeOffsetY(attributes?.offsetY),
          drawingPath: normalizeDrawingPath(attributes?.drawingPath),
          drawingViewBox: normalizeDrawingViewBox(attributes?.drawingViewBox),
          strokeWidth: normalizeStrokeWidth(attributes?.strokeWidth),
        }),
      toggleShapeOverlay: (attributes) => ({ commands }) =>
        commands.toggleMark(this.name, {
          shape: normalizeShape(attributes?.shape),
          color: normalizeColor(attributes?.color),
          symbol: normalizeSymbol(attributes?.symbol),
          size: normalizeSize(attributes?.size),
          opacity: normalizeOpacity(attributes?.opacity),
          offsetY: normalizeOffsetY(attributes?.offsetY),
          drawingPath: normalizeDrawingPath(attributes?.drawingPath),
          drawingViewBox: normalizeDrawingViewBox(attributes?.drawingViewBox),
          strokeWidth: normalizeStrokeWidth(attributes?.strokeWidth),
        }),
      unsetShapeOverlay: () => ({ commands }) => commands.unsetMark(this.name),
    }
  },

  addProseMirrorPlugins() {
    const markType = this.type

    return [
      new Plugin({
        props: {
          handleTextInput(view, from, to, text) {
            if (from !== to || !markType.isInSet(view.state.selection.$from.marks())) {
              return false
            }

            const transaction = view.state.tr.insertText(text, from, to)
            transaction.removeMark(from, from + text.length, markType)
            view.dispatch(transaction)
            return true
          },
        },
      }),
    ]
  },
})

export default ShapeOverlayMark
