import pyradox
import sys
import os
import numpy as np
from backend.app.get_fabric_req import stats
from backend.app.parties import *

countries = []

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)

goverments = {
    "absolute_monarchy": "Абсолютная монархия",
    "hms_government": "Конституционная монархия",
    "prussian_constitutionalism": "Прусский конституцианолизм",
    "democracy": "Демократия",
    "presidential_dictatorship": "Президентская диктатура",
    "proletarian_dictatorship": "Пролетарская диктатура",
    "bourgeois_dictatorship": "Буржуазная диктатура",
    "fascist_dictatorship": "Фашистская диктатура",
}

parties = {
    "communist": "Коммунизм",
    "fascist": "Фашизм",
    "liberal": "Либерализм",
    "conservative": "Консерватизм",
    "reactionary": "Реакционеры",
    "anarcho_liberal": "Анархо-Либералы",
    "socialist": "Социализм",
}

ideology = {
    "absolute_monarchy": "_monarchy",
    "hms_government": "",
    "prussian_constitutionalism": "",
    "democracy": "_republic",
    "presidential_dictatorship": "",
    "proletarian_dictatorship": "_communist",
    "bourgeois_dictatorship": "",
    "fascist_dictatorship": "_fascist",
}

war_id = 0


def text_fix(text):
    if not isinstance(text, str):
        return text
    try:
        return text.encode("latin-13").decode("cp1251")
    except:
        return text


def get_needs_goods(data):
    goods = {}
    if data is None:
        return goods
    for good in data:
        goods[good] = data[good]
    return goods


def get_weights():
    weigshts = {}
    saves_dir = os.path.join(current_dir, "data", "poptypes")
    for file in os.listdir(saves_dir):
        if file.endswith(".txt"):
            with open(
                os.path.join(saves_dir, file),
                "r",
                encoding="windows-1252",
                errors="ignore",
            ) as f:
                pop = file.replace(".txt", "")
                content = f.read()
                data = pyradox_txt.parse(content)
                weigshts[pop] = {}
                weigshts[pop]["base"] = get_needs_goods(data["life_needs"])
                weigshts[pop]["everyday"] = get_needs_goods(data["everyday_needs"])
                weigshts[pop]["luxury"] = get_needs_goods(data["luxury_needs"])
    return weigshts


weights = get_weights()
world_goods_price = {}


def get_subside_cost(tag, data=None):
    if tag not in data:
        return 0
    states = data[tag].find_all("state")
    subside = 0
    for state in states:
        for building in state.find_all("state_buildings"):
            if building["subsidised"]:
                income = building["last_income"]
                spend = building["last_spending"]
                wages = building["pops_paychecks"]
                subs = max(0, spend + wages - income)
                subside += subs

    return round(subside / 1000, 3)


def get_subside_ind(tag, data=None):
    if tag not in data:
        return 0
    states = data[tag].find_all("state")
    subside_c = 0
    all_fab = 0
    for state in states:
        for building in state.find_all("state_buildings"):
            income = building["last_income"]
            spend = building["last_spending"]
            wages = building["pops_paychecks"]
            subs = spend + wages - income
            if building["subsidised"] and subs > 0:
                subside_c += 1
            all_fab += 1
    if all_fab == 0:
        return 0
    return round(subside_c / all_fab * 100, 2)


def get_avg_income_per_fab(tag, data=None):
    if tag not in data:
        return 0
    states = data[tag].find_all("state")
    all_income = 0
    fab = 0
    for state in states:
        for building in state.find_all("state_buildings"):
            income = building["last_income"]
            cost = building["last_spending"]
            if income == 0 and cost == 0:
                continue
            all_income += income - cost
            fab += 1
    if fab == 0:
        return 0
    return round(all_income / fab / 1000, 3)


def get_gold_mining(tag, data=None):

    if tag not in data:
        return 0
    states = data[tag].find_all("state")
    gold = 0
    for state in states:
        prov_ids = list(state.find_all("provinces"))
        for provid in prov_ids:
            province = data[provid]
            if "rgo" in province:
                for rgo in list(province.find_all("rgo")):
                    last_income = rgo["last_income"]
                    if rgo["goods_type"] != "precious_metal":
                        last_income = 0
                    gold += last_income / 1000
    return int(gold)


def get_gdp_per_reg(tag, data=None):

    if tag not in data:
        return 0
    states = data[tag].find_all("state")
    gdp_per_reg = {}
    for state in states:
        gdp = 0
        prov_ids = list(state.find_all("provinces"))
        for provid in prov_ids:
            province = data[provid]
            if "rgo" in province:
                for rgo in list(province.find_all("rgo")):
                    last_income = rgo["last_income"]
                    if rgo["goods_type"] == "precious_metal":
                        last_income = 0
                    gdp += last_income / 1000
            if "artisans" in province:
                for pop in province.find_all("artisans"):
                    income = pop["production_income"]
                    cost = pop["needs_cost"]
                    gdp += max(0, income - cost) / 1000
        for building in state.find_all("state_buildings"):
            income = building["last_income"]
            cost = building["last_spending"]
            gdp += max(0, (income - cost) / 1000)
        gdp_per_reg[state["id"]["id"]] = int(gdp)
    gdp_per_reg = dict(sorted(gdp_per_reg.items(), key=lambda x: x[1], reverse=True))
    return gdp_per_reg


def get_fabric_count(tag, data=None):

    if tag not in data:
        return 0
    states = data[tag].find_all("state")
    total = 0
    for state in states:
        total += len(list(state.find_all("state_buildings")))
            
    return total

def get_concentrate_economy(tag, data=None):
    if tag not in data:
        return 0
    states = list(data[tag].find_all("state"))
    top = min(len(states), 4)
    slov = get_gdp_per_reg(tag, data)
    vals = list(slov.values())
    gdp = getGDP(tag, data)
    if gdp == 0:
        return 0
    return min(round(sum(vals[: top + 1]) / gdp, 3), 1)


