# Prateleira Mágica ✨📚

Um PWA estático, leve e extensível para leitura infantil com ilustrações, sílabas interativas, narração pelo navegador, desafios e uso offline. A prateleira reúne **22 livros**: aventuras personalizadas com a criança como protagonista e **cinco contos clássicos com personagens próprios**, incluindo *Rapunzel*, Andersen, Esopo e Beatrix Potter. Os livros personalizados adaptam títulos, textos e ilustrações à criança configurada.

## Usar

Site: `https://zonaro.github.io/prateleira-magica/`

Para desenvolver localmente, execute na raiz do repositório:

```bash
# Apenas uma vez (ou após limpar os modelos): baixar os binários MediaPipe para uso local
node tools/vendor-mediapipe.mjs
python3 -m http.server 8000
```

O comando de preparação usa npm e tar **apenas na máquina de desenvolvimento ou no CI**;
o site em execução continua estático, sem npm, sem servidor de API e sem React.
Os arquivos de IA gerados em `assets/vendor/mediapipe/` ficam fora do Git,
mas são copiados para o GitHub Pages durante a publicação e armazenados no
cache do PWA. Leia [a documentação da função por foto](docs/avatar-photo.md).

Abra `http://localhost:8000/`. Por segurança do navegador, abrir o HTML diretamente como `file://` não permite carregar os livros em JSON. O GitHub Pages (HTTPS) oferece o modo PWA completo.

## Estrutura

```text
index.html                         Prateleira / catálogo
livro.html                         Leitor de livros
personagem.html                    Redirecionamento legado para a aba Personalizar
perfil.html                        Perfil, avatar e Configurações dos pais
books/index.json                   Manifesto dos livros disponíveis
books/<slug>.json                  História completa e exercícios de cada livro
assets/css/app.css                 Estilos da biblioteca e do leitor
assets/js/library.js               Prateleira dinâmica
assets/js/reader.js                Leitor e narração
assets/js/page-turn.js             Adaptador da virada de páginas por toque
assets/js/colors.js                Adaptador do NameToColor, paletas, nomes infantis e temas
assets/js/color-explorer.js        Laboratório interativo de cores dentro do leitor
assets/js/music-keyboard.js        Teclado das 8 notas (Web Audio, funciona offline)
assets/vendor/NameToColor.js       Biblioteca original de zonaro/NameToColor
assets/vendor/NameToColor.ptBR.js  Dados originais de tradução brasileira
assets/vendor/page-flip.browser.js Motor StPageFlip 2.0.7, MIT, disponível offline
assets/vendor/LICENSE              Licença MIT da biblioteca StPageFlip
assets/js/avatar-parts.js          Peças vetoriais extraídas dos SVGs originais (geradas)
assets/js/avatar-presets.js        Arte integral dos 73 personagens prontos (gerada)
assets/js/pet-parts.js             Vetores das 20 pelúcias originais (gerados)
assets/js/avatar.js                Compositor das peças originais + pernas customizáveis
assets/js/preferences.js           Perfis independentes, identidade, pelúcia, progresso e conquistas
assets/js/parental.js              Senha com hash, tempo diário e limites individuais
assets/js/parental-ui.js           Seletor de criança, bloqueio e configurações dos pais
assets/js/settings-ui.js           Editor infantil só de aparência e pelúcias
assets/js/profile.js               Tela de perfil, livros lidos e medalhas
assets/js/profile-tabs.js          Navegação acessível entre abas do perfil
assets/js/pwa.js                   Instalação PWA e status de conexão
assets/illustrations/<slug>/*.svg  Ilustrações por página
assets/avatar-reference/svgrepo-kids/ SVGs de referência da coleção Kids Avatars
assets/avatar-reference/component-map.json Seleção de caminhos e cores dos SVGs originais
assets/pets/*.svg                   20 pelúcias CC0 originais + coração, sol e rouxinol exclusivos
assets/pets/catalog.json           Catálogo e fontes das pelúcias
assets/icons/                     Ícones PWA
manifest.webmanifest               Manifesto instalável
sw.js                              Cache offline
tests/verify.mjs                   Testes de integridade
tests/preferences.test.mjs         Testes da personalização
tests/family-parental.test.mjs     Testes de perfis múltiplos, tempo e senha
tests/offline.test.mjs             Teste completo do cache offline
tests/colors.test.mjs              Gerador de cores, harmonias, moods e novo livro
tests/progression.test.mjs         Desafio final e trava de páginas
tests/book-rewards.test.mjs        Catálogo completo de recompensas, travas de conclusão e backup
tests/page-turn.test.mjs           Virada de página desktop e mobile
tools/generate-story-art.mjs       Geração dos SVGs dos livros de Draco
tools/download-kids-avatars.mjs    Atualização dos SVGs de referência
tools/extract-avatar-components.py Geração das peças vetoriais utilizadas no app
tools/build-avatar-presets.mjs     Empacota personagens prontos para livros, perfil e backup offline
tools/download-cute-animal-pets.mjs Download original da coleção de pelúcias
tools/build-pet-parts.mjs          Empacota SVGs originais das pelúcias para uso offline
tools/preview-avatar-combinations.mjs Prévia visual das combinações de avatar
tools/build-escovacao-rapunzel.mjs Gera livro de higiene bucal e transcreve Rapunzel com atribuição
tools/build-classicos-publicos.mjs Gera quatro recontos originais de histórias em domínio público
books/rapunzel-fonte.txt          Fonte textual licenciada extraída do PDF de referência
docs/avatar-components.md         Proveniência, extração e compatibilidade
.github/workflows/pages.yml        Deploy no GitHub Pages
```

