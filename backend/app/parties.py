import os
from pyradox import txt as pyradox_txt

"""НЕ РАБОТАЕТ"""


def parse_victoria2_file(file_path):
    try:
        with open(file_path, "r", encoding="windows-1252", errors="ignore") as f:
            content = f.read()
        data = pyradox_txt.parse(content)
        return data

    except Exception as e:
        print(f"Ошибка при парсинге: {e}")
        return None


dst = r"C:\Users\User\Documents\parser\vic2-save\backend\app\data\countries"


def rename_files():
    for file in os.listdir(path=dst):
        try:
            data = parse_victoria2_file(os.path.join(dst, file))
            p = data["party"]
            name = p["name"]
            name = name.split("_")[0]
            if name == "NIP":
                name = "JAP"
            if file == "Austria-Hungary.txt":
                name = "KUK"
            if name == "DAN":
                name = "DEN"
            if name == "HOL":
                name = "NET"
            if name == "LIV":
                name = "LAT"
            if name == "HED":
                name = "HES"
            old_path = os.path.join(dst, file)
            new_path = os.path.join(dst, name + ".txt")
            os.rename(old_path, new_path)
            print(f"renamed {file} to {name}")
        except:
            pass


def prepare_paries(countries):
    parties = {}
    count = 1
    for tag in countries:
        data = parse_victoria2_file(os.path.join(dst, tag + ".txt"))
        p = data["party"]
        if p is None:
            continue
        parties[tag] = {}
        for party in data.find_all("party"):
            parties[tag][count] = party["ideology"]
            count += 1
        if not countries:
            break
    return parties


if __name__ == "__main__":
    rename_files()
