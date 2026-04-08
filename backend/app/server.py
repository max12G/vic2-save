from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import re
from pyradox import txt as pyradox_txt

from backend.app import logic
from backend.app import formulas
from backend.app.sort_functions import safe_sort
from backend.app.flags_convert import convert_files

from datetime import datetime
import pandas as pd
import os

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"])

cache = []
time_cache = {}
country_stats = {}
time_past = None


class LoadRequest(BaseModel):
    path: list[str]


def parse_victoria2_save(file_path):
    try:
        with open(file_path, "r", encoding="CP1251", errors="ignore") as f:
            content = f.read()
        content = re.sub(r"(bank=-?\d+\.\d+)\d{2}\.\d+", r"\1", content)
        data = pyradox_txt.parse(content)
        return data
    except Exception as e:
        print(f"Ошибка при парсинге: {e}")
        return None


@app.post(
    "/load",
    tags=["Загрузка файла"],
    summary="Загрузить файл",
    description="Ничего не возвращает, обновляет кэш",
)
def load_save(body: LoadRequest):
    global cache, country_stats
    logic.countries = []
    country_stats = {}
    path = body.path[-1]
    data = parse_victoria2_save(path)
    if data is None:
        return "Ошибка парсинга файла"
    country_stats[data["date"]] = {}
    cache.clear()
    cache.append(data)
    # C:/Users/User/Documents/parser/vic2-save/backend/test_data/siiiey1918_01_11.v2
    # C:/Users  /User/Documents/parser/vic2-save/backend/test_data/Dinney2004_01_01.v2
    # C:/Users/User/Documents/parser/vic2-save/backend/test_data/Dinney2005_08_29.v2
    # C:/Users/User/Documents/parser/vic2-save/backend/test_data/GER1860.v2
    # C:/Users/User/Documents/parser/vic2-save/backend/test_data/GER_TEST.v2
    # C:/Users/User/Documents/parser/vic2-save/backend/test_data/GER1880.v2
    # C:/Users/User/Documents/parser/vic2-save/backend/test_data/GER1892.v2
    logic.world_goods_price = data["worldmarket"]["price_pool"]
    logic.countries = [
        str(k)
        for k in data.keys()
        if len(str(k)) == 3
        and str(k).isalpha()
        and str(k).isupper()
        and logic.country_exists(tag=k, data=data)
    ]
    return f"loaded {len(logic.countries)} countries at {datetime.now()}"


@app.get(
    "/countries",
    tags=["Загрузка файла"],
    summary="Отсортировать страны",
    description="Возвращает список стран отсортированный",
)
def get_countries(sort_met: str = "gdp", ascendic: bool = False):
    logic.countries.sort(
        key=lambda x: safe_sort(sort_met=sort_met, tag=x, data=cache[-1]),
        reverse=not ascendic,
    )
    return {
        "countries": [
            {"tag": t, "flag_name": logic.get_flag_name(t, data=cache[-1])}
            for t in logic.countries
        ]
    }


@app.get(
    "/mods",
    tags=["Загрузка файла"],
    summary="Добавить флаги стран из мода",
    description="Ну тут все и так понятно",
)
def get_mod_flags(src: str = ""):
    if src:
        convert_files(src=src)
    return


