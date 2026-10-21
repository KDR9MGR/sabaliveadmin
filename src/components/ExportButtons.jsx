import { Button } from './ui.jsx'
import { EXPORT_FORMATS } from '../lib/export.js'

/* "Export: [CSV] [Excel]" — one button per format. onExport(format) does the download. Pass `show={can('export_data')}` to hide it from accounts
   without the Export data permission. */
export default function ExportButtons({ onExport, disabled, show = true, size = 'sm', label = 'Export' }) {
  if (!show) return null
  return (
    <span className="hstack" style={{ gap: 6, alignItems: 'center' }}>
      <span className="muted" style={{ fontSize: 12.5 }}>{label}</span>
      {EXPORT_FORMATS.map((f) => (
        <Button key={f.value} size={size} icon="download" disabled={disabled} onClick={() => onExport(f.value)}>{f.label}</Button>
      ))}
    </span>
  )
}
