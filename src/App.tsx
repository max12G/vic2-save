import { useState, useEffect, useRef } from "react"
import { open } from "@tauri-apps/plugin-dialog"
import { CountryStats, LoadResult } from "./types"
import { StatsPanel } from "./components/StatsPanel"
import { CompareView } from "./components/CompareView"
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

type View = "stats" | "compare"
type Theme = "victorian" | "classic"

const SORT_OPTIONS = [
  { value: "gdp",             label: "ВВП" },
  { value: "population",      label: "Население" },
  { value: "gdp_per_cap",     label: "ВВП на душу населения" },
  { value: "literacy",        label: "Грамотность" },
  { value: "industrial_gdp",  label: "Индустриальное ВВП" },
  { value: "natural_gdp",     label: "ВВП с/x" },
  { value: "size",            label: "Территории" },
  { value: "army_budget",     label: "Общий военный бюджет" },
]

declare global {
  interface Window { __TAURI_INTERNALS__?: unknown }
}

export default function App() {
  const [saveLoaded, setSaveLoaded] = useState(false)
  const [countries, setCountries] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("gdp")
  const [ascending, setAscending] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<string>("")
  const [stats, setStats] = useState<CountryStats | null>(null)
  const [compareStats, setCompareStats] = useState<Record<string, CountryStats>>({})
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])
  const [view, setView] = useState<View>("stats")
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showModModal, setShowModModal] = useState(false)
  const [modPath, setModPath] = useState("")
  const [modStatus, setModStatus] = useState("")
  const [modLoading, setModLoading] = useState(false)
  const [theme, setTheme] = useState<Theme>("victorian")

  const statsCache = useRef<Map<string, CountryStats>>(new Map())

  useEffect(() => {
    document.body.setAttribute("data-theme", theme)
  }, [theme])

  function toggleTheme() {
    setTheme(prev => prev === "victorian" ? "classic" : "victorian")
  }

  async function handleLoadMod() {
    statsCache.current.clear()
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
      const result = await apiFetch<LoadResult>(
        `/countries?sort_met=${sort}&ascendic=${asc}`
      )
      setCountries(result.countries)
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function handleOpenFile() {
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
        body: JSON.stringify({ path }),
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
    setSelectedCountry(tag)

    if (statsCache.current.has(tag)) {
      setStats(statsCache.current.get(tag)!)
      return
    }

    setStatsLoading(true)
    try {
      const data = await apiFetch<CountryStats>(`/stats/${tag}`)
      statsCache.current.set(tag, data)
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
    if (selectedForCompare.length < 2) {
      setError("Выбери минимум 2 страны")
      return
    }
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch<Record<string, CountryStats>>(
        `/compare?tags=${selectedForCompare.join(",")}`
      )
      setCompareStats(data)
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  const filteredCountries = countries.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="app">

      {/* Модальное окно мода */}
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
              <input
                className="modal-input"
                placeholder="C:\Victoria2\mod\MyMod\gfx\flags"
                value={modPath}
                onChange={e => setModPath(e.target.value)}
              />
              {modStatus && (
                <div className={`modal-status ${modStatus.startsWith("✓") ? "ok" : "err"}`}>
                  {modStatus}
                </div>
              )}
              <button
                className="modal-btn"
                onClick={handleLoadMod}
                disabled={modLoading || !modPath.trim()}
              >
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
            <button
              className="btn-mod"
              onClick={() => setShowModModal(true)}
              title="Загрузить мод"
            >
              ✦
            </button>
            <button
              className="btn-mod"
              onClick={toggleTheme}
              title={theme === "victorian" ? "Классическая тема" : "Викторианская тема"}
            >
              {theme === "victorian" ? "◈" : "⚙"}
            </button>
          </div>
          {saveLoaded && (
            <>
              <input
                className="search-input"
                placeholder="Поиск страны..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div className="sort-row">
                <select
                  className="sort-select"
                  value={sortBy}
                  onChange={e => handleSortChange(e.target.value)}
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <button
                  className="sort-dir-btn"
                  onClick={handleToggleAscending}
                  title={ascending ? "По возрастанию" : "По убыванию"}
                >
                  {ascending ? "↑" : "↓"}
                </button>
              </div>
            </>
          )}
        </div>

        {saveLoaded && (
          <div className="country-list">
            {filteredCountries.map(tag => (
              <div
                key={tag}
                className={`country-item ${selectedCountry === tag ? "active" : ""} ${
                  selectedForCompare.includes(tag) ? "in-compare" : ""
                }`}
                onClick={() => handleSelectCountry(tag)}
              >
                <img
                  src={`/flags/${tag}.png`}
                  alt={tag}
                  style={{ width: 20, height: 14, objectFit: "cover", borderRadius: 2, marginRight: 6, verticalAlign: "middle" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                />
                {tag}
              </div>
            ))}
          </div>
        )}

        {!saveLoaded && (
          <div className="sidebar-empty">
            Открой файл сохранения
          </div>
        )}
      </aside>

      <div className="main">
        {saveLoaded && (
          <div className="topbar">
            <div className="tabs">
              <button
                className={`tab ${view === "stats" ? "active" : ""}`}
                onClick={() => setView("stats")}
              >
                Статистика
              </button>
              <button
                className={`tab ${view === "compare" ? "active" : ""}`}
                onClick={() => setView("compare")}
              >
                Сравнение
              </button>
            </div>

            {view === "compare" && (
              <div className="compare-bar">
                <span className="compare-tags">
                  {selectedForCompare.length > 0
                    ? selectedForCompare.join(" · ")
                    : "Выбери страны из списка"}
                </span>
                <button
                  className="btn-compare"
                  onClick={handleCompare}
                  disabled={selectedForCompare.length < 2 || loading}
                >
                  Сравнить
                </button>
                {selectedForCompare.length > 0 && (
                  <button
                    className="btn-clear"
                    onClick={() => setSelectedForCompare([])}
                  >
                    Очистить
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {error && <div className="error-bar">{error}</div>}

        <div className="content">
          {!saveLoaded && (
            <div className="welcome">
              <div className="welcome-icon">⚙</div>
              <h2>Victoria 2 Analyzer</h2>
              <p>Открой файл сохранения (.v2) чтобы начать</p>
            </div>
          )}

          {saveLoaded && view === "stats" && statsLoading && (
            <div className="loading-state">Загрузка данных...</div>
          )}

          {saveLoaded && view === "stats" && !statsLoading && stats && (
            <StatsPanel stats={stats} />
          )}

          {saveLoaded && view === "stats" && !statsLoading && !stats && (
            <div className="placeholder">Выбери страну из списка слева</div>
          )}

          {saveLoaded && view === "compare" && Object.keys(compareStats).length > 0 && (
            <CompareView data={compareStats} />
          )}

          {saveLoaded && view === "compare" && Object.keys(compareStats).length === 0 && (
            <div className="placeholder">
              Отметь несколько стран в списке и нажми «Сравнить»
            </div>
          )}
        </div>
      </div>
    </div>
  )
}