def get_employed_fabric(tag, data=None):
    if tag not in data:
        return 0
    states = data[tag].find_all("state")
    pop = 0
    for state in states:
        for building in state.find_all("state_buildings"):
            for employee in building["employment"].find_all("employees"):
                pop += employee["count"]

    return pop


def get_rgo_employed(tag, data=None):

    if tag not in data:
        return 0
    states = data[tag].find_all("state")
    pop = 0
    for state in states:
        prov_ids = list(state.find_all("provinces"))
        for provid in prov_ids:
            province = data[provid]
            if "rgo" in province:
                for employee in province["rgo"]["employment"].find_all("employees"):
                    pop += employee["count"]
    return pop


def getSupply(tag, data=None):

    if tag not in data:
        return 0
    states = data[tag].find_all("state")
    Supply = 0
    for state in states:
        prov_ids = list(state.find_all("provinces"))
        for provid in prov_ids:
            province = data[provid]
            if "rgo" in province:
                for last_income in list(province["rgo"].find_all("last_income")):
                    Supply += last_income / 1000
            if "artisans" in province:
                for pop in province.find_all("artisans"):
                    Supply += pop["production_income"] / 1000

        for building in state.find_all("state_buildings"):
            Supply += building["last_income"] / 1000

    return int(Supply + goverement_gdp(tag, data))


def industirialGDP(tag, data=None):
    if tag not in data:
        return 0
    states = data[tag].find_all("state")
    GDP = 0
    for state in states:
        for building in state.find_all("state_buildings"):
            income = building["last_income"]
            cost = building["last_spending"]
            pay = building["pops_paychecks"]
            GDP += max(0, (income - cost + pay) / 1000)

    return int(GDP)


def GDP_selo(tag, data=None):
    if tag not in data:
        return 0
    states = data[tag].find_all("state")
    GDP = 0
    for state in states:
        prov_ids = list(state.find_all("provinces"))
        for provid in prov_ids:
            province = data[provid]
            if "rgo" in province:
                for rgo in list(province.find_all("rgo")):
                    last_income = rgo["last_income"]
                    if rgo["goods_type"] == "precious_metal":
                        last_income = 0
                    GDP += last_income / 1000
            if "artisans" in province:
                for pop in province.find_all("artisans"):
                    income = pop["production_income"]
                    cost = pop["needs_cost"]
                    GDP += max(0, income - cost) / 1000
    return int(GDP)


def goverement_gdp(tag, data=None):
    if tag not in data:
        return 0
    mil = data[tag]["military_spending"]["maxValue"] / 1000
    edu = data[tag]["education_spending"]["maxValue"] / 1000
    soc = data[tag]["social_spending"]["maxValue"] / 1000
    adm = data[tag]["crime_fighting"]["maxValue"] / 1000
    army = get_army_budget(tag, data)
    nav = get_naval_budget(tag, data)
    return mil + edu + soc + adm + army + nav


def getGDP(tag, data=None):
    return int(industirialGDP(tag, data) + GDP_selo(tag, data))


def indPower(tag, data=None):

    if tag not in data:
        return 0
    gdp = getGDP(tag, data)
    if gdp == 0:
        return 0
    return round(industirialGDP(tag, data) / gdp, 2)


def get_population(tag, data=None):

    if tag not in data:
        return 0

    pop_types = [
        "farmers",
        "labourers",
        "artisans",
        "clergymen",
        "clerks",
        "bureaucrats",
        "soldiers",
        "officers",
        "aristocrats",
        "capitalists",
        "slaves",
        "serfs",
        "craftsmen",
    ]

    States = data[tag].find_all("state")
    all_population = 0
    for state in States:
        prov_ids = list(state.find_all("provinces"))
        for provid in prov_ids:
            province = data[provid]
            for pop_type in pop_types:
                all_pops = province.find_all(pop_type)
                for pop in all_pops:
                    all_population += pop["size"]
    return all_population * 4


def get_literacy(tag, data=None):

    if tag not in data:
        return 0

    pop_types = [
        "farmers",
        "labourers",
        "artisans",
        "clergymen",
        "clerks",
        "bureaucrats",
        "soldiers",
        "officers",
        "aristocrats",
        "capitalists",
        "slaves",
        "serfs",
        "craftsmen",
    ]

    States = data[tag].find_all("state")
    lit = 0
    for state in States:
        prov_ids = list(state.find_all("provinces"))
        for provid in prov_ids:
            province = data[provid]
            for pop_type in pop_types:
                all_pops = province.find_all(pop_type)
                for pop in all_pops:
                    lit += pop["literacy"] * pop["size"]
    if lit == 0:
        return 0
    return round(lit / get_population(tag, data) * 400, 2)


def get_literacy_metropolian(tag, data=None):
    if tag not in data:
        return 0

    pop_types = [
        "farmers",
        "labourers",
        "artisans",
        "clergymen",
        "clerks",
        "bureaucrats",
        "soldiers",
        "officers",
        "aristocrats",
        "capitalists",
        "slaves",
        "serfs",
        "craftsmen",
    ]

    States = data[tag].find_all("state")
    lit = 0
    for state in States:
        prov_ids = list(state.find_all("provinces"))
        for provid in prov_ids:
            province = data[provid]
            for pop_type in pop_types:
                all_pops = province.find_all(pop_type)
                for pop in all_pops:
                    lit += pop["literacy"] * pop["size"]
    if lit == 0:
        return 0
    return round(lit / get_population(tag, data) * 400, 2)


def get_GDP_per_capita(tag, data=None):
    gdp = getGDP(tag, data)
    population = get_population(tag, data)
    if population == 0:
        return 0
    return round(gdp / population * 100000, 3)


