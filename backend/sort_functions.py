import logic

SORT_FUNCS = {
    "gdp": logic.getGDP,
    "population": logic.get_population,
    "gdp_per_cap": logic.get_GDP_per_capita,
    "army_budget": logic.get_all_mil_budget,
    "literacy": logic.get_literacy,
    "size": logic.get_country_size,
    "industrial_gdp": logic.industirialGDP,
    "natural_gdp": logic.GDP_selo,
}

def safe_sort(tag: str, sort_met: str) -> float:
    func = SORT_FUNCS.get(sort_met, logic.getGDP)
    try:
        return func(tag)
    except :
        return 0