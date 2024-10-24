import hashlib
from pathlib import Path
import httpx
import time
import zipfile

# Function to calculate the hash of a file
def calculate_file_hash(file_path: Path) -> str:
    sha256_hash = hashlib.sha256()
    with file_path.open("rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

# Function to download a file from a URL
async def download_file(url: str, file_path: Path):
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        file_path.write_bytes(response.content)

# Main function to download, check, and extract the file
async def handle_file_download(assets_folder, file_url):
    temp_file_path = assets_folder / "temp_file.zip"
    await download_file(file_url, temp_file_path)

    file_hash = calculate_file_hash(temp_file_path)

    existing_files = list(assets_folder.glob(f"*_{file_hash}"))
    if existing_files:
        print(f"File with hash {file_hash} already exists. Skipping.")
        temp_file_path.unlink()  # Remove temporary file
        return
    
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    new_folder = assets_folder / f"{timestamp}_{file_hash}"
    new_folder.mkdir(exist_ok=True)

    with zipfile.ZipFile(temp_file_path, 'r') as zip_ref:
        zip_ref.extractall(new_folder)
    
    temp_file_path.unlink()
    print(f"File downloaded and extracted to {new_folder}")