def get_fab_efficiency(tag, data=None):
    if tag not in data:
        return 0
    all_naval_techs = [
        "post_nelsonian_thought",
        "naval_professionalism",
        "naval_decision_making",
        "naval_risk_management",
        "naval_staff_system",
        "naval_plans",
        "clipper_design",
        "steamers",
        "iron_steamers",
        "steel_steamers",
        "steam_turbine_ships",
        "oil_driven_ships",
        "fire_control_systems",
        "weapon_platforms",
        "main_armament",
        "advanced_naval_ordnance",
        "long_range_fire_control",
        "heavy_armament",
        "naval_design_bureaus",
        "advanced_naval_design",
        "modern_naval_design",
        "naval_engineering",
        "naval_architecture",
        "dreadnought_design",
        "alphabetic_flag_signaling",
        "the_command_principle",
        "naval_logistics",
        "naval_intelligence",
        "naval_communications",
        "naval_coordination",
    ]
    country = data[tag]
    techs = country["technology"]
    count = 0
    for tech in techs:
        if tech in all_naval_techs:
            count += 1
    return count


def get_Consumption_economy(tag, data=None):

    if tag not in data:
        return 0
    states = data[tag].find_all("state")
    Consumption = 0
    for state in states:
        prov_ids = list(state.find_all("provinces"))
        for provid in prov_ids:
            province = data[provid]
            if "artisans" in province:
                for pop in province.find_all("artisans"):
                    cost = pop["needs_cost"]
                    Consumption += cost / 1000

        for building in state.find_all("state_buildings"):
            cost = building["last_spending"]
            Consumption += cost / 1000

    return int(Consumption)


def get_all_pop_money(tag, data=None):
    if tag not in data:
        return 0
    states = data[tag].find_all("state")
    pop_types = [
        "farmers",
        "labourers",
        "artisans",
        "clergymen",
        "clerks",
        "bureaucrats",
        "soldiers",
        "officers",
        "aristocrats",
        "capitalists",
        "slaves",
        "serfs",
        "craftsmen",
    ]
    all_money = 0
    for state in states:
        prov_ids = list(state.find_all("provinces"))
        for provid in prov_ids:
            province = data[provid]
            for pop in pop_types:
                for popul in province.find_all(pop):
                    money = popul["money"]
                    if money is None:
                        money = 0
                    all_money += money / 1000

    return int(all_money)


def get_money_activity(tag, data=None):

    gdp = getGDP(tag, data)
    all_money = get_money_mass(tag, data)
    if all_money == 0:
        return 0
    return round(gdp / all_money * 100, 3)


def getAvgRich(tag, data=None):
    pop_types = ["aristocrats", "capitalists"]
    States = data[tag].find_all("state")
    all_population = 0
    for state in States:
        prov_ids = list(state.find_all("provinces"))
        for provid in prov_ids:
            province = data[provid]
            for pop_type in pop_types:
                all_pops = province.find_all(pop_type)
                for pop in all_pops:
                    all_population += pop["size"]
    return all_population * 4


def getlifecost():
    base_cost = (
        0.1 * world_goods_price["wool"]
        + 0.1 * world_goods_price["fish"]
        + 0.1 * world_goods_price["fruit"]
        + 0.1 * world_goods_price["cattle"]
        + 0.4 * world_goods_price["grain"]
    )
    base_cost /= 1000
    mid_cost = (
        0.03 * world_goods_price["coal"]
        + 0.03 * world_goods_price["glass"]
        + 0.16 * world_goods_price["paper"]
        + 0.1 * world_goods_price["tobacco"]
        + 0.16 * world_goods_price["tea"]
        + 0.16 * world_goods_price["liquor"]
        + 0.16 * world_goods_price["regular_clothes"]
        + 0.13 * world_goods_price["furniture"]
    )
    mid_cost /= 1000
    if "aeroplanes" not in world_goods_price:
        world_goods_price["aeroplanes"] = 0
    if "fuel" not in world_goods_price:
        world_goods_price["fuel"] = 0
    if "automobiles" not in world_goods_price:
        world_goods_price["automobiles"] = 0
    if "telephones" not in world_goods_price:
        world_goods_price["telephones"] = 0
    if "radio" not in world_goods_price:
        world_goods_price["radio"] = 0
    luxury_cost = (
        0.01 * world_goods_price["aeroplanes"]
        + 0.01 * world_goods_price["fuel"]
        + 0.06 * world_goods_price["coffee"]
        + 0.03 * world_goods_price["opium"]
        + 0.03 * world_goods_price["automobiles"]
        + 0.04 * world_goods_price["telephones"]
        + 0.32 * world_goods_price["wine"]
        + 0.03 * world_goods_price["luxury_clothes"]
        + 0.03 * world_goods_price["radio"]
        + 0.03 * world_goods_price["luxury_furniture"]
    )
    luxury_cost /= 1000
    return round(base_cost, 6), round(mid_cost, 6), round(luxury_cost, 6)


def getpopsize(pop, tag, data=None):
    if tag not in data:
        return 0
    states = data[tag].find_all("state")
    total_population = 0
    for state in states:
        prov_ids = list(state.find_all("provinces"))
        for provid in prov_ids:
            province = data[provid]
            for popul in province.find_all(pop):
                population = popul["size"]
                total_population += population

    return total_population


def avgpopspending(pop, tag, data=None):
    if tag not in data:
        return 0
    base_cost, mid_cost, luxury_cost = getlifecost()
    states = data[tag].find_all("state")
    total_spending = 0
    total_population = getpopsize(pop, tag, data)
    if total_population == 0:
        return 0
    for state in states:
        prov_ids = list(state.find_all("provinces"))
        for provid in prov_ids:
            province = data[provid]
            for popul in province.find_all(pop):
                if "life_needs" not in popul:
                    base = 1
                else:
                    base = popul["life_needs"]
                if "everyday_needs" not in popul:
                    mid = 1
                else:
                    mid = popul["everyday_needs"]
                if "luxury_needs" not in popul:
                    luxury = 1
                else:
                    luxury = popul["luxury_needs"]
                if pop == "slaves":
                    mid = 0
                    luxury = 0
                population = popul["size"]
                total_spending += (
                    (population * base * base_cost)
                    + (population * mid * mid_cost)
                    + (population * luxury * luxury_cost)
                )

    return round(total_spending / total_population * 1000, 2)


