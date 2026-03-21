import { useState } from "react"
import { CountryStats } from "../types"
import {
  BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"

interface Props { stats: CountryStats }

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
const BG     = "var(--bg)"
const FONT_FAMILY = "var(--font-main)"



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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "#0a0705", border: `1px solid ${GOLD}55`, padding: "10px 14px", fontSize: 12, fontFamily: FONT_FAMILY }}>
      <div style={{ color: GOLD, marginBottom: 4, fontStyle: "italic" }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: TEXT }}>{p.name}: <b style={{ color: "#e8d5a8" }}>{fmt(p.value)}</b></div>
      ))}
    </div>
  )
}

function TabBtn({ id, label, active, onClick }: { id: string; label: string; active: boolean; onClick: (id: string) => void }) {
  return (
    <button onClick={() => onClick(id)} style={{
      background: "transparent",
      border: "none",
      borderBottom: active ? `2px solid ${GOLD}` : "2px solid transparent",
      color: active ? GOLD : TEXTDIM,
      padding: "10px 16px", cursor: "pointer",
      fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" as const,
      fontFamily: "Georgia, serif", transition: "all 0.2s", whiteSpace: "nowrap" as const,
    }}>
      {label}
    </button>
  )
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${BORDER2}` }}>
      <span style={{ color: TEXTDIM, fontSize: 12 }}>{label}</span>
      <span style={{ color: color || TEXT, fontSize: 12, fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  const c = color || GOLD
  return (
    <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderLeft: `2px solid ${c}`, padding: "12px 14px" }}>
      <div style={{ color: TEXTDIM, fontSize: 9, letterSpacing: 1.5, marginBottom: 5, textTransform: "uppercase" as const }}>{label}</div>
      <div style={{ color: "#e8d5a8", fontSize: 20, fontFamily: FONT_FAMILY }}>{value}</div>
      {sub && <div style={{ color: c, fontSize: 10, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function ProgressRow({ label, value, max, color, valLabel }: { label: string; value: number; max: number; color: string; valLabel: string }) {
  const pct = Math.min(Number(value) / max * 100, 100)
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: TEXTDIM, fontSize: 11 }}>{label}</span>
        <span style={{ color, fontSize: 11, fontWeight: 500 }}>{valLabel}</span>
      </div>
      <div style={{ height: 5, background: "#070503", border: `1px solid ${BORDER2}`, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, transition: "width 0.8s" }} />
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div style={{ color: TEXTDIM, fontSize: 9, letterSpacing: 2, marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid ${BORDER2}`, textTransform: "uppercase" as const }}>
      <span style={{ color: GOLD2, marginRight: 6 }}>◆</span>{children}<span style={{ color: GOLD2, marginLeft: 6 }}>◆</span>
    </div>
  )
}

