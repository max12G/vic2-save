import { useState } from "react"
import { CountryStats } from "../types"
import {
  BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"

interface Props { stats: CountryStats }

const GOLD = "#C9A84C"
const GREEN = "#2ECC71"
const RED = "#E74C3C"
const BLUE = "#4A90D9"
const ORANGE = "#F39C12"
const PANEL = "#0C0F1C"
const BORDER = "#161C30"

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
    <div style={{ background: "#0C0F1C", border: `1px solid ${GOLD}44`, padding: "10px 14px", borderRadius: 8, fontSize: 12, fontFamily: "monospace" }}>
      <div style={{ color: GOLD, fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || "#fff" }}>{p.name}: <b style={{ color: "#fff" }}>{fmt(p.value)}</b></div>
      ))}
    </div>
  )
}

function TabBtn({ id, label, active, onClick }: { id: string; label: string; active: boolean; onClick: (id: string) => void }) {
  return (
    <button onClick={() => onClick(id)} style={{
      background: active ? `${GOLD}12` : "transparent",
      border: "none",
      borderBottom: active ? `2px solid ${GOLD}` : "2px solid transparent",
      color: active ? GOLD : "#3A4A6A",
      padding: "10px 18px", cursor: "pointer",
      fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" as const,
      fontFamily: "monospace", transition: "all 0.2s", whiteSpace: "nowrap" as const,
    }}>
      {label}
    </button>
  )
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ color: "#3A4A6A", fontSize: 12 }}>{label}</span>
      <span style={{ color: color || "#C0CFF0", fontSize: 12, fontWeight: 700 }}>{value}</span>
    </div>
  )
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  const c = color || GOLD
  return (
    <div style={{ background: PANEL, border: `1px solid ${c}22`, borderLeft: `3px solid ${c}`, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ color: "#3A4A6A", fontSize: 10, letterSpacing: 1.5, marginBottom: 6, textTransform: "uppercase" as const }}>{label}</div>
      <div style={{ color: "#fff", fontSize: 22, fontWeight: 700, fontFamily: "monospace" }}>{value}</div>
      {sub && <div style={{ color: c, fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function ProgressRow({ label, value, max, color, valLabel }: { label: string; value: number; max: number; color: string; valLabel: string }) {
  const pct = Math.min(Number(value) / max * 100, 100)
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: "#3A4A6A", fontSize: 11 }}>{label}</span>
        <span style={{ color, fontSize: 11, fontWeight: 700 }}>{valLabel}</span>
      </div>
      <div style={{ height: 6, background: "#161C30", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.8s" }} />
      </div>
    </div>
  )
}

export function StatsPanel({ stats }: Props) {
  const [tab, setTab] = useState("overview")
  const indLevel = Number(stats.industrial_level) || 0
  const gdp = Number(stats.gdp) || 0
  const gini = Number(stats.gini) || 0

  const radarData = [
    { metric: "ВВП/кап",  value: Math.min(Number(stats.gdp_per_cap) * 5, 100) },
    { metric: "Грамот.",  value: Number(stats.literacy) },
    { metric: "Индустр.", value: indLevel * 100 },
    { metric: "Армия",    value: Math.min(Number(stats.army_innov) * 5, 100) },
    { metric: "Флот",     value: Math.min(Number(stats.naval_innov) * 3.5, 100) },
    { metric: "Рентаб.",  value: Math.max(0, Math.min(Number(stats.rentability), 100)) },
  ]

  const structureData = [
    { name: "Промышленность", value: Math.round(gdp * indLevel), fill: BLUE },
    { name: "С/х и ремесло",  value: Math.round(gdp * (1 - indLevel)), fill: GREEN },
  ]

  const employData = [
    { name: "Фабрики", value: Number(stats.fabric_employee) },
    { name: "Добыча",  value: Number(stats.all_employemenent) - Number(stats.fabric_employee) },
  ]

  return (
    <div style={{ background: "#070910", minHeight: "100%", color: "#C0CFF0", fontFamily: "monospace" }}>

      {/* HEADER */}
      <div style={{ background: "linear-gradient(90deg, #030508 0%, #080D1A 60%, #030508 100%)", borderBottom: `1px solid ${GOLD}44`, padding: "0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 3, height: 40, background: `linear-gradient(180deg, ${GREEN}, ${GOLD})`, borderRadius: 2 }} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                <h2 style={{ margin: 0, fontFamily: "monospace", fontSize: 24, color: "#fff", letterSpacing: 4 }}>{stats.tag}</h2>
                <span style={{ background: `${GOLD}22`, color: GOLD, fontSize: 10, padding: "2px 10px", borderRadius: 4, letterSpacing: 1 }}>{stats.goverement || "—"}</span>
              </div>
              <div style={{ color: "#2A3A5A", fontSize: 10, letterSpacing: 2 }}>VICTORIA II · {stats.country_size} РЕГИОНОВ</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, auto)", gap: 24, textAlign: "center" }}>
            {[
              { label: "ВВП",         value: fmt(stats.gdp) + " £",  color: GOLD },
              { label: "Население",   value: fmt(stats.population),   color: BLUE },
              { label: "Грамотность", value: fix(stats.literacy) + "%", color: GREEN },
              { label: "Джини",       value: fix(stats.gini, 3),      color: gini > 0.6 ? RED : ORANGE },
            ].map(k => (
              <div key={k.label}>
                <div style={{ color: k.color, fontSize: 18, fontWeight: 700 }}>{k.value}</div>
                <div style={{ color: "#2A3A5A", fontSize: 9, letterSpacing: 2 }}>{k.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", paddingLeft: 20 }}>
          {[
            { id: "overview",  label: "Обзор" },
            { id: "economy",   label: "Экономика" },
            { id: "industry",  label: "Промышленность" },
            { id: "military",  label: "Военное" },
            { id: "social",    label: "Социальное" },
          ].map(t => <TabBtn key={t.id} {...t} active={tab === t.id} onClick={setTab} />)}
        </div>
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <KpiCard label="ВВП"         value={fmt(stats.gdp) + " £"}          sub={fmt(stats.gdp_per_reg) + " £/регион"}          color={GOLD} />
              <KpiCard label="Население"   value={fmt(stats.population)}           sub={fmt(stats.population_per_reg) + " на регион"}  color={BLUE} />
              <KpiCard label="ВВП / капиту" value={fix(stats.gdp_per_cap, 3) + " £"} sub={"Скор. обращения " + fix(Number(stats.money_activity) * 100)} color={GREEN} />
              <KpiCard label="Грамотность" value={fix(stats.literacy) + "%"}       sub={"Джини " + fix(stats.gini, 3)}                 color={gini > 0.6 ? RED : ORANGE} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ color: GOLD, fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>СТРУКТУРА ВВП</div>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={structureData} barSize={44}>
                    <CartesianGrid stroke={BORDER} strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fill: "#3A4A6A", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmt} tick={{ fill: "#3A4A6A", fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} name="ВВП £"
                      fill={BLUE}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ color: GOLD, fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>КОМПЛЕКСНАЯ ОЦЕНКА</div>
                <ResponsiveContainer width="100%" height={170}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={BORDER} />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "#3A4A6A", fontSize: 10 }} />
                    <Radar dataKey="value" stroke={GOLD} fill={GOLD} fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ color: GOLD, fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>КЛЮЧЕВЫЕ ПОКАЗАТЕЛИ</div>
                <StatRow label="Валовый выпуск"      value={fmt(stats.supply) + " £"} />
                <StatRow label="Потребление"          value={fmt(stats.consuption) + " £"} />
                <StatRow label="Доля промышленности"  value={fix(indLevel * 100) + "%"}   color={BLUE} />
                <StatRow label="Рентабельность"       value={fix(stats.rentability) + "%"} color={Number(stats.rentability) < 0 ? RED : GREEN} />
                <StatRow label="Армия / Флот"         value={`${stats.army_innov}/20 · ${stats.naval_innov}/30`} />
                <StatRow label="Золотодобыча"         value={fmt(stats.gold_income) + " £"} color={GOLD} />
              </div>
            </div>
          </>
        )}

        {/* ── ECONOMY ── */}
        {tab === "economy" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <KpiCard label="ВВП"           value={fmt(stats.gdp) + " £"}       sub={fmt(stats.gdp_per_reg) + " £/регион"} color={GOLD} />
              <KpiCard label="Валовый выпуск" value={fmt(stats.supply) + " £"}   color={BLUE} />
              <KpiCard label="Потребление"    value={fmt(stats.consuption) + " £"} color={ORANGE} />
              <KpiCard label="ВВП / капиту"  value={fix(stats.gdp_per_cap, 3) + " £"} sub={"Скор. обращения " + fix(Number(stats.money_activity) * 100)} color={GREEN} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
              <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ color: GOLD, fontSize: 10, letterSpacing: 2, marginBottom: 14 }}>СТРУКТУРА ВВП</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={structureData} barSize={60}>
                    <CartesianGrid stroke={BORDER} strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fill: "#3A4A6A", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmt} tick={{ fill: "#3A4A6A", fontSize: 10 }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} name="ВВП £" fill={BLUE}
                      label={{ position: "top", formatter: fmt, fill: "#888", fontSize: 11 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ color: GOLD, fontSize: 10, letterSpacing: 2, marginBottom: 14 }}>ДЕТАЛИ</div>
                <StatRow label="ВВП на регион"       value={fmt(stats.gdp_per_reg) + " £"} />
                <StatRow label="Население на регион" value={fmt(stats.population_per_reg)} />
                <StatRow label="Скор. обращения"     value={fix(Number(stats.money_activity) * 100, 2)} />
                <StatRow label="Золотодобыча"         value={fmt(stats.gold_income) + " £"} color={GOLD} />
                <StatRow label="Доля промышленности"  value={fix(indLevel * 100) + "%"}     color={BLUE} />
                <StatRow label="Регионов"             value={String(stats.country_size)} />
              </div>
            </div>
          </>
        )}

        {/* ── INDUSTRY ── */}
        {tab === "industry" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <KpiCard label="Занято на фабриках" value={fmt(stats.fabric_employee)}         color={BLUE} />
              <KpiCard label="Безраб. фабрики"    value={fix(stats.fabric_unemployement) + "%"} sub={Number(stats.fabric_unemployement) > 20 ? "⚠ высокая" : "норма"} color={Number(stats.fabric_unemployement) > 20 ? RED : GREEN} />
              <KpiCard label="Рентабельность"     value={fix(stats.rentability) + "%"}        color={Number(stats.rentability) < 0 ? RED : GREEN} />
              <KpiCard label="Субсидируемых"      value={fix(stats.subside_pct) + "%"}        color={Number(stats.subside_pct) > 30 ? RED : ORANGE} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ color: GOLD, fontSize: 10, letterSpacing: 2, marginBottom: 14 }}>ЗАНЯТОСТЬ ПО СЕКТОРАМ</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={employData} layout="vertical">
                    <CartesianGrid stroke={BORDER} strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={fmt} tick={{ fill: "#3A4A6A", fontSize: 10 }} stroke={BORDER} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#9AAAC8", fontSize: 11 }} stroke={BORDER} width={70} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill={BLUE} radius={[0, 4, 4, 0]} name="Занято"
                      label={{ position: "right", formatter: fmt, fill: "#555", fontSize: 10 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ color: GOLD, fontSize: 10, letterSpacing: 2, marginBottom: 14 }}>ПОКАЗАТЕЛИ</div>
                <ProgressRow label="Безработица фабрики"  value={Number(stats.fabric_unemployement)} max={100} color={Number(stats.fabric_unemployement) > 20 ? RED : BLUE}   valLabel={fix(stats.fabric_unemployement) + "%"} />
                <ProgressRow label="Безработица добыча"   value={Number(stats.rgo_employement)}      max={100} color={Number(stats.rgo_employement) > 30 ? RED : GREEN}        valLabel={fix(stats.rgo_employement) + "%"} />
                <ProgressRow label="Субсидируемых предпр." value={Number(stats.subside_pct)}         max={100} color={Number(stats.subside_pct) > 30 ? RED : ORANGE}           valLabel={fix(stats.subside_pct) + "%"} />
                <div style={{ marginTop: 12 }}>
                  <StatRow label="Всего занятых"      value={fmt(stats.all_employemenent)} />
                  <StatRow label="Свободных мест"     value={fmt(stats.all_free_work_places)} />
                  <StatRow label="Ср. з/п рабочего"   value={fix(stats.fabric_worker_salary, 3) + " £"} />
                  <StatRow label="Ср. доход капит."   value={fmt(stats.capitalist_salary) + " £"} color={GOLD} />
                  <StatRow label="Валовый выпуск"     value={fmt(stats.supply) + " £"} />
                  <StatRow label="Потребление"        value={fmt(stats.consuption) + " £"} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── MILITARY ── */}
        {tab === "military" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <KpiCard label="Инно. армии"  value={stats.army_innov + " / 20"}  color={ORANGE} />
              <KpiCard label="Инно. флота"  value={stats.naval_innov + " / 30"}  color={BLUE} />
              <KpiCard label="Наз. бюджет"  value={fmt(stats.military_budget) + " £"} color={RED} />
              <KpiCard label="Мор. бюджет"  value={fmt(stats.naval_budget) + " £"}    color={BLUE} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ color: GOLD, fontSize: 10, letterSpacing: 2, marginBottom: 14 }}>ТЕХНОЛОГИЧЕСКИЙ УРОВЕНЬ</div>
                <ProgressRow label="Армейские технологии" value={Number(stats.army_innov)}  max={20} color={ORANGE} valLabel={`${stats.army_innov} / 20`} />
                <ProgressRow label="Морские технологии"   value={Number(stats.naval_innov)} max={30} color={BLUE}   valLabel={`${stats.naval_innov} / 30`} />
                <div style={{ marginTop: 14 }}>
                  <StatRow label="Наземный бюджет"  value={fmt(stats.military_budget) + " £"} color={ORANGE} />
                  <StatRow label="Морской бюджет"   value={fmt(stats.naval_budget) + " £"}    color={BLUE} />
                  <StatRow label="Золотодобыча"     value={fmt(stats.gold_income) + " £"}     color={GOLD} />
                </div>
              </div>

              <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ color: GOLD, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>РАДАР МОЩИ</div>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={BORDER} />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "#3A4A6A", fontSize: 10 }} />
                    <Radar dataKey="value" stroke={GOLD} fill={GOLD} fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* ── SOCIAL ── */}
        {tab === "social" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <KpiCard label="Грамотность"   value={fix(stats.literacy) + "%"}              color={GREEN} />
              <KpiCard label="Индекс Джини"  value={fix(stats.gini, 3)}                     color={gini > 0.6 ? RED : ORANGE} />
              <KpiCard label="З/п рабочего"  value={fix(stats.fabric_worker_salary, 3) + " £"} color={BLUE} />
              <KpiCard label="Доход капит."  value={fmt(stats.capitalist_salary) + " £"}    color={GOLD} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ color: GOLD, fontSize: 10, letterSpacing: 2, marginBottom: 14 }}>НЕРАВЕНСТВО</div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: "#3A4A6A", fontSize: 11 }}>Индекс Джини</span>
                    <span style={{ color: gini > 0.6 ? RED : ORANGE, fontSize: 13, fontWeight: 700 }}>{fix(stats.gini, 3)}</span>
                  </div>
                  <div style={{ height: 10, background: "#161C30", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{
                      width: `${gini * 100}%`, height: "100%",
                      background: `linear-gradient(90deg, ${GREEN}, ${ORANGE}, ${RED})`,
                      borderRadius: 5, transition: "width 0.8s"
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                    <span style={{ color: "#2A3A2A", fontSize: 10 }}>равенство</span>
                    <span style={{ color: "#3A2A2A", fontSize: 10 }}>неравенство</span>
                  </div>
                </div>
                <ProgressRow label="Грамотность"          value={Number(stats.literacy)} max={100} color={GREEN}  valLabel={fix(stats.literacy) + "%"} />
                <ProgressRow label="Доля промышленности"  value={indLevel * 100}          max={100} color={BLUE}   valLabel={fix(indLevel * 100) + "%"} />
                <ProgressRow label="Безработица фабрики"  value={Number(stats.fabric_unemployement)} max={100} color={Number(stats.fabric_unemployement) > 20 ? RED : ORANGE} valLabel={fix(stats.fabric_unemployement) + "%"} />
              </div>

              <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ color: GOLD, fontSize: 10, letterSpacing: 2, marginBottom: 14 }}>СОЦИАЛЬНЫЕ ПОКАЗАТЕЛИ</div>
                <StatRow label="Грамотность"          value={fix(stats.literacy) + "%"} color={GREEN} />
                <StatRow label="Индекс Джини"         value={fix(stats.gini, 3)}        color={gini > 0.6 ? RED : ORANGE} />
                <StatRow label="З/п рабочего"         value={fix(stats.fabric_worker_salary, 3) + " £"} />
                <StatRow label="Доход капиталиста"    value={fmt(stats.capitalist_salary) + " £"} color={GOLD} />
                <StatRow label="Население"            value={fmt(stats.population)} />
                <StatRow label="Население на регион"  value={fmt(stats.population_per_reg)} />
                <StatRow label="ВВП на регион"        value={fmt(stats.gdp_per_reg) + " £"} />
                <StatRow label="ВВП / капиту"         value={fix(stats.gdp_per_cap, 3) + " £"} />
                <StatRow label="Скор. обращения"      value={fix(Number(stats.money_activity) * 100, 2)} />
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}