import os
import json
from pathlib import Path
import re
import time
from urllib.parse import quote

import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
from google import genai
from fastapi.middleware.cors import CORSMiddleware


BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent

CHUNKS_FILE = BASE_DIR / "data" / "chunks.json"
EMBEDDINGS_FILE = BASE_DIR / "data" / "embeddings.npy"

MIN_SCORE = 0.62
TOP_K = 5
SITE_BASE_URL = os.getenv("SITE_BASE_URL", "http://127.0.0.1:8000/DisruptiveArchitectures/").rstrip("/") + "/"


app = FastAPI(
    title="Disruptive Architectures RAG",
    description="API do assistente baseado no conteúdo da disciplina."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_private_network=True,
)


class Pergunta(BaseModel):
    pergunta: str


print("Carregando material do curso...")

with CHUNKS_FILE.open("r", encoding="utf-8") as file:
    chunks = json.load(file)

embeddings = np.load(EMBEDDINGS_FILE)

print(f"Chunks carregados: {len(chunks)}")
print(f"Embeddings carregados: {embeddings.shape}")


load_dotenv(PROJECT_DIR / ".env")
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
gemini_model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

gemini = None
if api_key:
    try:
        gemini = genai.Client(api_key=api_key)
    except Exception as e:
        print(f"[AVISO] Erro ao instanciar Gemini Client: {e}")
else:
    print("[AVISO] GEMINI_API_KEY não foi configurada nas variáveis de ambiente.")


def executar_chamada_gemini(prompt: str) -> str:
    global gemini
    if not gemini:
        current_key = os.getenv("GEMINI_API_KEY")
        if current_key:
            gemini = genai.Client(api_key=current_key)
        else:
            return "Erro: GEMINI_API_KEY não foi configurada nas variáveis de ambiente do servidor."

    modelos_candidatos = [gemini_model]
    for alt in ["gemini-3.5-flash", "gemini-3.5-flash-lite"]:
        if alt not in modelos_candidatos:
            modelos_candidatos.append(alt)

    ultimo_erro = None
    for modelo in modelos_candidatos:
        for tentativa in range(3):
            try:
                response = gemini.models.generate_content(
                    model=modelo,
                    contents=prompt
                )
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                ultimo_erro = e
                err_msg = str(e)
                print(f"[Gemini Retry] Modelo {modelo} falhou (tentativa {tentativa+1}/3): {err_msg[:120]}")
                if any(x in err_msg for x in ["503", "UNAVAILABLE", "high demand", "429", "RESOURCE_EXHAUSTED"]):
                    time.sleep(1.5 * (tentativa + 1))
                    continue
                break

    if ultimo_erro:
        raise ultimo_erro
    return ""


CUSTOM_TITLES = {
    "material/aulas/IA/lab08/cnn_guia_completo.md": "Redes Neurais Convolucionais — CNN",
    "material/aulas/iot/index.md": "Introdução ao IoT",
    "material/aulas/iot/intro/index.md": "Conceitos de IoT e Embarcados",
    "material/aulas/checkpoint/index.md": "Checkpoints e Integridade Acadêmica",
}

_TITULOS_CACHE = {}


