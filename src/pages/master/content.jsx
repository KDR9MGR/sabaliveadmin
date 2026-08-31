import { useState } from 'react'
import { ListPage } from '../_templates.jsx'
import { PageHeader, Card, Button, StatusBadge, Tag, useToast } from '../../components/ui.jsx'
import { statusCol } from '../../components/cells.jsx'
import DataTable from '../../components/DataTable.jsx'
import EntityForm from '../../components/EntityForm.jsx'
import { banners, legalPages, announcements } from '../../data/index.js'

const CRUMBS = ['Home', 'Content / Settings']

export function Banners() {
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  return (
    <>
      <PageHeader title="Banners" crumbs={[...CRUMBS, 'Banners']}
        actions={<Button variant="primary" icon="plus" onClick={() => setAdding(true)}>Add Banner</Button>} />
      <DataTable
        rows={banners}
        searchKeys={['title', 'placement', 'id']}
        filters={[
          { label: 'Placement', options: [...new Set(banners.map((b) => b.placement))], get: (r) => r.placement },
          { label: 'Status', options: ['Active', 'Scheduled', 'Expired'], get: (r) => r.status },
        ]}
        columns={[
          { key: 'title', header: 'Banner', sortable: true, render: (r) => <span className="hstack" style={{ gap: 10 }}><span style={{ width: 44, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }} /><b>{r.title}</b></span> },
          { key: 'placement', header: 'Placement', render: (r) => <Tag>{r.placement}</Tag> },
          { key: 'starts', header: 'Starts', sortable: true },
          { key: 'ends', header: 'Ends' },
          statusCol(),
        ]}
        rowActions={(r) => [
          { label: 'Edit', icon: 'edit', onClick: () => toast(`Edit ${r.title}`) },
          { label: 'Preview', icon: 'eye', onClick: () => toast('Preview') },
          { label: r.status === 'Active' ? 'Deactivate' : 'Activate', icon: 'lock', onClick: () => toast('Toggled') },
          { sep: true },
          { label: 'Delete', icon: 'trash', onClick: () => toast('Deleted') },
        ]}
      />
      {adding && (
        <EntityForm title="Add Banner" onClose={() => setAdding(false)} savedMessage="Banner scheduled"
          fields={[
            { name: 'title', label: 'Title', required: true },
            { name: 'placement', label: 'Placement', type: 'select', options: ['Home Top', 'Live Room', 'Wallet', 'Explore'], required: true },
            { name: 'link', label: 'Target link / deeplink' },
            { name: 'starts', label: 'Start date', type: 'text', placeholder: 'DD MMM YYYY' },
            { name: 'ends', label: 'End date', type: 'text', placeholder: 'DD MMM YYYY' },
            { name: 'active', label: 'Publish immediately', type: 'toggle', full: true },
          ]}
        />
      )}
    </>
  )
}

export function LegalPages() {
  const toast = useToast()
  return (
    <ListPage
      title="Legal Pages"
      crumbs={[...CRUMBS, 'Legal Pages']}
      actions={<Button variant="primary" icon="plus" onClick={() => toast('New page')}>New Page</Button>}
      rows={legalPages}
      searchKeys={['title', 'slug']}
      columns={[
        { key: 'title', header: 'Page', sortable: true, render: (r) => <b>{r.title}</b> },
        { key: 'slug', header: 'Slug', render: (r) => <span className="mono muted">{r.slug}</span> },
        { key: 'updated', header: 'Last updated', sortable: true },
        statusCol(),
      ]}
      rowActions={(r) => [
        { label: 'Edit content', icon: 'edit', onClick: () => toast(`Edit ${r.title}`) },
        { label: 'View history', icon: 'clock', onClick: () => toast('Version history') },
        { label: r.status === 'Published' ? 'Unpublish' : 'Publish', icon: 'externalLink', onClick: () => toast('Toggled') },
      ]}
    />
  )
}

export function Announcements() {
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  return (
    <>
      <PageHeader title="Announcements" crumbs={[...CRUMBS, 'Announcements']}
        actions={<Button variant="primary" icon="plus" onClick={() => setAdding(true)}>New Announcement</Button>} />
      <DataTable
        rows={announcements}
        searchKeys={['title', 'audience', 'id']}
        tabs={[
          { label: 'All', value: 'all', filter: () => true },
          { label: 'Sent', value: 's', filter: (r) => r.status === 'Sent' },
          { label: 'Scheduled', value: 'sc', filter: (r) => r.status === 'Scheduled' },
          { label: 'Draft', value: 'd', filter: (r) => r.status === 'Draft' },
        ]}
        columns={[
          { key: 'title', header: 'Announcement', sortable: true, render: (r) => <b>{r.title}</b> },
          { key: 'audience', header: 'Audience', render: (r) => <Tag>{r.audience}</Tag> },
          { key: 'channel', header: 'Channel' },
          { key: 'sent', header: 'Date', sortable: true },
          statusCol(),
        ]}
        rowActions={(r) => [
          { label: 'Edit', icon: 'edit', onClick: () => toast(`Edit ${r.title}`) },
          { label: 'Duplicate', icon: 'layers', onClick: () => toast('Duplicated') },
          { label: 'Send now', icon: 'upload', onClick: () => toast('Sent') },
        ]}
      />
      {adding && (
        <EntityForm title="New Announcement" onClose={() => setAdding(false)} savedMessage="Announcement saved"
          fields={[
            { name: 'title', label: 'Title', required: true },
            { name: 'audience', label: 'Audience', type: 'select', options: ['All users', 'Hosts', 'Agencies', 'Sub Admins'], required: true },
            { name: 'channel', label: 'Channel', type: 'select', options: ['In-app', 'Push', 'Email', 'In-app + Push'] },
            { name: 'when', label: 'Schedule', type: 'select', options: ['Send now', 'Schedule for later'] },
            { name: 'body', label: 'Message', type: 'textarea', full: true, required: true },
          ]}
        />
      )}
    </>
  )
}
