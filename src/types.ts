export interface CountryStats {
  tag: string
  gdp: number
  population: number
  gdp_per_cap: number
  money_activity: number
  consuption: number
  supply: number
  industrial_level: number
  subside_percent: number
  rentability: number
  subside_pct: number
  diversification: number
  gold_income: number
  gini: number
  fabric_employee: number
  fabric_unemployement: number
  rgo_employement: number
  all_employemenent: number
  all_free_work_places: number
  fabric_worker_salary: number
  capitalist_salary: number
  literacy: number
  military_budget: number
  naval_budget: number
  army_innov: number
  naval_innov: number
  country_size: number
  population_per_reg: number
  gdp_per_reg: number
  goverement: string
}

export interface LoadResult {
  countries: string[]
}