def fabric_uneployement(tag, data=None):
    all_empl = getpopsize("craftsmen", tag, data) + getpopsize("clerks", tag, data)
    if all_empl == 0:
        return 0
    return round((all_empl - get_employed_fabric(tag, data)) / all_empl * 100, 2)


def rgo_uneployement(tag, data=None):
    return max(
        0,
        round(
            (
                getpopsize("farmers", tag, data)
                + getpopsize("labourers", tag, data)
                + getpopsize("slaves", tag, data)
                - get_rgo_employed(tag, data)
            )
            / (
                getpopsize("farmers", tag, data)
                + getpopsize("labourers", tag, data)
                + getpopsize("slaves", tag, data) * 100
                + 1
            ),
            2,
        ),
    )


def get_fabric_salary_spendings(tag, data=None):

    if tag not in data:
        return 0
    states = data[tag].find_all("state")
    salary = 0
    for state in states:
        for building in state.find_all("state_buildings"):
            sal = building["pops_paychecks"]
            salary += sal * 10

    return salary


def get_all_employed(tag, data=None):
    return get_employed_fabric(tag, data) + get_rgo_employed(tag, data)


def get_avg_salary(tag, data=None):
    fabric_employee = get_employed_fabric(tag, data)
    if fabric_employee == 0:
        return 0
    return round(get_fabric_salary_spendings(tag, data) / fabric_employee / 2, 3)


def get_avg_capilatils_salary(tag, data=None):
    if tag not in data:
        return 0
    states = data[tag].find_all("state")
    salary = 0
    for state in states:
        for building in state.find_all("state_buildings"):
            sal = building["pops_paychecks"]
            salary += (
                sal * 10 + (building["last_income"] - building["last_spending"]) / 100
            )

    return round(
        (
            salary / getpopsize("capitalists", tag, data)
            if getpopsize("capitalists", tag, data) > 0
            else 0
        ),
        1,
    )


def get_economy_producing_podrobno(tag, data=None):
    if tag not in data:
        return (0, 0)
    states = data[tag].find_all("state")
    good_produce = {}
    goods_pricing = {}
    for state in states:
        prov_ids = list(state.find_all("provinces"))
        for provid in prov_ids:
            province = data[provid]
            if "rgo" in province:
                good = province["rgo"]["goods_type"]
                good_produce[good] = good_produce.get(good, 0) + (
                    province["rgo"]["last_income"] / world_goods_price[good] / 1000
                )
                goods_pricing[good] = goods_pricing.get(good, 0) + (
                    province["rgo"]["last_income"] / 1000
                )
            if "artisans" in province:
                for pop in province.find_all("artisans"):
                    tot = 0
                    type_p = pop["production_type"]
                    if type_p is None:
                        continue
                    good = type_p.replace("artisan_", "")
                    if good == "winery":
                        good = "wine"
                    if good == "steamer":
                        good = "steamer_convoy"
                    if good == "clipper":
                        good = "clipper_convoy"
                    if good == "automobile":
                        good = "automobiles"
                    if good == "aeroplane":
                        good = "aeroplanes"
                    if good == "telephone":
                        good = "telephones"
                    if good == "barrel":
                        good = "barrels"

                    good_produce[good] = good_produce.get(good, 0) + (
                        pop["current_producing"] / 1000
                    )
                    goods_pricing[good] = goods_pricing.get(good, 0) + (
                        pop["current_producing"] * world_goods_price[good] / 1000
                    )
        for building in state.find_all("state_buildings"):
            name = building["building"]
            real_income = building["last_income"]
            fab_stats = stats.get(name, None)
            good = list(fab_stats[1].keys())[0]
            amount = real_income / world_goods_price[good]
            good_produce[good] = good_produce.get(good, 0) + amount
            goods_pricing[good] = goods_pricing.get(good, 0) + (
                amount * world_goods_price[good] / 1000
            )
    if goods_pricing == {}:
        return (0, 0)
    return good_produce, goods_pricing


def get_economy_demand_podrobno(tag, data=None):
    if tag not in data:
        return 0
    states = data[tag].find_all("state")
    good_demand = {}
    goods_pricing = {}
    for state in states:
        prov_ids = list(state.find_all("provinces"))
        for provid in prov_ids:
            province = data[provid]
            for pop in province.find_all("artisans"):
                needs = pop["need"]
                if needs is None:
                    continue
                goods = [
                    "cotton",
                    "machine_parts",
                    "timber",
                    "fabric",
                    "grain",
                    "cement",
                    "fish",
                    "furniture",
                    "steamer_convoy",
                    "tobacco",
                    "luxury_clothes",
                    "regular_clothes",
                    "luxury_furniture",
                    "automobiles",
                    "electric_gear",
                    "wine",
                    "coal",
                    "fertilizer",
                    "ammunition",
                    "glass",
                    "canned_food",
                    "small_arms",
                    "liquor",
                    "tea",
                    "silk",
                    "explosives",
                    "steel",
                    "aeroplanes",
                    "artillery",
                    "telephones",
                    "precious_metal",
                    "lumber",
                    "paper",
                    "iron",
                    "dye",
                    "sulphur",
                    "fuel",
                    "oil",
                    "coffee",
                    "fruit",
                    "tropical_wood",
                    "rubber",
                    "opium",
                ]
                g_needs = []
                for good in goods:
                    if needs[good] is None:
                        continue
                    g_needs.append(good)

                if needs is None:
                    continue
                real_spending = pop["needs_cost"] / 1000
                total_inp = sum(needs[g] * world_goods_price[g] for g in g_needs)
                for good in needs:
                    share = (
                        (needs[good] * world_goods_price[good]) / total_inp
                        if total_inp
                        else 0
                    )
                    good_demand[good] = (
                        good_demand.get(good, 0)
                        + real_spending * share / world_goods_price[good]
                    )
                    goods_pricing[good] = (
                        goods_pricing.get(good, 0) + real_spending * share
                    )

        for building in state.find_all("state_buildings"):
            name = building["building"]
            real_spending = building["last_spending"] / 1000
            fab_stats = stats.get(name, None)
            inp = fab_stats[0]
            total_inp = sum(inp.values())
            for good in inp:
                share = inp[good] / total_inp if total_inp else 0
                good_demand[good] = (
                    good_demand.get(good, 0)
                    + real_spending * share / world_goods_price[good]
                )
                goods_pricing[good] = goods_pricing.get(good, 0) + real_spending * share

    return good_demand, goods_pricing


