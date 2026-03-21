import { CountryStats } from "../types"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts"

const GOLD   = "var(--gold)"
const GOLD2  = "var(--gold-dim)"
const GREEN  = "var(--green)"
const RED    = "var(--red)"
const BLUE   = "var(--blue)"
const ORANGE = "var(--orange)"
const PANEL  = "var(--panel)"
const BORDER = "var(--border)"
const BORDER2 = "var(--border2)"
const TEXT   = "var(--text)"
const TEXTDIM = "var(--text-dim)"
const FONT_FAMILY = "var(--font-main)"
const FONT_STYLE = "var(--font-style)"

export interface TimeData {
  [date: string]: CountryStats
}

interface Props {
  timeData: TimeData | null
  selectedTag: string
  loading: boolean
}

function fmt(n: any): string {
  const v = Number(n)
  if (isNaN(v)) return "—"
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M"
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K"
  return v.toFixed(0)
}
function fix(n: any, d = 1): string {
  const v = Number(n)
  return isNaN(v) ? "—" : v.toFixed(d)
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div style={{ color: TEXTDIM, fontSize: 9, letterSpacing: 2, marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid ${BORDER2}`, textTransform: "uppercase" as const }}>
      <span style={{ color: GOLD2, marginRight: 6 }}>◆</span>{children}<span style={{ color: GOLD2, marginLeft: 6 }}>◆</span>
    </div>
  )
}

function Delta({ label, v1, v2, format = fmt, higherIsBetter = true }: {
  label: string; v1: number; v2: number
  format?: (n: any) => string; higherIsBetter?: boolean
}) {
  const diff = v2 - v1
  const pct = v1 !== 0 ? (diff / Math.abs(v1) * 100) : 0
  const positive = higherIsBetter ? diff > 0 : diff < 0
  const color = diff === 0 ? TEXT : positive ? GREEN : RED
  const arrow = diff > 0 ? "↑" : diff < 0 ? "↓" : "—"
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${BORDER2}` }}>
      <span style={{ color: TEXTDIM, fontSize: 12 }}>{label}</span>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ color: TEXT, fontSize: 12 }}>{format(v1)}</span>
        <span style={{ color: TEXTDIM, fontSize: 10 }}>→</span>
        <span style={{ color: TEXT, fontSize: 12 }}>{format(v2)}</span>
        <span style={{ color, fontSize: 11, fontWeight: 500, minWidth: 60, textAlign: "right" }}>
          {arrow} {Math.abs(pct).toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

const METRICS = [
  { key: "gdp",                 label: "ВВП",                 format: fmt,                                       higherIsBetter: true },
  { key: "population",          label: "Население",           format: fmt,                                       higherIsBetter: true },
  { key: "gdp_per_cap",         label: "ВВП на душу нас.",    format: (v: any) => fix(v, 3),                    higherIsBetter: true },
  { key: "literacy",            label: "Грамотность",         format: (v: any) => fix(v) + "%",                 higherIsBetter: true },
  { key: "industrial_level",    label: "Доля промышленности", format: (v: any) => fix(Number(v) * 100) + "%",   higherIsBetter: true },
  { key: "gini",                label: "Индекс Джини",        format: (v: any) => fix(v, 3),                    higherIsBetter: false },
  { key: "fabric_unemployement",label: "Безработица фабрик",  format: (v: any) => fix(v) + "%",                 higherIsBetter: false },
  { key: "rentability",         label: "Рентабельность",      format: (v: any) => fix(v) + "%",                 higherIsBetter: true },
  { key: "army_innov",          label: "Армейские техн.",     format: (v: any) => v + " / 40",                  higherIsBetter: true },
  { key: "naval_innov",         label: "Морские техн.",       format: (v: any) => v + " / 40",                  higherIsBetter: true },
  { key: "military_budget",     label: "Наземный бюджет",     format: fmt,                                       higherIsBetter: true },
  { key: "naval_budget",        label: "Морской бюджет",      format: fmt,                                       higherIsBetter: true },
  { key: "gold_income",         label: "Золотодобыча",        format: fmt,                                       higherIsBetter: true },
  { key: "country_savings",     label: "Казна",               format: fmt,                                       higherIsBetter: true },
  { key: "money_mass",          label: "Денежная масса",      format: fmt,                                       higherIsBetter: true },
]

const CHART_METRICS = [
  { key: "gdp",             label: "ВВП",           color: "#C9A84C" },
  { key: "population",      label: "Население",      color: "#4A7A9A" },
  { key: "literacy",        label: "Грамотность",    color: "#7A9A4A" },
  { key: "military_budget", label: "Воен. бюджет",  color: "#A83A2A" },
]

export function TimeView({ timeData, selectedTag, loading }: Props) {
  const cardStyle = { background: PANEL, border: `1px solid ${BORDER}`, padding: "16px 18px" }
  const dates = timeData ? Object.keys(timeData).sort() : []
  const s1 = dates[0] ? timeData![dates[0]] : null
  const s2 = dates[1] ? timeData![dates[1]] : null

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontStyle: "italic" }}>
      Загрузка данных...
    </div>
  )

  if (!selectedTag) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: TEXTDIM, fontStyle: "italic", fontSize: 14 }}>
      Выбери страну из списка слева
    </div>
  )

  if (!timeData || !s1 || !s2) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: TEXTDIM, fontStyle: "italic", fontSize: 14 }}>
      Загрузка...
    </div>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Заголовок */}
      <div style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={`/flags/${selectedTag}.png`} alt={selectedTag}
            style={{ height: 28, border: `1px solid ${BORDER}` }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
          <div>
            <div style={{ color: "#e8d5a8", fontSize: 20, fontFamily: FONT_FAMILY, fontStyle: FONT_STYLE, letterSpacing: 3 }}>{selectedTag}</div>
            <div style={{ color: TEXTDIM, fontSize: 9, letterSpacing: 2 }}>ДИНАМИКА ВО ВРЕМЕНИ</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 32, textAlign: "center" as const }}>
          <div>
            <div style={{ color: GOLD, fontSize: 16, fontFamily: FONT_FAMILY }}>{dates[0]}</div>
            <div style={{ color: TEXTDIM, fontSize: 9, letterSpacing: 1 }}>НАЧАЛО</div>
          </div>
          <div style={{ color: TEXTDIM, fontSize: 20 }}>→</div>
          <div>
            <div style={{ color: GOLD, fontSize: 16, fontFamily: FONT_FAMILY }}>{dates[1]}</div>
            <div style={{ color: TEXTDIM, fontSize: 9, letterSpacing: 1 }}>КОНЕЦ</div>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {[
          { label: "ВВП",        v1: Number(s1.gdp),        v2: Number(s2.gdp),        f: fmt,                        color: GOLD,   inv: false },
          { label: "Население",  v1: Number(s1.population), v2: Number(s2.population), f: fmt,                        color: BLUE,   inv: false },
          { label: "Грамотность",v1: Number(s1.literacy),   v2: Number(s2.literacy),   f: (v: any) => fix(v) + "%",   color: GREEN,  inv: false },
          { label: "Джини",      v1: Number(s1.gini),       v2: Number(s2.gini),       f: (v: any) => fix(v, 3),      color: ORANGE, inv: true  },
        ].map(({ label, v1, v2, f, color, inv }) => {
          const diff = v2 - v1
          const pct = v1 !== 0 ? (diff / Math.abs(v1) * 100) : 0
          const isPos = inv ? diff < 0 : diff > 0
          return (
            <div key={label} style={{ background: PANEL, border: `1px solid ${BORDER}`, borderLeft: `2px solid ${color}`, padding: "12px 14px" }}>
              <div style={{ color: TEXTDIM, fontSize: 9, letterSpacing: 1.5, marginBottom: 5, textTransform: "uppercase" as const }}>{label}</div>
              <div style={{ color: "#e8d5a8", fontSize: 18, fontFamily: "Georgia, serif" }}>{f(v2)}</div>
              <div style={{ color: isPos ? GREEN : RED, fontSize: 10, marginTop: 3 }}>
                {diff > 0 ? "↑" : "↓"} {Math.abs(pct).toFixed(1)}% от {f(v1)}
              </div>
            </div>
          )
        })}
      </div>

      {/* Графики */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {CHART_METRICS.map(({ key, label, color }) => {
          const chartData = dates.map(date => ({
            date, value: Number(timeData[date][key as keyof CountryStats]) || 0,
          }))
          return (
            <div key={key} style={cardStyle}>
              <SectionTitle>{label}</SectionTitle>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartData}>
                  <CartesianGrid stroke={BORDER2} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: TEXTDIM, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmt} tick={{ fill: TEXTDIM, fontSize: 10 }} axisLine={false} tickLine={false} width={45} />
                  <Tooltip contentStyle={{ background: "var(--bg)", border: `1px solid ${BORDER}`, color: TEXT, fontFamily: "Georgia, serif", fontSize: 12 }} formatter={(v: any) => [fmt(v), label]} />
                  <Line dataKey="value" stroke={color} strokeWidth={2} dot={{ fill: color, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )
        })}
      </div>

      {/* Таблица */}
      <div style={cardStyle}>
        <SectionTitle>Все показатели</SectionTitle>
        {METRICS.map(({ key, label, format, higherIsBetter }) => (
          <Delta key={key} label={label}
            v1={Number(s1[key as keyof CountryStats]) || 0}
            v2={Number(s2[key as keyof CountryStats]) || 0}
            format={format} higherIsBetter={higherIsBetter}
          />
        ))}
      </div>
    </div>
  )
}