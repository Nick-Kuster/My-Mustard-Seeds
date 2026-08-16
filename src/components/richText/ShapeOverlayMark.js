import { Mark, mergeAttributes } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'

const ALLOWED_SHAPES = new Set([
  'triangle',
  'circle',
  'box',
  'x-overlay',
  'cross-underline',
  'swoop-underline',
  'dash-underline',
  'wavy-underline',
])

const normalizeShape = (shape) => (ALLOWED_SHAPES.has(shape) ? shape : 'triangle')
const normalizeColor = (color) => (/^#[0-9a-fA-F]{6}$/.test(color) ? color : '')

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
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-shape-overlay]' }]
  },

  renderHTML({ mark, HTMLAttributes }) {
    const shape = normalizeShape(mark.attrs.shape)
    const color = normalizeColor(mark.attrs.color)
    const overlayAttributes = color
      ? {
          'data-shape-overlay-color': color,
          style: appendStyle(HTMLAttributes.style, `--shape-overlay-color: ${color}`),
        }
      : {}

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
        }),
      toggleShapeOverlay: (attributes) => ({ commands }) =>
        commands.toggleMark(this.name, {
          shape: normalizeShape(attributes?.shape),
          color: normalizeColor(attributes?.color),
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