def get_export(tag, data=None):
    if tag not in data:
        return 0
    demand = get_economy_demand_podrobno(tag, data)[1]
    prod = get_economy_producing_podrobno(tag, data)[1]
    export = 0
    for good in world_goods_price:
        dem = demand.get(good, 0)
        sup = prod.get(good, 0)
        export += max(sup - dem, 0)

    return int(export)


def get_import(tag):
    if tag not in data:
        return 0
    demand = get_economy_demand_podrobno(tag, data)[1]
    prod = get_economy_producing_podrobno(tag, data)[1]
    import_t = 0
    for good in world_goods_price:
        dem = demand.get(good, 0)
        sup = prod.get(good, 0)
        import_t += max(dem - sup, 0)

    return int(import_t)


def get_trade_balance(tag, data=None):
    return get_export(tag, data) - get_import(tag, data)


def get_army_budget(tag, data=None):
    if tag not in data:
        return 0
    supply = data[tag]["land_supply_cost"]
    cost = 0
    if supply is None:
        return 0
    for good in supply:
        cost += supply[good] * world_goods_price[good]
    return int(cost)


def get_naval_budget(tag, data=None):
    if tag not in data:
        return 0
    supply = data[tag]["naval_supply_cost"]
    cost = 0
    if supply is None:
        return 0
    for good in supply:
        cost += supply[good] * world_goods_price[good]
    return int(cost)


def get_diversification_ind(tag, data=None):
    res = get_economy_producing_podrobno(tag, data)[1]
    if res == {} or res == 0:
        return 0
    top3 = sorted(res.items(), key=lambda x: x[1], reverse=True)[:3]
    total = 0
    for _, amount in top3:
        total += amount
    if total == 0:
        return 0
    return round(getSupply(tag, data) / total, 3)


def sum_vals(d):
    total = 0
    for key in d:
        total += d[key]
    return total


def get_country_savings(tag, data=None):
    if tag not in data:
        return 0
    money = data[tag]["money"]
    return round(money, 3)


def get_tax(tag, data=None):
    if tag not in data:
        return 0
    country = data[tag]
    taxes = {}
    for tax_type in ["rich_tax", "middle_tax", "poor_tax"]:
        s = country[tax_type]["total"] / 1000
        taxes[tax_type] = s
    return taxes


def average_spendings(tag, data=None):
    if tag not in data:
        return 0
    spendings = {"rich": 0, "middle": 0, "poor": 0}
    rich_pops = ["aristocrats", "capitalists", "officers"]
    taxes = get_tax(tag, data)
    rich_population = 0
    for pop in rich_pops:
        rich_population += getpopsize(pop, tag)
    spendings["rich"] = (
        taxes["rich_tax"] / rich_population if rich_population > 0 else 0
    )
    mid_pops = ["clerks", "artisans", "bureaucrats", "officers", "clergymen"]
    mid_population = 0
    for pop in mid_pops:
        mid_population += getpopsize(pop, tag)
    spendings["middle"] = (
        taxes["middle_tax"] / mid_population if mid_population > 0 else 0
    )
    poor_pops = ["farmers", "laborers", "slaves", "soldiers", "craftsmen"]
    poor_population = 0
    for pop in poor_pops:
        poor_population += getpopsize(pop, tag)
    spendings["poor"] = (
        taxes["poor_tax"] / poor_population if poor_population > 0 else 0
    )
    return spendings


def jinny_ind(tag, data=None):
    if tag not in data:
        return 0
    spends = average_spendings(tag, data)
    rich_avg = spends["rich"]
    taxes = get_tax(tag, data)
    all_taxes = sum_vals(taxes)
    all_avg = (
        all_taxes / get_population(tag, data) if get_population(tag, data) > 0 else 0
    )
    if all_taxes == 0:
        return 0
    return round(rich_avg / all_avg, 3)


def amortization(tag, data=None):
    pass


def avg_rentability(tag, data=None):
    if tag not in data:
        return 0
    states = data[tag].find_all("state")
    all_income = 0
    fab = 0
    total_profit = 0
    total_cost = 0
    for state in states:
        for building in state.find_all("state_buildings"):
            income = building["last_income"]
            cost = building["last_spending"]
            if income == 0 and cost == 0:
                continue
            total_profit += income - cost
            total_cost += cost
            fab += 1
    if fab == 0:
        return 0
    if total_cost == 0:
        return 0
    return round(total_profit / total_cost * 100, 1)


def get_gdp_added_value(tag, data=None):
    pass


def get_all_work_places(tag, data=None):
    if tag not in data:
        return 0
    states = data[tag].find_all("state")
    all_work_pops = get_employed_fabric(tag, data)
    new_places = 0
    for state in states:
        for building in state.find_all("state_buildings"):
            new_places += (building["level"] + 1) * 10000
    return new_places - all_work_pops


