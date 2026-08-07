import { VueRenderer } from '@tiptap/vue-3'
import tippy from 'tippy.js'

// TipTap's documented Vue 3 Suggestion render() lifecycle (VueRenderer +
// tippy.js for popup positioning against the caret) — one factory reused
// by both the tag (#) and Strong's ($) Mention configs so this plumbing
// only exists once.
export const buildSuggestionRenderer = (ListComponent) => () => {
  let component
  let popup

  return {
    onStart: (props) => {
      component = new VueRenderer(ListComponent, {
        props,
        editor: props.editor,
      })
      if (!props.clientRect) return

      popup = tippy('body', {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
      })
    },

    onUpdate: (props) => {
      component.updateProps(props)
      if (!props.clientRect) return
      popup?.[0]?.setProps({ getReferenceClientRect: props.clientRect })
    },

    onKeyDown: (props) => {
      if (props.event.key === 'Escape') {
        popup?.[0]?.hide()
        return true
      }
      return component.ref?.onKeyDown(props) ?? false
    },

    onExit: () => {
      popup?.[0]?.destroy()
      component.destroy()
    },
  }
}
