# Avatar automático por foto — modelo local e privacidade infantil

## Arquitetura

O projeto é estático e usa **HTML + JavaScript vanilla**, sem React, bundler
ou backend. A opção **📷 Minha foto** é uma aba de `perfil.html` que inicia
oculta e só aparece depois que um responsável a habilita **para a criança selecionada**
e da confirmação de que os **sete recursos locais**
(bundle JS, arquivos WASM e ambos os modelos) estão disponíveis no domínio
do site ou no cache do PWA. Se faltar um deles, ela não aparece. Um link
direto para `perfil.html#foto` retorna a `#personalizar` se os recursos não
estiverem acessíveis. A checagem usa `HEAD` sem descarregar modelos grandes
só para verificar a disponibilidade. A conexão/restauração do Service Worker
permite reavaliar os recursos. A interação é uma tela própria, **sem pop-up**.

### Autorização individual e câmera automática

Em `perfil.html#pais`, selecione a criança e ative **Permitir “Minha Foto”**.
O clique do adulto solicita ao navegador permissão para usar a câmera;
quando concedida, o stream é interrompido imediatamente e a opção passa a
valer apenas para aquele perfil no app. Se a permissão for negada, a opção
permanece desativada. Essa autorização fica no armazenamento parental local,
fora do backup SVG da criança.

Ao entrar na aba autorizada, a câmera **abre automaticamente**, sem botão extra.
Há botão **Tirar minha foto** e opção de escolher imagem da galeria. Ao sair
da aba, trocar de criança, revogar a autorização ou esgotar o tempo diário,
a câmera é desligada. Ao liberar mais tempo, a prévia pode reiniciar.

**Limite do navegador:** a permissão física da câmera pertence à origem do
site (`zonaro.github.io`), não a cada perfil infantil. O app acrescenta sua
própria trava por criança. O navegador pode revogar a permissão ou solicitar
nova confirmação; nesse caso, o responsável deve conferir as permissões do site.

O texto apresentado à criança usa linguagem lúdica, solicita expressamente
ajuda de um adulto e explica que a foto será descartada após a criação.
O editor `assets/js/settings-ui.js` ainda recebe o resultado para preservar
undo, autosave e todos os dados existentes.

O processo é inteiramente client-side:

1. Ao escolher imagem ou usar `navigator.mediaDevices.getUserMedia`, a
   foto fica somente na memória da aba e é reduzida a, no máximo, 768 px no
   maior lado, usando um Canvas temporário.
2. O **FaceLandmarker** identifica 1 rosto (rejeita zero ou mais de um).
3. O **ImageSegmenter / SelfieMulticlass** identifica cabelo, face, roupa e
   acessórios. O Canvas extrai pixels das regiões relevantes; média aparada
   descarta parte dos extremos e a distância euclidiana RGB aproxima a cor às
   paletas do avatar existentes. Não extrapola gênero, etnia, idade ou identidade.
4. Os campos `skinColor`, `hairColor`, `outfitColor` e `avatarStyle` são
   propostos. Um sinal positivo de possível armação ao redor dos olhos pode
   sugerir `glasses_round`. Valores incertos não alteram a escolha atual.
5. `settings-ui.js` aplica as sugestões usando `edit('avatar-photo', ...)`,
   preservando `presetEdits`, undo, atualização SVG, medalhas e outros dados.
6. A foto não é passada ao módulo de preferências nem salva. Bitmap, máscara,
   Canvas e câmera são liberados após aplicação, erro ou cancelamento.

**Atenção:** cor da pele e cabelo estimados dependem da luz, do balanço de
branco e da qualidade da segmentação. Textura de cabelo e óculos são heurísticas
de baixa confiabilidade; sempre é possível corrigir pelo editor manual.

## Hospedagem 100% na mesma origem

Os scripts, WASM e modelos de ML são **servidos pelo próprio GitHub Pages**,
na mesma origem da aplicação. Nenhuma foto é enviada a terceiros e o runtime
não carrega JS nem modelos de CDNs. O `perfil.html` ainda aplica uma política
de segurança bloqueando conexões `fetch`/beacon e imagens de outras origens.

O código do navegador referencia:

```
assets/vendor/mediapipe/vision_bundle.mjs
assets/vendor/mediapipe/wasm/vision_wasm_internal.js
assets/vendor/mediapipe/wasm/vision_wasm_internal.wasm
assets/vendor/mediapipe/wasm/vision_wasm_nosimd_internal.js
assets/vendor/mediapipe/wasm/vision_wasm_nosimd_internal.wasm
assets/vendor/mediapipe/models/face_landmarker.task
assets/vendor/mediapipe/models/selfie_multiclass_256x256.tflite
```

Esses binários são grandes e **não são versionados no Git**. O arquivo
`tools/mediapipe-dependencies.json` fixa a versão do pacote npm
`@mediapipe/tasks-vision@0.10.21` e os endereços de origem dos modelos.
O script `tools/vendor-mediapipe.mjs` extrai os arquivos do pacote npm,
baixa os modelos no ambiente de build e registra tamanhos/hashes SHA-256 em
`BUILD-INFO.json`. A publicação copia todos para `_site/assets/vendor/`.
Há cópia dos avisos de licença do pacote, quando distribuídos.

Na rede do **usuário final** só existe o domínio do Prateleira Mágica:
`zonaro.github.io`. Conexões com npm/Google são exclusivamente do ambiente
de desenvolvimento/CI, **antes** da publicação.

### Preparar ambiente de desenvolvimento

Requisitos de desenvolvimento: Node.js 20+, npm, tar e rede na etapa de setup.

```sh
node tools/vendor-mediapipe.mjs
python3 -m http.server 8000
```

Abra `http://localhost:8000/perfil.html#pais` após o carregamento dos
modelos, autorize a função para a criança e então visite **Minha Foto**.
A câmera exige HTTPS ou localhost e permissão explícita. Abrir arquivos
`file://` não serve.

### Testar

```sh
node tools/vendor-mediapipe.mjs
node tests/avatar-photo.test.mjs
node tests/avatar-photo-availability.test.mjs
node tests/verify.mjs
node tests/offline.test.mjs
```

O CI de PR e o workflow de deploy fazem o setup **antes** de validar ou
publicar. O deploy principal continua estático, sem dependências npm em
produção.

### Offline

A aba só aparece quando os recursos estão publicados na origem ou disponíveis
integralmente no Cache Storage. Uma instalação sem rede nem cache suficiente
não mostra a aba. Após a instalação completa, ela fica acessível offline.
O Service Worker do PWA baixa os arquivos do MediaPipe para o Cache Storage
durante a instalação/atualização, separadamente do núcleo do app. Assim, um
erro/quota insuficiente para ~dezenas de MB de modelos **não impede a
prateleira e os livros de funcionar offline**; porém o reconhecimento por
foto só ficará disponível offline quando **todos** os recursos de IA tiverem
sido salvos. A primeira instalação/atualização precisa estar online para
popular o cache. Em caso de erro, abra a página online novamente.

As rotas `assets/vendor/mediapipe/*` são cache-first, inclusive WASM,
JS e modelos, reduzindo tráfego e tempo ao retornar à função. O cache é
renovado quando `CACHE_NAME` muda.

## Revisão e segurança

- Navegador bloqueando câmera: recurso de arquivo continua disponível.
- Mesmo que o consentimento da câmera seja negado, o aplicativo não perde o
  avatar, progresso nem medalhas.
- Foto só existe na memória volátil do navegador; a limpeza evita
  persistência do nosso código, mas não promete sobrescrita de RAM física.