def prom_innovation(tag, data=None):
    if tag not in data:
        return 0
    tech_list = [
        "water_wheel_power",
        "practical_steam_engine",
        "high_n_low_pressure_steam_engines",
        "steam_turbine",
        "combustion_engine",
        "electrical_power_generation",
        "publishing_industry",
        "mechanical_production",
        "interchangeable_parts",
        "semi_automatization",
        "assembly_line",
        "shift_work",
        "mechanized_mining",
        "clean_coal",
        "cheap_iron",
        "cheap_steel",
        "advanced_metallurgy",
        "electric_furnace",
        "experimental_railroad",
        "early_railroad",
        "iron_railroad",
        "steel_railroad",
        "integral_rail_system",
        "limited_access_roads",
        "basic_chemistry",
        "medicine",
        "inorganic_chemistry",
        "organic_chemistry",
        "electricity",
        "synthetic_polymers"
    ]
    country = data[tag]
    techs = country["technology"]
    count = 0
    for tech in techs:
        if tech in tech_list:
            count += 1
    return count


def commercial_innovation(tag, data=None):
    if tag not in data:
        return 0
    tech_list = [
        "private_banks",
        "stock_exchange",
        "business_banks",
        "investment_banks",
        "bank_inspection_board",
        "mutual_funds",
        "no_standard",
        "ad_hoc_money_bill_printing",
        "private_bank_money_bill_printing",
        "central_bank_money_bill_printing",
        "modern_central_bank_system",
        "market_determined_exchange_rates",
        "early_classical_theory_and_critique",
        "late_classical_theory",
        "collectivist_theory",
        "the_historical_theory",
        "neoclassical_theory",
        "keynesian_economics",
        "freedom_of_trade",
        "market_structure",
        "business_regulations",
        "market_regulations",
        "economic_responsibility",
        "government_interventionism",
        "guild_based_production",
        "organized_factories",
        "scientific_management",
        "time_saving_measures",
        "management_strategy",
        "organizational_development"
        ]
    country = data[tag]
    techs = country["technology"]
    count = 0
    for tech in techs:
        if tech in tech_list:
            count += 1
    return count


def army_innovation(tag, data=None):
    if tag not in data:
        return 0
    tech_list = [
        "post_napoleonic_thought",
        "strategic_mobility",
        "point_defense_system",
        "deep_defense_system",
        "infiltration",
        "flintlock_rifles",
        "muzzle_loaded_rifles",
        "breech_loaded_rifles",
        "machine_guns",
        "bolt_action_rifles",
        "bronze_muzzle_loaded_artillery",
        "iron_muzzle_loaded_artillery",
        "iron_breech_loaded_artillery",
        "steel_breech_loaded_artillery",
        "military_staff_system",
        "military_plans",
        "army_command_principle",
        "army_professionalism",
        "army_decision_making",
        "army_risk_management",
    ]
    country = data[tag]
    techs = country["technology"]
    count = 0
    for tech in techs:
        if tech in tech_list:
            count += 1
    return count


def naval_innovation(tag, data=None):
    if tag not in data:
        return 0
    all_naval_techs = [
        "post_nelsonian_thought",
        "naval_professionalism",
        "naval_decision_making",
        "naval_risk_management",
        "naval_staff_system",
        "naval_plans",
        "clipper_design",
        "steamers",
        "iron_steamers",
        "steel_steamers",
        "steam_turbine_ships",
        "oil_driven_ships",
        "fire_control_systems",
        "weapon_platforms",
        "main_armament",
        "advanced_naval_ordnance",
        "long_range_fire_control",
        "heavy_armament",
        "naval_design_bureaus",
        "advanced_naval_design",
        "modern_naval_design",
        "naval_engineering",
        "naval_architecture",
        "dreadnought_design",
        "alphabetic_flag_signaling",
        "the_command_principle",
        "naval_logistics",
        "naval_intelligence",
        "naval_communications",
        "naval_coordination",
    ]
    country = data[tag]
    techs = country["technology"]
    count = 0
    for tech in techs:
        if tech in all_naval_techs:
            count += 1
    return count


def real_gini(tag, data=None):
    if tag not in data:
        return 0

    all_money = get_all_pop_money(tag, data)
    all_pop = get_population(tag, data)

    pop_types = [
        "farmers",
        "labourers",
        "artisans",
        "clergymen",
        "clerks",
        "bureaucrats",
        "soldiers",
        "officers",
        "aristocrats",
        "capitalists",
        "slaves",
        "serfs",
        "craftsmen",
    ]
    lorenz = []

    states = data[tag].find_all("state")
    for state in states:
        prov_ids = list(state.find_all("provinces"))
        for provid in prov_ids:
            province = data[provid]
            for pop_type in pop_types:
                all_pops = province.find_all(pop_type)
                for pop in all_pops:
                    size_per = pop["size"] / all_pop * 100
                    if all_money == 0:
                        continue
                    money_per = pop["money"] / all_money * 100
                    if money_per == 0:
                        continue
                    lorenz.append((size_per, money_per))
    lorenz = sorted(lorenz, key=lambda x: x[1] / x[0])
    pop_sizes = np.array([x[0] for x in lorenz])
    wealth = np.array([x[1] for x in lorenz])
    cumulative_pop = np.cumsum(pop_sizes) / np.sum(pop_sizes)
    cumulative_wealth = np.cumsum(wealth) / np.sum(wealth)
    area = np.trapezoid(cumulative_wealth, cumulative_pop)

    return round(1 - 2 * area, 3)


def get_military_spendings(tag, data=None):
    if tag not in data:
        return 0
    spendings = data[tag]["military_spending"]["maxValue"]
    population = 0
    states = data[tag].find_all("state")
    pops = ["soldiers", "officers"]
    for state in states:
        prov_ids = list(state.find_all("provinces"))
        for provid in prov_ids:
            for pop in pops:
                for popul in data[provid].find_all(pop):
                    population += popul["size"]
    if population == 0:
        return 0
    return round(spendings / population, 3)


