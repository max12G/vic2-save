import { CountryStats, CountryEntry } from "../types"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts"
import { useState, ReactNode, useEffect } from "react"

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

const API = "http://localhost:8000"

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(API + url)
  if (!res.ok) throw new Error("Ошибка сервера")
  return res.json()
}

export interface TimeData {
  [date: string]: CountryStats | number | undefined
  gdp_progression?: number
  population_progression?: number
}

interface ProgressionResult {
  "start-date": string
  date_to_gdp_compare: string
  date_to_pop_compare: string
}

interface Props {
  timeData: TimeData | null
  selectedTag: string
  loading: boolean
  countries: CountryEntry[]
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

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div style={{ 
      color: TEXTDIM, 
      fontSize: 9, 
      letterSpacing: 2, 
      marginBottom: 12, 
      paddingBottom: 6, 
      borderBottom: `1px solid ${BORDER2}`, 
      textTransform: "uppercase" as const 
    }}>
      <span style={{ color: GOLD2, marginRight: 6 }}>◆</span>
      {children}
      <span style={{ color: GOLD2, marginLeft: 6 }}>◆</span>
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
  { key: "gdp",                 label: "ВВП",                 format: fmt,                                     higherIsBetter: true },
  { key: "population",          label: "Население",           format: fmt,                                     higherIsBetter: true },
  { key: "gdp_per_cap",         label: "ВВП на душу нас.",    format: (v: any) => fix(v, 3),                  higherIsBetter: true },
  { key: "literacy",            label: "Грамотность",         format: (v: any) => fix(v) + "%",               higherIsBetter: true },
  { key: "industrial_level",    label: "Доля промышленности", format: (v: any) => fix(Number(v) * 100) + "%", higherIsBetter: true },
  { key: "gini",                label: "Индекс Джини",        format: (v: any) => fix(v, 3),                  higherIsBetter: false },
  { key: "fabric_unemployement",label: "Безработица фабрик",  format: (v: any) => fix(v) + "%",               higherIsBetter: false },
  { key: "rentability",         label: "Рентабельность",      format: (v: any) => fix(v) + "%",               higherIsBetter: true },
  { key: "army_innov",          label: "Армейские техн.",     format: (v: any) => v + " / 40",                higherIsBetter: true },
  { key: "naval_innov",         label: "Морские техн.",       format: (v: any) => v + " / 40",                higherIsBetter: true },
  { key: "military_budget",     label: "Наземный бюджет",     format: fmt,                                     higherIsBetter: true },
  { key: "naval_budget",        label: "Морской бюджет",      format: fmt,                                     higherIsBetter: true },
  { key: "gold_income",         label: "Золотодобыча",        format: fmt,                                     higherIsBetter: true },
  { key: "country_savings",     label: "Казна",               format: fmt,                                     higherIsBetter: true },
  { key: "money_mass",          label: "Денежная масса",      format: fmt,                                     higherIsBetter: true },
]

const CHART_METRICS = [
  { key: "gdp",             label: "ВВП",          color: "#C9A84C" },
  { key: "population",      label: "Население",     color: "#4A7A9A" },
  { key: "literacy",        label: "Грамотность",   color: "#7A9A4A" },
  { key: "military_budget", label: "Воен. бюджет", color: "#A83A2A" },
]

