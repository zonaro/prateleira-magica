# Avatar automático por foto (MediaPipe no navegador)

## Visão geral

O app é estático (HTML, CSS e JavaScript vanilla, sem React ou build). O botão
**📷 Criar pela minha foto** aparece no editor de `perfil.html#personalizar`.
A interface é injetada pelo módulo `assets/js/avatar-photo.js`, que abre um
`<dialog>` nativo com câmera (MediaDevices) e escolha de JPG/PNG/WebP.

1. O usuário abre a câmera ou escolhe arquivo (até 10 MB).
2. A foto é decodificada em memória e reduzida a até 768 px no maior lado.
3. O MediaPipe `FaceLandmarker` encontra pontos do rosto, com validação de
   tamanho, posição e iluminação.
4. O `ImageSegmenter` usando `SelfieMulticlass` separa rosto (3), cabelo (1),
   roupas (4) e acessórios (5). O Canvas lê pixels só dessas classes e regiões.
5. Uma média aparada por canal reduz efeitos de sombras e reflexos. A função
   `nearestColor` usa a menor distância euclidiana RGB para buscar cores das
   paletas reais de `LivrinhoAvatar` / editor (pele: seis cores naturais).
6. É gerada uma sugestão de `skinColor`, `hairColor`, `outfitColor`,
   `avatarStyle` e `glasses`. Campos com amostras insuficientes são ignorados.
7. O editor chama `edit('avatar-photo', ...)`, atualizando SVG,
   `presetEdits`, undo e salvamento local de **configurações**. A foto não entra
   nesse estado nem nos backups.
8. O Canvas temporário é zerado, ImageBitmap é fechado, `input[type=file]` é
   limpo, tracks da câmera são interrompidas e máscaras MediaPipe são liberadas.

## Limites e revisão pela criança / responsável

- **Penteado**: usa alcance vertical e irregularidade aproximada da máscara de
  cabelo; não é um classificador confiável de liso/cacheado. O avatar tem 25
  estilos que não correspondem um-a-um aos cabelos do mundo real.
- **Óculos**: sinal heurístico de "acessórios" ao redor dos dois olhos e da
  ponte nasal. Não detecta armações com confiabilidade clínica; só adiciona
  `glasses_round` quando o sinal positivo é suficiente e não há outro
  acessório facial. Um falso negativo não remove um acessório existente.
- **Luz**: pele fotografada não é a cor real absoluta; balanço de branco,
  sombras e filtros afetam o resultado. A criança pode ajustar manualmente
  cada campo depois de aplicar.
- Foto ideal: **uma única pessoa**, rosto frontal nítido e torso visível,
  sem filtros, iluminação suave. O modelo pode errar mesmo nessas condições.
- Nunca inferir etnia, gênero, idade ou identidade a partir da foto.

## Privacidade infantil e dependências

A foto **não** é enviada à aplicação, logada, colocada em IndexedDB,
localStorage, Cache Storage, backups ou metadados do perfil. Captura e inferência
ocorrem no cliente. A remoção de referências, limpeza de Canvas e parada da
câmera permitem que o navegador libere a memória, mas não constituem garantia
de sobrescrita física instantânea em todos os navegadores/dispositivos.

**Importante:** esta primeira versão baixa o pacote MediaPipe `0.10.22`
pelo jsDelivr e dois modelos do Google Cloud Storage **somente quando o recurso
é acionado**. Esses pedidos de download revelam aos fornecedores informações
usuais de rede (por exemplo IP). A documentação do MediaPipe declara que os
dados de imagem são processados no dispositivo, mas sua política informa que
a biblioteca pode enviar métricas de uso/performance. Obtenha a autorização
adequada de responsável antes de usar fotos de crianças.

Para modo **integralmente offline, sem conexões com terceiros**: hospedar
`vision_bundle.mjs` e `wasm/*` da mesma versão de MediaPipe e os arquivos
`face_landmarker.task`, `selfie_multiclass_256x256.tflite` dentro de
`assets/vendor/mediapipe/`; alterar as constantes `MP_ROOT`, `FACE_MODEL`
e `MULTICLASS_MODEL` em `assets/js/avatar-photo.js`; atualizar o
`APP_SHELL` em `sw.js` e incrementar a versão do cache. Não misture versões
diferentes do pacote e WASM. A primeira ativação do PWA deverá pré-carregar
esses binários. A versão atual **exige internet na primeira análise**; não
promete uso offline dos modelos.

## Executar e testar

```sh
python3 -m http.server 8000
node tests/avatar-photo.test.mjs
node tests/verify.mjs
node tests/offline.test.mjs
```

Abra `http://localhost:8000/perfil.html#personalizar` ou o GitHub Pages
(HTTPS). Webcam exige contexto seguro e permissão explícita. Testes manuais:
fotografia clara, rosto pequeno, ausência de rosto, múltiplas pessoas, webcam
negada, cancelar no meio do carregamento, trocar de aba durante câmera ativa,
upload inválido, desempenho no Android e desfazer após aplicar. Verifique a aba
**Network** do DevTools: nenhum pedido deve conter bytes da foto.
