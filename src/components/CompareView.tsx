import { CountryStats } from "../types"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts"

interface Props { data: Record<string, CountryStats> }

const COLORS = ["#4f8ef7", "#4ff79f", "#f7954f", "#f74f4f", "#c44ff7"]

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toFixed(0)
}

export function CompareView({ data }: Props) {
  const tags = Object.keys(data)

  function makeBarData(keys: { key: keyof CountryStats; label: string }[]) {
    return keys.map(({ key, label }) => {
      const row: any = { metric: label }
      tags.forEach(tag => { row[tag] = data[tag][key] })
      return row
    })
  }

  const econData = makeBarData([
    { key: "gdp", label: "ВВП" },
    { key: "export", label: "Экспорт" },
    { key: "import", label: "Импорт" },
  ])

  const getMax = (key: keyof CountryStats) =>
    Math.max(...tags.map(t => Number(data[t][key]) || 0)) || 1

  const radarData = [
    { metric: "ВВП/кап",   key: "gdp_per_cap" as keyof CountryStats },
    { metric: "Грамот.",   key: "literacy"    as keyof CountryStats },
    { metric: "Индустр.",  key: "ind_power"   as keyof CountryStats },
    { metric: "Армия",     key: "army_innov"  as keyof CountryStats },
    { metric: "Флот",      key: "naval_innov" as keyof CountryStats },
    { metric: "ВВП",       key: "gdp"         as keyof CountryStats },
  ].map(({ metric, key }) => {
    const max = getMax(key)
    const row: any = { metric }
    tags.forEach(tag => {
      row[tag] = Math.round((Number(data[tag][key]) / max) * 100)
    })
    return row
  })

  const tableRows: { label: string; key: keyof CountryStats; format?: (v: number) => string }[] = [
    { label: "ВВП (£)",           key: "gdp",          format: fmt },
    { label: "ВВП / капиту",      key: "gdp_per_cap",  format: v => v.toFixed(3) },
    { label: "Население",          key: "population",   format: fmt },
    { label: "Грамотность %",      key: "literacy",     format: v => v.toFixed(1) + "%" },
    { label: "Инд. мощь %",        key: "ind_power",    format: v => (v * 100).toFixed(1) + "%" },
    { label: "Коэф. Джини",        key: "gini",         format: v => v.toFixed(3) },
    { label: "Экспорт (£)",        key: "export",       format: fmt },
    { label: "Импорт (£)",         key: "import",       format: fmt },
    { label: "Безраб. фабрик %",   key: "fab_unemploy", format: v => v.toFixed(1) + "%" },
    { label: "Армейские техн.",    key: "army_innov",   format: v => v + " / 20" },
    { label: "Морские техн.",      key: "naval_innov",  format: v => v + " / 30" },
  ]

  const tooltipStyle = {
    background: "#1a1d27", border: "1px solid #2a2d3a",
    borderRadius: 6, color: "#ccc"
  }

  return (
    <div className="compare-view">
      <h2 className="compare-title">{tags.join(" · ")}</h2>

      <div className="charts-grid">
        {/* Радар */}
        <div className="chart-card full-width">
          <div className="chart-title">Общее сравнение (нормализовано)</div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#2a2d3a" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "#666", fontSize: 11 }} />
              {tags.map((tag, i) => (
                <Radar key={tag} name={tag} dataKey={tag}
                  stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15}
                />
              ))}
              <Legend wrapperStyle={{ color: "#888", fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Экономика */}
        <div className="chart-card">
          <div className="chart-title">Экономика (£)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={econData}>
              <XAxis dataKey="metric" tick={{ fill: "#666", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmt} tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} width={45} />
              <Tooltip formatter={(v: any) => fmt(v) + " £"} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: "#888", fontSize: 12 }} />
              {tags.map((tag, i) => (
                <Bar key={tag} dataKey={tag} fill={COLORS[i]} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Таблица */}
        <div className="chart-card">
          <div className="chart-title">Сводная таблица</div>
          <table className="compare-table">
            <thead>
              <tr>
                <th>Показатель</th>
                {tags.map(t => <th key={t} style={{ color: COLORS[tags.indexOf(t)] }}>{t}</th>)}
              </tr>
            </thead>
            <tbody>
              {tableRows.map(({ label, key, format }) => (
                <tr key={key as string}>
                  <td>{label}</td>
                  {tags.map(tag => (
                    <td key={tag}>
                      {format
                        ? format(Number(data[tag][key]))
                        : fmt(Number(data[tag][key]))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}