import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'

export const normalizeShapeOverlayPreset = (preset = {}) => ({
  id: preset.id || null,
  name: String(preset.name || 'Custom mark').trim() || 'Custom mark',
  type: preset.type === 'drawing' ? 'drawing' : 'symbol',
  symbol: String(preset.symbol || '*').trim().slice(0, 4) || '*',
  color: /^#[0-9a-fA-F]{6}$/.test(preset.color) ? preset.color : '',
  size: Math.min(Math.max(Number(preset.size) || 1.6, 0.8), 3),
  opacity: Math.min(Math.max(Number(preset.opacity) || 0.58, 0.15), 1),
  offsetY: Math.min(Math.max(Number(preset.offsetY ?? preset.offset_y) || 0, -0.6), 0.6),
  strokeWidth: Math.min(Math.max(Number(preset.strokeWidth ?? preset.stroke_width) || 5, 1), 12),
  drawingPath: String(preset.drawingPath ?? preset.drawing_path ?? '').trim(),
  drawingViewBox: String(preset.drawingViewBox ?? preset.drawing_view_box ?? '0 0 120 60').trim() || '0 0 120 60',
})

const toRow = (preset, userId) => {
  const normalized = normalizeShapeOverlayPreset(preset)
  return {
    user_id: userId,
    name: normalized.name,
    type: normalized.type,
    symbol: normalized.type === 'symbol' ? normalized.symbol : null,
    color: normalized.color || null,
    size: normalized.size,
    opacity: normalized.opacity,
    offset_y: normalized.offsetY,
    stroke_width: normalized.strokeWidth,
    drawing_path: normalized.type === 'drawing' ? normalized.drawingPath : null,
    drawing_view_box: normalized.drawingViewBox,
    updated_at: new Date().toISOString(),
  }
}

const isMissingStrokeWidthColumnError = (error) =>
  error?.code === 'PGRST204' && String(error.message || '').includes("'stroke_width' column")

const savePresetRow = async ({ id, payload }) => {
  const query = id
    ? supabase.from('shape_overlay_presets').update(payload).eq('id', id)
    : supabase.from('shape_overlay_presets').insert(payload)

  return query.select().single()
}

const fromRow = (row) => normalizeShapeOverlayPreset(row)

export const useShapeOverlayPresetsStore = defineStore('shapeOverlayPresets', () => {
  const presets = ref([])
  const loading = ref(false)
  const loaded = ref(false)

  const fetchPresets = async () => {
    loading.value = true
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const { data, error } = await supabase
        .from('shape_overlay_presets')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name')

      if (error) throw error
      presets.value = (data || []).map(fromRow)
      loaded.value = true
    } catch (error) {
      console.error('Error fetching shape overlay presets:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const savePreset = async (preset) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw new Error('No active session')

    const normalizedPreset = normalizeShapeOverlayPreset(preset)
    const payload = toRow(normalizedPreset, session.user.id)
    let { data, error } = await savePresetRow({ id: preset.id, payload })

    if (isMissingStrokeWidthColumnError(error)) {
      const legacyPayload = { ...payload }
      delete legacyPayload.stroke_width
      ;({ data, error } = await savePresetRow({ id: preset.id, payload: legacyPayload }))
    }

    if (error) throw error

    const normalized = fromRow({
      ...data,
      strokeWidth: normalizedPreset.strokeWidth,
    })
    const index = presets.value.findIndex((item) => item.id === normalized.id)
    if (index >= 0) presets.value.splice(index, 1, normalized)
    else presets.value.push(normalized)
    presets.value.sort((a, b) => a.name.localeCompare(b.name))
    return normalized
  }

  const deletePreset = async (id) => {
    const { error } = await supabase.from('shape_overlay_presets').delete().eq('id', id)
    if (error) throw error
    presets.value = presets.value.filter((preset) => preset.id !== id)
  }

  return { presets, loading, loaded, fetchPresets, savePreset, deletePreset }
})
