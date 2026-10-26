# Prateleira Mágica ✨📚

Um PWA estático, leve e extensível para leitura infantil com ilustrações, sílabas interativas, narração pelo navegador, desafios e uso offline. A prateleira tem três aventuras: **{{nome}} e o Trem Travesso** (TRA–TRU), **{{nome}} e o Drone Desaparecido** (DRA–DRU) e **{{nome}} e o Trem dos Dragões** (as dez sílabas combinadas). Os títulos, os textos e os protagonistas ilustrados se adaptam à criança configurada.

## Usar

Site: `https://zonaro.github.io/prateleira-magica/`

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
assets/js/preferences.js           Nome, pronomes, voz e avatar do protagonista
assets/js/settings-ui.js           Editor de personagem no app
assets/js/pwa.js                   Instalação PWA e status de conexão
assets/illustrations/<slug>/*.svg  Ilustrações por página
assets/icons/                     Ícones PWA
manifest.webmanifest               Manifesto instalável
sw.js                              Cache offline
tests/verify.mjs                   Testes de integridade
tests/preferences.test.mjs         Testes da personalização
tests/offline.test.mjs             Teste completo do cache offline
tools/generate-story-art.mjs       Geração dos SVGs dos livros de Draco
.github/workflows/pages.yml        Deploy no GitHub Pages
```

Nenhum framework, empacotador, servidor PHP ou banco de dados é necessário.

## Adicionar outro livro

1. Crie um `books/<slug>.json` seguindo a estrutura do livro Ellie.
2. Coloque as ilustrações SVG em `assets/illustrations/<slug>/`.
3. Adicione um item ao array `books` de `books/index.json`, com `id`, `data`, `title`, `subtitle`, `cover`, `language` e `syllables`.
4. Aumente a versão `CACHE_NAME` em `sw.js` para que o cache offline seja reconstruído.
5. Execute `node tests/verify.mjs` e faça commit na `main`.

O catálogo gera automaticamente um card na prateleira (até três colunas no desktop); o leitor não precisa de alterações para abrir o novo livro.

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

### Protagonista personalizável

O botão **Personalizar** (na prateleira e no leitor) permite configurar:

- Nome da criança e escrita fonética separada para a narração.
- Gênero/pronomes: masculino (`ele/dele`), feminino (`ela/dela`) ou neutro (`elu/delu`).
- Cinco estilos de cabelo/boné e cores de pele naturais ou fantasia (incluindo verde, azul, lilás, rosa e qualquer cor escolhida no seletor).

Essas preferências ficam apenas no `localStorage` do navegador, sem conta ou servidor. O avatar SVG é personalizado localmente nas ilustrações de cada página, inclusive quando o aplicativo está offline. A chave de armazenamento do app anterior foi mantida de propósito para preservar o personagem após a renomeação do repositório.

**Regra para todos os livros:** os campos `title` de `books/index.json`, do JSON do livro e da página de capa devem usar `{{nome}}` quando mencionarem a criança. Nos textos, selos, medalhas e narrações, use `{{nome}}`, `{{pronome}}`, `{{Pronome}}`, `{{possessivo}}` ou `{{Possessivo}}`, nunca um nome infantil fixo. Se o nome for uma palavra interativa, use `[[{{nome}}]]`. Evite frases que dependam de flexão de gênero fora desses marcadores; prefira construções neutras como “a criança” quando necessário.

Nas ilustrações, o símbolo SVG `<symbol id="ellie">` (legado), `<symbol id="kid">` ou `<symbol id="protagonist">` representa **a criança configurada**, e as instâncias `<use>` são trocadas automaticamente pelo avatar escolhido. Os textos dos SVGs também aceitam `{{nome}}`, inclusive `<title>`, `aria-label` e balões de fala. O processo escapa caracteres especiais para preservar o XML válido. As capas na prateleira, a ilustração de destaque e as páginas do leitor herdam o mesmo avatar.

### Pronúncia

O texto exibido é personalizado com o nome escolhido, mas a escrita fonética aparece somente na voz. `pronunciation.names` continua disponível para personagens secundários (por exemplo, Drica e Draco); a pronúncia definida pela criança tem prioridade. `pronunciation.syllables` envia sons fonéticos e palavras de apoio (TRO: “tró, como em troca”; TRU: “trú, como em truque”). A disponibilidade e a qualidade da voz dependem do sintetizador de fala instalado no navegador/dispositivo.

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

Se o Pages ainda não estiver habilitado: **Settings → Pages → Build and deployment → Source: GitHub Actions**. Depois de renomear o repositório para `prateleira-magica` e publicar a branch `main`, o endereço será `https://zonaro.github.io/prateleira-magica/`. Os links entre páginas e os caminhos dos assets são relativos ao repositório, permitindo essa mudança sem quebrar os livros.

## Verificação

```bash
node tests/verify.mjs
node tests/preferences.test.mjs
node tests/offline.test.mjs
```

Licença: consulte [LICENSE](LICENSE).