def get_country_size(tag, data=None):
    if tag not in data:
        return 0
    states = list(data[tag].find_all("state"))
    return len(states)


def gdp_per_reg(tag, data=None):
    if tag not in data:
        return 0
    return round(getGDP(tag, data) / get_country_size(tag, data), 3)


def population_per_reg(tag, data=None):
    if tag not in data:
        return 0
    return int(get_population(tag, data) / get_country_size(tag, data))


def get_gov_type(tag, data=None):
    if tag not in data:
        return "unknown"
    gov = data[tag]["government"]
    if gov is None:
        return "unknown"
    return goverments[gov]


def get_upper_house(tag, data=None):
    if tag not in data:
        return "unknown"
    country = data[tag]
    upper_house = country["upper_house"]
    stats = {}
    for party in upper_house:
        name = parties[party]
        stats[name] = upper_house[party]
    return stats


def get_ruling_patry(tag, data=None):
    stats = get_upper_house(tag, data)
    stats = sorted(stats.items(), key=lambda x: x[1], reverse=True)
    return stats[0][0]


def get_money_mass(tag, data=None):
    if tag not in data:
        return 0
    gov_money = get_country_savings(tag, data)
    pop_money = get_all_pop_money(tag, data)
    bank = get_bank_savings(tag, data)
    return round(gov_money + pop_money + bank, 3)


def get_avg_pop_savings(tag, data=None):
    if tag not in data:
        return 0
    all_pop_money = get_all_pop_money(tag, data)
    population = get_population(tag, data)
    if population == 0:
        return 0
    return round(all_pop_money / population * 1000, 3)


def get_bank_savings(tag, data=None):
    if tag not in data:
        return 0
    bank = data[tag]["bank"]
    return round(bank["money"] + bank["money_lent"], 2)


def get_all_mil_budget(tag, data=None):
    return get_army_budget(tag, data=None) + get_naval_budget(tag, data=None)


def get_pop_spendings(tag, data=None):
    pass


def country_exists(tag, data=None):
    return get_country_size(tag, data) != 0


def calculate_active_wars(data=None):
    global war_id
    all_wars = {}
    melee_types = [
        "artillery",
        "dragoon",
        "infantry",
        "tank",
        "engineer",
        "hussar",
        "irregular",
    ]
    for war in data.find_all("active_war"):
        start_date, end_date = 0, 0
        fl = True
        war_dict = {}
        attackers = [war["original_attacker"]]
        defenders = [war["original_defender"]]
        biggest_battle_army = None
        mx_army = 0
        biggest_battle_navy = None
        mx_fleet = 0
        attack_loses = {}
        defend_loses = {}
        war_dict["id"] = war_id
        war_dict["name"] = war["name"]
        history = war["history"]
        fleet_cas_atk = 0
        fleet_cas_def = 0
        for date in history:
            if date != "battle":
                if fl:
                    start_date = date
                    fl = 0
                end_date = date
            event = history[date]
            if isinstance(event, str):
                continue
            if (
                "add_attacker" in event.keys()
                and event["add_attacker"] not in attackers
            ):
                attackers.append(event["add_attacker"])
            if (
                "add_defender" in event.keys()
                and event["add_defender"] not in defenders
            ):
                defenders.append(event["add_defender"])
            if "battle" in event.keys():
                for battle in event.find_all("battle"):
                    attacker = battle["attacker"]
                    attack_loses[attacker["country"]] = (
                        attack_loses.get(attacker["country"], 0)
                        + attacker["losses"] * 4
                    )
                    defender = battle["defender"]
                    defend_loses[defender["country"]] = (
                        defend_loses.get(defender["country"], 0)
                        + defender["losses"] * 4
                    )
        for battle in history.find_all("battle"):
            attacker = battle["attacker"]
            if set(battle["attacker"]) & set(melee_types):
                attack_loses[attacker["country"]] = (
                    attack_loses.get(attacker["country"], 0) + attacker["losses"] * 4
                )
                defender = battle["defender"]
                defend_loses[defender["country"]] = (
                    defend_loses.get(defender["country"], 0) + defender["losses"] * 4
                )
                tot = sum_battle_units(battle)
                print(tot)
                if tot > mx_army:
                    mx_army = tot
                    biggest_battle_army = battle
            else:
                fleet_cas_atk += battle["attacker"]["losses"]
                fleet_cas_def += battle["defender"]["losses"]
                tot = sum_battle_units(battle)
                if tot > mx_fleet:
                    mx_fleet = tot
                    biggest_battle_navy = battle
        war_dict["start_date"] = str(start_date)
        war_dict["end_date"] = str(end_date)
        war_dict["casualites_atk"] = attack_loses
        war_dict["casualites_def"] = defend_loses
        war_dict["fleet_casualites_atk"] = fleet_cas_atk
        war_dict["fleet_casualites_def"] = fleet_cas_def
        war_dict["biggest_land_battle"] = biggest_battle_army
        war_dict["biggest_sea_battle"] = biggest_battle_navy
        war_dict["attackers"] = list(set(attack_loses.keys()) | set(attackers))
        war_dict["defenders"] = list(set(defend_loses.keys()) | set(defenders))
        war_dict["total_losses"] = calculate_all_casualites(war_dict)
        if defend_loses != {} and attack_loses != {}:
            all_wars[war_id] = war_dict
            war_id += 1

    return all_wars


def sum_battle_units(battle):
    total = 0
    forbidden = ["country", "leader", "losses"]
    for key, value in battle["attacker"].items():
        if key in forbidden:
            continue
        total += value
    for key, value in battle["defender"].items():
        if key in forbidden:
            continue
        total += value

    return total


