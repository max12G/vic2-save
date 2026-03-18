import time
import os

def check_time(func: callable):
    def wrapper(*args, **kwargs):
        start = time.time() * 10000
        result = func(*args, **kwargs)
        end = time.time() * 10000
        print(f"Ожидаемое время: {end - start}")
        return result
    return wrapper

def clear_cache():
    src = r"C:\Users\User\Documents\parser\vic2-save"
    for root, dirs, files in os.walk(src):
        for file in files:
            if file.endswith(".pyc"):
                full_path = os.path.join(root, file)
                try:
                    os.remove(full_path)
                    print(f"DELETED: {full_path}")
                except Exception as e:
                    print(f"ERROR deleting {full_path}: {e}")

clear_cache()