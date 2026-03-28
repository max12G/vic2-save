import { useState, useEffect } from "react"
import { open } from "@tauri-apps/plugin-dialog"
import { CountryStats, CountryEntry, LoadResult } from "./types"
import { StatsPanel } from "./components/StatsPanel"
import { CompareView } from "./components/CompareView"
import { TimeView, TimeData } from "./components/Timeview"
import { WarHistoryView } from "./components/Wars"
import "./App.css"

const API = "http://localhost:8000"

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(API + url, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Ошибка сервера" }))
    throw new Error(err.detail || "Ошибка сервера")
  }
  return res.json()
}

type View = "stats" | "compare" | "time" | "war"
type Theme = "victorian" | "classic"

const SORT_OPTIONS = [
  { value: "gdp",            label: "ВВП" },
  { value: "population",     label: "Население" },
  { value: "gdp_per_cap",    label: "ВВП на душу населения" },
  { value: "literacy",       label: "Грамотность" },
  { value: "industrial_gdp", label: "Индустриальное ВВП" },
  { value: "natural_gdp",    label: "ВВП с/x" },
  { value: "size",           label: "Территории" },
  { value: "army_budget",    label: "Общий военный бюджет" },
]

declare global {
  interface Window { __TAURI_INTERNALS__?: unknown }
}