Nenhum framework, empacotador, servidor PHP ou banco de dados é necessário.

## Crianças e configurações dos pais

O nome inicial é **Você**. Na aba **Configurações dos pais**, os responsáveis podem adicionar até 30 perfis de crianças, escolher o perfil ativo e definir, para cada uma, nome, pronúncia (com botão para ouvir), data de nascimento, gênero e limite diário de uso. Por padrão, cada criança tem **60 minutos por dia**; o limite pode ser ajustado de 5 a 480 minutos. Avatar, medalhas e progresso de leitura ficam separados por criança.

O tempo é contado enquanto o aplicativo está visível **somente na prateleira, nos livros e nas abas de personalização** (incluindo personagens prontos e foto). Na landing page, na página de conquistas e nas configurações dos pais, o contador fica pausado e essas telas continuam acessíveis mesmo se o tempo esgotar. Ao esgotar o limite, a leitura e a personalização ficam bloqueadas até o **dia seguinte**, ou até um responsável inserir a senha e reiniciar o contador. A senha também protege o acesso às configurações parentais; é preciso criá-la no primeiro uso, e é recomendável anotá-la em local seguro. Se ainda não houver senha, os pais podem entrar na área para configurá-la. A troca de criança é feita no seletor flutuante. Usar o mesmo aplicativo em outro dispositivo não sincroniza perfis ou tempo automaticamente.

Os dados antigos do perfil único são migrados automaticamente, sem apagar conquistas. O backup SVG de cada criança, inclusive exportação e importação, está na área dos pais; **não inclui a senha ou o limite de tempo**. Os dados e o hash com sal da senha são armazenados localmente (`localStorage`), sem envio a servidores. Como o aplicativo é inteiramente client-side, esses controles ajudam no uso cotidiano, mas **não são uma barreira inviolável** contra alterações no armazenamento do navegador ou no relógio do dispositivo.

## Adicionar outro livro

1. Crie um `books/<slug>.json` seguindo a estrutura do livro Ellie.
2. Coloque as ilustrações SVG em `assets/illustrations/<slug>/`.
3. Adicione um item ao array `books` de `books/index.json`, com `id`, `data`, `title`, `subtitle`, `cover`, `language`, `subject` e `ageRange: [idadeMinima, idadeMaxima]` (e `syllables`, quando necessário). Para livros em que a criança **não** é a protagonista, inclua `"protagonistMode":"fixed"` no manifesto e no livro; as ilustrações e o título não serão substituídos pelo avatar.
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