def obter_titulo(source):
    source_str = str(source)
    if source_str in _TITULOS_CACHE:
        return _TITULOS_CACHE[source_str]

    if source_str in CUSTOM_TITLES:
        titulo = CUSTOM_TITLES[source_str]
        _TITULOS_CACHE[source_str] = titulo
        return titulo

    p = Path(source)
    if not p.is_absolute() and not p.exists():
        p = PROJECT_DIR / source

    titulo = None
    if p.exists():
        try:
            content = p.read_text(encoding="utf-8", errors="ignore")
            content = re.sub(r"<!--.*?-->", "", content, flags=re.DOTALL)
            fm = re.search(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
            if fm:
                m = re.search(r"^title:\s*(.+)$", fm.group(1), re.MULTILINE)
                if m:
                    t = m.group(1).strip("\"'").strip()
                    if t:
                        titulo = t
            if not titulo:
                for line in content.splitlines():
                    line = line.strip()
                    if line.startswith("# ") or line.startswith("## ") or line.startswith("### "):
                        h = re.sub(r"^#{1,3}\s+", "", line).strip()
                        h = re.sub(r"\*\*([^*]+)\*\*", r"\1", h)
                        h = re.sub(r"__([^_]+)__", r"\1", h)
                        h = re.sub(r"`([^`]+)`", r"\1", h)
                        if h and len(h) > 2 and not h.startswith("!["):
                            titulo = h
                            break
        except Exception:
            pass

    if not titulo:
        fallback = p.parent.name if p.stem.lower() == "index" else p.stem
        titulo = fallback.replace("_", " ").replace("-", " ").title()

    _TITULOS_CACHE[source_str] = titulo
    return titulo


def criar_url(source):
    caminho = Path(source)
    partes = list(caminho.parts)

    if partes and partes[0] == "material":
        partes = partes[1:]

    if partes and partes[-1].endswith(".md"):
        partes[-1] = partes[-1][:-3]

    if partes and partes[-1] == "index":
        partes = partes[:-1]

    partes_codificadas = [quote(p) for p in partes]
    caminho_url = "/".join(partes_codificadas)

    if caminho_url:
        return SITE_BASE_URL + caminho_url + "/"

    return SITE_BASE_URL


def buscar_contexto(pergunta, top_k=TOP_K):
    global gemini
    if not gemini:
        current_key = os.getenv("GEMINI_API_KEY")
        if current_key:
            gemini = genai.Client(api_key=current_key)
        else:
            return []

    res = gemini.models.embed_content(
        model="models/gemini-embedding-001",
        contents=pergunta
    )
    pergunta_embedding = np.array(res.embeddings[0].values, dtype=np.float32)
    norm = np.linalg.norm(pergunta_embedding)
    if norm > 0:
        pergunta_embedding = pergunta_embedding / norm

    scores = embeddings @ pergunta_embedding
    indices = np.argsort(scores)[::-1][:top_k]

    resultados = []
    for indice in indices:
        score = float(scores[indice])
        resultados.append({
            "score": score,
            "source": chunks[indice]["source"],
            "text": chunks[indice]["text"]
        })

    return resultados


def gerar_resposta(pergunta, resultados):
    pergunta_limpa = re.sub(r"[^\w\s]", "", pergunta.lower()).strip()
    saudacoes = {"oi", "ola", "olá", "bom dia", "boa tarde", "boa noite", "e ai", "e aí", "opa", "quem e voce", "quem é você", "o que voce faz", "o que você faz"}
    tokens = set(pergunta_limpa.split())
    palavras_saudacao = {"oi", "ola", "olá", "bom", "dia", "boa", "tarde", "noite", "e", "ai", "opa", "tudo", "bem", "como", "vai", "vc", "voce", "você", "assistente"}
    if pergunta_limpa in saudacoes or (bool(tokens) and tokens.issubset(palavras_saudacao)):
        return {
            "resposta": "Olá! Sou o assistente virtual da disciplina Disruptive Architectures. Estou aqui para responder dúvidas com base exclusivamente no material oficial das aulas e laboratórios (IA, GenAI, IoT, Arduino, ESP32, etc.). O que você gostaria de consultar?",
            "fontes": []
        }

    if any(p in pergunta_limpa for p in ["quem e o professor", "quem é o professor", "qual o professor", "nome do professor", "quem ministra"]):
        return {
            "resposta": "Segundo o material da disciplina, o professor responsável é o Prof. Arnaldo Viana.",
            "fontes": [
                {
                    "titulo": "Disruptive Architectures: IA e IoT",
                    "url": criar_url("material/index.md"),
                    "score": 1.0
                }
            ]
        }

    melhores = [
        resultado
        for resultado in resultados
        if resultado["score"] >= MIN_SCORE
    ]

    if not melhores:
        return {
            "resposta": "Não encontrei essa informação no material da disciplina.",
            "fontes": []
        }

    contexto = "\n\n".join(
        f"""
FONTE:
{resultado["source"]}

CONTEÚDO:
{resultado["text"]}
"""
        for resultado in melhores
    )

    prompt = f"""Você é o assistente oficial do site da disciplina Disruptive Architectures.

Sua função é responder perguntas EXCLUSIVAMENTE com base no conteúdo fornecido no CONTEXTO abaixo.

REGRAS OBRIGATÓRIAS:
1. Nunca use conhecimento externo ao CONTEXTO.
2. Nunca invente informações.
3. Nunca complete uma resposta usando seu conhecimento geral se o CONTEXTO não contiver a resposta com segurança.
4. Se o CONTEXTO não possuir informação suficiente para responder à pergunta, responda exatamente:
"Não encontrei essa informação no material da disciplina."
5. A resposta deve ser clara, objetiva e em português.
6. Quando houver informação suficiente, inicie a resposta deixando claro que a informação vem do material da disciplina, usando expressões como:
"Segundo o material da disciplina...", "De acordo com o conteúdo da disciplina...", ou "Com base no material da disciplina...".
7. Você pode resumir e explicar o conteúdo do CONTEXTO de forma didática, mas não pode adicionar dados que não estejam nele.
8. Não diga que você pesquisou na internet ou que acessou sites externos.
9. Não cite fontes ou links no corpo do texto da resposta (as fontes serão listadas automaticamente).

CONTEXTO DO SITE:
{contexto}

PERGUNTA DO USUÁRIO:
{pergunta}

Agora responda seguindo rigorosamente essas regras:"""

    texto_resposta = executar_chamada_gemini(prompt)

    frases_recusa = [
        "não encontrei essa informação no material",
        "não encontrei essa informação no conteúdo",
        "não foi possível encontrar essa informação no material",
        "essa informação não está presente no material"
    ]
    resposta_recusada = any(frase in texto_resposta.lower() for frase in frases_recusa)

    if resposta_recusada or not texto_resposta:
        return {
            "resposta": "Não encontrei essa informação no material da disciplina.",
            "fontes": []
        }

    melhores.sort(key=lambda r: r["score"], reverse=True)
    fontes = []
    fontes_adicionadas = set()

    for resultado in melhores:
        url = criar_url(resultado["source"])

        if url in fontes_adicionadas:
            continue

        fontes_adicionadas.add(url)
        titulo = obter_titulo(resultado["source"])

        fontes.append({
            "titulo": titulo,
            "url": url,
            "score": round(resultado["score"], 4)
        })

        if len(fontes) >= 3:
            break

    return {
        "resposta": texto_resposta,
        "fontes": fontes
    }


@app.get("/")
def inicio():
    return {
        "status": "online",
        "sistema": "Disruptive Architectures RAG"
    }


@app.post("/ask")
def perguntar(dados: Pergunta):
    pergunta = dados.pergunta.strip()
    print(f"\n[API /ask] Pergunta recebida: '{pergunta}'")

    if not pergunta:
        return {
            "resposta": "Digite uma pergunta.",
            "fontes": []
        }

    try:
        resultados = buscar_contexto(pergunta)
        resposta = gerar_resposta(pergunta, resultados)
        print(f"[API /ask] Resposta gerada. Fontes encontradas: {len(resposta.get('fontes', []))}")
        return resposta
    except Exception as e:
        print(f"[API /ask ERRO]: {e}")
        return {
            "resposta": f"Desculpe, ocorreu um erro interno ao processar a pergunta: {e}",
            "fontes": []
        }