<template>
  <div class="rich-text-toolbar-wrap" :style="toolbarSurfaceStyle">
    <div class="row items-center q-gutter-xs rich-text-toolbar" data-tour="rich-text-toolbar">
      <q-btn flat dense round size="sm" :ripple="false" icon="undo" :disable="!canUndo()"
        @mousedown.prevent @click="editor.chain().focus().undo().run()">
        <q-tooltip>Undo</q-tooltip>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" icon="redo" :disable="!canRedo()"
        @mousedown.prevent @click="editor.chain().focus().redo().run()">
        <q-tooltip>Redo</q-tooltip>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" icon="title"
        :color="isActive('heading') ? 'primary' : undefined"
        @mousedown.prevent @click="showTextStyleDialog = true" />
      <q-separator vertical inset />
      <q-btn flat dense round size="sm" :ripple="false" icon="format_bold"
        :color="isActive('bold') ? 'primary' : undefined"
        @mousedown.prevent @click="editor.chain().focus().toggleBold().run()">
        <q-tooltip>Bold</q-tooltip>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" icon="format_italic"
        :color="isActive('italic') ? 'primary' : undefined"
        @mousedown.prevent @click="editor.chain().focus().toggleItalic().run()">
        <q-tooltip>Italic</q-tooltip>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" icon="format_underlined"
        :color="isActive('underline') ? 'primary' : undefined"
        @mousedown.prevent @click="editor.chain().focus().toggleUnderline().run()">
        <q-tooltip>Underline</q-tooltip>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" icon="more_horiz" class="mobile-toolbar-menu"
        @mousedown.prevent>
        <q-tooltip>More format</q-tooltip>
        <q-menu anchor="bottom middle" self="top middle" :content-style="toolbarSurfaceStyle">
          <q-list dense class="toolbar-action-list" :style="toolbarSurfaceStyle" @mousedown.prevent>
            <q-item clickable v-close-popup :active="isActive('strike')" active-class="shape-menu-active"
              @click="editor.chain().focus().toggleStrike().run()">
              <q-item-section avatar><q-icon name="strikethrough_s" /></q-item-section>
              <q-item-section>Strike</q-item-section>
            </q-item>
            <q-item clickable v-close-popup :active="isActive('blockquote')" active-class="shape-menu-active"
              @click="editor.chain().focus().toggleBlockquote().run()">
              <q-item-section avatar><q-icon name="format_quote" /></q-item-section>
              <q-item-section>Block quote</q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable v-close-popup :disable="!canSinkListItem()"
              @click="editor.chain().focus().sinkListItem('listItem').run()">
              <q-item-section avatar><q-icon name="format_indent_increase" /></q-item-section>
              <q-item-section>Indent list item</q-item-section>
            </q-item>
            <q-item clickable v-close-popup :disable="!canLiftListItem()"
              @click="editor.chain().focus().liftListItem('listItem').run()">
              <q-item-section avatar><q-icon name="format_indent_decrease" /></q-item-section>
              <q-item-section>Outdent list item</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" icon="strikethrough_s" class="mobile-collapsed-control"
        :color="isActive('strike') ? 'primary' : undefined"
        @mousedown.prevent @click="editor.chain().focus().toggleStrike().run()">
        <q-tooltip>Strike</q-tooltip>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" icon="format_quote" class="mobile-collapsed-control"
        :color="isActive('blockquote') ? 'primary' : undefined"
        @mousedown.prevent @click="editor.chain().focus().toggleBlockquote().run()">
        <q-tooltip>Block quote</q-tooltip>
      </q-btn>
      <q-separator vertical inset />
      <q-btn flat dense round size="sm" :ripple="false" icon="format_list_bulleted"
        :color="isActive('bulletList') ? 'primary' : undefined"
        @mousedown.prevent @click="editor.chain().focus().toggleBulletList().run()">
        <q-tooltip>Bullet list</q-tooltip>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" icon="format_list_numbered"
        :color="isActive('orderedList') ? 'primary' : undefined"
        @mousedown.prevent @click="editor.chain().focus().toggleOrderedList().run()">
        <q-tooltip>Numbered list</q-tooltip>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" icon="format_indent_increase" class="mobile-collapsed-control"
        :disable="!canSinkListItem()"
        @mousedown.prevent @click="editor.chain().focus().sinkListItem('listItem').run()">
        <q-tooltip>Indent list item</q-tooltip>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" icon="format_indent_decrease" class="mobile-collapsed-control"
        :disable="!canLiftListItem()"
        @mousedown.prevent @click="editor.chain().focus().liftListItem('listItem').run()">
        <q-tooltip>Outdent list item</q-tooltip>
      </q-btn>
      <q-separator vertical inset />
      <q-btn flat dense round size="sm" :ripple="false" :color="isActive('highlight') ? 'primary' : undefined"
        class="mobile-collapsed-control" @mousedown.prevent @click="showHighlightDialog = true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 11l4 4" />
          <path d="M4 20l3-1 9-9a1.9 1.9 0 0 0-3-3l-9 9-1 3z" />
        </svg>
        <q-tooltip>Highlight</q-tooltip>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" :color="isActive('textStyle') ? 'primary' : undefined"
        class="mobile-collapsed-control" @mousedown.prevent @click="showTextColorDialog = true">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <text x="12" y="16" font-size="14" text-anchor="middle" fill="currentColor" font-family="sans-serif">A</text>
          <rect x="4" y="19" width="16" height="3" fill="currentColor" />
        </svg>
        <q-tooltip>Text color</q-tooltip>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" icon="draw" class="mobile-toolbar-menu"
        :color="isActive('highlight') || isActive('textStyle') || isActive('shapeOverlay') ? 'primary' : undefined"
        @mousedown.prevent>
        <q-tooltip>Marking</q-tooltip>
        <q-menu class="bubble-shape-menu" anchor="bottom middle" self="top middle" :content-style="toolbarSurfaceStyle">
          <q-list dense class="toolbar-action-list toolbar-action-list--wide" :style="toolbarSurfaceStyle" @mousedown.prevent>
            <q-item clickable v-close-popup :active="isActive('highlight')" active-class="shape-menu-active"
              @click="showHighlightDialog = true">
              <q-item-section avatar><q-icon name="border_color" /></q-item-section>
              <q-item-section>Highlight</q-item-section>
            </q-item>
            <q-item clickable v-close-popup :active="isActive('textStyle')" active-class="shape-menu-active"
              @click="showTextColorDialog = true">
              <q-item-section avatar><q-icon name="format_color_text" /></q-item-section>
              <q-item-section>Text color</q-item-section>
            </q-item>
            <q-separator />
            <q-item-label header>Overlays</q-item-label>
            <q-item v-for="shape in SHAPE_OPTIONS" :key="`mobile-${shape.name}`" clickable v-close-popup
              :active="isShapeActive(shape.name)" active-class="shape-menu-active"
              @click="setShape(shape.name)">
              <q-item-section avatar>
                <span :class="['shape-icon', `shape-icon--${shape.name}`]" aria-hidden="true"></span>
              </q-item-section>
              <q-item-section>{{ shape.label }}</q-item-section>
            </q-item>
            <q-separator v-if="customOverlayPresets.length" />
            <q-item v-for="preset in customOverlayPresets" :key="`mobile-${preset.id}`" clickable v-close-popup
              :active="isCustomOverlayActive(preset)" active-class="shape-menu-active"
              @click="setCustomOverlay(preset)">
              <q-item-section avatar>
                <span class="shape-icon shape-icon--custom-symbol" :style="{ color: preset.color || 'currentColor' }"
                  aria-hidden="true">
                  <svg v-if="preset.type === 'drawing'" viewBox="0 0 120 60" class="shape-icon-drawing">
                    <path :d="preset.drawingPath" :style="{ strokeWidth: preset.strokeWidth }" />
                  </svg>
                  <template v-else>{{ preset.symbol }}</template>
                </span>
              </q-item-section>
              <q-item-section>{{ preset.name }}</q-item-section>
            </q-item>
            <q-separator />
            <q-expansion-item dense expand-separator icon="palette" label="Overlay color"
              :disable="!isActive('shapeOverlay')">
              <div class="bubble-swatch-grid bubble-swatch-grid--menu" @mousedown.prevent>
                <button type="button" class="bubble-swatch-btn bubble-swatch-btn--default"
                  :class="{ 'bubble-swatch-btn--active': activeShapeColor === '' }"
                  aria-label="Use text color" @click="setShapeColor('')">
                  <span>A</span>
                </button>
                <button v-for="swatch in OVERLAY_COLOR_SWATCHES" :key="`mobile-color-${swatch.color}`" type="button"
                  class="bubble-swatch-btn" :class="{ 'bubble-swatch-btn--active': activeShapeColor === swatch.color }"
                  :style="{ backgroundColor: swatch.color }"
                  :aria-label="swatch.label" @click="setShapeColor(swatch.color)" />
                <label class="bubble-swatch-btn bubble-swatch-btn--custom" aria-label="Custom overlay color">
                  <q-icon name="palette" size="18px" />
                  <input type="color" @input="setShapeColor($event.target.value)" />
                </label>
              </div>
            </q-expansion-item>
            <q-separator />
            <q-item clickable v-close-popup @click="openCustomOverlayDialog">
              <q-item-section avatar><q-icon name="add" /></q-item-section>
              <q-item-section>Custom overlay</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="openManageCustomOverlaysDialog">
              <q-item-section avatar><q-icon name="tune" /></q-item-section>
              <q-item-section>Manage overlays</q-item-section>
            </q-item>
            <q-item clickable v-close-popup :disable="!isActive('shapeOverlay')"
              @click="runTrimmedCommand(() => editor.chain().focus().unsetShapeOverlay().run())">
              <q-item-section avatar><q-icon name="format_clear" /></q-item-section>
              <q-item-section>Remove overlay</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
      <q-separator vertical inset />
      <q-btn flat dense round size="sm" :ripple="false" :color="isActive('shapeOverlay') ? 'primary' : undefined"
        class="mobile-collapsed-control" @mousedown.prevent>
        <span v-if="activeShape === 'custom-symbol'" class="shape-icon shape-icon--custom-symbol"
          :style="{ color: activeShapeColor || 'currentColor' }" aria-hidden="true">
          {{ activeShapeAttrs.symbol || '*' }}
        </span>
        <span v-else-if="activeShape === 'custom-drawing'" class="shape-icon shape-icon--custom-symbol"
          :style="{ color: activeShapeColor || 'currentColor' }" aria-hidden="true">
          <svg viewBox="0 0 120 60" class="shape-icon-drawing">
            <path :d="activeShapeAttrs.drawingPath" :style="{ strokeWidth: activeShapeAttrs.strokeWidth || 5 }" />
          </svg>
        </span>
        <span v-else :class="['shape-icon', `shape-icon--${activeShape}`]" aria-hidden="true"></span>
        <q-tooltip>Shape overlay</q-tooltip>
        <q-menu class="bubble-shape-menu" anchor="bottom middle" self="top middle" :content-style="toolbarSurfaceStyle">
          <q-list dense class="bubble-shape-list" :style="toolbarSurfaceStyle" @mousedown.prevent>
            <q-item v-for="shape in SHAPE_OPTIONS" :key="shape.name" clickable v-close-popup
              :active="isShapeActive(shape.name)" active-class="shape-menu-active"
              @click="setShape(shape.name)">
              <q-item-section avatar>
                <span :class="['shape-icon', `shape-icon--${shape.name}`]" aria-hidden="true"></span>
              </q-item-section>
              <q-item-section>{{ shape.label }}</q-item-section>
            </q-item>
            <q-separator />
            <q-item v-for="preset in customOverlayPresets" :key="preset.id" clickable v-close-popup
              :active="isCustomOverlayActive(preset)" active-class="shape-menu-active"
              @click="setCustomOverlay(preset)">
              <q-item-section avatar>
                <span class="shape-icon shape-icon--custom-symbol" :style="{ color: preset.color || 'currentColor' }"
                  aria-hidden="true">
                  <svg v-if="preset.type === 'drawing'" viewBox="0 0 120 60" class="shape-icon-drawing">
                    <path :d="preset.drawingPath" :style="{ strokeWidth: preset.strokeWidth }" />
                  </svg>
                  <template v-else>{{ preset.symbol }}</template>
                </span>
              </q-item-section>
              <q-item-section>{{ preset.name }}</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="openCustomOverlayDialog">
              <q-item-section avatar>
                <q-icon name="add" />
              </q-item-section>
              <q-item-section>Custom overlay</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="openManageCustomOverlaysDialog">
              <q-item-section avatar>
                <q-icon name="tune" />
              </q-item-section>
              <q-item-section>Manage custom overlays</q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable v-close-popup :disable="!isActive('shapeOverlay')"
              @click="runTrimmedCommand(() => editor.chain().focus().unsetShapeOverlay().run())">
              <q-item-section avatar>
                <q-icon name="format_clear" />
              </q-item-section>
              <q-item-section>Remove shape</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" icon="palette"
        class="mobile-collapsed-control" :disable="!isActive('shapeOverlay')" @mousedown.prevent>
        <q-tooltip>Overlay color</q-tooltip>
        <q-menu class="bubble-swatch-menu" anchor="bottom middle" self="top middle"
          :content-style="toolbarSurfaceStyle">
          <div class="bubble-swatch-grid" :style="toolbarSurfaceStyle" @mousedown.prevent>
            <button type="button" class="bubble-swatch-btn bubble-swatch-btn--default"
              :class="{ 'bubble-swatch-btn--active': activeShapeColor === '' }"
              aria-label="Use text color" @click="setShapeColor('')">
              <span>A</span>
              <q-tooltip>Use text color</q-tooltip>
            </button>
            <button v-for="swatch in OVERLAY_COLOR_SWATCHES" :key="swatch.color" type="button"
              class="bubble-swatch-btn" :class="{ 'bubble-swatch-btn--active': activeShapeColor === swatch.color }"
              :style="{ backgroundColor: swatch.color }"
              :aria-label="swatch.label" @click="setShapeColor(swatch.color)">
              <q-tooltip>{{ swatch.label }}</q-tooltip>
            </button>
            <label class="bubble-swatch-btn bubble-swatch-btn--custom" aria-label="Custom overlay color">
              <q-icon name="palette" size="18px" />
              <input type="color" @input="setShapeColor($event.target.value)" />
              <q-tooltip>Custom color</q-tooltip>
            </label>
          </div>
        </q-menu>
      </q-btn>
      <q-separator vertical inset />
      <q-btn flat dense round size="sm" :ripple="false" icon="add_circle_outline" class="mobile-toolbar-menu"
        @mousedown.prevent>
        <q-tooltip>Insert</q-tooltip>
        <q-menu anchor="bottom middle" self="top middle" :content-style="toolbarSurfaceStyle">
          <q-list dense class="toolbar-action-list" :style="toolbarSurfaceStyle" @mousedown.prevent>
            <q-item clickable v-close-popup @click="showGlyphDialog = true">
              <q-item-section avatar>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 3v18" />
                  <path d="M7 8h10" />
                </svg>
              </q-item-section>
              <q-item-section>Glyph</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="fileInputRef?.click()">
              <q-item-section avatar><q-icon name="image" /></q-item-section>
              <q-item-section>Image</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" data-tour="rich-text-glyph-btn"
        class="mobile-collapsed-control" @mousedown.prevent @click="showGlyphDialog = true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3v18" />
          <path d="M7 8h10" />
        </svg>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" :loading="uploading" data-tour="rich-text-image-btn"
        class="mobile-collapsed-control" @mousedown.prevent @click="fileInputRef?.click()">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="10" r="1.5" />
          <path d="M21 16l-5.5-5.5a1.5 1.5 0 0 0-2.12 0L5 19" />
        </svg>
      </q-btn>
      <input ref="fileInputRef" type="file" accept="image/*" class="rich-text-file-input" @change="onFileSelected" />
    </div>

    <div v-if="showMobileBar" class="mobile-editor-bar" :class="{ 'mobile-editor-bar--focus': focusMode }" :style="toolbarSurfaceStyle"
      @pointerdown="keepMobileBarOpen" @mousedown.prevent="keepMobileBarOpen">
      <div v-if="mobilePanel === 'mark'" class="mobile-editor-panel">
        <div class="mobile-panel-heading">
          <span>Marking</span>
          <q-btn flat dense round size="sm" icon="close" @click="mobilePanel = ''">
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </div>
        <div class="mobile-panel-actions">
          <q-btn flat dense no-caps icon="border_color" label="Highlight"
            :color="isActive('highlight') ? 'primary' : undefined"
            @click="mobilePanel = 'highlight'" />
          <q-btn flat dense no-caps icon="format_color_text" label="Text"
            :color="isActive('textStyle') ? 'primary' : undefined"
            @click="mobilePanel = 'textColor'" />
          <q-btn flat dense no-caps icon="gesture" label="Overlay"
            :color="isActive('shapeOverlay') ? 'primary' : undefined"
            @click="mobilePanel = 'overlay'" />
          <q-btn flat dense no-caps icon="format_clear" label="Clear overlay"
            :disable="!isActive('shapeOverlay')"
            @click="runTrimmedCommand(() => editor.chain().focus().unsetShapeOverlay().run())" />
        </div>
      </div>

      <div v-else-if="mobilePanel === 'highlight'" class="mobile-editor-panel">
        <div class="mobile-panel-heading">
          <span>Highlight</span>
          <q-btn flat dense round size="sm" icon="arrow_back" @click="mobilePanel = 'mark'">
            <q-tooltip>Back</q-tooltip>
          </q-btn>
        </div>
        <div class="mobile-swatch-strip">
          <button v-for="swatch in HIGHLIGHT_SWATCHES" :key="`mobile-highlight-${swatch.color}`" type="button"
            class="bubble-swatch-btn" :style="{ backgroundColor: swatch.color }"
            :aria-label="swatch.label" @click="onHighlightSelect(swatch.color)" />
          <label class="bubble-swatch-btn bubble-swatch-btn--custom" aria-label="Custom highlight color">
            <q-icon name="palette" size="18px" />
            <input type="color" @input="onHighlightSelect($event.target.value)" />
          </label>
          <q-btn flat dense no-caps color="negative" label="Remove"
            @click="runTrimmedCommand(() => editor.chain().focus().unsetHighlight().run())" />
        </div>
      </div>

      <div v-else-if="mobilePanel === 'textColor'" class="mobile-editor-panel">
        <div class="mobile-panel-heading">
          <span>Text color</span>
          <q-btn flat dense round size="sm" icon="arrow_back" @click="mobilePanel = 'mark'">
            <q-tooltip>Back</q-tooltip>
          </q-btn>
        </div>
        <div class="mobile-swatch-strip">
          <button v-for="swatch in TEXT_COLOR_SWATCHES" :key="`mobile-text-${swatch.color}`" type="button"
            class="bubble-swatch-btn" :style="{ backgroundColor: swatch.color }"
            :aria-label="swatch.label" @click="onTextColorSelect(swatch.color)" />
          <label class="bubble-swatch-btn bubble-swatch-btn--custom" aria-label="Custom text color">
            <q-icon name="palette" size="18px" />
            <input type="color" @input="onTextColorSelect($event.target.value)" />
          </label>
          <q-btn flat dense no-caps color="negative" label="Remove"
            @click="runTrimmedCommand(() => editor.chain().focus().unsetColor().run())" />
        </div>
      </div>

      <div v-else-if="mobilePanel === 'overlay'" class="mobile-editor-panel mobile-editor-panel--tall">
        <div class="mobile-panel-heading">
          <span>Overlay</span>
          <q-btn flat dense round size="sm" icon="arrow_back" @click="mobilePanel = 'mark'">
            <q-tooltip>Back</q-tooltip>
          </q-btn>
        </div>
        <div class="mobile-overlay-strip">
          <button v-for="shape in SHAPE_OPTIONS" :key="`bottom-${shape.name}`" type="button"
            class="mobile-overlay-btn" :class="{ 'mobile-overlay-btn--active': isShapeActive(shape.name) }"
            :aria-label="shape.label" @click="setShape(shape.name)">
            <span :class="['shape-icon', `shape-icon--${shape.name}`]" aria-hidden="true"></span>
            <q-tooltip>{{ shape.label }}</q-tooltip>
          </button>
          <button v-for="preset in customOverlayPresets" :key="`bottom-${preset.id}`" type="button"
            class="mobile-overlay-btn" :class="{ 'mobile-overlay-btn--active': isCustomOverlayActive(preset) }"
            :aria-label="preset.name" @click="setCustomOverlay(preset)">
            <span class="shape-icon shape-icon--custom-symbol" :style="{ color: preset.color || 'currentColor' }"
              aria-hidden="true">
              <svg v-if="preset.type === 'drawing'" viewBox="0 0 120 60" class="shape-icon-drawing">
                <path :d="preset.drawingPath" :style="{ strokeWidth: preset.strokeWidth }" />
              </svg>
              <template v-else>{{ preset.symbol }}</template>
            </span>
            <q-tooltip>{{ preset.name }}</q-tooltip>
          </button>
        </div>
        <div class="mobile-panel-actions">
          <q-btn flat dense no-caps icon="palette" label="Color" :disable="!isActive('shapeOverlay')"
            @click="mobilePanel = 'overlayColor'" />
          <q-btn flat dense no-caps icon="add" label="Custom" @click="openCustomOverlayDialog" />
          <q-btn flat dense no-caps icon="tune" label="Manage" @click="openManageCustomOverlaysDialog" />
        </div>
      </div>

      <div v-else-if="mobilePanel === 'overlayColor'" class="mobile-editor-panel">
        <div class="mobile-panel-heading">
          <span>Overlay color</span>
          <q-btn flat dense round size="sm" icon="arrow_back" @click="mobilePanel = 'overlay'">
            <q-tooltip>Back</q-tooltip>
          </q-btn>
        </div>
        <div class="mobile-swatch-strip">
          <button type="button" class="bubble-swatch-btn bubble-swatch-btn--default"
            :class="{ 'bubble-swatch-btn--active': activeShapeColor === '' }"
            aria-label="Use text color" @click="setShapeColor('')">
            <span>A</span>
          </button>
          <button v-for="swatch in OVERLAY_COLOR_SWATCHES" :key="`bottom-overlay-color-${swatch.color}`" type="button"
            class="bubble-swatch-btn" :class="{ 'bubble-swatch-btn--active': activeShapeColor === swatch.color }"
            :style="{ backgroundColor: swatch.color }"
            :aria-label="swatch.label" @click="setShapeColor(swatch.color)" />
          <label class="bubble-swatch-btn bubble-swatch-btn--custom" aria-label="Custom overlay color">
            <q-icon name="palette" size="18px" />
            <input type="color" @input="setShapeColor($event.target.value)" />
          </label>
        </div>
      </div>

      <div v-else-if="mobilePanel === 'insert'" class="mobile-editor-panel">
        <div class="mobile-panel-heading">
          <span>Insert</span>
          <q-btn flat dense round size="sm" icon="close" @click="mobilePanel = ''">
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </div>
        <div class="mobile-panel-actions">
          <q-btn flat dense no-caps label="Glyph" @click="showGlyphDialog = true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3v18" />
              <path d="M7 8h10" />
            </svg>
          </q-btn>
          <q-btn flat dense no-caps icon="image" label="Image" @click="fileInputRef?.click()" />
        </div>
      </div>

      <div v-else-if="mobilePanel === 'selectionTag'" class="mobile-editor-panel">
        <div class="mobile-panel-heading">
          <span>Tag selected text</span>
          <q-btn flat dense round size="sm" icon="close" @click="mobilePanel = ''">
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </div>
        <div class="mobile-panel-actions">
          <q-btn flat dense no-caps icon="tag" label="Hashtag" :disable="!hasTextSelection" :loading="linkingTag"
            @click="makeTagReference" />
          <q-btn flat dense no-caps icon="menu_book" label="Verse" :disable="!hasTextSelection" :loading="linkingVerse"
            @click="makeVerseReference" />
        </div>
      </div>

      <div v-if="focusMode" class="mobile-focus-actions">
        <div class="mobile-focus-actions-row mobile-focus-actions-row--split">
          <div class="mobile-focus-group">
            <q-btn flat dense round size="sm" icon="undo" :disable="!canUndo()"
              @click="editor.chain().focus().undo().run()">
              <q-tooltip>Undo</q-tooltip>
            </q-btn>
            <q-btn flat dense round size="sm" icon="redo" :disable="!canRedo()"
              @click="editor.chain().focus().redo().run()">
              <q-tooltip>Redo</q-tooltip>
            </q-btn>
            <q-btn flat dense round size="sm" icon="title" :color="isActive('heading') ? 'primary' : undefined"
              @click="showTextStyleDialog = true">
              <q-tooltip>Text style</q-tooltip>
            </q-btn>
          </div>
          <div class="mobile-focus-group">
            <q-btn flat dense round size="sm" :ripple="false" @click="showGlyphDialog = true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3v18" />
                <path d="M7 8h10" />
              </svg>
              <q-tooltip>Glyph</q-tooltip>
            </q-btn>
            <q-btn flat dense round size="sm" icon="image" :loading="uploading" @click="fileInputRef?.click()">
              <q-tooltip>Image</q-tooltip>
            </q-btn>
          </div>
        </div>
        <div class="mobile-focus-actions-row">
          <q-btn flat dense round size="sm" icon="format_bold" :color="isActive('bold') ? 'primary' : undefined"
            @click="runTrimmedCommand(() => editor.chain().focus().toggleBold().run())">
            <q-tooltip>Bold</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="format_italic" :color="isActive('italic') ? 'primary' : undefined"
            @click="runTrimmedCommand(() => editor.chain().focus().toggleItalic().run())">
            <q-tooltip>Italic</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="format_underlined"
            :color="isActive('underline') ? 'primary' : undefined"
            @click="runTrimmedCommand(() => editor.chain().focus().toggleUnderline().run())">
            <q-tooltip>Underline</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="format_quote"
            :color="isActive('blockquote') ? 'primary' : undefined"
            @click="runTrimmedCommand(() => editor.chain().focus().toggleBlockquote().run())">
            <q-tooltip>Block quote</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="border_color"
            :color="isActive('highlight') ? 'primary' : undefined"
            @click="mobilePanel = 'highlight'">
            <q-tooltip>Highlight</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="format_color_text"
            :color="isActive('textStyle') ? 'primary' : undefined"
            @click="mobilePanel = 'textColor'">
            <q-tooltip>Text color</q-tooltip>
          </q-btn>
        </div>
        <div class="mobile-focus-actions-row">
          <q-btn flat dense round size="sm" icon="format_list_bulleted"
            :color="isActive('bulletList') ? 'primary' : undefined"
            @click="editor.chain().focus().toggleBulletList().run()">
            <q-tooltip>Bullet list</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="format_list_numbered"
            :color="isActive('orderedList') ? 'primary' : undefined"
            @click="editor.chain().focus().toggleOrderedList().run()">
            <q-tooltip>Numbered list</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="format_indent_increase"
            :disable="!canSinkListItem()"
            @click="editor.chain().focus().sinkListItem('listItem').run()">
            <q-tooltip>Indent list item</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="format_indent_decrease"
            :disable="!canLiftListItem()"
            @click="editor.chain().focus().liftListItem('listItem').run()">
            <q-tooltip>Outdent list item</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="gesture"
            :color="isActive('shapeOverlay') ? 'primary' : undefined"
            @click="mobilePanel = 'overlay'">
            <q-tooltip>Overlay</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="sell" :disable="!hasTextSelection"
            @click="mobilePanel = 'selectionTag'">
            <q-tooltip>Tag selection</q-tooltip>
          </q-btn>
        </div>
      </div>

      <div v-else class="mobile-editor-actions" :class="{ 'mobile-editor-actions--selection': hasTextSelection }">
        <template v-if="hasTextSelection">
          <q-btn flat dense round size="sm" icon="format_bold" :color="isActive('bold') ? 'primary' : undefined"
            @click="runTrimmedCommand(() => editor.chain().focus().toggleBold().run())">
            <q-tooltip>Bold</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="format_italic" :color="isActive('italic') ? 'primary' : undefined"
            @click="runTrimmedCommand(() => editor.chain().focus().toggleItalic().run())">
            <q-tooltip>Italic</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="format_underlined"
            :color="isActive('underline') ? 'primary' : undefined"
            @click="runTrimmedCommand(() => editor.chain().focus().toggleUnderline().run())">
            <q-tooltip>Underline</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="format_list_bulleted"
            :color="isActive('bulletList') ? 'primary' : undefined"
            @click="editor.chain().focus().toggleBulletList().run()">
            <q-tooltip>Bullet list</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="format_list_numbered"
            :color="isActive('orderedList') ? 'primary' : undefined"
            @click="editor.chain().focus().toggleOrderedList().run()">
            <q-tooltip>Numbered list</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="format_indent_increase"
            :disable="!canSinkListItem()"
            @click="editor.chain().focus().sinkListItem('listItem').run()">
            <q-tooltip>Indent list item</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="format_indent_decrease"
            :disable="!canLiftListItem()"
            @click="editor.chain().focus().liftListItem('listItem').run()">
            <q-tooltip>Outdent list item</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="draw"
            :color="isActive('highlight') || isActive('textStyle') || isActive('shapeOverlay') ? 'primary' : undefined"
            @click="toggleMobilePanel('mark')">
            <q-tooltip>Marking</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="format_quote"
            :color="isActive('blockquote') ? 'primary' : undefined"
            @click="runTrimmedCommand(() => editor.chain().focus().toggleBlockquote().run())">
            <q-tooltip>Block quote</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="strikethrough_s"
            :color="isActive('strike') ? 'primary' : undefined"
            @click="runTrimmedCommand(() => editor.chain().focus().toggleStrike().run())">
            <q-tooltip>Strike</q-tooltip>
          </q-btn>
        </template>
        <template v-else>
          <q-btn flat dense round size="sm" icon="undo" :disable="!canUndo()"
            @click="editor.chain().focus().undo().run()">
            <q-tooltip>Undo</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="redo" :disable="!canRedo()"
            @click="editor.chain().focus().redo().run()">
            <q-tooltip>Redo</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="title" :color="isActive('heading') ? 'primary' : undefined"
            @click="showTextStyleDialog = true">
            <q-tooltip>Text style</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="format_bold" :color="isActive('bold') ? 'primary' : undefined"
            @click="editor.chain().focus().toggleBold().run()">
            <q-tooltip>Bold</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="format_italic" :color="isActive('italic') ? 'primary' : undefined"
            @click="editor.chain().focus().toggleItalic().run()">
            <q-tooltip>Italic</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="format_underlined"
            :color="isActive('underline') ? 'primary' : undefined"
            @click="editor.chain().focus().toggleUnderline().run()">
            <q-tooltip>Underline</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="format_list_bulleted"
            :color="isActive('bulletList') ? 'primary' : undefined"
            @click="editor.chain().focus().toggleBulletList().run()">
            <q-tooltip>Bullet list</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="format_list_numbered"
            :color="isActive('orderedList') ? 'primary' : undefined"
            @click="editor.chain().focus().toggleOrderedList().run()">
            <q-tooltip>Numbered list</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="add_circle_outline" @click="toggleMobilePanel('insert')">
            <q-tooltip>Insert</q-tooltip>
          </q-btn>
        </template>
      </div>
    </div>

    <ColorPickerDialog v-model="showHighlightDialog" title="Highlight color" :swatches="HIGHLIGHT_SWATCHES"
      :card-style="toolbarSurfaceStyle"
      @select="onHighlightSelect" @clear="editor.chain().focus().unsetHighlight().run()" />
    <ColorPickerDialog v-model="showTextColorDialog" title="Text color" :swatches="TEXT_COLOR_SWATCHES"
      :card-style="toolbarSurfaceStyle"
      @select="onTextColorSelect" @clear="editor.chain().focus().unsetColor().run()" />
    <GlyphPickerDialog v-model="showGlyphDialog" @select="onGlyphSelect" @select-glyph="onGlyphNodeSelect" />
    <TextStyleDialog v-model="showTextStyleDialog" :editor="editor" />

    <q-dialog v-model="showCustomOverlayDialog">
      <q-card class="custom-overlay-card" :style="toolbarSurfaceStyle">
        <q-card-section class="custom-overlay-header">
          <div class="custom-overlay-title">Custom overlay</div>
          <q-btn flat dense round icon="close" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-card-section>

        <q-card-section class="custom-overlay-body">
          <div class="custom-overlay-preview-row">
            <span class="custom-overlay-preview-text">
              Word
              <span class="custom-overlay-preview-mark" :style="customOverlayPreviewStyle">
                <svg v-if="customOverlayDraft.type === 'drawing'" viewBox="0 0 120 60" class="custom-overlay-preview-svg">
                  <path :d="customOverlayDraft.drawingPath" :style="{ strokeWidth: customOverlayDraft.strokeWidth }" />
                </svg>
                <template v-else>{{ customOverlayDraft.symbol || '*' }}</template>
              </span>
            </span>
          </div>

          <q-input v-model.trim="customOverlayDraft.name" dense outlined label="Preset name" />
          <q-btn-toggle v-model="customOverlayDraft.type" dense unelevated no-caps spread
            :options="[
              { label: 'Symbol', value: 'symbol' },
              { label: 'Free draw', value: 'drawing' },
            ]" />
          <q-input v-if="customOverlayDraft.type === 'symbol'" v-model="customOverlayDraft.symbol"
            dense outlined label="Symbol" maxlength="4" />

          <div v-else class="custom-overlay-field">
            <div class="custom-overlay-field-label">Free draw</div>
            <q-btn-toggle v-model="drawingTool" dense unelevated no-caps spread
              :options="DRAWING_TOOL_OPTIONS" />
            <canvas ref="drawingCanvas" class="custom-overlay-canvas" width="240" height="120"
              @pointerdown="startDrawing" @pointermove="continueDrawing" @pointerup="endDrawing"
              @pointercancel="endDrawing" @pointerleave="endDrawing"></canvas>
            <q-btn flat dense no-caps label="Clear drawing" @click="clearDrawing" />
          </div>

          <div class="custom-overlay-field">
            <div class="custom-overlay-field-label">Color</div>
            <div class="bubble-shape-color-grid">
              <button type="button" class="bubble-swatch-btn bubble-swatch-btn--default"
                :class="{ 'bubble-swatch-btn--active': customOverlayDraft.color === '' }"
                aria-label="Use text color" @click="customOverlayDraft.color = ''">
                <span>A</span>
              </button>
              <button v-for="swatch in OVERLAY_COLOR_SWATCHES" :key="swatch.color" type="button"
                class="bubble-swatch-btn"
                :class="{ 'bubble-swatch-btn--active': customOverlayDraft.color === swatch.color }"
                :style="{ backgroundColor: swatch.color }"
                :aria-label="swatch.label" @click="customOverlayDraft.color = swatch.color" />
              <label class="bubble-swatch-btn bubble-swatch-btn--custom" aria-label="Custom overlay color">
                <q-icon name="palette" size="18px" />
                <input type="color" @input="customOverlayDraft.color = $event.target.value" />
              </label>
            </div>
          </div>

          <div class="custom-overlay-field">
            <div class="custom-overlay-field-label">Size</div>
            <q-slider v-model="customOverlayDraft.size" :min="0.8" :max="3" :step="0.1" dense label />
          </div>

          <div v-if="customOverlayDraft.type === 'drawing'" class="custom-overlay-field">
            <div class="custom-overlay-field-label">Line thickness</div>
            <q-slider v-model="customOverlayDraft.strokeWidth" :min="1" :max="12" :step="0.5" dense label />
          </div>

          <div class="custom-overlay-field">
            <div class="custom-overlay-field-label">Opacity</div>
            <q-slider v-model="customOverlayDraft.opacity" :min="0.15" :max="1" :step="0.05" dense label />
          </div>

          <div class="custom-overlay-field">
            <div class="custom-overlay-field-label">Vertical position</div>
            <q-slider v-model="customOverlayDraft.offsetY" :min="-0.6" :max="0.6" :step="0.05" dense label />
          </div>
        </q-card-section>

        <q-card-actions align="between">
          <q-btn flat no-caps color="negative" label="Delete" :disable="!editingCustomPresetId"
            @click="deleteCustomOverlayPreset" />
          <div class="custom-overlay-actions">
            <q-btn flat no-caps label="Apply only" @click="applyCustomOverlayDraft(false)" />
            <q-btn unelevated no-caps color="primary" label="Save and apply" @click="applyCustomOverlayDraft(true)" />
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showManageCustomOverlaysDialog">
      <q-card class="custom-overlay-manage-card" :style="toolbarSurfaceStyle">
        <q-card-section class="custom-overlay-header">
          <div class="custom-overlay-title">Manage custom overlays</div>
          <q-btn flat dense round icon="close" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-card-section>

        <q-card-section>
          <div v-if="!customOverlayPresets.length" class="custom-overlay-empty">
            No custom overlays yet.
          </div>
          <q-list v-else bordered separator class="custom-overlay-manage-list">
            <q-item v-for="preset in customOverlayPresets" :key="preset.id">
              <q-item-section avatar>
                <span class="shape-icon shape-icon--custom-symbol" :style="{ color: preset.color || 'currentColor' }"
                  aria-hidden="true">
                  <svg v-if="preset.type === 'drawing'" viewBox="0 0 120 60" class="shape-icon-drawing">
                    <path :d="preset.drawingPath" :style="{ strokeWidth: preset.strokeWidth }" />
                  </svg>
                  <template v-else>{{ preset.symbol }}</template>
                </span>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ preset.name }}</q-item-label>
                <q-item-label caption>{{ preset.type === 'drawing' ? 'Free draw' : 'Symbol' }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="custom-overlay-row-actions">
                  <q-btn flat dense round icon="check" @click="applyManagedPreset(preset)">
                    <q-tooltip>Apply</q-tooltip>
                  </q-btn>
                  <q-btn flat dense round icon="edit" @click="editManagedPreset(preset)">
                    <q-tooltip>Edit</q-tooltip>
                  </q-btn>
                  <q-btn flat dense round color="negative" icon="delete" @click="deleteManagedPreset(preset)">
                    <q-tooltip>Delete</q-tooltip>
                  </q-btn>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat no-caps icon="add" label="New overlay" @click="openNewManagedPreset" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, onBeforeUnmount, onMounted, watch } from 'vue'
