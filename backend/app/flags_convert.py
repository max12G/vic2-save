from PIL import Image
import os


def convert_files(src, dst = r"public\flags"):
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
    for file in os.listdir(dst):
        if "_" in file:
            os.remove(os.path.join(dst, file))
            print(f"DELETED {file}")


if __name__ == "__main__":
    convert_files(r"C:\Games\Victoria 2 Heart of Darkness\gfx\flags")