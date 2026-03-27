import math

def find_when(st1, st2, p1, p2, start_date = 0):
    date = list(map(int, start_date.split('.')))
    start_date = (
        (date[0]) * 365 + (date[1]) * 30 + (date[2])
    )
    p1 = 1 + p1 / 100
    p2 = 1 + p2 / 100
    if st1 > st2:
        return 1
    t = math.log(st1 / st2, p2 / p1)
    if t < 0:
        return -1
    t += start_date / 365
    years = int(t)
    t_month = (t - years) * 12
    month = int(t_month) + 1
    days = int((t_month - month + 1) * 30)
    return f"{years}.{month}.{days}"


def divide(pops: list = []) -> list:
    weights = []
    total = 0
    for cash in pops:
        weights.append(math.sqrt(cash))
        total += weights[-1]
    for i in range(len(pops)):
        pops[i] = weights[i] / total * 100
    return pops

    
if __name__ == "__main__":
    print(divide([1, 100, 25, 86, 55, 90, 1000]))