export function StatsPanel({ stats }: Props) {
  const [tab, setTab] = useState("overview")
  const indLevel = Number(stats.industrial_level) || 0
  const gdp = Number(stats.gdp) || 0
  const gini = Number(stats.gini) || 0

  const radarData = [
    { metric: "ВВП/душу",  value: Math.min(Number(stats.gdp_per_cap) * 5, 100) },
    { metric: "Грамот.",   value: Number(stats.literacy) },
    { metric: "Индустр.",  value: indLevel * 100 },
    { metric: "Армия",     value: Math.min(Number(stats.army_innov) * 5, 100) },
    { metric: "Флот",      value: Math.min(Number(stats.naval_innov) * 3.5, 100) },
    { metric: "Рентаб.",   value: Math.max(0, Math.min(Number(stats.rentability), 100)) },
  ]

  const structureData = [
    { name: "Промышленность", value: Math.round(gdp * indLevel) },
    { name: "С/х и ремесло",  value: Math.round(gdp * (1 - indLevel)) },
  ]

  const employData = [
    { name: "Фабрики", value: Number(stats.fabric_employee) },
    { name: "Добыча",  value: Number(stats.all_employemenent) - Number(stats.fabric_employee) },
  ]

  const overviewEconData = [
    { name: "Промышленность",        value: Math.round(gdp * indLevel) },
    { name: "С/х и ремесло",          value: Math.round(gdp * (1 - indLevel)) },
    { name: "Валовый выпуск",         value: Number(stats.supply) },
    { name: "Промежут. потребление",  value: Number(stats.consuption) },
  ]

  const headerBg = "linear-gradient(90deg, BG 0%, BG 50%, BG 100%)"
  const cardStyle = { background: PANEL, border: `1px solid ${BORDER}`, padding: "16px 18px" }

  return (
    <div style={{ background: BG, minHeight: "100%", color: TEXT, fontFamily: FONT_FAMILY }}>

      {/* HEADER */}
      <div style={{ background: headerBg, borderBottom: `1px solid ${BORDER}`, padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 2, height: 40, background: GOLD }} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                <img
                  src={`/flags/${stats.tag}.png`}
                  alt={stats.tag}
                  style={{ height: 28, border: `1px solid ${BORDER}` }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                />
                <h2 style={{ margin: 0, fontFamily: FONT_FAMILY, fontSize: 22, color: "#e8d5a8", letterSpacing: 4, fontStyle: "italic", fontWeight: 400 }}>{stats.tag}</h2>
                <span style={{ background: BG, color: GOLD, fontSize: 10, padding: "2px 8px", border: `1px solid ${GOLD}44`, letterSpacing: 1 }}>{stats.goverement + " -- " + stats.most_popular_party || "undefined"}</span>
              </div>
              <div style={{ color: TEXTDIM, fontSize: 9, letterSpacing: 2 }}>VICTORIA II · {stats.country_size} РЕГИОНОВ</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, auto)", gap: 24, textAlign: "center" }}>
            {[
              { label: "ВВП",         value: fmt(stats.gdp) + " £",    color: GOLD },
              { label: "Население",   value: fmt(stats.population),     color: BLUE },
              { label: "Грамотность", value: fix(stats.literacy) + "%", color: GREEN },
              { label: "Джини",       value: fix(stats.gini, 3),        color: gini > 0.6 ? RED : ORANGE },
            ].map(k => (
              <div key={k.label}>
                <div style={{ color: k.color, fontSize: 17, fontFamily: FONT_FAMILY }}>{k.value}</div>
                <div style={{ color: TEXTDIM, fontSize: 9, letterSpacing: 2, marginTop: 2 }}>{k.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", paddingLeft: 18, borderTop: `1px solid ${BORDER2}` }}>
          {[
            { id: "overview",  label: "Обзор" },
            { id: "economy",   label: "Экономика" },
            { id: "industry",  label: "Промышленность" },
            { id: "finance",   label: "Финансы" },
            { id: "military",  label: "Военное" },
            { id: "social",    label: "Социальное" },
          ].map(t => <TabBtn key={t.id} {...t} active={tab === t.id} onClick={setTab} />)}
        </div>
      </div>

      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              <KpiCard label="ВВП"              value={fmt(stats.gdp) + " £"}            sub={fmt(stats.gdp_per_reg) + " £/регион"}         color={GOLD} />
              <KpiCard label="Население"        value={fmt(stats.population)}             sub={fmt(stats.population_per_reg) + " на регион"} color={BLUE} />
              <KpiCard label="ВВП на душу нас." value={fix(stats.gdp_per_cap, 3) + " £"} sub={"Скор. обращения " + fix(Number(stats.money_activity) * 100)} color={GREEN} />
              <KpiCard label="Грамотность"      value={fix(stats.literacy) + "%"}         sub={"Джини " + fix(stats.gini, 3)}                color={stats.literacy > 60 ? GREEN : ORANGE} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={cardStyle}>
                <SectionTitle>Комплексная оценка</SectionTitle>
                <ResponsiveContainer width="100%" height={175}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={BORDER2} />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: TEXTDIM, fontSize: 10 }} />
                    <Radar dataKey="value" stroke={GOLD} fill={GOLD} fillOpacity={0.15} strokeWidth={1.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div style={cardStyle}>
                <SectionTitle>Ключевые показатели</SectionTitle>
                <StatRow label="Доля промышленности"           value={fix(indLevel * 100) + "%"}    color={BLUE} />
                <StatRow label="Рентабельность"                 value={fix(stats.rentability) + "%"} color={Number(stats.rentability) < 0 ? RED : GREEN} />
                <StatRow label="Армия / Флот"                   value={`${stats.army_innov} / 40 · ${stats.naval_innov} / 40`} />
                <StatRow label="Золотодобыча"                   value={fmt(stats.gold_income) + " £"} color={GOLD} />
                <StatRow label="Доля субсидируемых предприятий"    value={fix(stats.subside_pct) + "%"} color={Number(stats.subside_pct) > 30 ? RED : ORANGE} />
                <StatRow label="Безработица на фабриках"       value={fix(stats.fabric_unemployement) + "%"} color={Number(stats.fabric_unemployement) > 20 ? RED : GREEN} />
                <StatRow label="Средняя з/п рабочего"          value={fix(stats.fabric_worker_salary, 3) + " £"} />
              </div>
            </div>

            <div style={cardStyle}>
              <SectionTitle>Структура экономики</SectionTitle>
              <ResponsiveContainer width="100%" height={175}>
                <BarChart data={overviewEconData} barSize={55} margin={{ top: 20, right: 40, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={BORDER2} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: TEXTDIM, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmt} tick={{ fill: TEXTDIM, fontSize: 10 }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="£" fill={GOLD2}
                    label={{ position: "top", formatter: fmt, fill: TEXTDIM, fontSize: 12 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* ── ECONOMY ── */}
        {tab === "economy" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              <KpiCard label="ВВП"            value={fmt(stats.gdp) + " £"}        sub={fmt(stats.gdp_per_reg) + " £/регион"} color={GOLD} />
              <KpiCard label="Валовый выпуск"  value={fmt(stats.supply) + " £"}    color={BLUE} />
              <KpiCard label="Потребление"     value={fmt(stats.consuption) + " £"} color={ORANGE} />
              <KpiCard label="ВВП на душу нас." value={fix(stats.gdp_per_cap, 3) + " £"} color={GREEN} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <div style={cardStyle}>
                <SectionTitle>Структура ВВП</SectionTitle>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={structureData} barSize={75} margin={{ top: 22, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={BORDER2} strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fill: TEXTDIM, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmt} tick={{ fill: TEXTDIM, fontSize: 10 }} axisLine={false} tickLine={false} width={48} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="ВВП £" fill={GOLD2}
                      label={{ position: "top", formatter: fmt, fill: TEXTDIM, fontSize: 11 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={cardStyle}>
                <SectionTitle>Детали</SectionTitle>
                <StatRow label="ВВП на регион"       value={fmt(stats.gdp_per_reg) + " £"} />
                <StatRow label="Диверсификация"      value={fix(stats.diversification, 3)} />
                <StatRow label="Нас. на регион"      value={fmt(stats.population_per_reg)} />
                <StatRow label="Скор. обращения"     value={fix(Number(stats.money_activity) * 100, 2)} />
                <StatRow label="Золотодобыча"        value={fmt(stats.gold_income) + " £"} color={GOLD} />
                <StatRow label="Доля промышленности" value={fix(indLevel * 100) + "%"}     color={BLUE} />
                <StatRow label="Регионов"            value={String(stats.country_size)} />
              </div>
            </div>
          </>
        )}

        {/* ── INDUSTRY ── */}
        {tab === "industry" && (
          <div style={{
            position: "relative",
          }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(10,7,5,0.93)", pointerEvents: "none", zIndex: 0 }} />
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                <KpiCard label="Занятость на фабриках"          value={fmt(stats.fabric_employee)}             color={BLUE} />
                <KpiCard label="Безработица на фабриках"         value={fix(stats.fabric_unemployement) + "%"} sub={Number(stats.fabric_unemployement) > 20 ? "⚠ высокая" : "норма"} color={Number(stats.fabric_unemployement) > 20 ? RED : GREEN} />
                <KpiCard label="Средняя рентабельность"          value={fix(stats.rentability) + "%"}          sub={Number(stats.rentability) > 20 ? "здоровая" : "⚠ низкая"} color={Number(stats.rentability) > 20 ? GREEN : RED} />
                <KpiCard label="Доля субсидируемых предприятий"     value={fix(stats.subside_pct) + "%"}          sub={Number(stats.subside_pct) > 20 ? "⚠ зависимость от гос. средств" : "норма"} color={Number(stats.subside_pct) > 20 ? RED : GREEN} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={cardStyle}>
                  <SectionTitle>Занятость по секторам</SectionTitle>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={employData} layout="vertical">
                      <CartesianGrid stroke={BORDER2} strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={fmt} tick={{ fill: TEXTDIM, fontSize: 10 }} stroke={BORDER2} />
                      <YAxis type="category" dataKey="name" tick={{ fill: TEXT, fontSize: 11 }} stroke={BORDER2} width={65} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Занято" fill={GOLD2}
                        label={{ position: "right", formatter: fmt, fill: TEXTDIM, fontSize: 10 }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={cardStyle}>
                  <SectionTitle>Показатели</SectionTitle>
                  <ProgressRow label="Безработица на фабриках"        value={Number(stats.fabric_unemployement)} max={100} color={Number(stats.fabric_unemployement) > 20 ? RED : BLUE}   valLabel={fix(stats.fabric_unemployement) + "%"} />
                  <ProgressRow label="Безработица на добыче"          value={Number(stats.rgo_employement)}      max={100} color={Number(stats.rgo_employement) > 30 ? RED : GREEN}        valLabel={fix(stats.rgo_employement) + "%"} />
                  <ProgressRow label="Доля субсидируемых предприятий"    value={Number(stats.subside_pct)}          max={100} color={Number(stats.subside_pct) > 20 ? RED : BLUE}             valLabel={fix(stats.subside_pct) + "%"} />
                  <div style={{ marginTop: 10 }}>
                    <StatRow label="Диверсификация"            value={fix(stats.diversification, 3)} />
                    <StatRow label="Общая занятость"           value={fmt(stats.all_employemenent)} />
                    <StatRow label="Свободных мест"            value={fmt(stats.all_free_work_places)} />
                    <StatRow label="Средняя з/п рабочего"      value={fix(stats.fabric_worker_salary, 3) + " £"} />
                    <StatRow label="Средний доход капиталиста"      value={fmt(stats.capitalist_salary) + " £"} />
                    <StatRow label="Валовый выпуск"            value={fmt(stats.supply) + " £"} />
                    <StatRow label="Потребление"               value={fmt(stats.consuption) + " £"} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── FINANCE ── */}
        {tab === "finance" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              <KpiCard label="Казна"          value={fmt(stats.country_savings) + " £"} color={GOLD} />
              <KpiCard label="Банк"           value={fmt(stats.bank_savings) + " £"}    color={BLUE} />
              <KpiCard label="Денежная масса" value={fmt(stats.money_mass) + " £"}      color={GREEN} />
              <KpiCard label="Золотодобыча"   value={fmt(stats.gold_income) + " £"}     color={ORANGE} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={cardStyle}>
                <SectionTitle>Структура денежной массы</SectionTitle>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={[
                    { name: "Казна",  value: Number(stats.country_savings) },
                    { name: "Банк",   value: Number(stats.bank_savings) },
                    { name: "Население",  value: Number(stats.population_savings) },
                    { name: "Всего",  value: Number(stats.money_mass) },
                  ]} barSize={50} margin={{ top: 22, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={BORDER2} strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fill: TEXTDIM, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmt} tick={{ fill: TEXTDIM, fontSize: 10 }} axisLine={false} tickLine={false} width={48} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="£" fill={GOLD2}
                      label={{ position: "top", formatter: fmt, fill: TEXTDIM, fontSize: 11 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={cardStyle}>
                <SectionTitle>Финансовые показатели</SectionTitle>
                <StatRow label="Казна"                value={fmt(stats.country_savings) + " £"}   color={GOLD} />
                <StatRow label="Запасы банка"         value={fmt(stats.bank_savings) + " £"}      color={BLUE} />
                <StatRow label="Запасы населения"     value={fmt(stats.population_savings) + " £"} color={BLUE} />
                <StatRow label="Общая денежная масса" value={fmt(stats.money_mass) + " £"}        color={GREEN} />
                <StatRow label="Золотодобыча"         value={fmt(stats.gold_income) + " £"}       color={ORANGE} />
                <StatRow label="Скор. обращения"      value={fix(Number(stats.money_activity) * 100, 2)} />
                <div style={{ marginTop: 12 }}>
                  <ProgressRow label="Доля казны"    value={Number(stats.country_savings)}    max={Number(stats.money_mass) || 1} color={GOLD}  valLabel={fix(Number(stats.country_savings)    / (Number(stats.money_mass) || 1) * 100) + "%"} />
                  <ProgressRow label="Доля гос. банка"    value={Number(stats.bank_savings)}       max={Number(stats.money_mass) || 1} color={BLUE}  valLabel={fix(Number(stats.bank_savings)       / (Number(stats.money_mass) || 1) * 100) + "%"} />
                  <ProgressRow label="Доля накоплений населения"   value={Number(stats.population_savings)} max={Number(stats.money_mass) || 1} color={GREEN} valLabel={fix(Number(stats.population_savings) / (Number(stats.money_mass) || 1) * 100) + "%"} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── MILITARY ── */}
        {tab === "military" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              <KpiCard label="Инно. армии"    value={stats.army_innov + " / 40"}       color={ORANGE} />
              <KpiCard label="Инно. флота"    value={stats.naval_innov + " / 40"}      color={BLUE} />
              <KpiCard label="Наземный бюджет" value={fmt(stats.military_budget) + " £"} color={RED} />
              <KpiCard label="Морской бюджет"  value={fmt(stats.naval_budget) + " £"}   color={BLUE} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12}}>
              <div style={cardStyle}>
                <SectionTitle>Технологический уровень</SectionTitle>
                <ProgressRow label="Армейские технологии" value={Number(stats.army_innov)}  max={40} color={ORANGE} valLabel={`${stats.army_innov} / 40`} />
                <ProgressRow label="Морские технологии"   value={Number(stats.naval_innov)} max={40} color={BLUE}   valLabel={`${stats.naval_innov} / 40`} />
                <div style={{ marginTop: 20 }}>
                  <StatRow label="Наземный бюджет" value={fmt(stats.military_budget) + " £"} color={ORANGE} />
                  <StatRow label="Морской бюджет"  value={fmt(stats.naval_budget) + " £"}    color={BLUE} />
                  <StatRow label="Золотодобыча"    value={fmt(stats.gold_income) + " £"}     color={GOLD} />
                </div>
              </div>

              <div style={cardStyle}>
                <SectionTitle>Радар мощи</SectionTitle>
                <ResponsiveContainer width="100%" height={210}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={BORDER2} />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: TEXTDIM, fontSize: 12  }} />
                    <Radar dataKey="value" stroke={GOLD} fill={GOLD} fillOpacity={0.15} strokeWidth={1.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* ── SOCIAL ── */}
        {tab === "social" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              <KpiCard label="Грамотность"      value={fix(stats.literacy) + "%"}                color={GREEN} />
              <KpiCard label="Индекс Джини"     value={fix(stats.gini, 3)}                       color={gini > 0.6 ? RED : ORANGE} />
              <KpiCard label="З/п рабочего"     value={fix(stats.fabric_worker_salary, 3) + " £"} color={BLUE} />
              <KpiCard label="Доход капит."     value={fmt(stats.capitalist_salary) + " £"}      color={GOLD} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={cardStyle}>
                <SectionTitle>Неравенство</SectionTitle>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ color: TEXTDIM, fontSize: 11, fontStyle: "italic" }}>Индекс Джини</span>
                    <span style={{ color: gini > 0.6 ? RED : ORANGE, fontSize: 13 }}>{fix(stats.gini, 3)}</span>
                  </div>
                  <div style={{ height: 8, background: "#070503", border: `1px solid ${BORDER2}`, overflow: "hidden" }}>
                    <div style={{
                      width: `${gini * 100}%`, height: "100%",
                      background: `linear-gradient(90deg, ${GREEN}, ${ORANGE}, ${RED})`,
                      transition: "width 0.8s"
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                    <span style={{ color: BORDER, fontSize: 10, fontStyle: "italic" }}>равенство</span>
                    <span style={{ color: BORDER, fontSize: 10, fontStyle: "italic" }}>неравенство</span>
                  </div>
                </div>
                <ProgressRow label="Грамотность"         value={Number(stats.literacy)} max={100} color={GREEN}  valLabel={fix(stats.literacy) + "%"} />
                <ProgressRow label="Доля промышленности" value={indLevel * 100}          max={100} color={BLUE}   valLabel={fix(indLevel * 100) + "%"} />
                <ProgressRow label="Безработица фабрик"  value={Number(stats.fabric_unemployement)} max={100} color={Number(stats.fabric_unemployement) > 20 ? RED : ORANGE} valLabel={fix(stats.fabric_unemployement) + "%"} />
              </div>

              <div style={cardStyle}>
                <SectionTitle>Социальные показатели</SectionTitle>
                <StatRow label="Грамотность"          value={fix(stats.literacy) + "%"}             color={GREEN} />
                <StatRow label="Индекс Джини"         value={fix(stats.gini, 3)}                    color={gini > 0.6 ? RED : ORANGE} />
                <StatRow label="З/п рабочего"         value={fix(stats.fabric_worker_salary, 3) + " £"} />
                <StatRow label="Доход капиталиста"    value={fmt(stats.capitalist_salary) + " £"}   color={GOLD} />
                <StatRow label="Население"            value={fmt(stats.population)} />
                <StatRow label="Нас. на регион"       value={fmt(stats.population_per_reg)} />
                <StatRow label="ВВП на регион"        value={fmt(stats.gdp_per_reg) + " £"} />
                <StatRow label="ВВП на душу нас."     value={fix(stats.gdp_per_cap, 3) + " £"} />
                <StatRow label="Скор. обращения"      value={fix(Number(stats.money_activity) * 100, 2)} />
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}