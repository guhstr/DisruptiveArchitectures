import os
import json
import time
from pathlib import Path
import numpy as np
from dotenv import load_dotenv
from google import genai

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent

CHUNKS_FILE = BASE_DIR / "data" / "chunks.json"
EMBEDDINGS_FILE = BASE_DIR / "data" / "embeddings.npy"

MODEL_NAME = "models/gemini-embedding-001"

load_dotenv(PROJECT_DIR / ".env")
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY não encontrada no .env")

client = genai.Client(api_key=api_key)


def main():
    print("Carregando chunks...")
    with CHUNKS_FILE.open("r", encoding="utf-8") as file:
        chunks = json.load(file)

    texts = [chunk["text"] for chunk in chunks]
    print(f"Chunks encontrados: {len(texts)}")
    print(f"Gerando embeddings via {MODEL_NAME}...")

    batch_size = 50
    all_embeddings = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        sucesso = False
        for tentativa in range(6):
            try:
                res = client.models.embed_content(
                    model=MODEL_NAME,
                    contents=batch
                )
                for item in res.embeddings:
                    vec = np.array(item.values, dtype=np.float32)
                    norm = np.linalg.norm(vec)
                    if norm > 0:
                        vec = vec / norm
                    all_embeddings.append(vec)
                sucesso = True
                print(f"Progresso: {len(all_embeddings)}/{len(texts)}")
                time.sleep(4)
                break
            except Exception as e:
                print(f"Lote {i} falhou (tentativa {tentativa+1}): {e}")
                time.sleep(10 * (tentativa + 1))
        if not sucesso:
            raise RuntimeError(f"Falha ao gerar embeddings para lote a partir de {i}")

    embeddings = np.asarray(all_embeddings, dtype=np.float32)
    EMBEDDINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    np.save(EMBEDDINGS_FILE, embeddings)

    print()
    print("Embeddings criados com sucesso!")
    print(f"Quantidade: {len(embeddings)}")
    print(f"Dimensão: {embeddings.shape[1]}")
    print(f"Arquivo: {EMBEDDINGS_FILE}")


if __name__ == "__main__":
    main()