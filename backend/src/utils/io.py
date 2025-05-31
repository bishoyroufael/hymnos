import requests
from pathlib import Path

# Function to download a file from a URL
def download_file(url: str, file_path: Path):
    response = requests.get(url)
    file_path.write_bytes(response.content)