import json
import re
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent

MATERIAL_DIR = PROJECT_DIR / "material"
OUTPUT_FILE = BASE_DIR / "data" / "chunks.json"

CHUNK_SIZE = 1200
CHUNK_OVERLAP = 200


def clean_markdown(text):
    text = re.sub(r"^---.*?---", "", text, flags=re.DOTALL)

    text = re.sub(r"!\[.*?\]\(.*?\)", "", text)

    text = re.sub(r"\[(.*?)\]\(.*?\)", r"\1", text)

    text = re.sub(r"<[^>]+>", " ", text)

    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)

    return text.strip()


def split_text(text):
    paragraphs = [
        paragraph.strip()
        for paragraph in re.split(r"\n\s*\n", text)
        if paragraph.strip()
    ]

    chunks = []
    current = ""

    for paragraph in paragraphs:
        if len(current) + len(paragraph) + 2 <= CHUNK_SIZE:
            current += ("\n\n" if current else "") + paragraph
        else:
            if current:
                chunks.append(current)

            overlap = current[-CHUNK_OVERLAP:] if current else ""
            current = overlap + "\n\n" + paragraph

    if current:
        chunks.append(current)

    return chunks


def main():
    markdown_files = sorted(MATERIAL_DIR.rglob("*.md"))

    print(f"Arquivos Markdown encontrados: {len(markdown_files)}")

    all_chunks = []
    chunk_id = 0

    for file_path in markdown_files:
        try:
            text = file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            print(f"Arquivo ignorado por problema de encoding: {file_path}")
            continue

        cleaned = clean_markdown(text)

        if not cleaned:
            continue

        chunks = split_text(cleaned)

        for chunk in chunks:
            all_chunks.append(
                {
                    "id": chunk_id,
                    "source": str(file_path.relative_to(PROJECT_DIR)),
                    "text": chunk,
                }
            )

            chunk_id += 1

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT_FILE.open("w", encoding="utf-8") as file:
        json.dump(
            all_chunks,
            file,
            ensure_ascii=False,
            indent=2,
        )

    print()
    print("Processamento concluído.")
    print(f"Chunks criados: {len(all_chunks)}")
    print(f"Arquivo: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()