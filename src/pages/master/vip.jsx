import { useState } from 'react'
import { uploadMedia } from '../../lib/storage.js'
import SvgaPlayer from '../../components/SvgaPlayer.jsx'
import SvgPreview from '../../components/SvgPreview.jsx'
import { isSvg } from '../../lib/mediaTypes.js'
import { AsyncView } from '../_templates.jsx'
import { PageHeader, Card, Button, Drawer, ConfirmDialog, EmptyState, useToast } from '../../components/ui.jsx'
import DataTable from '../../components/DataTable.jsx'
import { numCol, statusCol } from '../../components/cells.jsx'
import { useAsyncData } from '../../lib/useAsync.js'
import { listVipProducts, saveVipProduct, deleteVipProduct, listLinkableItems } from '../../lib/vipApi.js'
import {
  checkProduct, formFromProduct, toggleKind, withPicture, orderBenefits, vipKind, acceptFor, OWN_PICTURE, VIP_TIERS, tierLabel,
  VIP_KINDS, VIP_CUSTOM, VIP_STATUSES, VIP_IMAGE_ACCEPT, VIP_NAME_MAX, VIP_TAGLINE_MAX, VIP_BENEFIT_TITLE_MAX, VIP_MAX_BENEFITS, VIP_MAX_DAYS,
} from '../../lib/vipProducts.js'

/* Master / Super Admin -> VIP Products: the cards of the app's VIP screen. A product is a bundle: a name, a short line, a badge picture, a coin price, a number of days and the
   benefits it includes (all of the list or just a few, each with an optional picture and name). Entry Effect, Vehicle, Avatar Frame and Theme give the picture uploaded in the benefit
   for the VIP's days (no Store item to pick: owner, 2026-11-18); the other benefits are listed on the product's page for now. A product is a VIP or an SVIP (its own tab in the app). The database (sabalive migration 20261106120000) enforces all of it:
   only a Master or Super Admin can save, and it re-checks every rule below. */

const isSvga = (url) => /\.svga(\?|$)/i.test(String(url || ''))

/* A picture, whatever it is: SVGA animation, SVG drawing or a still / GIF / WebP. */
function Art({ url, size = 40 }) {
  if (!url) return null
  if (isSvga(url)) return <SvgaPlayer url={url} size={size} />
  if (isSvg(url)) return <SvgPreview url={url} style={{ height: size, width: size, objectFit: 'contain' }} />
  return <img src={url} alt="" style={{ height: size, width: size, objectFit: 'contain' }} />
}

/* Upload one picture to the same public storage as the badge and gift pictures. `compact` is the small version inside a benefit. */
function PictureField({ label, value, onChange, hint, compact = false, required = false, accept = VIP_IMAGE_ACCEPT }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true); setError('')
    try { onChange(await uploadMedia('gift-assets', 'vip', file)) } catch (err) { setError(err?.message || 'Upload failed') } finally { setBusy(false) }
  }
  return (
    <div className={compact ? 'field' : 'field full'}>
      <label>{label}{required && <span className="req"> *</span>}</label>
      <div className="hstack" style={{ gap: 10, alignItems: 'center' }}>
        {value && <div style={{ background: 'rgba(127,127,127,.15)', borderRadius: 8, padding: 4 }}><Art url={value} size={compact ? 40 : 72} /></div>}
        <label className="btn" style={{ cursor: busy ? 'default' : 'pointer', textAlign: 'center' }}>
          {busy ? 'Uploading…' : value ? 'Replace' : 'Upload'}
          <input type="file" accept={accept} onChange={pick} disabled={busy} style={{ display: 'none' }} />
        </label>
        {value && <Button onClick={() => onChange('')}>Remove</Button>}
      </div>
      {hint && <span className="hint">{hint}</span>}
      {error && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</span>}
    </div>
  )
}

/* One ticked benefit: its own title and picture (both optional: the app has a name and an icon for every kind). For the kinds that give an item the picture IS the item (owner,
   2026-11-16: "the room entry effect does not need to come from the Store, same for the other items"; 2026-11-18: "take that option from Store away"): upload it and the buyer is given
   and put into it the moment they buy. There is NO Store item to pick any more. A product saved earlier with a Store item still shows it (so saving never silently changes what buyers get)
   until a picture is uploaded here: the picture then replaces it. */