Nas páginas, coloque `[[palavra]]` para exibir uma palavra colorida que pode ser tocada para ouvi-la. `kind: "dialogue"` destaca o parágrafo como fala. Propriedades opcionais de página: `syllables`, `speech`, `tip`, `callout`, `medal`, `interactive`, `bibliography`. `type: "challenge"` exibe os exercícios do livro; `type: "finish"` conclui a aventura. `"interactive": "color-explorer"` mostra o laboratório de cores e `"interactive": "music-keyboard"` disponibiliza o teclado de Dó a Dó (C, D, E, F, G, A, B, C). **Nessas páginas o arraste do motor de folhas é desabilitado** para permitir interação; os botões e setas continuam funcionando. `bibliography: [{"title":"...","url":"..."}]` insere referências como texto não clicável, especialmente nos livros de saúde. O item `exercises[].color`, quando informado como `#rrggbb`, mostra a cor da frase. O campo opcional `medal` personaliza o nome/emoji da medalha.

### Catálogo por assunto e idade recomendada

A prateleira oferece busca por título/assunto, filtro por assunto e faixa etária recomendada. Essas faixas são **orientativas**: crianças aprendem em ritmos diferentes e podem ler com ajuda de responsáveis.

| Livro | Assunto | Idade sugerida | Presentes ao concluir |
|---|---|---|---|
| Trem Travesso | Alfabetização (TR) | 5–8 anos | Medalha |
| Drone Desaparecido | Alfabetização (DR) | 5–8 anos | Medalha |
| Trem dos Dragões | Alfabetização e leitura | 6–9 anos | Medalha |
| Reino das Cores | Artes e cores | 4–8 anos | Medalha |
| Orquestra dos Sons | Ciências, sons e voz | 4–7 anos | Fones de ouvido + caixa de som |
| Festa das Notas | Música, notas e cifras | 5–9 anos | Mini teclado + violão + flauta |
| Jardim dos Sentimentos | Emoções e acolhimento | 3–7 anos | Pelúcia exclusiva de coração que muda de cor |
| Escudo das Vacinas | Saúde e vacinação | 4–8 anos | Kit médico + jaleco |
| Corpo em Movimento | Saúde, brincadeiras, água e descanso | 4–8 anos | Halteres de brinquedo + garrafinha com líquido colorível |
| Calendário das Festas | Cultura, festas e tradições brasileiras | 5–9 anos | Ano-Novo: coroa; Carnaval: máscara e regata de glitter; Páscoa: tiara de coelho e ovos; Festa Junina: chapéu; Independência: bandeirinha; Dia das Crianças: pião; Dia do Saci: fantasia de uma perna; Halloween: chapéu de bruxa, abóbora com vela animada, fantasia de fantasma, asas de morcego e asas de fada; Natal: gorro |
| Dança do Tempo | Ciências, calendário, rotação/translação e fases da Lua | 5–9 anos | Calendário, bola da Lua e pelúcia de sol sorridente |
| Turma dos Alimentos | Saúde, alimentação variada e segurança | 4–8 anos | Maçã, pera, uvas, iogurte, salada, pão e ovo de brinquedo |
| Viagem dos Oito Planetas | Ciências, planetas e Plutão | 5–9 anos | Oito bolas com texturas diferentes: Mercúrio, Vênus, Terra, Marte, Júpiter, Saturno, Urano e Netuno; bambolê na cintura inspirado nos anéis de Saturno |
| Aventura do ABC | Alfabetização, letras A–Z e palavras | 4–8 anos | Blocos de empilhar A, B e C |
| Trilha do NH | Alfabetização, NHA/NHE/NHI/NHO/NHU | 5–8 anos | Medalha do NH |
| Jardim das Diferenças | Convivência, respeito e diversidade brasileira | 6–9 anos | Dupla hélice de DNA e peteca de brinquedo |
| Clube dos Dentinhos | Saúde, higiene bucal, flúor e escovação | 4–8 anos | Escova de dentes de brinquedo |
| Rapunzel (conto clássico) | Literatura e imaginação; leitura acompanhada | 7–9 anos | Cabelo de Rapunzel com tranças longas |
| O Rouxinol e o Imperador (Andersen) | Contos clássicos, música e liberdade | 6–9 anos | Pelúcia exclusiva de rouxinol cantor |
| A Roupa Nova do Imperador (Andersen) | Contos clássicos, sinceridade e pensamento crítico | 5–9 anos | Coroa imperial com pedras coloridas |
| Fábulas de Esopo | Fábulas e convivência: tartaruga, leão, rato, raposa e corvo | 5–9 anos | Tartaruguinha de madeira |
| A História de Pedro Coelho (Potter) | Contos clássicos, escolhas e respeito ao espaço alheio | 4–8 anos | Cenoura de brinquedo |

