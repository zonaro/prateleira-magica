# Avatar automático por foto — modelo local e privacidade infantil

## Arquitetura

O projeto é estático e usa **HTML + JavaScript vanilla**, sem React, bundler
ou backend. A opção **📷 Criar pela minha foto** aparece em
`perfil.html#personalizar`, na interface gerada por `assets/js/settings-ui.js`.

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

Abra `http://localhost:8000/perfil.html#personalizar`. A câmera exige
HTTPS ou localhost e permissão explícita. Abrir arquivos `file://` não serve.

### Testar

```sh
node tools/vendor-mediapipe.mjs
node tests/avatar-photo.test.mjs
node tests/verify.mjs
node tests/offline.test.mjs
```

O CI de PR e o workflow de deploy fazem o setup **antes** de validar ou
publicar. O deploy principal continua estático, sem dependências npm em
produção.

### Offline

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
