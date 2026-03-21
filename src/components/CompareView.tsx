import { CountryStats } from "../types"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts"

interface Props { data: Record<string, CountryStats> }


function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toFixed(0)
}

const GOLD   = "var(--gold)"
const GREEN  = "var(--green)"
const RED    = "var(--red)"
const BLUE   = "var(--blue)"
const ORANGE = "var(--orange)"
const TEXT   = "var(--text)"
const TEXTDIM = "var(--text-dim)"
const BG     = "var(--bg)"
const FONT_FAMILY = "var(--font-main)"

const COLORS = [BLUE, GREEN, ORANGE, RED, GOLD]

export function CompareView({ data }: Props) {
  const tags = Object.keys(data)

  function makeBarData(keys: { key: keyof CountryStats; label: string }[]) {
    return keys.map(({ key, label }) => {
      const row: any = { metric: label }
      tags.forEach(tag => { row[tag] = data[tag][key] })
      return row
    })
  }

  const econData = makeBarData([{ key: "gdp", label: "ВВП" }])

  const byGdp     = [...tags].sort((a, b) => Number(data[b].gdp) - Number(data[a].gdp))
  const byPop     = [...tags].sort((a, b) => Number(data[b].population) - Number(data[a].population))
  const byGdpPc   = [...tags].sort((a, b) => Number(data[b].gdp_per_cap) - Number(data[a].gdp_per_cap))
  const byMilitary = [...tags].sort((a, b) =>
    (Number(data[b].naval_budget) + Number(data[b].military_budget)) -
    (Number(data[a].naval_budget) + Number(data[a].military_budget))
  )

  const rankings = [
    {
      title: "ВВП (£)",
      sorted: byGdp,
      getNum: (t: string) => Number(data[t].gdp),
      getValue: (t: string) => fmt(Number(data[t].gdp)) + " £",
    },
    {
      title: "Население",
      sorted: byPop,
      getNum: (t: string) => Number(data[t].population),
      getValue: (t: string) => fmt(Number(data[t].population)),
    },
    {
      title: "ВВП на душу населения (£)",
      sorted: byGdpPc,
      getNum: (t: string) => Number(data[t].gdp_per_cap),
      getValue: (t: string) => Number(data[t].gdp_per_cap).toFixed(3) + " £",
    },
    {
      title: "Военный бюджет (£)",
      sorted: byMilitary,
      getNum: (t: string) => Number(data[t].naval_budget) + Number(data[t].military_budget),
      getValue: (t: string) => fmt(Number(data[t].naval_budget) + Number(data[t].military_budget)) + " £",
    },
  ]

  const getMax = (key: keyof CountryStats) =>
    Math.max(...tags.map(t => Number(data[t][key]) || 0)) || 1

  const radarData = [
    { metric: "ВВП на душу населения",  key: "gdp_per_cap"     as keyof CountryStats },
    { metric: "Грамот.",  key: "literacy"         as keyof CountryStats },
    { metric: "Индустр.", key: "industrial_level" as keyof CountryStats },
    { metric: "Армия",    key: "army_innov"       as keyof CountryStats },
    { metric: "Флот",     key: "naval_innov"      as keyof CountryStats },
    { metric: "ВВП",      key: "gdp"              as keyof CountryStats },
  ].map(({ metric, key }) => {
    const max = getMax(key)
    const row: any = { metric }
    tags.forEach(tag => {
      row[tag] = Math.round((Number(data[tag][key]) / max) * 100)
    })
    return row
  })

  const tableRows: { label: string; key: keyof CountryStats; format?: (v: number) => string }[] = [
    { label: "ВВП (£)",            key: "gdp",                  format: fmt },
    { label: "ВВП на душу населения",    key: "gdp_per_cap",          format: v => v.toFixed(3) },
    { label: "Население",          key: "population",           format: fmt },
    { label: "Грамотность %",      key: "literacy",             format: v => v.toFixed(1) + "%" },
    { label: "Инд. мощь %",        key: "industrial_level",     format: v => (v * 100).toFixed(1) + "%" },
    { label: "Коэф. Джини",        key: "gini",                 format: v => v.toFixed(3) },
    { label: "Безраб. фабрик %",   key: "fabric_unemployement", format: v => v.toFixed(1) + "%" },
    { label: "Армейские техн.",    key: "army_innov",           format: v => v + " / 40" },
    { label: "Морские техн.",      key: "naval_innov",          format: v => v + " / 40" },
    { label: "Наземный бюджет (£)",key: "military_budget",      format: fmt },
    { label: "Морской бюджет (£)", key: "naval_budget",         format: fmt },
  ]

  const tooltipStyle = {
    background: BG, border: "1px solid BG",
    borderRadius: 6, color: TEXT,
  }

  return (
    <div className="compare-view">
      <h2 className="compare-title">{tags.join(" · ")}</h2>

      <div className="charts-grid">
        {rankings.map(({ title, sorted, getNum, getValue }) => {
          const maxVal = getNum(sorted[0]) || 1
          return (
            <div key={title} className="chart-card">
              <div className="chart-title">{title}</div>
              {sorted.map((tag, i) => {
                const val = getNum(tag) || 0
                const pct = Math.round(val / maxVal * 100)
                return (
                  <div key={tag} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: TEXT, fontSize: 11, width: 16 }}>#{i + 1}</span>
                        <span style={{ color: COLORS[tags.indexOf(tag)], fontSize: 12, fontFamily: FONT_FAMILY, fontWeight: 700 }}>{tag}</span>
                      </div>
                      <span style={{ color: TEXT, fontSize: 12 }}>{getValue(tag)}</span>
                    </div>
                    <div style={{ height: 5, background: BG, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: COLORS[tags.indexOf(tag)], borderRadius: 3 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      <div className="charts-grid">
        {/* Радар */}
        <div className="chart-card full-width">
          <div className="chart-title">Общее сравнение (нормализовано)</div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#2a2d3a" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: TEXTDIM, fontSize: 11 }} />
              {tags.map((tag, i) => (
                <Radar key={tag} name={tag} dataKey={tag}
                  stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15}
                />
              ))}
              <Legend wrapperStyle={{ color: TEXT, fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Экономика */}
        <div className="chart-card">
          <div className="chart-title">ВВП (£)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={econData}>
              <XAxis dataKey="metric" tick={{ fill: TEXT, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmt} tick={{ fill: TEXTDIM, fontSize: 11 }} axisLine={false} tickLine={false} width={45} />
              <Tooltip formatter={(v: any) => fmt(v) + " £"} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: TEXT, fontSize: 12 }} />
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