export default function App() {
  const [saveLoaded, setSaveLoaded]   = useState(false)
  const [countries, setCountries]     = useState<CountryEntry[]>([])
  const [search, setSearch]           = useState("")
  const [sortBy, setSortBy]           = useState("gdp")
  const [ascending, setAscending]     = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<string>("")
  const [stats, setStats]             = useState<CountryStats | null>(null)
  const [compareStats, setCompareStats] = useState<Record<string, CountryStats>>({})
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])
  const [view, setView]               = useState<View>("stats")
  const [loading, setLoading]         = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [error, setError]             = useState("")
  const [showModModal, setShowModModal] = useState(false)
  const [modPath, setModPath]         = useState("")
  const [modStatus, setModStatus]     = useState("")
  const [modLoading, setModLoading]   = useState(false)
  const [theme, setTheme]             = useState<Theme>("victorian")

  const [timePath1, setTimePath1]         = useState("")
  const [timeLoaded, setTimeLoaded]       = useState(false)
  const [timeCountries, setTimeCountries] = useState<CountryEntry[]>([])
  const [timeData, setTimeData]           = useState<TimeData | null>(null)
  const [timeLoadingStats, setTimeLoadingStats] = useState(false)
  const [selectedTimeTag, setSelectedTimeTag]   = useState("")

  const [warData, setWarData] = useState<any[] | null>(null)
  const [warLoading, setWarLoading] = useState(false)
  const [selectedWarTag, setSelectedWarTag] = useState("")

  useEffect(() => {
    document.body.setAttribute("data-theme", theme)
  }, [theme])

  const [csvLoading, setCsvLoading] = useState(false)

  async function handleExportCsv() {
    let path: string | null = null
    if (window.__TAURI_INTERNALS__) {
      const { open } = await import("@tauri-apps/plugin-dialog")
      path = await open({ directory: true, multiple: false }) as string | null
      if (!path) return
      path = path + "\\"
    } else {
      path = prompt("Папка для сохранения CSV (например C:\\stats\\):")
      if (!path) return
    }
    setCsvLoading(true)
    try {
      await apiFetch(`/csv_load?path=${encodeURIComponent(path)}`, { method: "POST" })
      alert("CSV сохранён в " + path)
    } catch (e: any) {
      alert("Ошибка: " + e.message)
    }
    setCsvLoading(false)
  }

  function toggleTheme() {
    setTheme(prev => prev === "victorian" ? "classic" : "victorian")
  }

  async function handleLoadMod() {
    if (!modPath.trim()) return
    setModLoading(true)
    setModStatus("")
    try {
      await apiFetch(`/mods?src=${encodeURIComponent(modPath)}`)
      setModStatus("✓ Флаги мода загружены успешно")
    } catch (e: any) {
      setModStatus("✗ Ошибка: " + e.message)
    }
    setModLoading(false)
  }

  async function loadCountries(sort: string, asc: boolean) {
    try {
      const result = await apiFetch<LoadResult>(`/countries?sort_met=${sort}&ascendic=${asc}`)
      setCountries(result.countries)
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function handleOpenFile() {
    setSelectedForCompare([])
    let path: string | null = null
    if (window.__TAURI_INTERNALS__) {
      path = await open({
        filters: [{ name: "Victoria 2 Save", extensions: ["v2"] }],
        multiple: false,
      }) as string | null
    } else {
      path = prompt("Путь к .v2 файлу:")
    }
    if (!path) return
    setLoading(true)
    setError("")
    try {
      await apiFetch("/load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: [path] }),
      })
      await loadCountries(sortBy, ascending)
      setSaveLoaded(true)
      setStats(null)
      setSelectedCountry("")
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function handleLoadTime() {
    if (!timePath1.trim()) { setError("Укажи путь к файлу прошлого"); return }
    if (!saveLoaded)        { setError("Сначала загрузи основной файл"); return }
    setLoading(true)
    setError("")
    setTimeData(null)
    setSelectedTimeTag("")
    try {
      await apiFetch<void>("/time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: [timePath1] }),
      })
      const c = await apiFetch<LoadResult>("/countries")
      setTimeCountries(c.countries)
      setTimeLoaded(true)
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function handleSelectTimeTag(tag: string) {
    setSelectedTimeTag(tag)
    setTimeLoadingStats(true)
    setError("")
    try {
      const data = await apiFetch<TimeData>(`/time_compare/${tag}`)
      setTimeData(data)
    } catch (e: any) {
      setError(e.message)
    }
    setTimeLoadingStats(false)
  }

  async function handleSortChange(newSort: string) {
    setSortBy(newSort)
    await loadCountries(newSort, ascending)
  }

  async function handleToggleAscending() {
    const newAsc = !ascending
    setAscending(newAsc)
    await loadCountries(sortBy, newAsc)
  }

  async function handleSelectCountry(tag: string) {
    if (view === "compare") { toggleCompare(tag); return }
    if (view === "time")    { handleSelectTimeTag(tag); return }
    if (view === "war")     { handleSelectWarTag(tag); return }
    setSelectedCountry(tag)
    setStatsLoading(true)
    try {
      const data = await apiFetch<CountryStats>(`/stats/${tag}`)
      setStats(data)
    } catch (e: any) {
      setError(e.message)
    }
    setStatsLoading(false)
  }

  function toggleCompare(tag: string) {
    setSelectedForCompare(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag].slice(0, 5)
    )
  }

  async function handleCompare() {
    if (selectedForCompare.length < 2) { setError("Выбери минимум 2 страны"); return }
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch<Record<string, CountryStats>>(`/compare?tags=${selectedForCompare.join(",")}`)
      setCompareStats(data)
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }
  

  async function handleSelectWarTag(tag: string) {
    setSelectedWarTag(tag)
    setWarLoading(true)
    setError("")
    try {
      const data = await apiFetch<any[]>(`/war_history/${tag}?n=10`)
      setWarData(data)
    } catch (e: any) {
      setError(e.message)
    }
    setWarLoading(false)
  }

  const activeCountries = view === "time" ? timeCountries : countries
  const filteredCountries = activeCountries.filter(c =>
    c.tag.toLowerCase().includes(search.toLowerCase())
  )

  function CountryList({ items, activeTag, compareList }: {
    items: CountryEntry[]
    activeTag: string
    compareList?: string[]
  }) {
    return (
      <div className="country-list">
        {items.map(({ tag, flag_name }) => (
          <div key={tag}
            className={`country-item ${activeTag === tag ? "active" : ""} ${compareList?.includes(tag) ? "in-compare" : ""}`}
            onClick={() => handleSelectCountry(tag)}>
            <img src={`/flags/${flag_name}.png`} alt={tag}
              style={{ width: 20, height: 14, objectFit: "cover", borderRadius: 2, marginRight: 6, verticalAlign: "middle" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
            {tag}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="app">

      {showModModal && (
        <div className="modal-overlay" onClick={() => setShowModModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>Загрузка контента мода</span>
              <button className="modal-close" onClick={() => setShowModModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-desc">
                Укажи путь к папке <code>gfx/flags</code> мода — флаги будут сконвертированы и добавлены в приложение.
              </p>
              <label className="modal-label">Путь к папке с флагами (.tga)</label>
              <input className="modal-input" placeholder="C:\Victoria2\mod\MyMod\gfx\flags"
                value={modPath} onChange={e => setModPath(e.target.value)} />
              {modStatus && (
                <div className={`modal-status ${modStatus.startsWith("✓") ? "ok" : "err"}`}>{modStatus}</div>
              )}
              <button className="modal-btn" onClick={handleLoadMod} disabled={modLoading || !modPath.trim()}>
                {modLoading ? "Конвертируем..." : "Загрузить флаги"}
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn-open" style={{ flex: 1 }} onClick={handleOpenFile} disabled={loading}>
              {loading ? "Загрузка..." : "Открыть .v2"}
            </button>
            <button className="btn-mod" onClick={toggleTheme}
              title={theme === "victorian" ? "Классическая тема" : "Викторианская тема"}>
              {theme === "victorian" ? "◈" : "⚙"}
            </button>
            <button className="btn-mod" onClick={() => setShowModModal(true)} title="Загрузить мод">✦</button>
          </div>
          {saveLoaded && view !== "time" && (
            <>
              <input className="search-input" placeholder="Поиск страны..."
                value={search} onChange={e => setSearch(e.target.value)} />
              <div className="sort-row">
                <select className="sort-select" value={sortBy} onChange={e => handleSortChange(e.target.value)}>
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <button className="sort-dir-btn" onClick={handleToggleAscending}
                  title={ascending ? "По возрастанию" : "По убыванию"}>
                  {ascending ? "↑" : "↓"}
                </button>
                {saveLoaded && (
                <button
                  className="btn-export"
                  onClick={handleExportCsv}
                  disabled={csvLoading}
                  title="Экспорт в CSV"
                  style={{ width: "100%", marginTop: 0, fontSize: 10, letterSpacing: 1 }}
                >
                  {csvLoading ? "..." : "↓ CSV"}
                </button>
              )}
              </div>
            </>
          )}
          {view === "time" && timeLoaded && (
            <input className="search-input" placeholder="Поиск страны..."
              value={search} onChange={e => setSearch(e.target.value)} />
          )}
        </div>

        {saveLoaded && view !== "time" && (
          <CountryList items={filteredCountries} activeTag={selectedCountry} compareList={selectedForCompare} />
        )}
        {view === "time" && timeLoaded && (
          <CountryList items={filteredCountries} activeTag={selectedTimeTag} />
        )}
        {!saveLoaded && view !== "time" && (
          <div className="sidebar-empty">Открой файл сохранения</div>
        )}
        {view === "time" && !timeLoaded && (
          <div className="sidebar-empty">Загрузи сохранение из прошлого</div>
        )}
      </aside>

      <div className="main">
        {(saveLoaded || view === "time") && (
          <div className="topbar">
            <div className="tabs">
              <button className={`tab ${view === "stats" ? "active" : ""}`} onClick={() => setView("stats")}>Статистика</button>
              <button className={`tab ${view === "war" ? "active" : ""}`} onClick={() => setView("war")}>Военная история</button>
              <button className={`tab ${view === "time" ? "active" : ""}`} onClick={() => setView("time")}>Динамика</button>
              <button className={`tab ${view === "compare" ? "active" : ""}`} onClick={() => setView("compare")}>Сравнение</button>
            </div>

            {view === "compare" && (
              <div className="compare-bar">
                <span className="compare-tags">
                  {selectedForCompare.length > 0 ? selectedForCompare.join(" · ") : "Выбери страны из списка"}
                </span>
                <button className="btn-compare" onClick={handleCompare}
                  disabled={selectedForCompare.length < 2 || loading}>Сравнить</button>
                {selectedForCompare.length > 0 && (
                  <button className="btn-clear" onClick={() => setSelectedForCompare([])}>Очистить</button>
                )}
              </div>
            )}

            {view === "time" && (
              <div style={{ display: "flex", gap: 6, flex: 1, alignItems: "center" }}>
                <span style={{ color: "var(--text-dim)", fontSize: 11, whiteSpace: "nowrap" as const }}>Файл из прошлого:</span>
                <input
                  style={{ flex: 1, padding: "5px 8px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 11, fontFamily: "var(--font-main)", outline: "none" }}
                  placeholder="Путь к .v2 файлу..."
                  value={timePath1}
                  onChange={e => setTimePath1(e.target.value)}
                />
                {!!window.__TAURI_INTERNALS__ && (
                  <button onClick={async () => {
                    const p = await open({ filters: [{ name: "Victoria 2 Save", extensions: ["v2"] }], multiple: false })
                    if (typeof p === "string") setTimePath1(p)
                  }} style={{ padding: "5px 8px", background: "var(--bg)", color: "var(--gold)", border: "1px solid var(--border)", cursor: "pointer" }}>…</button>
                )}
                <button onClick={handleLoadTime} disabled={loading || !timePath1.trim() || !saveLoaded}
                  style={{ padding: "5px 14px", background: "var(--bg)", color: "var(--gold)", border: "1px solid var(--border)", fontSize: 11, fontFamily: "var(--font-main)", cursor: "pointer" }}>
                  {loading ? "..." : "Загрузить"}
                </button>
                {!saveLoaded && <span style={{ color: "var(--red)", fontSize: 10 }}>Сначала открой основной файл</span>}
              </div>
            )}
          </div>
        )}

        {error && <div className="error-bar">{error}</div>}

        <div className="content">
          {!saveLoaded && view !== "time" && (
            <div className="welcome">
              <div className="welcome-icon">⚙</div>
              <h2>Victoria 2 Analyzer</h2>
              <p>Открой файл сохранения (.v2) чтобы начать</p>
            </div>
          )}

          {saveLoaded && view === "stats" && statsLoading && <div className="loading-state">Загрузка данных...</div>}
          {saveLoaded && view === "stats" && !statsLoading && stats && <StatsPanel stats={stats} />}
          {saveLoaded && view === "stats" && !statsLoading && !stats && (
            <div className="placeholder">Выбери страну из списка слева</div>
          )}

          {saveLoaded && view === "compare" && Object.keys(compareStats).length > 0 && <CompareView data={compareStats} />}
          {saveLoaded && view === "compare" && Object.keys(compareStats).length === 0 && (
            <div className="placeholder">Отметь несколько стран в списке и нажми «Сравнить»</div>
          )}

          {view === "time" && !timeLoaded && (
            <div className="welcome">
              <div className="welcome-icon">⏳</div>
              <h2>Динамика во времени</h2>
              <p>Укажи файл прошлого сохранения в строке выше и нажми «Загрузить»</p>
            </div>
          )}
          {view === "time" && timeLoaded && (
            <TimeView
              timeData={timeData}
              selectedTag={selectedTimeTag}
              loading={timeLoadingStats}
              countries={timeCountries}
            />
          )}
          {saveLoaded && view === "war" && (
            <WarHistoryView 
              warData={warData} 
              selectedTag={selectedWarTag} 
              loading={warLoading} 
            />
          )}
        </div>
      </div>
    </div>
  )
}