def calculate_previous_wars(data=None):
    global war_id
    all_wars = {}
    melee_types = [
        "artillery",
        "dragoon",
        "infantry",
        "tank",
        "engineer",
        "hussar",
        "irregular",
    ]
    for war in data.find_all("previous_war"):
        start_date, end_date = 0, 0
        fl = True
        war_dict = {}
        attackers = [war["original_attacker"]]
        defenders = [war["original_defender"]]
        biggest_battle_army = None
        mx_army = 0
        biggest_battle_navy = None
        mx_fleet = 0
        attack_loses = {}
        defend_loses = {}
        war_dict["id"] = war_id
        war_dict["name"] = war["name"]
        history = war["history"]
        fleet_cas_atk = 0
        fleet_cas_def = 0
        for date in history:
            if date != "battle":
                if fl:
                    start_date = date
                    fl = 0
                end_date = date
            event = history[date]
            if isinstance(event, str):
                continue
            if (
                "add_attacker" in event.keys()
                and event["add_attacker"] not in attackers
            ):
                attackers.append(event["add_attacker"])
            if (
                "add_defender" in event.keys()
                and event["add_defender"] not in defenders
            ):
                defenders.append(event["add_defender"])
            if "battle" in event.keys():
                for battle in event.find_all("battle"):
                    attacker = battle["attacker"]
                    attack_loses[attacker["country"]] = (
                        attack_loses.get(attacker["country"], 0)
                        + attacker["losses"] * 4
                    )
                    defender = battle["defender"]
                    defend_loses[defender["country"]] = (
                        defend_loses.get(defender["country"], 0)
                        + defender["losses"] * 4
                    )
        for battle in history.find_all("battle"):
            attacker = battle["attacker"]
            if set(battle["attacker"]) & set(melee_types):
                attack_loses[attacker["country"]] = (
                    attack_loses.get(attacker["country"], 0) + attacker["losses"] * 4
                )
                defender = battle["defender"]
                defend_loses[defender["country"]] = (
                    defend_loses.get(defender["country"], 0) + defender["losses"] * 4
                )
                tot = sum_battle_units(battle)
                print(tot)
                if tot > mx_army:
                    mx_army = tot
                    biggest_battle_army = battle
            else:
                fleet_cas_atk += battle["attacker"]["losses"]
                fleet_cas_def += battle["defender"]["losses"]
                tot = sum_battle_units(battle)
                if tot > mx_fleet:
                    mx_fleet = tot
                    biggest_battle_navy = battle
        war_dict["start_date"] = str(start_date)
        war_dict["end_date"] = str(end_date)
        war_dict["casualites_atk"] = attack_loses
        war_dict["casualites_def"] = defend_loses
        war_dict["fleet_casualites_atk"] = fleet_cas_atk
        war_dict["fleet_casualites_def"] = fleet_cas_def
        war_dict["biggest_land_battle"] = biggest_battle_army
        war_dict["biggest_sea_battle"] = biggest_battle_navy
        war_dict["attackers"] = list(set(attack_loses.keys()) | set(attackers))
        war_dict["defenders"] = list(set(defend_loses.keys()) | set(defenders))
        war_dict["total_losses"] = calculate_all_casualites(war_dict)
        if defend_loses != {} and attack_loses != {}:
            all_wars[war_id] = war_dict
            war_id += 1

    return all_wars


def get_country_war_status(tag, data=None):
    if data is None:
        return 0
    wars = calculate_active_wars(data)
    countries = []
    for war in wars.values():
        countries.extend(war["attackers"])
        countries.extend(war["defenders"])

    return int(tag in countries)


def find_all_prev_wars_tag(tag, data):
    wars = calculate_previous_wars(data)
    all_wars = {}
    for id, war in wars.items():
        all_tags = war["attackers"] + war["defenders"]
        if tag in all_tags:
            all_wars[id] = war
    return all_wars


def calculate_all_casualites(war):
    return sum(war["casualites_atk"].values()) + sum(war["casualites_def"].values())


def country_war_history(tag, data):
    wars = find_all_prev_wars_tag(tag, data)
    total_losses = 0
    for _, war in wars.items():
        if tag in war["attackers"]:
            total_losses += war["casualites_atk"].get(tag, 0)
        else:
            total_losses += war["casualites_def"].get(tag, 0)
    return total_losses


def wars_sort(wars, top=-1, rev=False):
    wars = sorted(wars.items(), key=lambda x: x[1]["total_losses"], reverse=not (rev))[
        :top
    ]
    return {id: war for id, war in wars}


def get_flag_name(tag, data):
    if tag not in data:
        return tag
    gov = data[tag]["government"]
    name = ideology[gov]
    return tag + name


def get_goods_prices(data):
    worldmarket = data["worldmarket"]
    current = worldmarket["price_pool"]
    res = []
    res.append(current)
    k = 20
    for prev in data.find_all("price_history"):
        res.append(prev)
    return res



def get_progression(start, end, date1, date2):
    date1 = list(map(int, date1.split(".")))
    date2 = list(map(int, date2.split(".")))
    days = (
        (date2[0] - date1[0]) * 365 + (date2[1] - date1[1]) * 30 + (date2[2] - date1[2])
    )
    n = days / 365
    return round(((end / start) ** (1 / n) - 1) * 100, 2)


def parse_victoria2_save(file_path):
    try:
        with open(file_path, "r", encoding="CP1251", errors="ignore") as f:
            content = f.read()
        data = pyradox.txt.parse(content)
        return data
    except Exception as e:
        print(f"Ошибка при парсинге: {e}")
        return None


def load_red_save(file_path, save_data):
    with open(file_path, "w", encoding="CP1251") as f:
        f.write(str(save_data))


if __name__ == "__main__":
    data = {}
    pass
    # print(get_economy_producing_podrobno("JAP"))
    # print(get_diversification_ind("USA"))
