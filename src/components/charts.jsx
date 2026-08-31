import Chart from 'react-apexcharts'

const FONT = 'Inter, system-ui, sans-serif'
const AXIS = '#8a94a6'
const GRID = '#eef0f3'

const base = {
  chart: { fontFamily: FONT, toolbar: { show: false }, zoom: { enabled: false }, animations: { speed: 400 } },
  grid: { borderColor: GRID, strokeDashArray: 4, padding: { left: 4, right: 4 } },
  tooltip: { theme: 'light', style: { fontSize: '12px' } },
  dataLabels: { enabled: false },
  legend: { show: false },
}

export function AreaChart({ series, categories, color = '#7c3aed', height = 260, label = 'Value' }) {
  return (
    <Chart
      type="area"
      height={height}
      series={[{ name: label, data: series }]}
      options={{
        ...base,
        colors: [color],
        stroke: { curve: 'smooth', width: 3 },
        fill: {
          type: 'gradient',
          gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 90, 100] },
        },
        xaxis: {
          categories: categories || series.map((_, i) => i + 1),
          labels: { style: { colors: AXIS, fontSize: '11px' }, rotate: 0, hideOverlappingLabels: true },
          axisBorder: { show: false }, axisTicks: { show: false },
          tickAmount: Math.min(10, (categories || series).length),
        },
        yaxis: { labels: { style: { colors: AXIS, fontSize: '11px' } } },
      }}
    />
  )
}

export function BarChart({ series, categories, color = '#7c3aed', height = 260, label = 'Value', horizontal = false }) {
  return (
    <Chart
      type="bar"
      height={height}
      series={[{ name: label, data: series }]}
      options={{
        ...base,
        colors: [color],
        plotOptions: { bar: { borderRadius: 5, columnWidth: '55%', horizontal, borderRadiusApplication: 'end' } },
        xaxis: {
          categories: categories || series.map((_, i) => i + 1),
          labels: { style: { colors: AXIS, fontSize: '11px' } },
          axisBorder: { show: false }, axisTicks: { show: false },
        },
        yaxis: { labels: { style: { colors: AXIS, fontSize: '11px' } } },
      }}
    />
  )
}

export function DonutChart({ data, height = 260, centerLabel = 'Total' }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <Chart
      type="donut"
      height={height}
      series={data.map((d) => d.value)}
      options={{
        ...base,
        labels: data.map((d) => d.label),
        colors: data.map((d) => d.color),
        stroke: { width: 2, colors: ['#fff'] },
        plotOptions: {
          pie: {
            donut: {
              size: '72%',
              labels: {
                show: true,
                name: { fontSize: '12px', color: AXIS },
                value: { fontSize: '22px', fontWeight: 700, color: '#1f2430', formatter: (v) => Number(v).toLocaleString() },
                total: { show: true, label: centerLabel, color: AXIS, formatter: () => total.toLocaleString() },
              },
            },
          },
        },
        tooltip: { ...base.tooltip, y: { formatter: (v) => v.toLocaleString() } },
      }}
    />
  )
}

export function Sparkline({ series, color = '#7c3aed', height = 44 }) {
  return (
    <Chart
      type="area"
      height={height}
      series={[{ data: series }]}
      options={{
        chart: { sparkline: { enabled: true }, fontFamily: FONT },
        colors: [color],
        stroke: { curve: 'smooth', width: 2 },
        fill: { type: 'gradient', gradient: { opacityFrom: 0.3, opacityTo: 0 } },
        tooltip: { enabled: false },
      }}
    />
  )
}