@app.get(
    "/stats/{tag}",
    tags=["Статистика стран"],
    summary="Получить базовые статы стран",
    description="Ну возвращает словарь",
)
def get_stats(tag: str, data=None, dataset: bool = False):
    global cache, country_stats
    if data is None:
        data = cache[-1]
    date = data["date"]
    if tag in country_stats[date].keys():
        country = country_stats[date][tag]
        return country
    else:
        country = {
            "gdp": logic.getGDP(tag, data=data),
            "population": logic.get_population(tag, data=data),
            "gdp_per_cap": logic.get_GDP_per_capita(tag, data=data),
            "money_activity": logic.get_money_activity(tag, data=data),
            "consuption": logic.get_Consumption_economy(tag, data=data),
            "supply": logic.getSupply(tag, data=data),
            "industrial_level": logic.indPower(tag, data=data),
            "subside_percent": logic.get_subside_ind(tag, data=data),
            "rentability": logic.avg_rentability(tag, data=data),
            "subside_pct": logic.get_subside_ind(tag, data=data),
            "diversification": logic.get_diversification_ind(tag, data=data),
            "gold_income": logic.get_gold_mining(tag, data=data),
            "country_savings": logic.get_country_savings(tag, data=data),
            "bank_savings": logic.get_bank_savings(tag, data=data),
            "population_savings": logic.get_all_pop_money(tag, data=data),
            "money_mass": logic.get_money_mass(tag, data=data),
            "gini": logic.real_gini(tag, data=data),
            "fabric_employee": logic.get_employed_fabric(tag, data=data),
            "fabric_unemployement": logic.fabric_uneployement(tag, data=data),
            "rgo_employement": logic.rgo_uneployement(tag, data=data),
            "all_employemenent": logic.get_all_employed(tag, data=data),
            "all_free_work_places": logic.get_all_work_places(tag, data=data),
            "fabric_worker_salary": logic.get_avg_salary(tag, data=data),
            "capitalist_salary": logic.get_avg_capilatils_salary(tag, data=data),
            "literacy": logic.get_literacy(tag, data=data),
            "military_budget": logic.get_army_budget(tag, data=data),
            "naval_budget": logic.get_naval_budget(tag, data=data),
            "army_innov": logic.army_innovation(tag, data=data),
            "naval_innov": logic.naval_innovation(tag, data=data),
            "country_size": logic.get_country_size(tag, data=data),
            "population_per_reg": logic.population_per_reg(tag, data=data),
            "gdp_per_reg": logic.gdp_per_reg(tag, data=data),
            "goverement": logic.get_gov_type(tag, data=data),
            "most_popular_party": logic.get_ruling_patry(tag, data=data),
            "flag_name": logic.get_flag_name(tag, data=data),
        }
        if dataset:
            taxes = logic.get_tax(tag, data=data)
            country["war_status"] = logic.get_country_war_status(tag, data=data)
            country.update(taxes)

        country_stats[date][tag] = country
        if len(country_stats[date].keys()) > 5:
            t = list(country_stats[date].keys())[0]
            country_stats[date].pop(t)
        return country


@app.get(
    "/compare",
    tags=["Статистика стран"],
    summary="Сравнение нескольких стран",
    description="Максимум 5 стран, в сравнение входит базовая статистика",
)
def compare(tags: str):
    result = {}
    for tag in tags.split(","):
        result[tag] = get_stats(tag)
    return result


@app.get(
    "/war_history/{tag}",
    tags=["Статистика стран"],
    summary="Военная статистика страны",
    description="Топ n войн по потерям и их общая сумма",
)
def get_wars(tag: str, n: int = 5, reverse: bool = False):
    stats = {}
    data = cache[0]
    all_wars = logic.find_all_prev_wars_tag(tag, data)
    stats["biggest_wars"] = logic.wars_sort(all_wars, n, reverse)
    stats["all_casualites"] = logic.country_war_history(tag, data)
    war_list = []
    for war_id, war in stats["biggest_wars"].items():
        war_item = {"id": war_id}
        war_item.update(war)
        war_list.append(war_item)
    war_list.append(stats["all_casualites"])
    return war_list


@app.post(
    "/time",
    tags=["Временная прогрессия"],
    summary="Загрузка сейва прошлых лет",
    description="Будет проводится сравнение с текущим сохранением",
)
def get_time_progression(body: LoadRequest):
    global time_past, time_cache, country_stats
    if not cache:
        return "Сначала загрузи основной файл"
    data_present = cache[-1]
    data_past = parse_victoria2_save(body.path[0])
    if data_past is None:
        return "Ошибка парсинга файла"
    time_past = data_past
    logic.countries = [
        str(k)
        for k in data_present.keys()
        if len(str(k)) == 3
        and str(k).isalpha()
        and str(k).isupper()
        and logic.country_exists(tag=k, data=data_past)
        and logic.country_exists(tag=k, data=data_present)
    ]
    logic.countries.sort(key=lambda x: logic.getGDP(x, data=data_present), reverse=True)
    time_cache = {}
    country_stats[data_past["date"]] = {}
    return f"loaded {len(logic.countries)} at {datetime.now()}"