Todo livro mantém um desafio antes da última página. As **53 recompensas vinculadas a livros** só ficam selecionáveis depois de **marcar todas as frases do desafio e chegar à página final** (`finished` + `medalEarnedAt` ou `challengeCompletedAt`). O livro de dígrafo NH desbloqueia apenas a medalha, como os livros originais de alfabetização. No livro das festas, **todos os presentes de cada data** são liberados juntos ao terminar a aventura completa. Os itens ficam visíveis em cinza enquanto bloqueados. As recompensas vinculadas ao livro são definidas em `assets/js/avatar.js` (`rewardBooks`) e listadas como `rewards` no JSON do livro. Os IDs devem corresponder. A regra é verificada também ao carregar e importar perfis, não apenas na interface. O penteado especial de Rapunzel segue a mesma regra de conclusão e é compatível com as cores de cabelo existentes.

O coração é a 21ª pelúcia, exclusiva do Jardim dos Sentimentos, o sol sorridente é a 22ª pelúcia, exclusiva da Dança do Tempo, e o rouxinol cantor é a 23ª pelúcia, liberada pelo conto de Andersen; as outras 20 continuam liberadas com duas medalhas. A cor do líquido da garrafinha é guardada separadamente em `waterColor` e incluída no backup SVG. Os **quatro livros de saúde** trazem bibliografia para os responsáveis, sem links clicáveis no leitor; os livros culturais, de astronomia e os clássicos novos também possuem fontes em texto puro. As explicações são educativas e não substituem a orientação da UBS ou dos profissionais de saúde.

Na fantasia do Saci, a perna direita e o respectivo sapato são ocultados na composição do avatar, sem afetar a aparência normal ao retirar a fantasia. A abóbora de Halloween tem uma vela **apenas ilustrada** com animação SVG; não representa uma chama real. Todas as bolas planetárias têm texturas vetoriais únicas e a de Saturno inclui anéis. O texto distingue o **Dia do Saci** (uma celebração cultural brasileira reconhecida, por exemplo, em São Paulo) do **Halloween**; ambos ocorrem em 31 de outubro, mas não são o mesmo evento. Alguns dias apresentados são feriados nacionais, e outros são festividades ou pontos facultativos conforme o local.

**Ilustração individual por página:** os 22 livros usam um SVG diferente para cada página. As 47 cenas originais dos três livros TR/DR foram preservadas, junto de **239 cenas vetoriais geradas** para os demais livros. A arte é gerada de modo reprodutível por `node tools/illustrate-books.mjs` e conferida em `--check` no CI. Os dados são gerados por `node tools/build-new-books.mjs`, `node tools/build-escovacao-rapunzel.mjs` e `node tools/build-classicos-publicos.mjs`. O avatar da criança continua inserido via `#kid` nas histórias personalizadas. Os cinco contos clássicos possuem personagens fixos desenhados para suas narrativas e seus SVGs não são processados pela personalização de avatares. Os arquivos são incluídos automaticamente no cache offline do PWA.

