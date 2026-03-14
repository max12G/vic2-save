import { CountryStats } from "../types"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts"

interface Props { stats: CountryStats }

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toFixed(0)
}

function Metric({ label, value, unit = "", accent = false }: {
  label: string; value: string | number; unit?: string; accent?: boolean
}) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${accent ? "accent" : ""}`}>
        {value}<span className="metric-unit">{unit}</span>
      </div>
    </div>
  )
}

export function StatsPanel({ stats }: Props) {
  const tradeData = [
    { name: "Экспорт", value: stats.export },
    { name: "Импорт", value: stats.import },
  ]

  const gdpData = [
    { name: "Пром.", value: Math.round(stats.gdp * stats.ind_power) },
    { name: "С/х", value: Math.round(stats.gdp * (1 - stats.ind_power)) },
  ]

  const radarData = [
    { metric: "ВВП/кап", value: Math.min(stats.gdp_per_cap * 500, 100) },
    { metric: "Грамот.", value: stats.literacy },
    { metric: "Индустр.", value: stats.ind_power * 100 },
    { metric: "Армия", value: Math.min(stats.army_innov * 5, 100) },
    { metric: "Флот", value: Math.min(stats.naval_innov * 3.5, 100) },
    { metric: "Рентаб.", value: Math.max(0, 100 - stats.fab_unemploy * 2) },
  ]

  const tradeBalance = stats.export - stats.import
  const tradeColor = tradeBalance >= 0 ? "#4ff79f" : "#f74f4f"

  return (
    <div className="stats-panel">
      <div className="stats-header">
        <h2 className="country-name">{stats.tag}</h2>
        <div className="header-badges">
          <span className="badge-stat">{stats.country_size} регионов</span>
        </div>
      </div>

      {/* Ключевые метрики */}
      <div className="metrics-grid">
        <Metric label="ВВП" value={fmt(stats.gdp)} unit=" £" />
        <Metric label="Население" value={fmt(stats.population)} />
        <Metric label="Грамотность" value={stats.literacy.toFixed(1)} unit="%" />
        <Metric label="ВВП / капиту" value={stats.gdp_per_cap.toFixed(3)} unit=" £" />
        <Metric label="Инд. мощь" value={(stats.ind_power * 100).toFixed(1)} unit="%" />
        <Metric label="Коэф. Джини" value={stats.gini.toFixed(3)} accent={stats.gini > 0.5} />
        <Metric label="Безраб. фабрик" value={stats.fab_unemploy.toFixed(1)} unit="%" accent={stats.fab_unemploy > 20} />
        <Metric label="Субсидии" value={stats.subside_pct.toFixed(1)} unit="%" />
      </div>

      <div className="charts-grid">
        {/* Структура ВВП */}
        <div className="chart-card">
          <div className="chart-title">Структура ВВП</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={gdpData} barSize={40}>
              <XAxis dataKey="name" tick={{ fill: "#666", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmt} tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} width={45} />
              <Tooltip
                formatter={(v: any) => [fmt(v) + " £", ""]}
                contentStyle={{ background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: 6, color: "#ccc" }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}
                fill="#4f8ef7"
                label={{ position: "top", formatter: fmt, fill: "#888", fontSize: 11 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Торговля */}
        <div className="chart-card">
          <div className="chart-title">Торговля</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={tradeData} barSize={40}>
              <XAxis dataKey="name" tick={{ fill: "#666", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmt} tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} width={45} />
              <Tooltip
                formatter={(v: any) => [fmt(v) + " £", ""]}
                contentStyle={{ background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: 6, color: "#ccc" }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}
                fill="#4ff79f"
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="trade-balance" style={{ color: tradeColor }}>
            Баланс: {tradeBalance >= 0 ? "+" : ""}{fmt(tradeBalance)} £
          </div>
        </div>

        {/* Радар */}
        <div className="chart-card">
          <div className="chart-title">Комплексная оценка</div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#2a2d3a" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "#666", fontSize: 11 }} />
              <Radar dataKey="value" stroke="#4f8ef7" fill="#4f8ef7" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Военное */}
        <div className="chart-card">
          <div className="chart-title">Военный потенциал</div>
          <div className="stat-rows">
            <div className="stat-row">
              <span>Армейские технологии</span>
              <span className="stat-val">{stats.army_innov} / 20</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${stats.army_innov / 20 * 100}%`, background: "#f7954f" }} />
            </div>
            <div className="stat-row" style={{ marginTop: 12 }}>
              <span>Морские технологии</span>
              <span className="stat-val">{stats.naval_innov} / 30</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${stats.naval_innov / 30 * 100}%`, background: "#4f8ef7" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}