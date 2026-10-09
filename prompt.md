Esta dando erro, preciso que voce altere a estetica, o botao flutuante nao esta funcionando em todas as paginas, quero algo que pareca novo, e use os arquivos da pasta ./rag se precisar pode alterar e criar novos, preciso do chatbot em python, altere a que ja tem para a que voce vai criar agora, mas nao apague so deixe na pasta sem utilidade, para a nova pegar o lugar, e mude um pouco o icone do botao flutuante tambem, quero que voce faca essas coisas tambem:

Quero uma estética:

- moderna;
- acadêmica;
- tecnológica;
- limpa;
- discreta;
- coerente com o MkDocs Material.

Evite aparência de chatbot comercial genérico.

Use as cores e variáveis CSS do próprio tema sempre que possível:

Melhorar o campo de entrada.

Placeholder:

"Pergunte sobre o conteúdo da disciplina..."

O campo deve ficar visualmente integrado ao painel.

O botão de enviar deve ser um pequeno botão com ícone de seta.

Ao pressionar Enter, enviar a pergunta.

O botão do chatbot deve aparecer em TODAS as páginas do site.

O site usa MkDocs Material com navegação instantânea (navigation.instant), então quando o usuário navega entre páginas o DOM pode ser recriado.

O botão e o chatbot precisam continuar funcionando durante a navegação.

Não pode acontecer:

- o botão desaparecer ao trocar de página;
- aparecer dois botões;
- o chatbot ser duplicado;
- eventos de clique serem registrados várias vezes;
- a conversa ser perdida ao navegar entre páginas.

Deve existir SOMENTE UM botão flutuante.

O estado da conversa deve continuar sendo preservado durante a navegação.


Não altere a lógica do RAG sem necessidade.

O chatbot deve continuar sendo exclusivamente sobre o conteúdo do site.

Ele não deve responder assuntos externos utilizando conhecimento geral do Gemini.

Se a API retornar:

"Não encontrei essa informação no material da disciplina."

mostrar essa mensagem normalmente.

O chatbot já recebe fontes no formato:

{
  "titulo": "...",
  "url": "..."
}

Manter essa funcionalidade.

As fontes devem aparecer abaixo da resposta.

Quero deixar visualmente mais bonito.

Exemplo:

📚 Fonte

Redes Neurais Convolucionais

[Ver conteúdo completo →]

O link deve ser clicável e levar diretamente para a página correspondente do próprio site.

Não inventar URLs.

O JavaScript deve apenas utilizar a URL recebida pela API.