import { Notify } from 'quasar'
import ColorPickerDialog from './ColorPickerDialog.vue'
import GlyphPickerDialog from './GlyphPickerDialog.vue'
import TextStyleDialog from './TextStyleDialog.vue'
import { useImageUpload } from 'src/composables/useImageUpload'
import { useShapeOverlayPresetsStore, normalizeShapeOverlayPreset } from 'stores/shapeOverlayPresets'
import { getSectionStyle } from 'src/utils/sectionColors'
import { useTagsStore } from 'stores/tags'
import { useBibleDataStore } from 'stores/bibleData'
import { parseFullVerseReference } from 'src/utils/verseUtils'
import { resolveVerseMatch } from 'src/composables/useInlineReferenceResolver'

const props = defineProps({
  editor: { type: Object, required: true },
  sectionColor: { type: String, default: '' },
  sectionTextColor: { type: String, default: '' },
  focusMode: { type: Boolean, default: false },
  onVerseResolved: { type: Function, default: () => {} },
  onTagResolved: { type: Function, default: () => {} },
})

const toolbarSurfaceStyle = computed(() => {
  const style = getSectionStyle({ color: props.sectionColor, textColor: props.sectionTextColor })
  return {
    backgroundColor: style.backgroundColor || 'var(--color-surface-alt)',
    color: style.color || 'var(--color-text)',
    ...(style['--section-text-color'] ? { '--section-text-color': style['--section-text-color'] } : {}),
  }
})