function BenefitRow({ kind, benefit, items, onChange }) {
  const info = vipKind(kind)
  const choices = info?.link ? (items[info.link] || []) : []
  const ownPicture = benefit.link_item_id === OWN_PICTURE
  const legacyStore = !ownPicture && benefit.link_item_id ? benefit.link_item_id : ''
  const legacyName = legacyStore ? (choices.find((i) => i.id === legacyStore)?.name || 'a Store item') : ''
  return (
    <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(127,127,127,.08)' }}>
      <div className="form-grid">
        <div className="field">
          <label>Name shown in the app (optional)</label>
          <input className="input" value={benefit.title} maxLength={VIP_BENEFIT_TITLE_MAX * 2} placeholder={info?.label || ''} onChange={(e) => onChange({ title: e.target.value })} />
        </div>
        <PictureField
          compact
          label={info?.link ? 'Picture (this is the item the buyer gets)' : 'Picture (optional)'}
          accept={acceptFor(kind)}
          value={benefit.image_url}
          onChange={(u) => onChange(withPicture(benefit, u))}
        />
        {info?.link && (
          <div className="field full">
            <span className="hint">
              {legacyStore
                ? `This VIP still gives the Store item "${legacyName}" (made before the picture became the item). Upload a picture above to replace it: the picture then becomes the buyer's own item, hidden from the Store, and put on the moment they buy.`
                : benefit.image_url
                  ? 'The picture above is the buyer\'s own item (hidden from the Store: nobody can buy it there) and is put on the moment they buy this VIP. Change the picture and Save again: everybody who owns it sees the new one. An MP4 plays as an effect; the VIP page shows the kind\'s icon for it.'
                  : 'Upload a picture above and it becomes the item the buyer gets and wears. Until you do, this benefit is only listed on the VIP\'s page and gives nothing.'}
            </span>
          </div>
        )}
        {info && !info.link && (
          <div className="field full">
            <span className="hint">{info.gives || info.does || 'Listed on the VIP\'s page only for now: it does nothing yet. Its rule is switched on later.'}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function VipForm({ product, items, onClose, onSaved, tier }) {
  // a NEW product starts as the tier of the button that opened it (Create VIP Product / Create SVIP Product); an existing one keeps its own
  const [v, setV] = useState(() => (product || !tier ? formFromProduct(product) : { ...formFromProduct(product), tier }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()
  const set = (k, val) => setV((s) => ({ ...s, [k]: val }))
  const patchBenefit = (i, patch) => setV((s) => ({ ...s, benefits: s.benefits.map((b, j) => (j === i ? { ...b, ...patch } : b)) }))
  const customs = v.benefits.map((b, i) => ({ b, i })).filter(({ b }) => b.kind === VIP_CUSTOM)

  const submit = async () => {
    setError('')
    const next = { ...v, benefits: orderBenefits(v.benefits) }
    const checked = checkProduct(next)
    if (checked.error) { setError(checked.error); return }
    setBusy(true)
    try {
      await saveVipProduct(product?.id, next)
      toast(product ? 'VIP product updated' : v.tier === 'svip' ? 'SVIP product created' : 'VIP product created')
      onSaved()
      onClose()
    } catch (e) {
      setError(e?.message || 'Could not save the VIP product')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Drawer
      title={product ? `Edit — ${product.name}` : v.tier === 'svip' ? 'Create SVIP Product' : 'Create VIP Product'}
      onClose={onClose}
      footer={<>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="primary" icon={busy ? 'refresh' : 'check'} onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
      </>}
    >
      {error && <div className="badge badge--danger" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 14 }}>{error}</div>}
      <div className="form-grid">
        <div className="field">
          <label>Name <span className="req">*</span></label>
          <input className="input" value={v.name} maxLength={VIP_NAME_MAX * 2} onChange={(e) => set('name', e.target.value)} placeholder="VIP1" />
          <span className="hint">Up to {VIP_NAME_MAX} characters. The card and the page show it.</span>
        </div>
        <div className="field">
          <label>Short line (optional)</label>
          <input className="input" value={v.tagline} maxLength={VIP_TAGLINE_MAX * 2} onChange={(e) => set('tagline', e.target.value)} placeholder="Start your royal journey" />
          <span className="hint">Under the name on the product's page, up to {VIP_TAGLINE_MAX} characters.</span>
        </div>
        <PictureField
          label="Badge picture"
          value={v.badge_url}
          onChange={(u) => set('badge_url', u)}
          hint="The crest on the card and the top of the page, and the badge on the buyer's own profile. PNG, WebP, GIF, SVG or SVGA, square or close to it, on a transparent background. Without one the app shows a gold crown."
        />
        <div className="field">
          <label>Price (coins) <span className="req">*</span></label>
          <input className="input" type="number" min="1" step="1" value={v.price_coins} onChange={(e) => set('price_coins', e.target.value)} placeholder="2000000" />
          <span className="hint">What the buyer pays. A whole number, at least 1.</span>
        </div>
        <div className="field">
          <label>Days <span className="req">*</span></label>
          <input className="input" type="number" min="1" max={VIP_MAX_DAYS} step="1" value={v.duration_days} onChange={(e) => set('duration_days', e.target.value)} />
          <span className="hint">How long one purchase lasts (1 to {VIP_MAX_DAYS}). Buying again while it is active adds the days.</span>
        </div>
        <div className="field">
          <label>Order</label>
          <input className="input" type="number" step="1" value={v.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
          <span className="hint">Smaller numbers show first in the app.</span>
        </div>
        <div className="field">
          <label>Status</label>
          <select className="select" value={v.status} onChange={(e) => set('status', e.target.value)}>
            {VIP_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <span className="hint">Inactive: hidden from the app and from profiles, nobody can buy it. People who own it keep their days and see it again if you set it back to Active.</span>
        </div>
        <div className="field">
          <label>Tier</label>
          <select className="select" value={v.tier} onChange={(e) => set('tier', e.target.value)}>
            {VIP_TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <span className="hint">Which tab of the app's VIP screen shows it: VIP or SVIP. An SVIP is its own product with its own price, days and benefits: tick below whatever it should include.</span>
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>What this VIP includes</div>
        <div className="muted" style={{ fontSize: 12.5, marginBottom: 10 }}>
          Tick the benefits this VIP has: all of them or just a few. A name and a picture for each are optional (the app has a default for every kind).
          Everything below that says "works by itself" or "gives an item" is applied to the buyer the moment they buy: Entry Effect, Vehicle, Avatar Frame and Theme give the picture you upload
          for them (put on at once, for the VIP's days; nothing to set up in the Store); Comment Box, Hide Country, Short Profile Decoration, Colourful User Name and High Speed Upgrade work on their own.
          Adding one of these to a VIP that people already own gives it to them now, until their own days end. The rest are listed on the page for now and do nothing yet.
        </div>
        <div className="vstack" style={{ gap: 6 }}>
          {VIP_KINDS.map((k) => {
            const i = v.benefits.findIndex((b) => b.kind === k.key)
            return (
              <div key={k.key}>
                <label className="hstack" style={{ gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={i >= 0} onChange={() => set('benefits', toggleKind(v.benefits, k.key))} />
                  <span style={{ fontWeight: i >= 0 ? 700 : 500 }}>{k.label}</span>
                  {k.gives && <span className="muted" style={{ fontSize: 11 }}>{k.link ? 'gives an item' : 'shows on the profile'}</span>}
                  {k.does && <span className="muted" style={{ fontSize: 11 }}>works by itself</span>}
                </label>
                {i >= 0 && <BenefitRow kind={k.key} benefit={v.benefits[i]} items={items} onChange={(patch) => patchBenefit(i, patch)} />}
              </div>
            )
          })}
        </div>

        <div style={{ fontWeight: 700, margin: '20px 0 4px' }}>Custom benefits</div>
        <div className="muted" style={{ fontSize: 12.5, marginBottom: 6 }}>Anything that is not in the list above: a name and, if you like, a picture. Listed on the page only.</div>
        {customs.map(({ b, i }, n) => (
          <div key={i} style={{ marginTop: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(127,127,127,.08)' }}>
            <div className="form-grid">
              <div className="field">
                <label>Name <span className="req">*</span></label>
                <input className="input" value={b.title} maxLength={VIP_BENEFIT_TITLE_MAX * 2} placeholder={`Custom benefit ${n + 1}`} onChange={(e) => patchBenefit(i, { title: e.target.value })} />
              </div>
              <PictureField compact label="Picture (optional)" value={b.image_url} onChange={(u) => patchBenefit(i, { image_url: u })} />
              <div className="field full">
                <Button icon="trash" onClick={() => set('benefits', v.benefits.filter((_, j) => j !== i))}>Remove this benefit</Button>
              </div>
            </div>
          </div>
        ))}
        <div style={{ marginTop: 10 }}>
          <Button
            icon="plus"
            disabled={v.benefits.length >= VIP_MAX_BENEFITS}
            onClick={() => set('benefits', [...v.benefits, { kind: VIP_CUSTOM, title: '', image_url: '', link_item_id: '' }])}
          >
            Add a custom benefit
          </Button>
          <span className="muted" style={{ fontSize: 12, marginLeft: 10 }}>{v.benefits.length} of {VIP_MAX_BENEFITS} benefits</span>
        </div>
      </div>
    </Drawer>
  )
}

export function VipProducts() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsyncData(listVipProducts)
  const linkable = useAsyncData(listLinkableItems)
  const [adding, setAdding] = useState(null) // null, 'vip' or 'svip': which tier the new product starts as
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const rows = (data?.products || []).map((p) => ({ ...p, benefitCount: p.benefits.length }))
  const items = linkable.data || {}

  const remove = async () => {
    setBusy(true)
    try {
      const n = await deleteVipProduct(deleting.id)
      toast(n > 0 ? `"${deleting.name}" deleted; ${n} ${n === 1 ? 'person' : 'people'} lost it` : `"${deleting.name}" deleted`)
      setDeleting(null)
      reload()
    } catch (e) {
      toast(e?.message || 'Could not delete the VIP product')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="VIP Products"
        crumbs={['Home', 'Platform', 'VIP Products']}
        actions={data?.available !== false && (
          <>
            <Button variant="primary" icon="plus" onClick={() => setAdding('vip')}>Create VIP Product</Button>
            <Button variant="primary" icon="plus" onClick={() => setAdding('svip')}>Create SVIP Product</Button>
          </>
        )}
      />
      <AsyncView loading={loading} error={error} reload={reload}>
        {data?.available === false ? (
          <Card><EmptyState icon="star" title="VIP products are not installed on this project yet" text="They need the database update 20261106120000. Once it is applied this page works." /></Card>
        ) : (
          <DataTable
            rows={rows}
            searchKeys={['name', 'tagline']}
            filters={[{ label: 'Tier', options: ['VIP', 'SVIP'], get: (r) => tierLabel(r.tier) }, { label: 'Status', options: ['Active', 'Inactive'], get: (r) => r.statusLabel }]}
            columns={[
              { key: 'name', header: 'VIP', sortable: true, render: (r) => (
                <span className="hstack" style={{ gap: 10, opacity: r.status === 'active' ? 1 : 0.55 }}>
                  {r.badge_url ? <Art url={r.badge_url} size={36} /> : <span style={{ width: 36, textAlign: 'center' }}>👑</span>}
                  <span><b>{r.name}</b>{r.tagline && <span className="muted" style={{ display: 'block', fontSize: 12 }}>{r.tagline}</span>}</span>
                </span>
              ) },
              { key: 'tier', header: 'Tier', sortable: true, render: (r) => <span className={`badge ${r.tier === 'svip' ? 'badge--warning' : ''}`}>{tierLabel(r.tier)}</span> },
              numCol('price_coins', 'Price (coins)'),
              numCol('duration_days', 'Days'),
              numCol('benefitCount', 'Benefits'),
              numCol('owners', 'Owners now'),
              numCol('sort_order', 'Order'),
              statusCol('statusLabel'),
            ]}
            rowActions={(r) => [
              { label: 'Edit', icon: 'edit', onClick: () => setEditing(r) },
              { label: 'Delete', icon: 'trash', onClick: () => setDeleting(r) },
            ]}
            emptyText="No VIP products yet. Create the first one."
          />
        )}
      </AsyncView>
      {adding && <VipForm items={items} tier={adding} onClose={() => setAdding(null)} onSaved={reload} />}
      {editing && <VipForm product={editing} items={items} onClose={() => setEditing(null)} onSaved={reload} />}
      {deleting && (
        <ConfirmDialog
          title={`Delete "${deleting.name}"?`}
          message={deleting.owners > 0
            ? `${deleting.owners} ${deleting.owners === 1 ? 'person owns' : 'people own'} it right now and will lose it (the Store items it already gave stay until their own end date). This cannot be undone. To hide it without taking it from them, set it to Inactive instead.`
            : 'Nobody owns it right now. This cannot be undone.'}
          confirmLabel="Delete VIP product"
          danger
          busy={busy}
          onConfirm={remove}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}
