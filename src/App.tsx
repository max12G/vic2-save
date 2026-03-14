import { useState } from "react"
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

export default function App() {
  const [saveLoaded, setSaveLoaded] = useState(false)
  const [countries, setCountries] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [selectedCountry, setSelectedCountry] = useState<string>("")
  const [stats, setStats] = useState<CountryStats | null>(null)
  const [compareStats, setCompareStats] = useState<Record<string, CountryStats>>({})
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])
  const [view, setView] = useState<View>("stats")
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleOpenFile() {
    const path = prompt("Путь к .v2 файлу:")
    if (!path) return

    setLoading(true)
    setError("")
    try {
      const result = await apiFetch<LoadResult>("/load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      })
      setCountries(result.countries)
      setSaveLoaded(true)
      setStats(null)
      setSelectedCountry("")
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function handleSelectCountry(tag: string) {
    if (view === "compare") {
      toggleCompare(tag)
      return
    }
    setSelectedCountry(tag)
    setStatsLoading(true)
    setError("")
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
      <aside className="sidebar">
        <div className="sidebar-header">
          <button className="btn-open" onClick={handleOpenFile} disabled={loading}>
            {loading ? "Загрузка..." : "Открыть .v2"}
          </button>
          {saveLoaded && (
            <input
              className="search-input"
              placeholder="Поиск страны..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
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