- A biblioteca MediaPipe possui um **aviso próprio** de métricas de uso e
  desempenho (https://developers.google.com/edge/mediapipe/solutions/tasks).
  A política `connect-src 'self'` foi adicionada à página infantil para
  impedir conexões de telemetria externas convencionais; isso não equivale
  a uma auditoria completa do binário de terceiros. Reavaliar as políticas e
  consentimentos pertinentes antes de uso público por crianças.
- Não usar fotos infantis reais no CI, em logs, Issues nem capturas públicas.
- Teste manual em Android/iOS/desktop: câmera autorizada/negada, selfie
  frontal, roupa visível, rosto pequeno, vários rostos, pouca luz, sem rede
  após instalação, troca de aba, cancelar, upload inválido e desfazer.
- Verifique a aba **Rede** do DevTools: carregamentos de modelos devem apontar
  apenas para a origem da aplicação; nenhuma foto deve aparecer em requisições.

## Atualizar modelos

Modificar `tools/mediapipe-dependencies.json` conscientemente, repetir
`node tools/vendor-mediapipe.mjs` e validar licenças, peso dos arquivos,
versão dos WASM, algoritmo das categorias e hashes do modelo. Aumentar
`CACHE_NAME` em `sw.js` e validar no mobile. Não usar modelos com URL
mutável sem checagem de integridade.

## Verificação automática do deploy

A publicação do GitHub Pages deve usar **Settings → Pages → Build and deployment → Source: GitHub Actions**. A opção *Deploy from a branch* pode executar um segundo workflow automático, publicar o repositório cru e omitir os sete binários MediaPipe gerados pelo CI (ignorados no Git).

O workflow `.github/workflows/pages.yml` prepara e testa os sete arquivos em `assets/vendor/mediapipe` antes de empacotar. **Após** `actions/deploy-pages`, executa `node tools/check-photo-deployment.mjs --public` para checar por HTTP no domínio final os sete arquivos (JS, WASM, modelos) e o HTML que contém `tabFoto`. Um 404/HTML de erro causa falha do deploy, mesmo que a etapa `actions/deploy-pages` tenha terminado com sucesso. O teste faz requisições `HEAD` e não transfere modelos grandes; a inferência e qualidade de fotos reais ainda exigem testes com dispositivo.

O SW `v28` força nova instalação do cache após a correção da publicação; sem espaço para todos os arquivos, a função por foto continua indisponível offline, sem quebrar os livros.

## Ajustes do editor por foto (crop, cores e óculos)

- Antes de executar os modelos, câmera e upload passam por uma etapa de **recorte
  4:5 ajustável**, com zoom entre 1× e 4×, arraste por mouse/toque,
  pinça com dois dedos, rolagem e setas do teclado. A análise recebe apenas
  o recorte final (Canvas 512×640), não o arquivo completo.
- O quadro da câmera é espelhado para corresponder à prévia; tracks são
  paradas imediatamente após capturar, antes do recorte.
- A classificação da cor do cabelo usa concentração da matiz e saturação
  para identificar tinturas fortes, sem perder cabelo castanho e preto.
  A paleta inclui vermelho, verde, laranja e turquesa fantasia.
- A detecção de acessórios nas regiões dos dois olhos e da ponte
  é heurística; só tenta escolher a cor da armação quando há sinais
  suficientes de óculos. A cor escolhida é gravada em `accessoryColor`,
  compartilhada com outros acessórios conforme o editor atual.
- Após analisar a foto, o editor aplica as opções em `draft`, salva
  com histórico e desfazer, remove as camadas SVG herdadas de personagens
  prontos quando necessário e re-renderiza **todas** as opções e swatches,
  não só o SVG principal. A escolha pode ser corrigida manualmente.
- Ao fechar/trocar aba, cancelamento, erro e conclusão, imagens temporárias
  são limpas da memória JS e a câmera é desligada. O aplicativo não
  envia, exporta ou salva a fotografia (apenas parâmetros do avatar).
- Teste de regressão: `node tests/avatar-photo-enhancements.test.mjs`.
  A verificação funcional em Android/iOS requer revisão em dispositivo real.

## Correção do seletor de foto

O controle de zoom usa `input[type=range]`. O upload deve sempre usar o campo
`input.avatar-photo-input[type=file]`; selecionar genericamente `input` aponta
para o slider e impede a galeria de abrir. Para evitar permissões de clique
programático variáveis entre Android, iOS e desktop, o campo de arquivo agora
ocupa, de forma transparente, a área do controle **Escolher uma foto** e recebe
o clique/toque **nativamente**. O campo é desabilitado durante a análise e
limpo após o uso, permitindo escolher o mesmo arquivo outra vez.

O teste `tests/avatar-photo-picker.test.mjs` executa o evento de escolha de
arquivo numa aba que contém simultaneamente os inputs de zoom e upload,
validando a passagem ao recorte e a limpeza ao sair da aba.