const HIGHLIGHT_SWATCHES = [
  { color: '#fef08a', label: 'Yellow' },
  { color: '#bbf7d0', label: 'Green' },
  { color: '#bfdbfe', label: 'Blue' },
  { color: '#fbcfe8', label: 'Pink' },
  { color: '#fed7aa', label: 'Orange' },
  { color: '#e9d5ff', label: 'Purple' },
  { color: '#fecaca', label: 'Red' },
  { color: '#e5e7eb', label: 'Gray' },
]

const TEXT_COLOR_SWATCHES = [
  { color: '#000000', label: 'Black' },
  { color: '#ffffff', label: 'White' },
  { color: '#dc2626', label: 'Red' },
  { color: '#ea580c', label: 'Orange' },
  { color: '#ca8a04', label: 'Yellow' },
  { color: '#16a34a', label: 'Green' },
  { color: '#2563eb', label: 'Blue' },
  { color: '#9333ea', label: 'Purple' },
  { color: '#6b7280', label: 'Gray' },
]

const SHAPE_OPTIONS = [
  { name: 'triangle', label: 'Triangle' },
  { name: 'circle', label: 'Circle' },
  { name: 'box', label: 'Box' },
  { name: 'cloud', label: 'Cloud' },
  { name: 'x-overlay', label: 'X overlay' },
  { name: 'cross-underline', label: 'Cross overlay' },
  { name: 'swoop-underline', label: 'Swoop underline' },
  { name: 'dash-underline', label: 'Dash underline' },
  { name: 'wavy-underline', label: 'Wavy underline' },
]