**Rapunzel — direitos e leitura acompanhada:** conto originalmente publicado pelos irmãos Grimm, transcrito integralmente da [edição em português adaptada por Sueli Maria de Regino (2016)](https://domainpublic.wordpress.com/wp-content/uploads/2022/03/rapunzel.pdf), pertencente à Biblioteca Bilíngue de Literatura Infantil e Juvenil – Libras/Português. O aviso de direitos no próprio PDF permite usar, reproduzir e divulgar os **textos** da adaptação com citação da fonte. As **ilustrações deste projeto são novas**; não utilizam as imagens do PDF. A íntegra do texto extraído está preservada em `books/rapunzel-fonte.txt`, conferida automaticamente em teste. Recomendamos leitura acompanhada por conta de acontecimentos delicados (separação familiar e ferimento do príncipe).

**Novos clássicos — seleção e direitos:** os quatro títulos foram encontrados no [catálogo de domínio público](https://www.baixelivros.com.br/dominio-publico) ou na [literatura infantil](https://www.baixelivros.com.br/literatura-infantil) do Baixe Livros. O site mistura obras em domínio público com PDFs de distribuição somente **gratuita**; portanto, não se pode reutilizar automaticamente as traduções contemporâneas. As narrativas originais de **Hans Christian Andersen** (morto em 1875), das **fábulas tradicionalmente atribuídas a Esopo** (Antiguidade) e de **Beatrix Potter** (morta em 1943) já cumpriram o prazo patrimonial da lei brasileira. Todo texto destes quatro livros é um **reconto autoral novo em português brasileiro**, com ilustrações SVG próprias; não foram copiados PDFs, traduções, adaptações nem artes do site. Em particular, a edição portuguesa de *Pedro Coelho* publicada em 2026 é marcada **“Gratuita”** no site; apenas a história original de 1902 foi usada como base. As páginas de bibliografia registram o autor e o catálogo, exibidos como **texto não clicável** para a criança. O FAQ da landing adapta perguntas úteis com redação própria, sem copiar o texto do outro site.

**Cuidados com a diversidade:** a história apresenta as categorias de autodeclaração do IBGE (branca, preta, parda, amarela, indígena), sem tratá-las como tipos biológicos ou tons literais de pele. O termo "vermelha" é contextualizado como inadequado para substituir os nomes dos povos indígenas. Em vez de um ranking impossível de sustentar ("o Brasil é o mais miscigenado"), apresenta as diversas ancestralidades e histórias da população brasileira; explica racismo e convida ao respeito. As fontes do IBGE e do genoma humano aparecem em uma página para responsáveis, **sem links clicáveis**.

### Novidades de personalização, capas e doações

- O ioiô colorível aparece em Brinquedos e é desbloqueado uma única vez ao voltar
  uma página em qualquer livro (inclusive pelo gesto de virar a folha). A
  conquista permanece no perfil e acompanha a exportação do SVG.
- Gabriel e Bruno recebem ajuste de eixo nas peças SVG originais do tronco,
  permitindo combinar outras roupas sem deslocar mangas e ombros.
- As capas exibidas na landing e na prateleira usam bordas `10px 40px 40px 10px`.
- As doações PIX usam QR Code **local** (imagem fornecida pelo responsável pelo
  projeto e conferida com o BR Code). Há PIX copia e cola, sem exibir nome ou
  CPF do recebedor na página inicial.

### Leitor adaptativo de páginas 📖

O leitor escolhe **automaticamente** entre a virada StPageFlip e um modo
leve sem animação/engine de dobra, que mantém texto, ilustrações, toque horizontal,
botões, teclado, narração e medalhas. Aparelhos com memória/CPU limitadas e
quem usa preferência do sistema para reduzir movimento já iniciam com leitura
leve. Nos demais, o leitor mede a fluidez **apenas durante a virada**: quadros
repetidamente atrasados ou uma virada que não termina ativam o modo leve
automaticamente, mantendo a página atual. A detecção desconsidera abas
ocultas e evita monitoramento permanente.

O seletor **Animação das páginas**, na página do livro, permite escolher
*Automática*, *Desligada — leitura leve* ou *Tentar animação novamente*.
Um aparelho com engasgos usa temporariamente leitura leve (24h), mas o leitor
pode experimentar a animação novamente. A preferência de movimento reduzido do
sistema prevalece. Tudo funciona offline.

### Avatar por foto — aba opcional 📷

No perfil, a aba **📷 Minha foto** aparece apenas quando todos os arquivos
locais do MediaPipe estão disponíveis via site ou cache offline. Nessa aba,
a criança é convidada a **pedir ajuda a uma pessoa adulta** para abrir a
câmera ou escolher uma foto. A imagem é analisada somente no aparelho,
descartada ao final e não entra nos backups; o avatar gerado pode ser revisado
na aba **Personalizar**, sem perder as medalhas. O recurso não abre pop-up.

### Protagonista personalizável

O botão **Personalizar** (na prateleira e na aba Perfil) abre [`perfil.html#personalizar`](perfil.html#personalizar). O histórico de leitura e o editor agora são **abas da mesma página Perfil**. O endereço antigo `personagem.html` redireciona para essa aba. A prévia do personagem fica **fixa durante a rolagem**: em coluna lateral no computador e em uma faixa compacta no topo do celular. Nessa tela, é possível configurar:

- Nome da criança e escrita fonética separada para a narração.
- Data de nascimento opcional para calcular a idade e preencher `{{idade}}` em roteiros futuros.
- Gênero/pronomes: masculino (`ele/dele`), feminino (`ela/dela`) ou neutro (`elu/delu`).
- **25 penteados e 25 roupas** (24 da coleção Kids Avatars + jaleco médico), combináveis (625 combinações principais), incluindo Careca. O jaleco só fica selecionável após concluir o livro das vacinas.
- Escolha independente da cor do cabelo, da roupa e **dos acessórios**, com paletas e seleção livre. Há boné ampliado, tapa-olho, óculos com nariz e bigode, máscara de raposa (kitsune), máscara de super-herói, capacete esportivo, **tiara de gatinho**, capa com capuz e capa de super-herói. A **boina de encanador com a inicial da criança** é desbloqueada ao conquistar **três medalhas**. Flores são desenhadas sobre as tiaras mesmo quando selecionadas primeiro. A capa com capuz **oculta temporariamente o cabelo** para impedir que ele apareça atravessando o tecido; ao tirar a capa, o penteado escolhido volta intacto.
- **Brinquedos personalizáveis:** bolas de futebol, basquete, tênis, futebol americano, handebol e monstrinho de bolso (bola vermelha/branca), peteca, peças de xadrez, asas de fada ou morcego, skate, bambolê e **fantasia de fantasma** (lençol sobre o personagem inteiro, com furos para os olhos). A criança pode combinar um brinquedo de mão, um das costas, um do chão, um bambolê na cintura e uma fantasia, com cor escolhida separadamente. **Bola de monstrinho: duas medalhas; skate: quatro medalhas.** A peteca vem do livro da diversidade; asas e fantasma, do livro das festas; o bambolê, do livro do espaço.
- **Presentes educativos:** fones (antes disponíveis livremente), caixa de som, mini teclado, violão, flauta, kit médico, halteres leves de faz de conta, garrafinha e jaleco. A água da garrafinha usa seu próprio seletor de cor; os instrumentos e brinquedos de mão dividem o mesmo espaço visual.
- **Calça, shorts, saia curta, saia longa ou fralda**, com cor independente. Para os pés: **tênis, chinelo, meias lisas/listradas/de bolinhas, descalço ou patins**, com escolha de cor quando aplicável. Os patins são liberados após **três medalhas**.
- Cores de pele naturais ou fantasia (incluindo verde, azul, lilás e rosa), mantendo o seletor livre existente.
- **Invente uma cor em cada seletor:** ao lado de **cada** `input[type=color]` (pele, cabelo, roupa, acessórios, brinquedos, líquido da garrafinha, parte de baixo e calçados) há um campo de palavra livre e um botão **🔊 Ouvir**. Digite `vermelho`, `girassol`, `abraço` ou outra palavra: o NameToColor atualiza imediatamente o próprio seletor e a prévia do avatar, mostra o nome aproximado e salva a cor com histórico de desfazer. A palavra em si não é guardada nem enviada para lugar algum; só a cor HEX permanece no perfil. A seção isolada “Invente uma cor com palavras” foi removida.
- **Paleta do aplicativo por mood:** uma seleção entre os dez estilos oficiais do NameToColor (Vibrante, Futurista, Divertido, Pastel suave, Calmo, Retrô, Orgânico, Sofisticado, Escuro e Corporativo), mais o tema original. O tema muda as cores de navegação e da interface na prateleira, no leitor e no perfil, sem afetar as cores do livro, ilustrações ou pele.
- O botão **Pintar meu personagem com estas cores** usa quatro tons da paleta para cabelo, roupa, parte inferior e tênis. **Não altera `skinColor`**. A criança pode seguir customizando cada parte depois.
- Uma das **20 pelúcias originais** da coleção [Cute Animal Vectors](https://www.svgrepo.com/collection/cute-animal-vectors/), desbloqueada somente depois de conquistar **duas medalhas**. A pelúcia fica ao lado do avatar, apoiada no chão na altura dos tênis, nas ilustrações, no editor e no perfil.
- A **pelúcia de coração das emoções**, adicional e exclusiva do livro dos sentimentos, muda suavemente de cor em SVG, sem conexão ou imagem externa.
- **Gravação automática:** não há botão Salvar. Cada escolha é persistida imediatamente via `preferences.save` e refletida no perfil e nos próximos livros.
- **Desfazer:** um histórico em memória registra as alterações desde que o editor foi carregado. Digitação contínua e arraste do seletor de cores são agrupados em um único passo. O histórico some ao sair/recarregar a página.
- **Apagar meu perfil e começar de novo:** pede confirmação e redefine também as conquistas e os livros lidos (`achievements.books = {}`), além do avatar, pronúncia, nome, nascimento, tema e pelúcia. A ação pode ser desfeita durante a mesma visita ao editor.

### Progresso e medalhas

Na página [`perfil.html`](perfil.html), a criança vê o nome, a idade (quando informada), o personagem, a pelúcia e os livros já iniciados ou concluídos. Cada livro exibe **percentual de páginas visitadas** e o emoji **🏅** caso a medalha do desafio tenha sido conquistada. Os cards permitem retomar a leitura.

Todos os nove livros têm um desafio de frases antes da última página. **A página seguinte e a medalha final ficam bloqueadas** até a criança marcar todas as frases. O bloqueio vale para botão, bolinhas, setas do teclado e deslize. Ao completar o desafio, uma medalha fica registrada em `achievements.books[id].medalEarnedAt` e não se perde ao fechar o app. O campo `visitedPages` registra as páginas efetivamente visitadas; livros marcados como concluídos em versões antigas continuam com 100% para preservar o histórico. O Reino das Cores usa sete frases com sete cores distintas e registra **🎨 Medalha das Cores** no perfil, além de contar para liberar a pelúcia.

O desbloqueio das pelúcias conta **medalhas de livros diferentes**, nunca frases isoladas. Sem duas medalhas, o catálogo aparece bloqueado. A escolha fica salva localmente e é incluída no SVG de backup.

Essas preferências ficam apenas no `localStorage` do navegador, sem conta ou servidor. O avatar SVG é personalizado localmente nas ilustrações de cada página, inclusive quando o aplicativo está offline. A chave de armazenamento do app anterior foi mantida de propósito para preservar o personagem após a renomeação do repositório.

#### SVG de personagem como backup

No editor, **Exportar perfil** oferece um arquivo `.svg` que funciona como uma ilustração vetorial comum. A extensão e os detalhes do formato **não são exibidos à criança**, mas permanecem como contrato técnico. O arquivo inclui um elemento `<metadata id="prateleira-magica-profile" data-format="application/json">` contendo um JSON inline com:

- `profile`: `name`, `pronunciation`, `birthDate`, `gender`, `petId`, `avatarStyle`, `outfitStyle`, `skinColor`, `hairColor`, `outfitColor`, `bottomStyle`, `bottomColor`, `footwearStyle`, `sockPattern`, `shoeColor`, `accessories`, `accessoryColor`, `toys`, `toyColor`, `waterColor`, `sourceSvg`, `presetEdits`, `themeMood` (campos de personagens prontos presentes quando usados);
- `achievements.books`: cada ID de livro com frases marcadas (`completedExercises`), páginas visitadas (`visitedPages`), conclusão da história (`finished`, `finishedAt`) e medalha (`medalEarnedAt`, `challengeCompletedAt` legado);
- `app`, `schemaVersion` e `exportedAt` para identificar a origem, versão e data do backup.

As frases marcadas ficam salvas automaticamente no navegador e reaparecem ao abrir o mesmo livro. A conclusão de um livro também fica registrada quando a criança alcança a página final. Ao tocar em **Importar perfil**, escolha um arquivo exportado anteriormente; o aplicativo valida o JSON de perfil e pede confirmação para **substituir** as preferências e conquistas existentes. Por segurança, os elementos gráficos de SVGs importados **não** são inseridos no app: o personagem é redesenhado localmente usando apenas os dados validados do JSON.

O backup não exige conta, servidor nem conexão. **Privacidade:** como o arquivo contém o nome da criança e seu histórico de leitura, guarde-o em um local seguro e evite compartilhá-lo publicamente. Um SVG sem os metadados de perfil da Prateleira Mágica não pode ser importado como backup.

**Regra para todos os livros:** os campos `title` de `books/index.json`, do JSON do livro e da página de capa devem usar `{{nome}}` quando mencionarem a criança. Nos textos, selos, medalhas e narrações, use `{{nome}}`, `{{idade}}` (quando o nascimento estiver cadastrado), `{{pronome}}`, `{{Pronome}}`, `{{possessivo}}` ou `{{Possessivo}}`, nunca um nome infantil fixo. Se o nome for uma palavra interativa, use `[[{{nome}}]]`. Evite frases que dependam de flexão de gênero fora desses marcadores; prefira construções neutras como “a criança” quando necessário.

Nas ilustrações, o símbolo SVG `<symbol id="ellie">` (legado), `<symbol id="kid">` ou `<symbol id="protagonist">` representa **a criança configurada**, e as instâncias `<use>` são trocadas automaticamente pelo avatar escolhido. Os textos dos SVGs também aceitam `{{nome}}`, inclusive `<title>`, `aria-label` e balões de fala. O processo escapa caracteres especiais para preservar o XML válido. As capas na prateleira, a ilustração de destaque e as páginas do leitor herdam o mesmo avatar.

#### Referências visuais SVG Repo

O rosto, os penteados e as roupas **usam as formas vetoriais originais**, extraídas dos SVGs da coleção [Kids Avatars](https://www.svgrepo.com/collection/kids-avatars/). `tools/extract-avatar-components.py` copia as formas declaradas em `component-map.json` e substitui somente as cores por marcadores de personalização. As flores foram retiradas dos componentes de cabelo; as listras e os ajustes de alinhamento são camadas de composição. Pernas, partes de baixo, calçados, brinquedos e acessórios adicionais são desenhados pelo aplicativo. Asas e capas usam uma camada atrás do corpo; máscaras e flores são pintadas por cima; o skate fica sob os pés.

O catálogo de SVGs fica em `assets/avatar-reference/svgrepo-kids/`. Os componentes editáveis são carregados de `assets/js/avatar-parts.js`; os **73 personagens prontos** são carregados de `assets/js/avatar-presets.js`. Ambos funcionam offline, e os desenhos originais são incorporados aos SVGs de ilustrações e backups sem links externos. Ao personalizar um personagem pronto, somente o cabelo, a roupa ou a cor escolhida é alterada; o perfil guarda essa seleção para que as outras partes não voltem ao avatar padrão. A opção **Careca** não desenha cabelo, e **Boné** é um acessório separado com migração de perfis antigos. Veja as [fontes e decisões de composição](docs/avatar-components.md).

Para tentar baixar ou atualizar a coleção novamente, execute `node tools/download-kids-avatars.mjs` com acesso à internet. O script reaproveita os arquivos válidos já existentes.

Para reconstruir as peças editáveis, execute `python3 tools/extract-avatar-components.py`; para reconstruir os personagens prontos, execute `node tools/build-avatar-presets.mjs`. Depois rode os testes e atualize o cache offline do Service Worker.

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
