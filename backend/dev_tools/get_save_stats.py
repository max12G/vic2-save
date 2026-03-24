import pyradox
import sys
import re
import pandas as pd
import time
import tqdm
import os
import backend.app.logic as logic

sys.setrecursionlimit(1000)


def parse_victoria2_save(file_path):
    try:
        with open(file_path, "r", encoding="windows-1252", errors="ignore") as f:
            content = f.read()

        content = re.sub(r"(bank=-?\d+\.\d+)\d{2}\.\d+", r"\1", content)

        data = pyradox.txt.parse(content)
        return data

    except Exception as e:
        print(f"Ошибка при парсинге: {e}")
        return None


data = parse_victoria2_save("backend\data\siiiey1918_01_11.v2")
world_goods_price = data["worldmarket"]["price_pool"]


logic.data = data
logic.world_goods_price = world_goods_price
all_goods_supply = data["worldmarket"]["supply_pool"]
tot_pop = 0


print(logic.real_gini("RUS"))
time_g = data["date"].split(".")
time_g = int(time_g[0]) * 365 + int(time_g[1]) * 30 + int(time_g[2])
print(f"Дата сохранения: {data['date']} (в днях: {time_g})")
logic.data = data
province_keys = [i for i in data.keys() if isinstance(i, int)]
all_country_tags = [
    tag
    for tag in data.keys()
    if isinstance(tag, str)
    and len(tag) == 3
    and tag.isupper()
    and data[tag].find("state") is not None
]
print(all_country_tags)
all_country_tags.sort(key=logic.getGDP)
print(all_country_tags)
top = []
to_csv = []
print("Предварительная загрузка...")
all_gdp = 0
for tag in tqdm.tqdm(all_country_tags):
    gdp = logic.getGDP(tag)
    pop = logic.get_population(tag)
    tot_pop += pop
    all_gdp += gdp
    top.append((tag, gdp))