const OVERLAY_COLOR_SWATCHES = [
  { color: '#ffffff', label: 'White' },
  { color: '#dc2626', label: 'Red' },
  { color: '#ea580c', label: 'Orange' },
  { color: '#ca8a04', label: 'Yellow' },
  { color: '#16a34a', label: 'Green' },
  { color: '#2563eb', label: 'Blue' },
  { color: '#9333ea', label: 'Purple' },
  { color: '#6b7280', label: 'Gray' },
  { color: '#111827', label: 'Black' },
]

const DRAWING_TOOL_OPTIONS = [
  { label: 'Pen', value: 'pen' },
  { label: 'Line', value: 'line' },
  { label: 'Box', value: 'box' },
  { label: 'Oval', value: 'oval' },
  { label: 'Tri', value: 'triangle' },
]

const DEFAULT_CUSTOM_OVERLAY = {
  name: 'Custom mark',
  type: 'symbol',
  symbol: '*',
  color: '#dc2626',
  size: 1.6,
  opacity: 0.58,
  offsetY: 0,
  strokeWidth: 5,
  drawingPath: '',
  drawingViewBox: '0 0 120 60',
}

const showHighlightDialog = ref(false)
const showTextColorDialog = ref(false)
const showGlyphDialog = ref(false)
const showTextStyleDialog = ref(false)
const showCustomOverlayDialog = ref(false)
const showManageCustomOverlaysDialog = ref(false)
const mobilePanel = ref('')
const editorFocused = ref(false)
const lastTextSelection = ref(null)
const mobileBarInteracting = ref(false)
const linkingVerse = ref(false)
const linkingTag = ref(false)
let blurTimer = null
let hideTimer = null
const editingCustomPresetId = ref('')
const customOverlayDraft = ref({ ...DEFAULT_CUSTOM_OVERLAY })
const customOverlaySelection = ref(null)
const drawingCanvas = ref(null)
const drawingPoints = ref([])
const drawingSegments = ref([])
const drawingTool = ref('pen')
const drawingStartPoint = ref(null)
const isDrawing = ref(false)

