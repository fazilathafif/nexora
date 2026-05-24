export const PREF_DEFAULTS = {
  font_size:           'medium',   // 'small' | 'medium' | 'large' | 'xl'
  high_contrast:       false,
  reduce_motion:       false,
  dyslexia_font:       false,
  color_blind_mode:    'none',    // 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia'
  leaderboard_opt_in:  true,
}

const ZOOM_MAP = { small: '0.88', medium: '1', large: '1.12', xl: '1.25' }

// Machado 2009 color-blind correction matrices (RGB, no alpha column)
const CB_MATRICES = {
  deuteranopia: '0.367 0.861 -0.228 0 0  0.280 0.673  0.047 0 0  -0.012 0.043  0.969 0 0  0 0 0 1 0',
  protanopia:   '0.152 1.053 -0.205 0 0  0.115 0.786  0.099 0 0 -0.004 -0.048  1.052 0 0  0 0 0 1 0',
  tritanopia:   '1.256 -0.077 -0.179 0 0 -0.078  0.931  0.148 0 0  0.005  0.691  0.304 0 0  0 0 0 1 0',
}

const SVG_FILTER_ID = 'nx-cb-filter'

function injectCbFilter(mode) {
  let existing = document.getElementById(SVG_FILTER_ID + '-svg')
  if (existing) existing.remove()

  if (mode === 'none') return

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.id = SVG_FILTER_ID + '-svg'
  svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden')
  svg.innerHTML = `
    <defs>
      <filter id="${SVG_FILTER_ID}">
        <feColorMatrix type="matrix" values="${CB_MATRICES[mode]}" />
      </filter>
    </defs>`
  document.body.appendChild(svg)

  let styleEl = document.getElementById(SVG_FILTER_ID + '-style')
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = SVG_FILTER_ID + '-style'
    document.head.appendChild(styleEl)
  }
  styleEl.textContent = `body { filter: url(#${SVG_FILTER_ID}); }`
}

function removeCbFilter() {
  const svg = document.getElementById(SVG_FILTER_ID + '-svg')
  if (svg) svg.remove()
  const style = document.getElementById(SVG_FILTER_ID + '-style')
  if (style) style.textContent = ''
}

export function applyPreferences(raw) {
  const prefs = { ...PREF_DEFAULTS, ...raw }

  // Font size via zoom
  document.documentElement.style.zoom = ZOOM_MAP[prefs.font_size] ?? '1'

  // Body class toggles
  const body = document.body
  body.classList.toggle('nx-high-contrast',   !!prefs.high_contrast)
  body.classList.toggle('nx-reduce-motion',    !!prefs.reduce_motion)
  body.classList.toggle('nx-dyslexia',         !!prefs.dyslexia_font)

  // Remove all color-blind classes then add the active one
  body.classList.remove('nx-cb-deuteranopia', 'nx-cb-protanopia', 'nx-cb-tritanopia')
  if (prefs.color_blind_mode && prefs.color_blind_mode !== 'none') {
    body.classList.add(`nx-cb-${prefs.color_blind_mode}`)
    injectCbFilter(prefs.color_blind_mode)
  } else {
    removeCbFilter()
  }
}