@app.get(
    "/time_compare/{tag}",
    tags=["Временная прогрессия"],
    summary="Отслеживание прогресса",
    description="Пока что внедрены только базовые показатели",
)
def time_compare(tag: str):
    global time_cache, cache
    if time_past is None or not cache:
        return {}
    stack = {}
    date1 = str(time_past["date"])
    date2 = str(cache[-1]["date"])
    stack[date1] = get_stats(tag, time_past)
    stack[date2] = get_stats(tag, cache[-1])
    stack["gdp_progression"] = logic.get_progression(
        stack[date1]["gdp"], stack[date2]["gdp"], date1, date2
    )
    stack["population_progression"] = logic.get_progression(
        stack[date1]["population"], stack[date2]["population"], date1, date2
    )
    time_cache[tag] = stack
    return stack


@app.get(
    "/time_compare/{tag1}/progression/{tag2}",
    tags=["Временная прогрессия"],
    summary="Дата, когда показатели одной страны достигнут другой страны",
    description="-1 - Никогда не достигнет с текущими темпами роста, 1 - уже больше",
)
def get_progression(tag1: str, tag2: str):
    global time_cache, cache
    stack1 = time_compare(tag1) if tag1 not in time_cache.keys() else time_cache[tag1]
    stack2 = time_compare(tag2) if tag2 not in time_cache.keys() else time_cache[tag2]
    date = list(stack1.keys())[1]
    gdp1 = stack1[date]["gdp"]
    gdp2 = stack2[date]["gdp"]
    pop1 = stack1[date]["population"]
    pop2 = stack2[date]["population"]
    per_gdp1 = stack1["gdp_progression"]
    per_gdp2 = stack2["gdp_progression"]
    per_pop1 = stack1["population_progression"]
    per_pop2 = stack2["population_progression"]
    gdp_date = formulas.find_when(gdp1, gdp2, per_gdp1, per_gdp2, date)
    pop_date = formulas.find_when(pop1, pop2, per_pop1, per_pop2, date)
    answer = {}
    answer["start-date"] = date
    if gdp_date == 1:
        gdp_date = "already bigger"
    if gdp_date == -1:
        gdp_date = "never"
    if pop_date == 1:
        pop_date = "already bigger"
    if pop_date == -1:
        pop_date = "never"
    answer["date_to_gdp_compare"] = gdp_date
    answer["date_to_pop_compare"] = pop_date
    return answer