const fileInputRef = ref(null)
const { uploading, uploadImage } = useImageUpload()
const shapeOverlayPresetsStore = useShapeOverlayPresetsStore()
const tagsStore = useTagsStore()
const bibleData = useBibleDataStore()
const customOverlayPresets = computed(() => shapeOverlayPresetsStore.presets)
const isShapeActive = (shape) => isActive('shapeOverlay', { shape })
const activeShapeAttrs = computed(() => {
  void revision.value
  return props.editor.getAttributes('shapeOverlay') || {}
})
const activeShape = computed(() => {
  const attrs = activeShapeAttrs.value
  if (attrs.shape === 'custom-symbol') return 'custom-symbol'
  if (attrs.shape === 'custom-drawing') return 'custom-drawing'
  return SHAPE_OPTIONS.find((shape) => isShapeActive(shape.name))?.name || 'triangle'
})
const activeShapeColor = computed(() => activeShapeAttrs.value.color || '')
const customOverlayPreviewStyle = computed(() => ({
  color: customOverlayDraft.value.color || 'currentColor',
  fontSize: `${customOverlayDraft.value.size}em`,
  opacity: customOverlayDraft.value.opacity,
  transform: `translate(-50%, calc(-50% + ${customOverlayDraft.value.offsetY}em))`,
}))

const onFileSelected = async (event) => {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  try {
    const { imagePath, mimeType } = await uploadImage(file)
    props.editor
      .chain()
      .focus()
      .insertContent({ type: 'imageReference', attrs: { imagePath, mimeType, alt: '' } })
      .run()
  } catch (err) {
    Notify.create({ type: 'negative', message: err.message || 'Failed to upload image' })
  }
}

const onHighlightSelect = (color) => {
  if (hasTextSelection.value) {
    runTrimmedCommand(() => props.editor.chain().focus().setHighlight({ color }).run())
    return
  }

  props.editor.chain().focus().setHighlight({ color }).run()
}

const onTextColorSelect = (color) => {
  if (hasTextSelection.value) {
    runTrimmedCommand(() => props.editor.chain().focus().setColor(color).run())
    return
  }

  props.editor.chain().focus().setColor(color).run()
}

const onGlyphSelect = (char) => {
  props.editor.chain().focus().insertContent(char).run()
}

const onGlyphNodeSelect = (glyphId) => {
  props.editor.chain().focus().insertContent({ type: 'glyphReference', attrs: { glyphId } }).run()
}

const setShape = (shape) => {
  runTrimmedCommand(() => props.editor.chain().focus().setShapeOverlay({ shape, color: activeShapeColor.value }).run())
}

const isCustomOverlayActive = (preset) => {
  const attrs = props.editor.getAttributes('shapeOverlay')
  const shape = preset.type === 'drawing' ? 'custom-drawing' : 'custom-symbol'
  return attrs.shape === shape && attrs.symbol === preset.symbol && attrs.color === preset.color
}

const applyShapeOverlayToRange = (attributes, selection) => {
  if (!selection) return false

  props.editor
    .chain()
    .focus()
    .setTextSelection({ from: selection.from, to: selection.to })
    .setShapeOverlay(attributes)
    .run()
  return true
}

const setCustomOverlay = (preset, selection = null) => {
  const overlay = normalizeShapeOverlayPreset(preset)
  const attributes = {
    shape: overlay.type === 'drawing' ? 'custom-drawing' : 'custom-symbol',
    color: overlay.color,
    symbol: overlay.symbol,
    size: overlay.size,
    opacity: overlay.opacity,
    offsetY: overlay.offsetY,
    strokeWidth: overlay.strokeWidth,
    drawingPath: overlay.drawingPath,
    drawingViewBox: overlay.drawingViewBox,
  }

  if (selection) {
    applyShapeOverlayToRange(attributes, selection)
    return
  }

  runTrimmedCommand(() => props.editor.chain().focus().setShapeOverlay(attributes).run())
}

