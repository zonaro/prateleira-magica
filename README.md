# Prateleira de Livrinhos 📚

Um PWA estático, leve e extensível para leitura infantil com ilustrações, sílabas interativas, narração pelo navegador, desafios e uso offline. O primeiro título é **Ellie e o Trem Travesso**, com 14 páginas e treinos de TRA, TRE, TRI, TRO e TRU.

## Usar

Site: `https://zonaro.github.io/livrinho-infantil-treino/`

Para desenvolver localmente, execute na raiz do repositório:

```bash
python3 -m http.server 8000
```

Abra `http://localhost:8000/`. Por segurança do navegador, abrir o HTML diretamente como `file://` não permite carregar os livros em JSON. O GitHub Pages (HTTPS) oferece o modo PWA completo.

## Estrutura

```text
index.html                         Prateleira / catálogo
livro.html                         Leitor de livros
books/index.json                   Manifesto dos livros disponíveis
books/<slug>.json                  História completa e exercícios de cada livro
assets/css/app.css                 Estilos da biblioteca e do leitor
assets/js/library.js               Prateleira dinâmica
assets/js/reader.js                Leitor e narração
assets/js/pwa.js                   Instalação PWA e status de conexão
assets/illustrations/<slug>/*.svg  Ilustrações por página
assets/icons/                     Ícones PWA
manifest.webmanifest               Manifesto instalável
sw.js                              Cache offline
tests/verify.mjs                   Testes de integridade
.github/workflows/pages.yml        Deploy no GitHub Pages
```

Nenhum framework, empacotador, servidor PHP ou banco de dados é necessário.

## Adicionar outro livro

1. Crie um `books/<slug>.json` seguindo a estrutura do livro Ellie.
2. Coloque as ilustrações SVG em `assets/illustrations/<slug>/`.
3. Adicione um item ao array `books` de `books/index.json`, com `id`, `data`, `title`, `subtitle`, `cover`, `language` e `syllables`.
4. Aumente a versão `CACHE_NAME` em `sw.js` para que o cache offline seja reconstruído.
5. Execute `node tests/verify.mjs` e faça commit na `main`.

O catálogo gera automaticamente um card na prateleira; o leitor não precisa de alterações para abrir o novo livro.

### Estrutura mínima de um livro

```json
{
  "schemaVersion": 1,
  "id": "meu-novo-livro",
  "title": "Título da História",
  "language": "pt-BR",
  "cover": "assets/illustrations/meu-novo-livro/capa.svg",
  "pronunciation": {
    "names": { "NomeExemplo": "pronúncia fonética" },
    "syllables": { "PRA": { "sound": "prá", "example": "prato" } }
  },
  "exercises": [{ "syllable": "PRA", "text": "O prato é prata." }],
  "pages": [{
    "type": "cover",
    "illustration": "assets/illustrations/meu-novo-livro/capa.svg",
    "sticker": "NOVA AVENTURA",
    "chapter": "Meu livrinho",
    "title": "Título da História",
    "blocks": [{ "kind": "paragraph", "text": "Hoje começa uma aventura!" }]
  }]
}
```

Nas páginas, coloque `[[palavra]]` para exibir uma palavra colorida que pode ser tocada para ouvi-la. `kind: "dialogue"` destaca o parágrafo como fala. Propriedades opcionais de página: `syllables`, `speech`, `tip`, `callout`, `medal`. `type: "challenge"` exibe os exercícios do livro; `type: "finish"` conclui a aventura.

### Pronúncia

O texto exibido nunca é alterado pela narração. `pronunciation.names` permite, por exemplo, ler **Ellie** como **Éli**; `pronunciation.syllables` envia sons fonéticos e palavras de apoio (TRO: “tró, como em troca”; TRU: “trú, como em truque”). A disponibilidade e a qualidade da voz dependem do sintetizador de fala instalado no navegador/dispositivo.

## Controles

- Clique ou toque em **Próxima** e **Voltar**, ou deslize na área do livro.
- `←` página anterior; `→` próxima; **Espaço** ou botão **Ouvir** narra a página atual.
- Toque em palavras coloridas ou nas sílabas para ouvi-las individualmente.
- No desafio, marque cada frase lida para ganhar a medalha.

## Offline e instalação

O Service Worker salva a prateleira, o leitor, todos os JSONs e todas as ilustrações listadas no catálogo, quando há rede no primeiro acesso. Depois, a navegação e a leitura ficam disponíveis offline, inclusive em URLs de livros com parâmetros. Para receber novos livros ou mudanças, o usuário precisa abrir o site com internet ao menos uma vez após a publicação da nova versão do Service Worker.

Em navegadores compatíveis, use **Instalar app** ou a opção **Adicionar à tela inicial**. A narração por voz depende das vozes disponíveis localmente; alguns sintetizadores podem precisar de conectividade.

## GitHub Pages

O workflow `.github/workflows/pages.yml` valida os arquivos e publica a raiz do repositório a cada push na branch `main`.

Se o Pages ainda não estiver habilitado: **Settings → Pages → Build and deployment → Source: GitHub Actions**. Após a primeira execução bem-sucedida, o endereço ficará em `https://zonaro.github.io/livrinho-infantil-treino/`.

## Verificação

```bash
node tests/verify.mjs
node tests/offline.test.mjs
```

Licença: consulte [LICENSE](LICENSE).