@app.post(
    "/csv_load",
    tags=["Экспорт файлов"],
    summary="Экспорт в csv",
    description="И так ясно",
)
def get_csv(path: str):
    to_csv = []
    data = cache[-1]
    logic.world_goods_price = data["worldmarket"]["price_pool"]
    countries = [
        str(k)
        for k in data.keys()
        if len(str(k)) == 3
        and str(k).isalpha()
        and str(k).isupper()
        and logic.country_exists(tag=k, data=data)
    ]
    countries.sort(key=lambda x: logic.getGDP(x, data), reverse=True)
    for tag in countries:
        gdp = logic.getGDP(tag, data)
        pop = logic.get_population(tag, data)
        gdp_per_capita = logic.get_GDP_per_capita(tag, data)
        money_activity = logic.get_money_activity(tag, data)
        comp = logic.get_Consumption_economy(tag, data)
        ind = logic.indPower(tag, data)
        jini = logic.real_gini(tag, data)
        suppl = logic.getSupply(tag, data)
        empl_fab = logic.get_employed_fabric(tag, data)
        unemploy_fab = logic.fabric_uneployement(tag, data)
        empl_rgo = logic.get_rgo_employed(tag, data)
        unemploy_rgo = logic.rgo_uneployement(tag, data)
        avg_salary = logic.get_avg_salary(tag, data)
        avg_salary_cap = logic.get_avg_capilatils_salary(tag, data)
        all_empl = logic.get_all_employed(tag, data)
        lit = logic.get_literacy(tag, data)
        diver = logic.get_diversification_ind(tag, data)
        mil = logic.get_army_budget(tag, data)
        mil_in = logic.army_innovation(tag, data)
        nav = logic.get_naval_budget(tag, data)
        nav_in = logic.naval_innovation(tag, data)
        money = logic.get_country_savings(tag, data)
        gold = logic.get_gold_mining(tag, data)
        conc = logic.get_concentrate_economy(tag, data)
        subs = logic.get_subside_cost(tag, data)
        subs_ind = logic.get_subside_ind(tag, data)
        profit = logic.get_avg_income_per_fab(tag, data)
        profitability = logic.avg_rentability(tag, data)
        all_work_places = logic.get_all_work_places(tag, data)
        regs = logic.get_country_size(tag, data)
        gdp_per_regs = logic.gdp_per_reg(tag, data)
        pop_per_regs = logic.population_per_reg(tag, data)
        gov_type = logic.get_gov_type(tag, data)
        money_mass = logic.get_money_mass(tag, data)
        avg_savings = logic.get_avg_pop_savings(tag, data)
        bank = logic.get_bank_savings(tag, data)
        to_csv.append(
            [
                tag,
                gdp,
                pop,
                gdp_per_capita,
                money_activity,
                comp,
                ind,
                subs,
                subs_ind,
                profit,
                profitability,
                jini,
                suppl,
                empl_fab,
                unemploy_fab,
                empl_rgo,
                unemploy_rgo,
                avg_salary,
                avg_salary_cap,
                all_empl,
                all_work_places,
                lit,
                diver,
                mil,
                mil_in,
                nav,
                nav_in,
                money,
                gold,
                conc,
                regs,
                gdp_per_regs,
                pop_per_regs,
                gov_type,
                money_mass,
                avg_savings,
                bank,
            ]
        )

    df = pd.DataFrame(
        to_csv,
        columns=[
            "Страна",
            "ВВП",
            "Население",
            "ВВП на душу населения",
            "Скорость обращения накоплений(x100)",
            "Промежуточное потребление",
            "Доля промышленности",
            "Стоимость гос. субсидий",
            "Доля субсируемых предприятий (%)",
            "Средняя доходность предприятия",
            "Средняя рентабельность предприятия (%)",
            "Индекс Джини",
            "Валовый выпуск",
            "Занятость на фабриках",
            "Безработица на заводах",
            "Средняя занятость добывающего сектора",
            "Безработица на добывающем секторе",
            "Средняя з/п рабочего на фабрике",
            "Средний доход капиталиста",
            "Общее число рабочего населения",
            "Количество свободных рабочих мест на фабриках",
            "Грамотность",
            "Диверсифицированность экономики",
            "Наземный бюджет",
            "Иновационность армии",
            "Морской бюджет",
            "Иновационность флота",
            "Золотой запас",
            "Золотодобыча",
            "Доля ввп в 4-x крупнейших регионах",
            "Размер страны в регионах",
            "Экономическая плотность (ввп на регион)",
            "Плотность населения (население на регион)",
            "Тип правления",
            "Общая денежная масса",
            "Средние сбережения населения",
            "Запасы гос.банка",
        ],
    )
    if not os.path.isdir(path):
        os.mkdir(path)
    df.to_csv(path + "economy_stats.csv", index=False)
    return "OK"


if __name__ == "__main__":
    import uvicorn
    import traceback
    import sys

    is_frozen = getattr(sys, "frozen", False)
    try:
        if not is_frozen:
            uvicorn.run(
                "server:app", host="localhost", port=8000, reload=True, log_level="info"
            )
        else:
            from server import app

            uvicorn.run(app, host="localhost", port=8000, log_level="warning")
    except Exception:
        with open("server_error.log", "w") as f:
            f.write(traceback.format_exc())