const openCustomOverlayDialog = () => {
  customOverlaySelection.value = getTrimmedSelection()
  const attrs = props.editor.getAttributes('shapeOverlay')
  const isCustomShape = attrs.shape === 'custom-symbol' || attrs.shape === 'custom-drawing'
  const activePreset = isCustomShape
    ? customOverlayPresets.value.find((preset) => {
        const shape = preset.type === 'drawing' ? 'custom-drawing' : 'custom-symbol'
        return shape === attrs.shape && preset.symbol === attrs.symbol && preset.color === attrs.color
      })
    : null

  editingCustomPresetId.value = activePreset?.id || ''
  customOverlayDraft.value = normalizeShapeOverlayPreset({
    ...DEFAULT_CUSTOM_OVERLAY,
    ...(activePreset || {}),
    ...(isCustomShape ? {
      ...attrs,
      type: attrs.shape === 'custom-drawing' ? 'drawing' : 'symbol',
    } : {}),
    id: activePreset?.id || '',
  })
  resetDrawingSegments(customOverlayDraft.value.drawingPath)
  showCustomOverlayDialog.value = true
}

const openManageCustomOverlaysDialog = () => {
  customOverlaySelection.value = getTrimmedSelection()
  showManageCustomOverlaysDialog.value = true
}

const openNewManagedPreset = () => {
  editingCustomPresetId.value = ''
  customOverlayDraft.value = { ...DEFAULT_CUSTOM_OVERLAY }
  drawingPoints.value = []
  drawingSegments.value = []
  showManageCustomOverlaysDialog.value = false
  showCustomOverlayDialog.value = true
}

const editManagedPreset = async (preset) => {
  editingCustomPresetId.value = preset.id
  customOverlayDraft.value = normalizeShapeOverlayPreset(preset)
  resetDrawingSegments(customOverlayDraft.value.drawingPath)
  showManageCustomOverlaysDialog.value = false
  showCustomOverlayDialog.value = true

  if (customOverlayDraft.value.type === 'drawing') {
    await nextTick()
    drawCanvasPath()
  }
}

const applyManagedPreset = (preset) => {
  setCustomOverlay(preset, customOverlaySelection.value)
  showManageCustomOverlaysDialog.value = false
  customOverlaySelection.value = null
}

const deleteManagedPreset = async (preset) => {
  try {
    await shapeOverlayPresetsStore.deletePreset(preset.id)
  } catch (error) {
    console.error('Failed to delete custom overlay:', error)
    Notify.create({ type: 'negative', message: 'Could not delete that custom overlay.' })
  }
}

const applyCustomOverlayDraft = async (shouldSave) => {
  const preset = normalizeShapeOverlayPreset({
    ...customOverlayDraft.value,
    id: editingCustomPresetId.value || null,
  })

  if (preset.type === 'drawing' && !preset.drawingPath) {
    Notify.create({ type: 'warning', message: 'Draw a marking first.' })
    return
  }

  if (shouldSave) {
    try {
      const saved = await shapeOverlayPresetsStore.savePreset(preset)
      editingCustomPresetId.value = saved.id
      setCustomOverlay(saved, customOverlaySelection.value)
    } catch (error) {
      console.error('Failed to save custom overlay:', error)
      Notify.create({ type: 'negative', message: 'Could not save that custom overlay.' })
      return
    }
  } else {
    setCustomOverlay(preset, customOverlaySelection.value)
  }

  showCustomOverlayDialog.value = false
  customOverlaySelection.value = null
}

const deleteCustomOverlayPreset = async () => {
  if (!editingCustomPresetId.value) return

  try {
    await shapeOverlayPresetsStore.deletePreset(editingCustomPresetId.value)
    editingCustomPresetId.value = ''
    customOverlayDraft.value = { ...DEFAULT_CUSTOM_OVERLAY }
    drawingPoints.value = []
    drawingSegments.value = []
    clearCanvas()
  } catch (error) {
    console.error('Failed to delete custom overlay:', error)
    Notify.create({ type: 'negative', message: 'Could not delete that custom overlay.' })
  }
}

const getCanvasPoint = (event) => {
  const canvas = drawingCanvas.value
  if (!canvas) return null

  const rect = canvas.getBoundingClientRect()
  return {
    x: Math.min(Math.max(((event.clientX - rect.left) / rect.width) * 120, 0), 120),
    y: Math.min(Math.max(((event.clientY - rect.top) / rect.height) * 60, 0), 60),
  }
}

