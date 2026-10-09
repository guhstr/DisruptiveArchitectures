import json
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer


BASE_DIR = Path(__file__).resolve().parent

CHUNKS_FILE = BASE_DIR / "data" / "chunks.json"
EMBEDDINGS_FILE = BASE_DIR / "data" / "embeddings.npy"

MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"


def main():
    print("Carregando chunks...")

    with CHUNKS_FILE.open("r", encoding="utf-8") as file:
        chunks = json.load(file)

    texts = [chunk["text"] for chunk in chunks]

    print(f"Chunks encontrados: {len(texts)}")
    print(f"Carregando modelo: {MODEL_NAME}")

    model = SentenceTransformer(MODEL_NAME)

    print("Gerando embeddings...")

    embeddings = model.encode(
        texts,
        show_progress_bar=True,
        normalize_embeddings=True,
    )

    embeddings = np.asarray(embeddings, dtype=np.float32)

    EMBEDDINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    np.save(EMBEDDINGS_FILE, embeddings)

    print()
    print("Embeddings criados com sucesso!")
    print(f"Quantidade: {len(embeddings)}")
    print(f"Dimensão: {embeddings.shape[1]}")
    print(f"Arquivo: {EMBEDDINGS_FILE}")


if __name__ == "__main__":
    main()