/* Shared helpers for the 3 new panels (Country Admin, Sub Admin, Agency —
   under /country-admin, /sub-admin, /panel-agency). Layout only for now:
   wired into navigation and routing, not yet hooked up to real data. */
import { PageHeader, Card, EmptyState } from '../components/ui.jsx'

export function PanelPlaceholder({ title, crumbs, icon = 'layers', text }) {
  return (
    <>
      <PageHeader title={title} crumbs={crumbs} />
      <Card><div className="card__body">
        <EmptyState
          icon={icon}
          title={`${title} — layout only`}
          text={text || 'Wired into navigation and routing. Data hookup comes in a later pass.'}
        />
      </div></Card>
    </>
  )
}
