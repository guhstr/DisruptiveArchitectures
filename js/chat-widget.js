/**
 * Assistente RAG - Disciplina Disruptive Architectures (IA & IoT)
 * Versão 2.1 - Estética Acadêmica, Moderna e Totalmente Integrada ao MkDocs Material
 */

(function () {
  "use strict";

  // Previne reinicialização duplicada no mesmo ciclo de execução
  if (window.__DA_RAG_INITIALIZED__) {
    if (typeof window.__DA_RAG_ENSURE__ === "function") {
      window.__DA_RAG_ENSURE__();
    }
    return;
  }
  window.__DA_RAG_INITIALIZED__ = true;
  window.__DA_RAG_VERSION__ = "2.1.0";

  // Detecção inteligente de ambiente:
  // Em localhost/127.0.0.1 utiliza a porta local 8001.
  // Em produção (GitHub Pages), utiliza o serviço FastAPI no Render.
  const DEFAULT_PROD_URL = "https://disruptive-architectures-rag.onrender.com/ask";
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "";
  const WORKER_URL = isLocal
    ? `http://${window.location.hostname || "127.0.0.1"}:8001/ask`
    : (window.__DA_RAG_API_URL__ || DEFAULT_PROD_URL);

  // Chave do SessionStorage para preservar o estado da conversa entre páginas e recarregamentos
  const STORAGE_KEY = "da_rag_chat_state_v2";

  // Carrega estado persistido (mensagens e status do painel)
  function carregarEstado() {
    try {
      const salvo = sessionStorage.getItem(STORAGE_KEY);
      if (salvo) {
        const dados = JSON.parse(salvo);
        return {
          aberto: !!dados.aberto,
          mensagens: Array.isArray(dados.mensagens) ? dados.mensagens : [],
          enviando: false,
        };
      }
    } catch (e) {
      console.warn("[RAG Widget] Erro ao carregar sessionStorage:", e);
    }
    return {
      aberto: false,
      mensagens: [],
      enviando: false,
    };
  }

  const estado = carregarEstado();

  function salvarEstado() {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          aberto: estado.aberto,
          mensagens: estado.mensagens,
        })
      );
    } catch (e) {
      console.warn("[RAG Widget] Erro ao salvar sessionStorage:", e);
    }
  }

  // Injeção de CSS integrado às variáveis de tema do MkDocs Material
  function injetarEstilos() {
    if (document.getElementById("da-rag-style")) return;

    const style = document.createElement("style");
    style.id = "da-rag-style";
    style.textContent = `
      /* Botão flutuante tecnológico e acadêmico */
      #da-rag-bubble {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--md-primary-fg-color, #673ab7), var(--md-primary-fg-color--dark, #512da8));
        color: #ffffff;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(103, 58, 183, 0.38), 0 2px 4px rgba(0, 0, 0, 0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease, opacity 0.2s ease;
        user-select: none;
      }
      #da-rag-bubble:hover {
        transform: scale(1.08) translateY(-2px);
        box-shadow: 0 8px 24px rgba(103, 58, 183, 0.5), 0 3px 6px rgba(0, 0, 0, 0.15);
      }
      #da-rag-bubble:active {
        transform: scale(0.96);
      }
      #da-rag-bubble:focus-visible,
      #da-rag-send:focus-visible,
      #da-rag-input:focus-visible,
      #da-rag-close:focus-visible,
      #da-rag-clear:focus-visible {
        outline: 2px solid var(--md-accent-fg-color, #7e57c2);
        outline-offset: 2px;
      }

      /* Painel do Chatbot */
      #da-rag-widget {
        position: fixed;
        bottom: 92px;
        right: 24px;
        z-index: 9999;
        width: 390px;
        max-width: calc(100vw - 32px);
        height: 540px;
        max-height: calc(100vh - 120px);
        background: var(--md-default-bg-color, #ffffff);
        color: var(--md-default-fg-color, #212121);
        border-radius: 14px;
        box-shadow: 0 12px 38px rgba(0, 0, 0, 0.22), 0 4px 12px rgba(0, 0, 0, 0.08);
        border: 1px solid var(--md-default-fg-color--lightest, rgba(0, 0, 0, 0.12));
        display: none;
        flex-direction: column;
        overflow: hidden;
        font-family: var(--md-text-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
        animation: da-rag-slidein 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes da-rag-slidein {
        from { opacity: 0; transform: translateY(14px) scale(0.97); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      #da-rag-widget.open {
        display: flex;
      }

      /* Cabeçalho Acadêmico e Tecnológico */
      #da-rag-header {
        background: linear-gradient(135deg, var(--md-primary-fg-color, #673ab7), var(--md-primary-fg-color--dark, #512da8));
        color: #ffffff;
        padding: 12px 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        user-select: none;
      }
      #da-rag-header-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .da-rag-header-icon-wrap {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.16);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      #da-rag-title {
        font-weight: 600;
        font-size: 14px;
        line-height: 1.25;
        letter-spacing: 0.2px;
      }
      #da-rag-subtitle {
        font-size: 11px;
        opacity: 0.88;
        display: flex;
        align-items: center;
        gap: 5px;
        margin-top: 1px;
      }
      .da-rag-status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #10b981;
        display: inline-block;
        box-shadow: 0 0 6px #10b981;
      }
      #da-rag-header-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .da-rag-icon-btn {
        background: rgba(255, 255, 255, 0.14);
        border: none;
        color: #ffffff;
        cursor: pointer;
        width: 28px;
        height: 28px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s, transform 0.15s;
      }
      .da-rag-icon-btn:hover {
        background: rgba(255, 255, 255, 0.28);
      }
      .da-rag-icon-btn:active {
        transform: scale(0.92);
      }

      /* Área de Mensagens */
      #da-rag-messages {
        flex: 1;
        overflow-y: auto;
        padding: 14px;
        font-size: 13.5px;
        line-height: 1.55;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: var(--md-default-bg-color, #ffffff);
      }
      #da-rag-messages::-webkit-scrollbar {
        width: 6px;
      }
      #da-rag-messages::-webkit-scrollbar-thumb {
        background: var(--md-default-fg-color--lightest, rgba(0, 0, 0, 0.15));
        border-radius: 4px;
      }

      .da-rag-msg {
        display: flex;
        flex-direction: column;
        max-width: 90%;
      }
      .da-rag-msg.user {
        align-self: flex-end;
        align-items: flex-end;
      }
      .da-rag-msg.bot {
        align-self: flex-start;
        align-items: flex-start;
      }
      .da-rag-msg .bubble {
        padding: 9px 13px;
        border-radius: 12px;
        text-align: left;
        white-space: pre-wrap;
        word-break: break-word;
        font-size: 13px;
      }
      .da-rag-msg.user .bubble {
        background: var(--md-primary-fg-color, #673ab7);
        color: #ffffff;
        border-bottom-right-radius: 2px;
        box-shadow: 0 2px 6px rgba(103, 58, 183, 0.25);
      }
      .da-rag-msg.bot .bubble {
        background: var(--md-code-bg-color, rgba(0, 0, 0, 0.04));
        color: var(--md-default-fg-color, #212121);
        border: 1px solid var(--md-default-fg-color--lightest, rgba(0, 0, 0, 0.08));
        border-bottom-left-radius: 2px;
      }
      .da-rag-msg .bubble p {
        margin: 0 0 6px 0;
      }
      .da-rag-msg .bubble p:last-child {
        margin-bottom: 0;
      }
      .da-rag-msg .bubble ul {
        margin: 6px 0;
        padding-left: 18px;
      }
      .da-rag-msg .bubble li {
        margin-bottom: 3px;
      }
      .da-rag-msg .bubble code {
        background: var(--md-default-fg-color--lightest, rgba(0, 0, 0, 0.08));
        padding: 2px 5px;
        border-radius: 4px;
        font-size: 12px;
        font-family: var(--md-code-font, monospace);
      }
      .da-rag-msg .bubble pre {
        background: var(--md-code-bg-color, #20222a);
        color: #f8f8f2;
        padding: 8px 10px;
        border-radius: 6px;
        overflow-x: auto;
        margin: 6px 0;
        max-width: 100%;
      }
      .da-rag-msg .bubble pre code {
        background: none;
        padding: 0;
        color: inherit;
        font-size: 11.5px;
        white-space: pre;
      }

      /* Fontes citadas estilizadas com link de redirecionamento */
      .da-rag-sources {
        margin-top: 8px;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .da-rag-sources-label {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.3px;
        color: var(--md-default-fg-color--light, #666666);
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .da-rag-source-card {
        display: flex;
        flex-direction: column;
        padding: 8px 11px;
        background: var(--md-default-bg-color, #ffffff);
        border: 1px solid rgba(103, 58, 183, 0.25);
        border-left: 3px solid var(--md-primary-fg-color, #673ab7);
        border-radius: 6px;
        text-decoration: none;
        color: inherit;
        transition: all 0.16s ease;
        gap: 3px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      }
      .da-rag-source-card:hover {
        background: rgba(103, 58, 183, 0.06);
        border-color: var(--md-primary-fg-color, #673ab7);
        transform: translateY(-1px);
        box-shadow: 0 4px 10px rgba(103, 58, 183, 0.14);
      }
      .da-rag-source-title {
        font-size: 12.5px;
        font-weight: 600;
        color: var(--md-default-fg-color, #212121);
        line-height: 1.3;
      }
      .da-rag-source-cta {
        font-size: 11.5px;
        font-weight: 600;
        color: var(--md-primary-fg-color, #673ab7);
        align-self: flex-start;
        display: inline-flex;
        align-items: center;
        gap: 3px;
      }

      /* Sugestões rápidas de boas-vindas */
      .da-rag-suggestions {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 8px;
        width: 100%;
      }
      .da-rag-chip {
        background: rgba(103, 58, 183, 0.07);
        border: 1px solid rgba(103, 58, 183, 0.22);
        color: var(--md-primary-fg-color, #673ab7);
        padding: 7px 11px;
        border-radius: 8px;
        font-size: 12px;
        cursor: pointer;
        text-align: left;
        transition: all 0.15s ease;
        font-weight: 500;
      }
      .da-rag-chip:hover {
        background: var(--md-primary-fg-color, #673ab7);
        color: #ffffff;
        border-color: var(--md-primary-fg-color, #673ab7);
      }

      /* Indicador de carregamento / digitando */
      .da-rag-typing {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 5px 6px;
      }
      .da-rag-typing span {
        width: 6px;
        height: 6px;
        background: var(--md-primary-fg-color, #673ab7);
        border-radius: 50%;
        animation: da-rag-bounce 1.3s infinite ease-in-out both;
      }
      .da-rag-typing span:nth-child(1) { animation-delay: -0.32s; }
      .da-rag-typing span:nth-child(2) { animation-delay: -0.16s; }
      @keyframes da-rag-bounce {
        0%, 80%, 100% { transform: scale(0); opacity: 0.35; }
        40% { transform: scale(1); opacity: 1; }
      }

      /* Linha de entrada de texto perfeitamente integrada */
      #da-rag-input-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background: var(--md-default-bg-color, #ffffff);
        border-top: 1px solid var(--md-default-fg-color--lightest, rgba(0, 0, 0, 0.08));
      }
      #da-rag-input {
        flex: 1;
        background: var(--md-code-bg-color, rgba(0, 0, 0, 0.04));
        border: 1px solid var(--md-default-fg-color--lightest, rgba(0, 0, 0, 0.12));
        border-radius: 20px;
        padding: 9px 14px;
        font-size: 13px;
        font-family: inherit;
        color: var(--md-default-fg-color, #212121);
        outline: none;
        transition: border-color 0.16s, box-shadow 0.16s, background 0.16s;
      }
      #da-rag-input::placeholder {
        color: var(--md-default-fg-color--light, #888888);
        opacity: 0.75;
      }
      #da-rag-input:focus {
        border-color: var(--md-primary-fg-color, #673ab7);
        box-shadow: 0 0 0 3px rgba(103, 58, 183, 0.15);
        background: var(--md-default-bg-color, #ffffff);
      }
      #da-rag-send {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: none;
        background: var(--md-primary-fg-color, #673ab7);
        color: #ffffff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s, opacity 0.15s, transform 0.15s;
        flex-shrink: 0;
      }
      #da-rag-send:hover:not(:disabled) {
        background: var(--md-primary-fg-color--dark, #512da8);
        transform: scale(1.05);
      }
      #da-rag-send:active:not(:disabled) {
        transform: scale(0.95);
      }
      #da-rag-send:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      /* Responsividade mobile */
      @media (max-width: 480px) {
        #da-rag-bubble {
          bottom: 16px;
          right: 16px;
          width: 52px;
          height: 52px;
        }
        #da-rag-widget {
          bottom: 0;
          right: 0;
          width: 100vw;
          max-width: 100vw;
          height: min(560px, 88vh);
          max-height: 88vh;
          border-radius: 14px 14px 0 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Conversor simples e seguro de Markdown para HTML
  function markdownParaHtml(texto) {
    if (!texto) return "";
    let seguro = texto
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const blocosDeCodigo = [];
    seguro = seguro.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, (_, codigo) => {
      const idx = blocosDeCodigo.length;
      blocosDeCodigo.push(codigo.replace(/\n$/, ""));
      return `%%CODEBLOCK_${idx}%%`;
    });

    seguro = seguro.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    seguro = seguro.replace(/__(.+?)__/g, "<strong>$1</strong>");
    seguro = seguro.replace(/\*(.+?)\*/g, "<em>$1</em>");
    seguro = seguro.replace(/(?<!\w)_(.+?)_(?!\w)/g, "<em>$1</em>");
    seguro = seguro.replace(/`(.+?)`/g, "<code>$1</code>");
    seguro = seguro.replace(/^#{1,6}\s+(.+)$/gm, "<strong>$1</strong>");
    seguro = seguro.replace(
      /\[(.+?)\]\(((?:https?:\/\/|\/|#)[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    const linhas = seguro.split("\n");
    let html = "";
    let dentroLista = false;
    for (const linha of linhas) {
      const itemLista = linha.match(/^\s*[-*]\s+(.+)$/);
      if (itemLista) {
        if (!dentroLista) {
          html += "<ul>";
          dentroLista = true;
        }
        html += `<li>${itemLista[1]}</li>`;
      } else {
        if (dentroLista) {
          html += "</ul>";
          dentroLista = false;
        }
        html += linha.trim() ? `<p>${linha}</p>` : "";
      }
    }
    if (dentroLista) html += "</ul>";

    html = html.replace(/%%CODEBLOCK_(\d+)%%/g, (_, idx) => {
      return `<pre><code>${blocosDeCodigo[Number(idx)]}</code></pre>`;
    });

    return html;
  }

  function renderizarMensagem(container, m) {
    const wrap = document.createElement("div");
    wrap.className = `da-rag-msg ${m.who}`;
    wrap.dataset.msgId = m.id;

    const bubbleEl = document.createElement("div");
    bubbleEl.className = "bubble";

    if (m.loading) {
      bubbleEl.innerHTML = `
        <div class="da-rag-typing" title="Consultando material da disciplina...">
          <span></span><span></span><span></span>
        </div>
      `;
    } else if (m.who === "bot") {
      bubbleEl.innerHTML = markdownParaHtml(m.texto);
    } else {
      bubbleEl.textContent = m.texto;
    }
    wrap.appendChild(bubbleEl);

    // Sugestões rápidas de boas-vindas
    if (m.comSugestoes) {
      const sug = document.createElement("div");
      sug.className = "da-rag-suggestions";
      sug.innerHTML = `
        <button type="button" class="da-rag-chip" data-q="O que são Redes Neurais Convolucionais?">💡 O que são Redes Neurais Convolucionais?</button>
        <button type="button" class="da-rag-chip" data-q="Como funciona o protocolo MQTT no ESP32?">💡 Como funciona o protocolo MQTT no ESP32?</button>
        <button type="button" class="da-rag-chip" data-q="O que é uma Máquina de Estados (FSM)?">💡 O que é uma Máquina de Estados (FSM)?</button>
      `;
      wrap.appendChild(sug);
    }

    // Fontes citadas formatadas
    if (m.fontes && m.fontes.length) {
      const srcBox = document.createElement("div");
      srcBox.className = "da-rag-sources";

      const label = document.createElement("div");
      label.className = "da-rag-sources-label";
      label.textContent = m.fontes.length > 1 ? "📚 Fontes da disciplina:" : "📚 Fonte da disciplina:";
      srcBox.appendChild(label);

      m.fontes.forEach((f) => {
        const card = document.createElement("a");
        card.className = "da-rag-source-card";
        card.href = f.url;
        card.title = `Acessar: ${f.titulo || f.url}`;

        const titleDiv = document.createElement("div");
        titleDiv.className = "da-rag-source-title";
        titleDiv.textContent = f.titulo || f.url;

        const ctaDiv = document.createElement("div");
        ctaDiv.className = "da-rag-source-cta";
        ctaDiv.textContent = "Ver conteúdo completo →";

        card.appendChild(titleDiv);
        card.appendChild(ctaDiv);
        srcBox.appendChild(card);
      });

      wrap.appendChild(srcBox);
    }

    container.appendChild(wrap);
    container.scrollTop = container.scrollHeight;
    return wrap;
  }

  let proximoId = estado.mensagens.length ? Math.max(...estado.mensagens.map((m) => m.id || 0)) + 1 : 1;

  function addMessage(texto, who, fontes, loading, comSugestoes) {
    const id = proximoId++;
    const m = { id, texto, who, fontes, loading: !!loading, comSugestoes: !!comSugestoes };
    estado.mensagens.push(m);
    salvarEstado();

    const container = document.getElementById("da-rag-messages");
    if (container) renderizarMensagem(container, m);
    return id;
  }

  function removeMessage(id) {
    estado.mensagens = estado.mensagens.filter((m) => m.id !== id);
    salvarEstado();
    const el = document.querySelector(`[data-msg-id="${id}"]`);
    if (el) el.remove();
  }

  function limparConversa() {
    estado.mensagens = [];
    salvarEstado();
    const container = document.getElementById("da-rag-messages");
    if (container) {
      container.innerHTML = "";
      addMessage(
        "Oi! Sou o assistente oficial do curso **Disruptive Architectures**.\n\nPergunte qualquer coisa sobre as aulas e laboratórios (CNNs, YOLO, MQTT, Arduino, ESP32, GenAI, etc.).",
        "bot",
        null,
        false,
        true
      );
    }
  }

  // Montagem do Widget e garantia de elemento único no DOM
  function montarWidget() {
    injetarEstilos();

    // Elimina duplicações caso existam múltiplos no DOM
    const bubblesExistentes = document.querySelectorAll("#da-rag-bubble");
    if (bubblesExistentes.length > 1) {
      for (let i = 1; i < bubblesExistentes.length; i++) bubblesExistentes[i].remove();
    }
    const widgetsExistentes = document.querySelectorAll("#da-rag-widget");
    if (widgetsExistentes.length > 1) {
      for (let i = 1; i < widgetsExistentes.length; i++) widgetsExistentes[i].remove();
    }

    // Se ambos já existem no DOM, apenas sincroniza visibilidade
    const bubbleJaExiste = document.getElementById("da-rag-bubble");
    const widgetJaExiste = document.getElementById("da-rag-widget");
    if (bubbleJaExiste && widgetJaExiste) {
      if (estado.aberto && !widgetJaExiste.classList.contains("open")) {
        widgetJaExiste.classList.add("open");
        bubbleJaExiste.setAttribute("aria-expanded", "true");
      }
      return;
    }

    // Cria botão flutuante se não existir
    let bubble = bubbleJaExiste;
    if (!bubble) {
      bubble = document.createElement("button");
      bubble.id = "da-rag-bubble";
      bubble.title = "Assistente Disruptive Architectures";
      bubble.setAttribute("aria-label", "Abrir assistente da disciplina");
      bubble.setAttribute("aria-expanded", estado.aberto ? "true" : "false");
      // Ícone SVG tecnológico e acadêmico (balão de diálogo com estrela/spark de IA)
      bubble.innerHTML = `
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <path d="M12 7l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3z" fill="currentColor" stroke="none"/>
        </svg>
      `;
      document.body.appendChild(bubble);
    }

    // Cria painel se não existir
    let widget = widgetJaExiste;
    if (!widget) {
      widget = document.createElement("div");
      widget.id = "da-rag-widget";
      widget.setAttribute("role", "dialog");
      widget.setAttribute("aria-labelledby", "da-rag-title");
      if (estado.aberto) widget.classList.add("open");

      widget.innerHTML = `
        <div id="da-rag-header">
          <div id="da-rag-header-left">
            <div class="da-rag-header-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <div id="da-rag-title">Assistente da Disciplina</div>
              <div id="da-rag-subtitle">
                <span class="da-rag-status-dot"></span>
                Disruptive Architectures · IA & IoT
              </div>
            </div>
          </div>
          <div id="da-rag-header-actions">
            <button id="da-rag-clear" class="da-rag-icon-btn" title="Reiniciar conversa" aria-label="Reiniciar conversa">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
            </button>
            <button id="da-rag-close" class="da-rag-icon-btn" title="Fechar assistente" aria-label="Fechar assistente">✕</button>
          </div>
        </div>
        <div id="da-rag-messages" aria-live="polite" aria-busy="false"></div>
        <div id="da-rag-input-row">
          <input id="da-rag-input" type="text" placeholder="Pergunte sobre o conteúdo da disciplina..." aria-label="Pergunta sobre o conteúdo" autocomplete="off" />
          <button id="da-rag-send" type="button" aria-label="Enviar pergunta" title="Enviar pergunta">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor"></polygon>
            </svg>
          </button>
        </div>
      `;
      document.body.appendChild(widget);
    }

    const inputEl = widget.querySelector("#da-rag-input");
    const sendButton = widget.querySelector("#da-rag-send");
    const messagesEl = widget.querySelector("#da-rag-messages");
    const closeButton = widget.querySelector("#da-rag-close");
    const clearButton = widget.querySelector("#da-rag-clear");

    // Restaura mensagens persistidas no histórico
    messagesEl.innerHTML = "";
    if (estado.mensagens.length > 0) {
      estado.mensagens.forEach((m) => renderizarMensagem(messagesEl, m));
    }

    async function enviarPergunta(textoDireto) {
      const pergunta = (typeof textoDireto === "string" ? textoDireto : inputEl.value).trim();
      if (!pergunta || estado.enviando) return;

      estado.enviando = true;
      inputEl.disabled = true;
      sendButton.disabled = true;
      messagesEl.setAttribute("aria-busy", "true");
      inputEl.value = "";

      addMessage(pergunta, "user");
      const loadingId = addMessage(null, "bot", null, true);

      console.log(`[RAG Widget] Consultando ${WORKER_URL}: "${pergunta}"`);

      try {
        const resp = await fetch(WORKER_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pergunta }),
        });

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status} - ${resp.statusText}`);
        }

        const data = await resp.json();
        removeMessage(loadingId);

        if (data.erro) {
          addMessage("Ops, ocorreu um erro ao consultar o material: " + data.erro, "bot");
        } else {
          addMessage(data.resposta, "bot", data.fontes);
        }
      } catch (e) {
        removeMessage(loadingId);
        console.error("[RAG Widget] Erro ao comunicar com backend:", e);
        addMessage(
          `Não consegui consultar o assistente (${e.message || e}). Certifique-se de que a API local está ativa em ${WORKER_URL}.`,
          "bot"
        );
      } finally {
        estado.enviando = false;
        inputEl.disabled = false;
        sendButton.disabled = false;
        messagesEl.setAttribute("aria-busy", "false");
        const inputAtual = document.getElementById("da-rag-input");
        if (inputAtual) inputAtual.focus();
      }
    }

    bubble.onclick = () => {
      widget.classList.toggle("open");
      estado.aberto = widget.classList.contains("open");
      salvarEstado();
      bubble.setAttribute("aria-expanded", String(estado.aberto));
      if (estado.aberto) {
        inputEl.focus();
        if (estado.mensagens.length === 0) {
          addMessage(
            "Oi! Sou o assistente oficial do curso **Disruptive Architectures**.\n\nPergunte qualquer coisa sobre as aulas e laboratórios (CNNs, YOLO, MQTT, Arduino, ESP32, GenAI, etc.).",
            "bot",
            null,
            false,
            true
          );
        }
      }
    };

    closeButton.onclick = () => {
      widget.classList.remove("open");
      estado.aberto = false;
      salvarEstado();
      bubble.setAttribute("aria-expanded", "false");
      bubble.focus();
    };

    clearButton.onclick = () => {
      if (confirm("Deseja reiniciar a conversa com o assistente?")) {
        limparConversa();
      }
    };

    sendButton.onclick = () => enviarPergunta();

    inputEl.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        enviarPergunta();
      }
    };

    // Cliques em chips de sugestão rápida
    messagesEl.onclick = (e) => {
      const chip = e.target.closest(".da-rag-chip");
      if (chip && chip.dataset.q) {
        enviarPergunta(chip.dataset.q);
      }
    };
  }

  window.__DA_RAG_ENSURE__ = montarWidget;

  // Integração com MkDocs Material (navegação instantânea)
  if (typeof window.document$ !== "undefined" && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(() => {
      montarWidget();
    });
  } else {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", montarWidget);
    } else {
      montarWidget();
    }
  }

  // Observer de proteção caso algum mecanismo remova elementos do body
  let mutando = false;
  new MutationObserver(() => {
    if (mutando) return;
    if (!document.getElementById("da-rag-widget") || !document.getElementById("da-rag-bubble")) {
      mutando = true;
      montarWidget();
      mutando = false;
    }
  }).observe(document.body, { childList: true, subtree: false });
})();