import Icon from './Icon.jsx'
import { PANELS } from '../config/nav.js'

/* Small coloured pill that names the current panel — drop next to a page <h1>. */
export default function PanelChip({ panel }) {
  const p = PANELS[panel]
  if (!p) return null
  return (
    <span className="panel-chip" style={{ background: p.color }} title={p.scope}>
      <Icon name={p.icon} size={12} />
      {p.label}
    </span>
  )
}
