import os
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import dataset

folder_path = r"C:\Users\User\Documents\Paradox Interactive\Victoria II\save games"
target_file = "autosave.v2"


class CheckSavegame(FileSystemEventHandler):
    def __init__(self):
        self.last_update = 0
        self.interval = 0.1
    def on_modified(self, event):
        if not event.is_directory and os.path.basename(event.src_path) == target_file:
            current_time = time.time()
            if current_time - self.last_update < self.interval:
                return
            self.last_update = current_time
            print(f"Found changes at {time.ctime()}, start update")
            dataset.update_dataset(str(os.path.join(folder_path, target_file)))


event_handler = CheckSavegame()

obs = Observer()
obs.schedule(event_handler, folder_path, recursive=False)
obs.start()

print(f"watching: {folder_path}")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    obs.stop()
obs.join()