(
    tgdp,
    tpop,
    tcomp,
    avgmon,
    avgind,
    avgj,
    tsuppl,
    templ,
    tunempl,
    trgoempl,
    trgounempl,
    avg_sal,
    templ_all,
    avglit,
) = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
totexp, totimp, totmil, totnav = 0, 0, 0, 0
avg_diver, tot_mon = 0, 0
avg_conc, totgold = 0, 0
avg_subs = 0
avg_subs_ind = 0
avg_profit = 0
avg_profitabily = 0
twork = 0
avg_army_in, avg_navy_in = 0, 0
avg_gpr = 0
avg_ppr = 0
tot_reg = 0
avg_cap_sal = 0
t_money_mass = 0
avg_s = 0
tot_bank = 0
templ_all = 0
top.sort(key=lambda x: x[1], reverse=True)
print("Жди...")
a = time.time()
for tag, gdp in tqdm.tqdm(top):
    gdp = logic.getGDP(tag)
    gdp_per = round(gdp / all_gdp * 100, 2)
    pop = logic.get_population(tag)
    pop_per = round(pop / tot_pop * 100, 2)
    gdp_per_capita = logic.get_GDP_per_capita(tag)
    money_activity = logic.get_money_activity(tag)
    comp = logic.get_Consumption_economy(tag)
    ind = logic.indPower(tag)
    jini = logic.real_gini(tag)
    suppl = logic.getSupply(tag)
    empl_fab = logic.get_employed_fabric(tag)
    unemploy_fab = logic.fabric_uneployement(tag)
    empl_rgo = logic.get_rgo_employed(tag)
    unemploy_rgo = logic.rgo_uneployement(tag)
    avg_salary = logic.get_avg_salary(tag)
    avg_salary_cap = logic.get_avg_capilatils_salary(tag)
    all_empl = logic.get_all_employed(tag)
    lit = logic.get_literacy(tag)
    # exp = logic.get_export(tag)
    # imp = logic.get_import(tag)
    diver = logic.get_diversification_ind(tag)
    mil = logic.get_army_budget(tag)
    mil_in = logic.army_innovation(tag)
    nav = logic.get_naval_budget(tag)
    nav_in = logic.naval_innovation(tag)
    money = logic.get_country_savings(tag)
    gold = logic.get_gold_mining(tag)
    conc = logic.get_concentrate_economy(tag)
    subs = logic.get_subside_cost(tag)
    subs_ind = logic.get_subside_ind(tag)
    profit = logic.get_avg_income_per_fab(tag)
    profitability = logic.avg_rentability(tag)
    all_work_places = logic.get_all_work_places(tag)
    regs = logic.get_country_size(tag)
    gdp_per_regs = logic.gdp_per_reg(tag)
    pop_per_regs = logic.population_per_reg(tag)
    gov_type = logic.get_gov_type(tag)
    money_mass = logic.get_money_mass(tag)
    avg_savings = logic.get_avg_pop_savings(tag)
    bank = logic.get_bank_savings(tag)
    # print(gdp_per_regs)
    to_csv.append(
        [
            tag,
            gdp,
            gdp_per,
            pop,
            pop_per,
            gdp_per_capita,
            money_activity,
            comp,
            ind,
            subs,
            subs_ind,
            profit,
            profitability,
            jini,
            # exp,
            # imp,
            # exp - imp,
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
    tgdp += gdp
    tpop += pop
    tcomp += comp
    avgmon += money_activity
    avgind += ind
    avgj += jini
    tsuppl += suppl
    templ += empl_fab
    tunempl += unemploy_fab
    trgoempl += empl_rgo
    trgounempl += unemploy_rgo
    avg_sal += avg_salary
    templ_all += all_empl
    avglit += lit
    # totexp += exp
    # totimp += imp
    avg_diver += diver
    totmil += mil
    totnav += nav
    tot_mon += money
    avg_conc += conc
    totgold += gold
    avg_subs += subs
    avg_subs_ind += subs_ind
    avg_profit += profit
    avg_profitabily += profitability
    twork += all_work_places
    avg_army_in += mil_in
    avg_navy_in += nav_in
    tot_reg += regs
    avg_gpr += gdp_per_regs
    avg_ppr += pop_per_regs
    avg_cap_sal += avg_salary_cap
    t_money_mass += money_mass
    avg_s += avg_savings
    tot_bank += bank

tgdp = round(tgdp, 3)
tpop = round(tpop, 3)
tcomp = round(tcomp, 3)
tsuppl = round(tsuppl, 3)
templ = round(templ, 3)
tunempl = round(tunempl / len(all_country_tags), 3)
trgounempl = round(trgounempl / len(all_country_tags), 3)
avg_gdp_per_reg = round(avg_gpr / len(all_country_tags), 3)
avg_gdp_per_capita = round(tgdp / tpop * 100000, 3)
avgmon = round(avgmon / len(all_country_tags), 3)
avgind = round(avgind / len(all_country_tags), 3)
avgj = round(avgj / len(all_country_tags), 3)
avg_sal = round(avg_sal / len(all_country_tags), 3)
avglit = round(avglit / len(all_country_tags), 3)
avg_diver = round(avg_diver / len(all_country_tags), 3)
tot_mon = round(tot_mon, 3)
avg_conc = round(avg_conc / len(all_country_tags), 3)
avg_army_in = round(avg_army_in / len(all_country_tags), 3)
avg_navy_in = round(avg_navy_in / len(all_country_tags), 3)
totgold = round(totgold, 3)
avg_subs = round(avg_subs / len(all_country_tags), 3)
avg_subs_ind = round(avg_subs_ind / len(all_country_tags), 3)
avg_profit = round(avg_profit / len(all_country_tags), 3)
avg_profitabily = round(avg_profitabily / len(all_country_tags), 3)
avg_cap_sal = round(avg_cap_sal / len(all_country_tags), 3)
avg_ppr = round(avg_ppr / len(all_country_tags), 3)
t_money_mass = round(t_money_mass, 3)
avg_s = round(avg_s / len(all_country_tags), 3)
tot_bank = round(tot_bank, 3)
to_csv.insert(
    0,
    [
        "Глобальные показатели",
        tgdp,
        100,
        tpop,
        100,
        avg_gdp_per_capita,
        avgmon,
        tcomp,
        avgind,
        avg_subs,
        avg_subs_ind,
        avg_profit,
        avg_profitabily,
        avgj,
        tsuppl,
        templ,
        twork,
        tunempl,
        trgoempl,
        trgounempl,
        avg_sal,
        avg_cap_sal,
        templ_all,
        avglit,
        avg_diver,
        totmil,
        avg_army_in,
        totnav,
        avg_navy_in,
        tot_mon,
        totgold,
        avg_conc,
        tot_reg,
        avg_gdp_per_reg,
        avg_ppr,
        "unkwonw",
        t_money_mass,
        avg_s,
        tot_bank,
    ],
)

df = pd.DataFrame(
    to_csv,
    columns=[
        "Страна",
        "ВВП",
        "Отношение к общему ВВП (%)",
        "Население",
        "Отношение к общему населению (%)",
        "ВВП на душу населения",
        "Скорость обращения накоплений(x100)",
        "Промежуточное потребление",
        "Доля промышленности",
        "Стоимость гос. субсидий",
        "Доля субсируемых предприятий (%)",
        "Средняя доходность предприятия",
        "Средняя рентабельность предприятия (%)",
        "Индекс Джини",
        # "Потенциальный экспорт",
        # "Потенциальный импорт",
        # "Торговый баланс",
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


df.to_csv("economy_stats.csv", index=False)
print(time.time() - a)
