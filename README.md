# Prateleira Mágica ✨📚

Um PWA estático, leve e extensível para leitura infantil com ilustrações, sílabas interativas, narração pelo navegador, desafios e uso offline. A prateleira tem quatro aventuras: **{{nome}} e o Trem Travesso** (TRA–TRU), **{{nome}} e o Drone Desaparecido** (DRA–DRU), **{{nome}} e o Trem dos Dragões** (as dez sílabas combinadas) e **{{nome}} e o Reino das Cores** (misturas, harmonias, exploração das cores e Medalha das Cores). Os títulos, os textos e os protagonistas ilustrados se adaptam à criança configurada.

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
personagem.html                    Redirecionamento legado para a aba Personalizar
perfil.html                        Abas Meu perfil (medalhas) e Personalizar (avatar)
books/index.json                   Manifesto dos livros disponíveis
books/<slug>.json                  História completa e exercícios de cada livro
assets/css/app.css                 Estilos da biblioteca e do leitor
assets/js/library.js               Prateleira dinâmica
assets/js/reader.js                Leitor e narração
assets/js/page-turn.js             Adaptador da virada de páginas por toque
assets/js/colors.js                Adaptador do NameToColor, paletas, nomes infantis e temas
assets/js/color-explorer.js        Laboratório interativo de cores dentro do leitor
assets/vendor/NameToColor.js       Biblioteca original de zonaro/NameToColor
assets/vendor/NameToColor.ptBR.js  Dados originais de tradução brasileira
assets/vendor/page-flip.browser.js Motor StPageFlip 2.0.7, MIT, disponível offline
assets/vendor/LICENSE              Licença MIT da biblioteca StPageFlip
assets/js/avatar-parts.js          Peças vetoriais extraídas dos SVGs originais (geradas)
assets/js/pet-parts.js             Vetores das 20 pelúcias originais (gerados)
assets/js/avatar.js                Compositor das peças originais + pernas customizáveis
assets/js/preferences.js           Nome, nascimento, pronomes, pelúcia, progresso e conquistas
assets/js/settings-ui.js           Editor de personagem, pelúcias e backup SVG
assets/js/profile.js               Tela de perfil, livros lidos e medalhas
assets/js/profile-tabs.js          Navegação acessível entre abas do perfil
assets/js/pwa.js                   Instalação PWA e status de conexão
assets/illustrations/<slug>/*.svg  Ilustrações por página
assets/avatar-reference/svgrepo-kids/ SVGs de referência da coleção Kids Avatars
assets/avatar-reference/component-map.json Seleção de caminhos e cores dos SVGs originais
assets/pets/*.svg                   20 pelúcias da coleção Cute Animal Vectors sem alterações
assets/pets/catalog.json           Catálogo e fontes das pelúcias
assets/icons/                     Ícones PWA
manifest.webmanifest               Manifesto instalável
sw.js                              Cache offline
tests/verify.mjs                   Testes de integridade
tests/preferences.test.mjs         Testes da personalização
tests/offline.test.mjs             Teste completo do cache offline
tests/colors.test.mjs              Gerador de cores, harmonias, moods e novo livro
tests/progression.test.mjs         Desafio final e trava de páginas
tests/page-turn.test.mjs           Virada de página desktop e mobile
tools/generate-story-art.mjs       Geração dos SVGs dos livros de Draco
tools/download-kids-avatars.mjs    Atualização dos SVGs de referência
tools/extract-avatar-components.py Geração das peças vetoriais utilizadas no app
tools/download-cute-animal-pets.mjs Download original da coleção de pelúcias
tools/build-pet-parts.mjs          Empacota SVGs originais das pelúcias para uso offline
tools/preview-avatar-combinations.mjs Prévia visual das combinações de avatar
docs/avatar-components.md         Proveniência, extração e compatibilidade
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

Nas páginas, coloque `[[palavra]]` para exibir uma palavra colorida que pode ser tocada para ouvi-la. `kind: "dialogue"` destaca o parágrafo como fala. Propriedades opcionais de página: `syllables`, `speech`, `tip`, `callout`, `medal`, `interactive`. `type: "challenge"` exibe os exercícios do livro; `type: "finish"` conclui a aventura. A página com `"interactive": "color-explorer"` mostra o laboratório de cores sem alterar as demais funções da leitura. O item `exercises[].color`, quando informado como `#rrggbb`, mostra a cor da frase. O campo opcional `medal` no JSON do livro e no catálogo personaliza o nome/emoji da medalha exibida após o desafio.

### Protagonista personalizável

O botão **Personalizar** (na prateleira e na aba Perfil) abre [`perfil.html#personalizar`](perfil.html#personalizar). O histórico de leitura e o editor agora são **abas da mesma página Perfil**. O endereço antigo `personagem.html` redireciona para essa aba. A prévia do personagem fica **fixa durante a rolagem**: em coluna lateral no computador e em uma faixa compacta no topo do celular. Nessa tela, é possível configurar:

- Nome da criança e escrita fonética separada para a narração.
- Data de nascimento opcional para calcular a idade e preencher `{{idade}}` em roteiros futuros.
- Gênero/pronomes: masculino (`ele/dele`), feminino (`ela/dela`) ou neutro (`elu/delu`).
- **22 penteados e 18 roupas extraídos dos SVGs reais da coleção Kids Avatars**, combináveis livremente: 396 combinações principais, antes de variar as cores. Penteados incluem afro, cacheado, maria-chiquinha, tranças, cabelo longo, cortes curtos, topetes, acessórios de flores/laços e boné.
- Escolha independente da cor do cabelo e da roupa, com paletas e seleção livre.
- **Calça, shorts ou saia**, com cor independente, e cor personalizada para os tênis, espelhados para permanecer alinhados.
- Cores de pele naturais ou fantasia (incluindo verde, azul, lilás e rosa), mantendo o seletor livre existente.
- **Palavra mágica → cor:** escreva `vermelho`, `girassol`, `abraço` ou outra palavra. O NameToColor gera uma cor repetível, mostra um nome infantil aproximado, oferece leitura em voz alta e permite aplicá-la ao cabelo, roupa, calça/shorts/saia, sapatos ou pele.
- **Paleta do aplicativo por mood:** uma seleção entre os dez estilos oficiais do NameToColor (Vibrante, Futurista, Divertido, Pastel suave, Calmo, Retrô, Orgânico, Sofisticado, Escuro e Corporativo), mais o tema original. O tema muda as cores de navegação e da interface na prateleira, no leitor e no perfil, sem afetar as cores do livro, ilustrações ou pele.
- O botão **Vestir meu personagem com esta paleta** usa quatro tons da paleta para cabelo, roupa, parte inferior e tênis. **Não altera `skinColor`**. A criança pode seguir customizando cada parte depois.
- Uma das **20 pelúcias originais** da coleção [Cute Animal Vectors](https://www.svgrepo.com/collection/cute-animal-vectors/), desbloqueada somente depois de conquistar **duas medalhas**. A pelúcia fica ao lado do avatar, apoiada no chão na altura dos tênis, nas ilustrações, no editor e no perfil.

### Progresso e medalhas

Na página [`perfil.html`](perfil.html), a criança vê o nome, a idade (quando informada), o personagem, a pelúcia e os livros já iniciados ou concluídos. Cada livro exibe **percentual de páginas visitadas** e o emoji **🏅** caso a medalha do desafio tenha sido conquistada. Os cards permitem retomar a leitura.

Todos os quatro livros têm um desafio de frases antes da última página. **A página seguinte e a medalha final ficam bloqueadas** até a criança marcar todas as frases. O bloqueio vale para botão, bolinhas, setas do teclado e deslize. Ao completar o desafio, uma medalha fica registrada em `achievements.books[id].medalEarnedAt` e não se perde ao fechar o app. O campo `visitedPages` registra as páginas efetivamente visitadas; livros marcados como concluídos em versões antigas continuam com 100% para preservar o histórico. O Reino das Cores usa sete frases com sete cores distintas e registra **🎨 Medalha das Cores** no perfil, além de contar para liberar a pelúcia.

O desbloqueio das pelúcias conta **medalhas de livros diferentes**, nunca frases isoladas. Sem duas medalhas, o catálogo aparece bloqueado. A escolha fica salva localmente e é incluída no SVG de backup.

Essas preferências ficam apenas no `localStorage` do navegador, sem conta ou servidor. O avatar SVG é personalizado localmente nas ilustrações de cada página, inclusive quando o aplicativo está offline. A chave de armazenamento do app anterior foi mantida de propósito para preservar o personagem após a renomeação do repositório.

#### SVG de personagem como backup

No editor, **Baixar personagem SVG** salva as escolhas atuais e oferece um arquivo `.svg` que funciona como uma ilustração vetorial comum. Ele inclui um elemento `<metadata id="prateleira-magica-profile" data-format="application/json">` contendo um JSON inline com:

- `profile`: `name`, `pronunciation`, `birthDate`, `gender`, `petId`, `avatarStyle`, `outfitStyle`, `skinColor`, `hairColor`, `outfitColor`, `bottomStyle`, `bottomColor`, `shoeColor`, `themeMood`;
- `achievements.books`: cada ID de livro com frases marcadas (`completedExercises`), páginas visitadas (`visitedPages`), conclusão da história (`finished`, `finishedAt`) e medalha (`medalEarnedAt`, `challengeCompletedAt` legado);
- `app`, `schemaVersion` e `exportedAt` para identificar a origem, versão e data do backup.

As frases marcadas ficam salvas automaticamente no navegador e reaparecem ao abrir o mesmo livro. A conclusão de um livro também fica registrada quando a criança alcança a página final. Ao tocar em **Importar personagem SVG**, escolha um backup baixado anteriormente; o aplicativo valida o JSON de perfil e pede confirmação para **substituir** as preferências e conquistas existentes. Por segurança, os elementos gráficos de SVGs importados **não** são inseridos no app: o personagem é redesenhado localmente usando apenas os dados validados do JSON.

O backup não exige conta, servidor nem conexão. **Privacidade:** como o arquivo contém o nome da criança e seu histórico de leitura, guarde-o em um local seguro e evite compartilhá-lo publicamente. Um SVG sem os metadados de perfil da Prateleira Mágica não pode ser importado como backup.

**Regra para todos os livros:** os campos `title` de `books/index.json`, do JSON do livro e da página de capa devem usar `{{nome}}` quando mencionarem a criança. Nos textos, selos, medalhas e narrações, use `{{nome}}`, `{{idade}}` (quando o nascimento estiver cadastrado), `{{pronome}}`, `{{Pronome}}`, `{{possessivo}}` ou `{{Possessivo}}`, nunca um nome infantil fixo. Se o nome for uma palavra interativa, use `[[{{nome}}]]`. Evite frases que dependam de flexão de gênero fora desses marcadores; prefira construções neutras como “a criança” quando necessário.

Nas ilustrações, o símbolo SVG `<symbol id="ellie">` (legado), `<symbol id="kid">` ou `<symbol id="protagonist">` representa **a criança configurada**, e as instâncias `<use>` são trocadas automaticamente pelo avatar escolhido. Os textos dos SVGs também aceitam `{{nome}}`, inclusive `<title>`, `aria-label` e balões de fala. O processo escapa caracteres especiais para preservar o XML válido. As capas na prateleira, a ilustração de destaque e as páginas do leitor herdam o mesmo avatar.

#### Referências visuais SVG Repo

O rosto, os penteados e as roupas **usam as formas vetoriais originais**, extraídas dos SVGs da coleção [Kids Avatars](https://www.svgrepo.com/collection/kids-avatars/). A geometria de cabelo e roupa não é redesenhada: `tools/extract-avatar-components.py` copia as formas declaradas em `component-map.json` e substitui somente as cores por marcadores de personalização. Apenas pernas, calça, shorts, saia e tênis têm formas próprias do aplicativo.

O catálogo original (74 SVGs baixados dentre 75 identificados) fica em `assets/avatar-reference/svgrepo-kids/`, acompanhado de `sources.json` e das URLs de origem. **31 SVGs originais** são utilizados nos componentes de rosto, cabelo e roupa; as respectivas páginas do SVG Repo indicam licença CC0. O app carrega **somente** o pacote de componentes extraídos `assets/js/avatar-parts.js`, incluído no cache offline; não precisa carregar os SVGs originais separadamente, nem depender de rede para compor ou exportar um personagem. Veja as [fontes e decisões de composição](docs/avatar-components.md).

Para tentar baixar ou atualizar a coleção novamente, execute `node tools/download-kids-avatars.mjs` com acesso à internet. O script reaproveita os arquivos válidos já existentes.

Para reconstruir as peças usadas pelo app após alterar as seleções, execute `python3 tools/extract-avatar-components.py` e rode os testes. A geração precisa manter o SVG final auto-contido para o backup funcionar offline.

#### Pelúcias sem redesenho

Os arquivos `assets/pets/*.svg` são os **20 SVGs originais e sem alterações** da coleção [Cute Animal Vectors](https://www.svgrepo.com/collection/cute-animal-vectors/), todos conferidos com indicação de licença CC0 nas páginas individuais. O script `node tools/download-cute-animal-pets.mjs` baixa e valida a coleção completa. O script `node tools/build-pet-parts.mjs` empacota as formas originais sem modificar seus caminhos; apenas o contêiner posiciona a pelúcia ao lado da criança, encostada na mesma linha de chão dos sapatos (inclusive nas histórias e nos backups offline). A chave `petId` permanece nos dados salvos por compatibilidade.

### NameToColor e o Livro das Cores

A integração utiliza os **arquivos originais** [`NameToColor.js`](https://github.com/zonaro/NameToColor/blob/main/NameToColor.js) e [`NameToColor.ptBR.js`](https://github.com/zonaro/NameToColor/blob/main/NameToColor.ptBR.js), copiados para `assets/vendor/` e pré-cacheados no Service Worker. Não há chamada à API nem necessidade de CDN em tempo de execução. Depois da primeira carga completa, o gerador de cores e o catálogo brasileiro funcionam offline. Para atualizar essa dependência no futuro, substitua ambos os arquivos com as versões do mesmo repositório e rode `node tests/colors.test.mjs`.

O adaptador `assets/js/colors.js` expõe `window.LivrinhoColors` com os métodos `hex(palavra)`, `name(hex)`, `palette(mood)`, `harmonies(hex,mood)` e `applyTheme(mood)`. `hex()` usa `generateColor` e `palette()` usa `generateThemePalette`, exatamente como na biblioteca original. A função `name()` consulta `colorName` e `closestName` em português e, quando o nome retornado não tem tradução, procura uma **aproximação** entre os 181 nomes de cores do pacote brasileiro (não uma equivalência científica exata). Os modos de harmonia usam `generateMonochrome`, `generateTriadic`, `generateComplementary` e `generateThemePalette`.

No livro **{{nome}} e o Reino das Cores**, a criança explora misturas de tinta (com resultados ilustrativos, que variam conforme os pigmentos), sensação de cores quentes/frias, contraste complementar, três cores triádicas, variações monocromáticas e combinações por sentimento. No laboratório interativo, pode:

1. Selecionar uma cor pelo `input[type=color]`.
2. Tocar em uma das dezoito bolinhas de cores comuns.
3. Digitar qualquer palavra em português e transformá-la numa cor reprodutível.
4. Ler e ouvir o nome aproximado, ver HEX e explorar quatro tipos de paletas que podem ser tocadas para descobrir outras cores.
5. Completar sete frases coloridas para obter **🎨 Medalha das Cores**, salva no mesmo `achievements.books` dos demais livros.

O tema escolhido na personalização é persistido no mesmo perfil (`themeMood`), portanto acompanha o SVG de backup e a restauração. O padrão `""` mantém a aparência clássica. Os dez moods disponíveis correspondem à lista oficial de temas da categoria `mood` do NameToColor. Para acessibilidade, as cores de destaque do tema são escurecidas quando necessário para manter contraste com textos em branco, e os fundos são suavizados; os dados das paletas originais não são alterados.

### Pronúncia

O texto exibido é personalizado com o nome escolhido, mas a escrita fonética aparece somente na voz. O botão **🔊 Ouvir**, ao lado do campo de pronúncia em **Perfil → Personalizar**, testa exatamente o texto digitado, sem precisar salvá-lo. `pronunciation.names` continua disponível para personagens secundários (por exemplo, Drica e Draco); a pronúncia definida pela criança tem prioridade. `pronunciation.syllables` envia sons fonéticos e palavras de apoio (TRO: “tró, como em troca”; TRU: “trú, como em truque”). A disponibilidade e a qualidade da voz dependem do sintetizador de fala instalado no navegador/dispositivo.

## Controles

- O leitor não tem cabeçalho: somente **barra de progresso**, **livrinho** e paginação/legenda. O rodapé fixo mantém **Prateleira**, **Ouvir**, **Voltar** e o botão rosa de avanço visíveis durante a leitura.
- Arraste o **canto da folha com o dedo ou mouse** para acompanhar a dobra em tempo real. A animação usa [StPageFlip 2.0.7](https://github.com/Nodlik/StPageFlip), motor realista sem jQuery e de licença MIT, empacotado localmente. No desktop cada página lógica reúne ilustração à esquerda e texto à direita; no celular ambos aparecem na mesma folha. O motor respeita `prefers-reduced-motion` na navegação por botões.
- `←` página anterior; `→` próxima; **Espaço** ou botão **Ouvir** alterna entre narrar, pausar e continuar da última palavra identificada. O módulo `assets/js/speech.js` divide textos em trechos curtos e preserva o progresso: se o navegador não informar limites de palavra, no máximo o trecho atual é repetido, nunca a página inteira.
- As ilustrações SVG usam `object-fit: contain` em todas as resoluções, sem cortar as bordas do desenho.
- Toque em palavras coloridas ou nas sílabas para ouvi-las individualmente.
- No desafio, marque **todas** as frases lidas para liberar a página final e ganhar a medalha.

## Offline e instalação

O Service Worker salva a prateleira, o leitor, o editor, o perfil, todos os JSONs, as ilustrações, os dois arquivos originais do NameToColor e **os 20 SVGs das pelúcias**, quando há rede no primeiro acesso. Depois, a navegação e a leitura ficam disponíveis offline, inclusive em URLs de livros com parâmetros. Com conexão, HTML, CSS, JavaScript e JSONs usam **network-first**, atualizando o cache após novos deploys; ilustrações usam cache-first. Quando offline, tudo recorre às versões locais disponíveis.

Em navegadores compatíveis, use **Instalar app** ou a opção **Adicionar à tela inicial**. A narração por voz depende das vozes disponíveis localmente; alguns sintetizadores podem precisar de conectividade.

## GitHub Pages

O workflow `.github/workflows/pages.yml` valida os arquivos e publica a raiz do repositório a cada push na branch `main`.

Se o Pages ainda não estiver habilitado: **Settings → Pages → Build and deployment → Source: GitHub Actions**. Depois de renomear o repositório para `prateleira-magica` e publicar a branch `main`, o endereço será `https://zonaro.github.io/prateleira-magica/`. Os links entre páginas e os caminhos dos assets são relativos ao repositório, permitindo essa mudança sem quebrar os livros.

## Verificação

```bash
node tests/verify.mjs
node tests/preferences.test.mjs
node tests/colors.test.mjs
node tests/avatar.test.mjs
node tests/progression.test.mjs
node tests/page-turn.test.mjs
node tests/offline.test.mjs
node tools/build-pet-parts.mjs --check
```

Licença: consulte [LICENSE](LICENSE).