const pointsToPenPath = (points) => {
  if (!points.length) return ''

  return points
    .map((point, index) => `${index === 0 || point.move ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ')
}

const splitDrawingPath = (path) =>
  String(path || '')
    .trim()
    .split(/(?=\s*M\s*-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?)/i)
    .map((segment) => segment.trim())
    .filter(Boolean)

const combinedDrawingPath = (previewPath = '') =>
  [...drawingSegments.value, previewPath]
    .map((segment) => String(segment || '').trim())
    .filter(Boolean)
    .join(' ')

const setDraftDrawingPath = (previewPath = '') => {
  customOverlayDraft.value.drawingPath = combinedDrawingPath(previewPath)
}

const commitDrawingSegment = (segment) => {
  const normalizedSegment = String(segment || '').trim()
  if (!normalizedSegment) return

  drawingSegments.value.push(normalizedSegment)
  setDraftDrawingPath()
}

const resetDrawingSegments = (path = '') => {
  drawingSegments.value = splitDrawingPath(path)
  drawingPoints.value = []
  setDraftDrawingPath()
}

const shapeToPath = (tool, start, end) => {
  if (!start || !end) return ''

  const x1 = start.x.toFixed(1)
  const y1 = start.y.toFixed(1)
  const x2 = end.x.toFixed(1)
  const y2 = end.y.toFixed(1)
  const left = Math.min(start.x, end.x)
  const right = Math.max(start.x, end.x)
  const top = Math.min(start.y, end.y)
  const bottom = Math.max(start.y, end.y)
  const width = Math.max(right - left, 1)
  const height = Math.max(bottom - top, 1)
  const centerX = left + width / 2
  const centerY = top + height / 2
  const radiusX = width / 2
  const radiusY = height / 2

  if (tool === 'line') return `M ${x1} ${y1} L ${x2} ${y2}`
  if (tool === 'box') {
    return [
      `M ${left.toFixed(1)} ${top.toFixed(1)}`,
      `L ${right.toFixed(1)} ${top.toFixed(1)}`,
      `L ${right.toFixed(1)} ${bottom.toFixed(1)}`,
      `L ${left.toFixed(1)} ${bottom.toFixed(1)}`,
      'Z',
    ].join(' ')
  }
  if (tool === 'oval') {
    return [
      `M ${(centerX - radiusX).toFixed(1)} ${centerY.toFixed(1)}`,
      `A ${radiusX.toFixed(1)} ${radiusY.toFixed(1)} 0 1 0 ${(centerX + radiusX).toFixed(1)} ${centerY.toFixed(1)}`,
      `A ${radiusX.toFixed(1)} ${radiusY.toFixed(1)} 0 1 0 ${(centerX - radiusX).toFixed(1)} ${centerY.toFixed(1)}`,
    ].join(' ')
  }
  if (tool === 'triangle') {
    return [
      `M ${centerX.toFixed(1)} ${top.toFixed(1)}`,
      `L ${right.toFixed(1)} ${bottom.toFixed(1)}`,
      `L ${left.toFixed(1)} ${bottom.toFixed(1)}`,
      'Z',
    ].join(' ')
  }

  return ''
}

const clearCanvas = () => {
  const canvas = drawingCanvas.value
  if (!canvas) return

  const context = canvas.getContext('2d')
  context.clearRect(0, 0, canvas.width, canvas.height)
}

const drawCanvasSampleWord = () => {
  const canvas = drawingCanvas.value
  if (!canvas) return

  const context = canvas.getContext('2d')
  context.save()
  context.fillStyle = 'rgba(0, 0, 0, 0.18)'
  context.font = '600 46px Georgia, serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText('Word', canvas.width / 2, canvas.height / 2 + 4)
  context.restore()
}

const drawCanvasPath = () => {
  const canvas = drawingCanvas.value
  if (!canvas) return

  const context = canvas.getContext('2d')
  clearCanvas()
  drawCanvasSampleWord()
  context.strokeStyle = customOverlayDraft.value.color || '#111827'
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.globalAlpha = customOverlayDraft.value.opacity

  if (customOverlayDraft.value.drawingPath && typeof Path2D !== 'undefined') {
    context.save()
    context.scale(2, 2)
    context.lineWidth = customOverlayDraft.value.strokeWidth / 2
    context.stroke(new Path2D(customOverlayDraft.value.drawingPath))
    context.restore()
  } else {
    context.lineWidth = customOverlayDraft.value.strokeWidth
    context.beginPath()
    drawingPoints.value.forEach((point) => {
      const x = point.x * 2
      const y = point.y * 2
      if (point.move) context.moveTo(x, y)
      else context.lineTo(x, y)
    })
    context.stroke()
  }

  context.globalAlpha = 1
}

const startDrawing = (event) => {
  const point = getCanvasPoint(event)
  if (!point) return

  event.currentTarget.setPointerCapture?.(event.pointerId)
  isDrawing.value = true
  drawingStartPoint.value = point

  if (drawingTool.value === 'pen') {
    drawingPoints.value = [{ ...point, move: true }]
    setDraftDrawingPath(pointsToPenPath(drawingPoints.value))
  }

  drawCanvasPath()
}

const continueDrawing = (event) => {
  if (!isDrawing.value) return

  const point = getCanvasPoint(event)
  if (!point) return

  if (drawingTool.value === 'pen') {
    drawingPoints.value.push(point)
    setDraftDrawingPath(pointsToPenPath(drawingPoints.value))
  } else {
    const shapePath = shapeToPath(drawingTool.value, drawingStartPoint.value, point)
    setDraftDrawingPath(shapePath)
  }

  drawCanvasPath()
}

const endDrawing = (event) => {
  if (!isDrawing.value) return

  if (drawingTool.value === 'pen') {
    commitDrawingSegment(pointsToPenPath(drawingPoints.value))
  } else {
    const point = getCanvasPoint(event)
    const shapePath = shapeToPath(drawingTool.value, drawingStartPoint.value, point)
    commitDrawingSegment(shapePath)
  }

  drawingPoints.value = []
  isDrawing.value = false
  drawingStartPoint.value = null
  event.currentTarget.releasePointerCapture?.(event.pointerId)
  drawCanvasPath()
}

const clearDrawing = () => {
  drawingPoints.value = []
  drawingSegments.value = []
  drawingStartPoint.value = null
  customOverlayDraft.value.drawingPath = ''
  clearCanvas()
  drawCanvasSampleWord()
}

const readTrimmedSelection = () => {
  const { from, to } = props.editor.state.selection
  const rawText = props.editor.state.doc.textBetween(from, to, '', '')
  const leadingWhitespace = rawText.match(/^\s*/)?.[0].length || 0
  const trailingWhitespace = rawText.match(/\s*$/)?.[0].length || 0
  const trimmedFrom = from + leadingWhitespace
  const trimmedTo = to - trailingWhitespace

  if (trimmedFrom >= trimmedTo) return null

  return {
    from: trimmedFrom,
    to: trimmedTo,
    text: props.editor.state.doc.textBetween(trimmedFrom, trimmedTo, ' ').trim(),
  }
}

const selectionStillMatches = (selection) => {
  if (!selection) return false
  return props.editor.state.doc.textBetween(selection.from, selection.to, ' ').trim() === selection.text
}

const getTrimmedSelection = () => {
  const selection = readTrimmedSelection()
  if (selection) {
    lastTextSelection.value = selection
    return selection
  }

  return selectionStillMatches(lastTextSelection.value) ? lastTextSelection.value : null
}

const runTrimmedCommand = (callback) => {
  const selection = getTrimmedSelection()
  if (!selection) return false

  props.editor.chain().focus().setTextSelection({ from: selection.from, to: selection.to }).run()
  callback(selection)
  return true
}

const replaceSelection = (content, selection) => {
  props.editor.chain().focus().insertContentAt({ from: selection.from, to: selection.to }, content).run()
  mobilePanel.value = ''
}

const makeVerseReference = async () => {
  const selection = getTrimmedSelection()
  const text = selection?.text || ''
  const verseRange = parseFullVerseReference(text)
  if (!verseRange) {
    Notify.create({ type: 'warning', message: 'Select a full verse reference first.' })
    return
  }

  linkingVerse.value = true
  try {
    await bibleData.loadBooks()
    const resolved = await resolveVerseMatch({ raw: text, verseRange }, bibleData)
    if (!resolved) {
      Notify.create({ type: 'warning', message: 'That verse reference was not found.' })
      return
    }
    replaceSelection({ type: 'verseReference', attrs: resolved }, selection)
    props.onVerseResolved(resolved)
  } catch (error) {
    console.error('Failed to link selected verse:', error)
    Notify.create({ type: 'negative', message: 'Could not link that verse.' })
  } finally {
    linkingVerse.value = false
  }
}

const normalizeTagName = (value) =>
  String(value || '')
    .trim()
    .replace(/^#+/, '')
    .replace(/\s+/g, ' ')

const makeTagReference = async () => {
  const selection = getTrimmedSelection()
  const tagName = normalizeTagName(selection?.text)
  if (!tagName) {
    Notify.create({ type: 'warning', message: 'Select text to tag first.' })
    return
  }

  linkingTag.value = true
  try {
    await tagsStore.fetchTags()
    const existing = tagsStore.tags.find((tag) => tag.name.toLowerCase() === tagName.toLowerCase())
    const tag = existing || await tagsStore.createTag(tagName)
    replaceSelection({ type: 'tagReference', attrs: { tagId: tag.id, tagName: tag.name } }, selection)
    props.onTagResolved(tag)
  } catch (error) {
    console.error('Failed to tag selected text:', error)
    Notify.create({ type: 'negative', message: 'Could not create that tag.' })
  } finally {
    linkingTag.value = false
  }
}

const setShapeColor = (color) => {
  runTrimmedCommand(() => {
    const attrs = props.editor.getAttributes('shapeOverlay')
    const shape = activeShape.value

    props.editor.chain().focus().setShapeOverlay({
      shape,
      color,
      ...(shape === 'custom-symbol'
        ? {
            symbol: attrs.symbol,
            size: attrs.size,
            opacity: attrs.opacity,
            offsetY: attrs.offsetY,
          }
        : {}),
      ...(shape === 'custom-drawing'
        ? {
            size: attrs.size,
            opacity: attrs.opacity,
            offsetY: attrs.offsetY,
            strokeWidth: attrs.strokeWidth,
            drawingPath: attrs.drawingPath,
            drawingViewBox: attrs.drawingViewBox,
          }
        : {}),
    }).run()
  })
}

const toggleMobilePanel = (panel) => {
  mobilePanel.value = mobilePanel.value === panel ? '' : panel
}

// editor.isActive(...) isn't itself reactive — @tiptap/vue-3's
// useEditorState() composable (built for exactly this) isn't available
// in the installed version, so fall back to bumping a ref on every
// transaction to force the toolbar to re-evaluate active states.
const revision = ref(0)
const onTransaction = () => {
  revision.value++
  const selection = readTrimmedSelection()
  if (selection) lastTextSelection.value = selection
}

const hasTextSelection = computed(() => {
  void revision.value
  const selection = readTrimmedSelection()
  return Boolean(selection?.text)
})

const showMobileBar = computed(() =>
  props.focusMode ||
  editorFocused.value ||
  hasTextSelection.value ||
  Boolean(mobilePanel.value) ||
  showCustomOverlayDialog.value ||
  showManageCustomOverlaysDialog.value ||
  showGlyphDialog.value ||
  showTextStyleDialog.value
)

const onFocus = () => {
  editorFocused.value = true
}

const onBlur = () => {
  if (blurTimer) clearTimeout(blurTimer)
  blurTimer = setTimeout(() => {
    editorFocused.value = false
    if (!hasTextSelection.value) mobilePanel.value = ''
  }, 150)
}

const keepMobileBarOpen = () => {
  if (blurTimer) clearTimeout(blurTimer)
  if (hideTimer) clearTimeout(hideTimer)
  mobileBarInteracting.value = true
  editorFocused.value = true
  hideTimer = setTimeout(() => {
    mobileBarInteracting.value = false
  }, 750)
}

const onEditorPointerDown = () => {
  keepMobileBarOpen()
}

const onDocumentSelectionChange = () => {
  const dom = props.editor.view.dom
  const selection = document.getSelection()
  const anchorNode = selection?.anchorNode
  if (!anchorNode || !dom.contains(anchorNode)) {
    if (mobileBarInteracting.value) {
      editorFocused.value = true
      revision.value++
      return
    }

    if (!mobilePanel.value && !showCustomOverlayDialog.value && !showManageCustomOverlaysDialog.value) {
      lastTextSelection.value = null
      editorFocused.value = false
    }
    revision.value++
    return
  }

  keepMobileBarOpen()
  const trimmedSelection = readTrimmedSelection()
  if (trimmedSelection) {
    lastTextSelection.value = trimmedSelection
  } else if (!mobileBarInteracting.value) {
    lastTextSelection.value = null
    mobilePanel.value = ''
  }
  revision.value++
}

onMounted(() => {
  props.editor.on('transaction', onTransaction)
  props.editor.on('focus', onFocus)
  props.editor.on('blur', onBlur)
  props.editor.view.dom.addEventListener('pointerdown', onEditorPointerDown)
  props.editor.view.dom.addEventListener('touchstart', onEditorPointerDown, { passive: true })
  document.addEventListener('selectionchange', onDocumentSelectionChange)
  shapeOverlayPresetsStore.fetchPresets().catch(() => {
    Notify.create({ type: 'warning', message: 'Custom overlays could not be loaded.' })
  })
})

onBeforeUnmount(() => {
  if (blurTimer) clearTimeout(blurTimer)
  if (hideTimer) clearTimeout(hideTimer)
  props.editor.off('transaction', onTransaction)
  props.editor.off('focus', onFocus)
  props.editor.off('blur', onBlur)
  props.editor.view.dom.removeEventListener('pointerdown', onEditorPointerDown)
  props.editor.view.dom.removeEventListener('touchstart', onEditorPointerDown)
  document.removeEventListener('selectionchange', onDocumentSelectionChange)
})

const isActive = (name, attrs) => {
  void revision.value // establish reactive dependency
  return props.editor.isActive(name, attrs)
}

const canUndo = () => {
  void revision.value // establish reactive dependency
  return props.editor.can().undo()
}

const canRedo = () => {
  void revision.value // establish reactive dependency
  return props.editor.can().redo()
}

const canSinkListItem = () => {
  void revision.value // establish reactive dependency
  return props.editor.can().sinkListItem('listItem')
}

const canLiftListItem = () => {
  void revision.value // establish reactive dependency
  return props.editor.can().liftListItem('listItem')
}

watch(() => customOverlayDraft.value.type, async (type) => {
  if (type !== 'drawing') return
  await nextTick()
  drawCanvasPath()
})

watch(showCustomOverlayDialog, async (show) => {
  if (!show || customOverlayDraft.value.type !== 'drawing') return
  await nextTick()
  drawCanvasPath()
})

watch([
  () => customOverlayDraft.value.color,
  () => customOverlayDraft.value.opacity,
  () => customOverlayDraft.value.strokeWidth,
], () => {
  if (showCustomOverlayDialog.value && customOverlayDraft.value.type === 'drawing') {
    drawCanvasPath()
  }
})
</script>

<style scoped>
.rich-text-toolbar-wrap {
  position: sticky;
  top: 107px;
  z-index: 20;
  margin-bottom: 8px;
  padding: 0 0 2px;
  border-bottom: 1px solid var(--color-border);
}

.rich-text-toolbar {
  flex-wrap: wrap;
  padding: 4px 0;
}

.mobile-toolbar-menu {
  display: none;
}

.mobile-editor-bar {
  display: none;
}

.rich-text-file-input {
  display: none;
}

.bubble-swatch-grid {
  display: grid;
  grid-template-columns: repeat(4, 32px);
  gap: 8px;
  padding: 10px;
}

.bubble-swatch-grid--menu {
  padding: 8px 16px 12px 56px;
}

.bubble-swatch-btn {
  flex: 0 0 32px;
  width: 32px;
  min-width: 32px;
  max-width: 32px;
  height: 32px;
  min-height: 32px;
  max-height: 32px;
  aspect-ratio: 1;
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.16));
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
}

.bubble-swatch-btn--active {
  box-shadow:
    0 0 0 2px var(--color-surface),
    0 0 0 4px currentColor;
}

.bubble-swatch-btn--default {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(135deg, transparent 46%, var(--color-border) 47%, var(--color-border) 53%, transparent 54%),
    var(--color-surface);
  color: currentColor;
  font-size: 13px;
  font-weight: 700;
}

.bubble-swatch-btn--custom {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  color: currentColor;
  overflow: hidden;
}

.bubble-swatch-btn--custom input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  cursor: pointer;
  opacity: 0;
}

.shape-icon {
  display: inline-block;
  width: 18px;
  height: 18px;
  color: currentColor;
}

.shape-icon--triangle {
  position: relative;
}

.shape-icon--triangle::before {
  content: "△";
  position: absolute;
  inset: 0;
  font-size: 20px;
  line-height: 18px;
  text-align: center;
}

.shape-icon--circle {
  border: 2px solid currentColor;
  border-radius: 50%;
}

.shape-icon--box {
  border: 2px solid currentColor;
  border-radius: 3px;
}

.shape-icon--cloud {
  position: relative;
}

.shape-icon--cloud::before {
  content: "";
  position: absolute;
  left: 1px;
  right: 1px;
  bottom: 3px;
  height: 9px;
  border: 2px solid currentColor;
  border-radius: 999px;
}

.shape-icon--cloud::after {
  content: "";
  position: absolute;
  left: 4px;
  top: 2px;
  width: 10px;
  height: 10px;
  border: 2px solid currentColor;
  border-bottom-color: transparent;
  border-radius: 50%;
}

.shape-icon--x-overlay {
  position: relative;
}

.shape-icon--x-overlay::before {
  content: "X";
  position: absolute;
  inset: 0;
  font-size: 18px;
  font-weight: 800;
  line-height: 18px;
  text-align: center;
}

.shape-icon--custom-symbol {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 800;
  line-height: 18px;
}

.shape-icon--custom-symbol:empty::before {
  content: "*";
}

.shape-icon-drawing {
  width: 20px;
  height: 14px;
  overflow: visible;
}

.shape-icon-drawing path,
.custom-overlay-preview-svg path {
  fill: none;
  stroke: currentColor;
  stroke-width: 7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.shape-icon--cross-underline,
.shape-icon--swoop-underline,
.shape-icon--dash-underline,
.shape-icon--wavy-underline {
  position: relative;
}

.shape-icon--cross-underline::before,
.shape-icon--swoop-underline::before,
.shape-icon--dash-underline::before,
.shape-icon--wavy-underline::before {
  content: "A";
  position: absolute;
  left: 3px;
  top: -1px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.shape-icon--swoop-underline::after {
  content: "";
  position: absolute;
  left: 1px;
  right: 1px;
  bottom: 0;
  height: 9px;
  border-bottom: 2px solid currentColor;
  border-radius: 0 0 70% 70%;
  transform: rotate(-8deg);
}

.shape-icon--dash-underline::after {
  content: "";
  position: absolute;
  left: 1px;
  right: 1px;
  bottom: 1px;
  height: 2px;
  background: repeating-linear-gradient(
    to right,
    currentColor 0 4px,
    transparent 4px 6px
  );
}

.shape-icon--wavy-underline::after {
  content: "∿";
  position: absolute;
  left: 1px;
  right: 1px;
  bottom: -4px;
  font-size: 22px;
  line-height: 1;
}

.shape-icon--cross-underline::after {
  content: "+";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  font-size: 20px;
  font-weight: 800;
  line-height: 18px;
  text-align: center;
}

:global(.bubble-swatch-menu),
:global(.bubble-shape-menu) {
  border: 1px solid var(--color-border);
}

.bubble-shape-list {
  min-width: 160px;
}

.bubble-shape-color-grid {
  display: grid;
  grid-template-columns: repeat(3, 32px);
  gap: 8px;
}

.shape-menu-active {
  background: var(--color-hover);
  color: var(--q-primary);
}

.toolbar-action-list {
  min-width: 180px;
}

.toolbar-action-list--wide {
  min-width: min(280px, calc(100vw - 32px));
  max-height: min(70vh, 560px);
  overflow-y: auto;
}

.custom-overlay-card {
  width: min(420px, calc(100vw - 32px));
  color: var(--color-text);
}

.custom-overlay-manage-card {
  width: min(560px, calc(100vw - 32px));
  color: var(--color-text);
}

.custom-overlay-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
}

.custom-overlay-title {
  font-size: 18px;
  font-weight: 600;
}

.custom-overlay-body {
  display: grid;
  gap: 14px;
}

.custom-overlay-preview-row {
  display: flex;
  justify-content: center;
  padding: 16px 0 8px;
}

.custom-overlay-preview-text {
  position: relative;
  display: inline-block;
  font-size: 28px;
  line-height: 1.2;
}

.custom-overlay-preview-mark {
  position: absolute;
  left: 50%;
  top: 50%;
  pointer-events: none;
  font-weight: 800;
  line-height: 1;
}

.custom-overlay-preview-svg {
  width: 2.8em;
  height: 1.4em;
  overflow: visible;
}

.custom-overlay-field {
  display: grid;
  gap: 8px;
}

.custom-overlay-field-label {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.custom-overlay-actions {
  display: flex;
  gap: 8px;
}

.custom-overlay-empty {
  padding: 20px;
  color: var(--color-text-secondary);
  text-align: center;
}

.custom-overlay-manage-list {
  border-color: var(--color-border);
  border-radius: 8px;
}

.custom-overlay-row-actions {
  display: flex;
  gap: 2px;
}

.custom-overlay-canvas {
  width: 100%;
  height: 120px;
  touch-action: none;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface-alt);
  cursor: crosshair;
}

@media (max-width: 599px) {
  .rich-text-toolbar-wrap {
    position: static;
    margin-bottom: 0;
    padding: 0;
    border-bottom: 0;
    background: transparent !important;
  }

  .rich-text-toolbar {
    display: none;
  }

  .mobile-editor-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: calc(56px + env(safe-area-inset-bottom));
    z-index: 8000;
    display: grid;
    gap: 0;
    padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
    border-top: 1px solid var(--color-border);
    box-shadow: 0 -10px 26px var(--color-shadow-strong);
  }

  .mobile-editor-bar--focus {
    bottom: 0;
  }

  .mobile-editor-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2px;
    min-height: 42px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
  }

  .mobile-editor-actions :deep(.q-btn) {
    flex: 0 0 auto;
  }

  .mobile-focus-actions {
    display: grid;
    gap: 4px;
  }

  .mobile-focus-actions-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2px;
    min-height: 40px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
  }

  .mobile-focus-actions-row--split {
    gap: 12px;
  }

  .mobile-focus-group {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2px;
  }

  .mobile-focus-actions-row :deep(.q-btn) {
    flex: 0 0 auto;
  }

  .mobile-focus-actions-row::-webkit-scrollbar {
    display: none;
  }

  .mobile-editor-actions::-webkit-scrollbar {
    display: none;
  }

  .mobile-editor-panel {
    display: grid;
    gap: 8px;
    padding: 4px 2px 8px;
    border-bottom: 1px solid var(--color-border);
  }

  .mobile-editor-panel--tall {
    max-height: 42vh;
  }

  .mobile-panel-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 32px;
    padding: 0 2px 0 8px;
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 600;
  }

  .mobile-panel-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    padding: 0 2px 2px;
    scrollbar-width: none;
  }

  .mobile-panel-actions::-webkit-scrollbar {
    display: none;
  }

  .mobile-swatch-strip {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    padding: 0 8px 2px;
    scrollbar-width: none;
  }

  .mobile-swatch-strip::-webkit-scrollbar {
    display: none;
  }

  .mobile-overlay-strip {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 42px;
    gap: 8px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    padding: 0 8px 2px;
    scrollbar-width: none;
  }

  .mobile-overlay-strip::-webkit-scrollbar {
    display: none;
  }

  .mobile-overlay-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    min-width: 42px;
    height: 38px;
    min-height: 38px;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: var(--color-surface);
    color: currentColor;
    font: inherit;
  }

  .mobile-overlay-btn--active {
    border-color: var(--q-primary);
    color: var(--q-primary);
    background: var(--color-hover);
  }
}
</style>