export function TimeView({ timeData, selectedTag, loading, countries }: Props) {
  const [tagB, setTagB]           = useState("")
  const [progression, setProgression] = useState<ProgressionResult | null>(null)
  const [progLoading, setProgLoading] = useState(false)
  const [progError, setProgError] = useState("")

  useEffect(() => {
    setProgression(null);
    setProgError("");
  }, [selectedTag, tagB]);

  const cardStyle = { background: PANEL, border: `1px solid ${BORDER}`, padding: "16px 18px" }

  const dates = timeData
    ? Object.keys(timeData)
        .filter(key => key.includes('.') && !isNaN(parseFloat(key)))
        .sort((a, b) => {
          const pa = a.split('.').map(Number)
          const pb = b.split('.').map(Number)
          for (let i = 0; i < 3; i++) {
            if (pa[i] !== pb[i]) return pa[i] - pb[i]
          }
          return 0
        })
    : []

  const s1 = dates[0] ? (timeData![dates[0]] as CountryStats) : null
  const s2 = dates[1] ? (timeData![dates[1]] as CountryStats) : null

  async function handleProgression() {
    if (!tagB || !selectedTag) return
    setProgLoading(true)
    setProgError("")
    setProgression(null)
    try {
      const data = await apiFetch<ProgressionResult>(`/time_compare/${selectedTag}/progression/${tagB}`)
      setProgression(data)
    } catch (e: any) {
      setProgError(e.message)
    }
    setProgLoading(false)
  }

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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: RED, fontStyle: "italic", fontSize: 14 }}>
      Нет данных — проверь что оба файла загружены корректно
    </div>
  )

  function progressionLabel(val: string) {
    if (val === "already bigger") return { text: "Уже больше", color: GREEN }
    if (val === "never")          return { text: "Никогда", color: RED }
    return { text: val, color: GOLD }
  }

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
          { label: "ВВП",        v1: Number(s1.gdp),        v2: Number(s2.gdp),       f: fmt,                       color: GOLD,   inv: false },
          { label: "Население",  v1: Number(s1.population), v2: Number(s2.population),f: fmt,                       color: BLUE,   inv: false },
          { label: "Грамотность",v1: Number(s1.literacy),   v2: Number(s2.literacy),  f: (v: any) => fix(v) + "%",  color: GREEN,  inv: false },
          { label: "Джини",      v1: Number(s1.gini),       v2: Number(s2.gini),      f: (v: any) => fix(v, 3),     color: ORANGE, inv: true  },
        ].map(({ label, v1, v2, f, color, inv }) => {
          const diff = v2 - v1
          const pct = v1 !== 0 ? (diff / Math.abs(v1) * 100) : 0
          const isPos = inv ? diff < 0 : diff > 0
          return (
            <div key={label} style={{ background: PANEL, border: `1px solid ${BORDER}`, borderLeft: `2px solid ${color}`, padding: "12px 14px" }}>
              <div style={{ color: TEXTDIM, fontSize: 9, letterSpacing: 1.5, marginBottom: 5, textTransform: "uppercase" as const }}>{label}</div>
              <div style={{ color: "#e8d5a8", fontSize: 18, fontFamily: FONT_FAMILY }}>{f(v2)}</div>
              <div style={{ color: isPos ? GREEN : RED, fontSize: 12, marginTop: 3 }}>
                {diff > 0 ? "↑" : "↓"} {Math.abs(pct).toFixed(1)}% от {f(v1)}
              </div>
            </div>
          )
        })}
      </div>

      {/* Рост */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${GOLD}`, padding: "14px" }}>
          <div style={{ color: TEXTDIM, fontSize: 9, letterSpacing: 1.5, marginBottom: 4 }}>СРЕДНЕГОДОВОЙ РОСТ ВВП</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ color: GOLD, fontSize: 24, fontFamily: FONT_FAMILY }}>{fix(timeData?.gdp_progression, 2)}%</span>
            <span style={{ color: GREEN, fontSize: 11 }}>В ГОД</span>
          </div>
        </div>
        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${BLUE}`, padding: "14px" }}>
          <div style={{ color: TEXTDIM, fontSize: 9, letterSpacing: 1.5, marginBottom: 4 }}>ПРИРОСТ НАСЕЛЕНИЯ</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ color: BLUE, fontSize: 24, fontFamily: FONT_FAMILY }}>{fix(timeData?.population_progression, 2)}%</span>
            <span style={{ color: GREEN, fontSize: 11 }}>В ГОД</span>
          </div>
        </div>
      </div>

      {/* Сравнение со страной B */}
      <div style={{ ...cardStyle }}>
        <SectionTitle>Когда {selectedTag} обгонит...</SectionTitle>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <select
            value={tagB}
            onChange={e => { setTagB(e.target.value); setProgression(null) }}
            style={{ flex: 1, padding: "6px 8px", background: "var(--bg3)", border: `1px solid ${BORDER}`, color: TEXT, fontSize: 12, fontFamily: "Georgia, serif", outline: "none" }}
          >
            <option value="">Выбери страну для сравнения...</option>
            {countries.filter(c => c.tag !== selectedTag).map(c => (
              <option key={c.tag} value={c.tag}>{c.tag}</option>
            ))}
          </select>
          <button
            onClick={handleProgression}
            disabled={!tagB || progLoading}
            style={{ padding: "6px 16px", background: "var(--bg)", color: GOLD, border: `1px solid ${BORDER}`, fontSize: 11, fontFamily: "Georgia, serif", cursor: "pointer" }}
          >
            {progLoading ? "..." : "Рассчитать"}
          </button>
        </div>

        {progError && <div style={{ color: RED, fontSize: 12, fontStyle: "italic" }}>{progError}</div>}

        {progression && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: `По ВВП обгонит ${tagB}`, val: progression.date_to_gdp_compare },
              { label: `По населению обгонит ${tagB}`, val: progression.date_to_pop_compare },
            ].map(({ label, val }) => {
              const { text, color } = progressionLabel(val)
              return (
                <div key={label} style={{ background: "var(--bg)", border: `1px solid ${BORDER}`, borderLeft: `2px solid ${color}`, padding: "12px 14px" }}>
                  <div style={{ color: TEXTDIM, fontSize: 9, letterSpacing: 1.5, marginBottom: 6, textTransform: "uppercase" as const }}>{label}</div>
                  <div style={{ color: text === "Уже больше" || text === "Никогда" ? color : "#e8d5a8", fontSize: 18, fontFamily: FONT_FAMILY }}>
                    {text}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Графики */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {CHART_METRICS.map(({ key, label, color }) => {
          const chartData = dates.map(date => {
            const s = timeData[date] as CountryStats
            return { date, value: Number(s[key as keyof CountryStats]) || 0 }
          })
          return (
            <div key={key} style={cardStyle}>
              <SectionTitle>{label}</SectionTitle>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartData}>
                  <CartesianGrid stroke={BORDER2} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: TEXTDIM, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmt} tick={{ fill: TEXTDIM, fontSize: 10 }} axisLine={false} tickLine={false} width={45} />
                  <Tooltip contentStyle={{ background: "var(--bg)", border: `1px solid ${BORDER}`, color: TEXT, fontFamily: FONT_FAMILY, fontSize: 12 }} formatter={(v: any) => [fmt(v), label]} />
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