from PIL import Image
import os


def convert_files(src, dst=r"public\flags"):
    for file in os.listdir(src):
        if file.endswith(".tga"):
            img = Image.open(os.path.join(src, file))
            name = file.replace(".tga", ".png")
            img.save(os.path.join(dst, name))
            print(f"✓ {name}")


if __name__ == "__main__":
    convert_files(r"C:\Games\Victoria 2 Heart of Darkness\gfx\flags")
