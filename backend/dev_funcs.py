from PIL import Image
import os

src = r"backend\data\flags"
dst = r"backend\data\flags"

def convert_files():
    for file in os.listdir(src):
        if file.endswith(".tga"):
            img = Image.open(os.path.join(src, file))
            name = file.replace(".tga", ".png")
            img.save(os.path.join(dst, name))   
            try:
                os.remove(os.path.join(src, file))
            except :
                pass
            print(f"✓ {name}")
    for file in os.listdir(src):
        if "_" in file:
            os.remove(os.path.join(src, file))
            print(f"DELETED {file}")

convert_files()