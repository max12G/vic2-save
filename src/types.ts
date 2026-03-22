export interface CountryEntry {
  tag: string
  flag_name: string
}
export interface LoadResult { countries: CountryEntry[] }


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
  country_savings: number
  bank_savings: number
  population_savings: number
  money_mass: number
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
  most_popular_party: string
  flag_name: string
}

