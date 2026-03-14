export interface CountryStats {
  tag: string
  gdp: number
  population: number
  literacy: number
  gdp_per_cap: number
  ind_power: number
  gini: number
  export: number
  import: number
  army_innov: number
  naval_innov: number
  subside_pct: number
  fab_unemploy: number
  country_size: number
}

export interface LoadResult {
  countries: string[]
}