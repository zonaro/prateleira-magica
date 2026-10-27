/**
 * Recontos ORIGINAIS em português de narrativas infantis cujos enredos estão
 * em domínio público no Brasil. Não transcreve traduções modernas nem copia
 * ilustrações dos PDFs do Baixe Livros.
 * Use --check na CI para conferir os JSONs versionados.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const illustration = (id, n) => `assets/illustrations/capitulos/${id}/${String(n + 1).padStart(2, '0')}.svg`;
const p = (text) => ({ kind: 'paragraph', text });
const d = (text) => ({ kind: 'dialogue', text });
const page = (type, sticker, title, ...blocks) => ({ type, sticker, chapter: type === 'cover' ? 'Era uma vez...' : title, title, blocks });
const bibliography = (site, name, extra) => ({
  ...page('story', 'FONTES PARA FAMÍLIAS', 'De onde veio este conto?',
    p('Esta história é uma nova versão infantil de uma obra clássica em domínio público. Escrevemos o texto em português e desenhamos todas as cenas especialmente para a Prateleira Mágica.'),
    p('Os endereços são informações para os adultos: aparecem como texto e não abrem links durante a leitura. Traduções e ilustrações de edições recentes podem ter direitos próprios.')),
  interactive: 'bibliography',
  bibliography: [
    { title: `${name} — ficha bibliográfica no Baixe Livros`, url: site.replace(/^https?:\/\//, '') },
    { title: 'Baixe Livros — explicação sobre licenças de uso', url: 'www.baixelivros.com.br/licencas' },
    { title: 'Brasil — Lei de Direitos Autorais nº 9.610/1998 (artigo 41)', url: 'www.planalto.gov.br/ccivil_03/leis/l9610.htm' },
    ...(extra || [])
  ]
});
const finish = (sticker, title, text, medal) => ({ ...page('finish', sticker, title, p(text)), medal });
const challenge = (name, gift) => page('challenge', 'DESAFIO DO CONTO', 'O que ficou da história?',
  p(`Que aventura! Agora recorde as passagens de ${name}, marcando as frases verdadeiras. Leia com alguém de casa, se quiser. Ao completar o desafio e chegar à última página, você ganha sua medalha e ${gift}!`));

const books = [
  {
    id: 'o-rouxinol-e-o-imperador', title: 'O Rouxinol e o Imperador',
    subtitle: 'Um passarinho de verdade e a canção mais bonita do palácio',
    subject: 'Contos clássicos · música, natureza e amizade', ageRange: [6, 9],
    color: '#80b6ad', medal: '🐦 Medalha do Canto',
    originalAuthors: ['Hans Christian Andersen'], originalPublicationYear: 1843,
    sourceDocument: 'https://www.baixelivros.com.br/infantil/o-rouxinol-e-o-imperador-pdf',
    sourceNotice: 'Reconto original. A obra de Andersen está em domínio público; não foi reproduzido o texto de nenhuma tradução moderna.',
    rewards: [{ id: 'nightingale_plush', label: 'Pelúcia de rouxinol cantor' }],
    exercises: [
      { syllable: '🌳', text: 'O rouxinol vivia livre na floresta e cantava lindamente.' },
      { syllable: '🎵', text: 'O imperador conheceu a voz do pássaro graças a outras pessoas.' },
      { syllable: '🏰', text: 'A gaiola e o palácio não eram o lar preferido do passarinho.' },
      { syllable: '⚙️', text: 'O pássaro de brinquedo tocava sempre a mesma música.' },
      { syllable: '💚', text: 'A canção do rouxinol ajudou o imperador em um momento difícil.' },
      { syllable: '🕊️', text: 'Cuidar de um amigo também é respeitar sua liberdade.' }
    ],
    pages: [
      page('cover', 'A VOZ DA FLORESTA', 'O Rouxinol e o Imperador', p('Muito longe daqui, num palácio de telhas brilhantes, morava um imperador que gostava de descobrir coisas maravilhosas. Mas ele ainda não conhecia a maior maravilha de seu próprio jardim...')),
      page('story', 'PALÁCIO DE PORCELANA', 'Um reino muito bonito', p('O palácio tinha janelas coloridas, pontes delicadas e jardins cheios de flores. Visitantes de muitos lugares passeavam por lá e escreviam sobre tudo o que viam.'), p('Alguns diziam que a coisa mais linda daquele reino não era um tesouro: era uma canção.')),
      page('story', 'UM CANTO DESCONHECIDO', 'Quem está cantando?', p('Uma cozinheira contou ao imperador sobre um pequeno rouxinol que morava perto do bosque.'), d('— Quando ele canta, até a minha pressa descansa!'), p('O imperador ficou tão curioso que pediu ajuda para encontrar o passarinho.')),
      page('story', 'NA FLORESTA VERDE', 'A busca pela voz', p('Os convidados ouviram uma vaca mugindo, sapos coaxando e folhas dançando ao vento. Cada som parecia uma surpresa.'), d('— Escutem bem! — pediu a cozinheira. — Agora é o rouxinol!'), p('De um galhinho veio uma melodia suave, como gotas de luar.')),
      page('story', 'O PEQUENO ARTISTA', 'Uma voz que emociona', p('O rouxinol era miudinho, de penas discretas. No entanto, sua voz encheu o jardim de encanto.'), p('No palácio, o imperador escutou tão emocionado que seus olhos ficaram molhados de alegria.')),
      page('story', 'SAUDADES DA FLORESTA', 'Um amigo precisa de espaço', p('O rouxinol recebeu comida boa e atenção, mas sentia falta dos galhos, do vento e de voar sem hora marcada.'), d('— Minha canção fica mais bonita quando posso cantar livre — explicou o pássaro.')),
      page('story', 'UM PRESENTE BRILHANTE', 'A música de engrenagens', p('Um dia chegou uma caixinha com um pássaro feito de ouro e pedras coloridas. Ao girar uma pequena chave, ele cantava uma linda música.'), p('Era bonito de ver! Mas tocava a mesma melodia, sempre igualzinha.')),
      page('story', 'O SILÊNCIO', 'Onde está o rouxinol?', p('Todos prestaram tanta atenção ao pássaro mecânico que esqueceram o pequeno cantor da floresta.'), p('O rouxinol voou de volta para as árvores, onde podia encontrar outros pássaros e inventar novas melodias.')),
      page('story', 'A ENGRENAGEM CANSOU', 'Quando a música parou', p('Depois de muitos giros, o mecanismo começou a falhar: cric, crec... e silêncio!'), p('O imperador sentiu falta de uma canção que nascesse de verdade, diferente a cada amanhecer.')),
      page('story', 'UM MOMENTO DIFÍCIL', 'A janela aberta', p('Algum tempo depois, o imperador ficou muito doente. Estava cansado e com medo, e o palácio parecia silencioso demais.'), p('Então uma sombra pousou na janela: era o rouxinol, que tinha ouvido a notícia.')),
      page('story', 'UMA CANÇÃO DE CARINHO', 'A música volta a florescer', p('O passarinho cantou baixinho. Sua melodia trouxe calma e esperança enquanto o imperador descansava.'), d('— Obrigado por voltar, meu amigo — sussurrou o imperador.'), p('O rouxinol prometeu visitar o palácio quando quisesse. E assim continuou: livre e querido.')),
      page('story', 'UM PRESENTE ESPECIAL', 'A canção da amizade', p('O imperador aprendeu que nem toda beleza cabe numa caixa. Algumas maravilhas precisam de árvores, liberdade e carinho.'), p('E quando o rouxinol aparecia, todo o jardim parecia cantar junto.')),
      bibliography('https://www.baixelivros.com.br/infantil/o-rouxinol-e-o-imperador-pdf', 'O Rouxinol e o Imperador'),
      challenge('O Rouxinol e o Imperador', 'uma pelúcia de rouxinol'),
      finish('MEDALHA DO CANTO', 'A música mora no coração', 'Você ouviu a história do pássaro que cantava livre! Sua pelúcia de rouxinol agora pode acompanhar o avatar.', '🐦 Medalha do Canto conquistada!')
    ]
  },
  {
    id: 'a-roupa-nova-do-imperador', title: 'A Roupa Nova do Imperador',
    subtitle: 'O desfile mais estranho do reino e a coragem de dizer a verdade',
    subject: 'Contos clássicos · honestidade e pensamento crítico', ageRange: [5, 9],
    color: '#d59c75', medal: '👑 Medalha da Sinceridade',
    originalAuthors: ['Hans Christian Andersen'], originalPublicationYear: 1837,
    sourceDocument: 'https://www.baixelivros.com.br/infantil/a-roupa-nova-do-imperador-pdf',
    sourceNotice: 'Reconto original da obra em domínio público. Não foi utilizada a tradução de 2021 ou suas ilustrações.',
    rewards: [{ id: 'emperor_crown', label: 'Coroa imperial com pedras brilhantes' }],
    exercises: [
      { syllable: '👗', text: 'O imperador gostava muito de roupas novas.' },
      { syllable: '🧵', text: 'Os visitantes afirmaram tecer um pano mágico que ninguém conseguia ver.' },
      { syllable: '🤫', text: 'Muitos adultos fingiram ver o tecido porque tinham medo de passar vergonha.' },
      { syllable: '👀', text: 'As máquinas de costura estavam vazias o tempo todo.' },
      { syllable: '🗣️', text: 'Uma criança foi sincera ao contar o que estava vendo.' },
      { syllable: '💛', text: 'Podemos dizer a verdade com gentileza, mesmo quando outras pessoas discordam.' }
    ],
    pages: [
      page('cover', 'O DESFILE DO REINO', 'A Roupa Nova do Imperador', p('Num reino de ruas coloridas vivia um imperador que adorava roupas elegantes. Tinha casacos para o sol, capas para a chuva e botas para dias de festa!')),
      page('story', 'UM ARMÁRIO GIGANTE', 'O sonho de desfilar', p('O guarda-roupa do imperador era tão grande que parecia um labirinto. Mesmo assim, ele repetia:'), d('— Preciso de algo que ninguém nunca viu!')),
      page('story', 'DOIS VISITANTES', 'Os tecelões misteriosos', p('Certo dia, chegaram dois visitantes dizendo que sabiam fabricar o tecido mais raro do mundo.'), d('— Nossa roupa é tão especial que somente pessoas muito inteligentes podem enxergá-la!'), p('Mas era um truque: eles não tinham tecido nenhum.')),
      page('story', 'TEARES VAZIOS', 'Tic-tac, sem nenhum fio', p('Os visitantes fingiam trabalhar dia e noite. Faziam movimentos com as mãos, contavam botões invisíveis e pediam carretéis de linha.'), p('Quando alguém entrava, via apenas máquinas vazias.')),
      page('story', 'O MINISTRO VISITA', 'Será que posso falar?', p('Um ministro olhou, olhou e não enxergou nadinha.'), d('— Se eu disser a verdade, vão pensar que não entendo de roupas?'), p('Com vergonha, ele fingiu admirar listras e bordados que não existiam.')),
      page('story', 'TODO MUNDO FINGE', 'O boato cresce', p('Outros visitantes também diziam ver seda brilhante e flores douradas. Cada um tinha medo de ser o único a discordar.'), p('Às vezes, quando um grupo inteiro repete algo, parece difícil fazer uma pergunta simples.')),
      page('story', 'A PROVA DA ROUPA', 'Uma roupa imaginária', p('Chegou o dia da prova. Os falsos alfaiates movimentaram os braços ao redor do imperador, como se vestissem um casaco invisível.'), d('— Que elegante! — disseram, tentando esconder a surpresa.'), p('O imperador estava apenas com sua roupa de baixo.')),
      page('story', 'MÚSICA NA RUA', 'Começa o desfile', p('As trombetas tocaram e o imperador desfilou por ruas cheias de bandeirinhas. A multidão aplaudia sua suposta roupa encantada.'), p('Quase ninguém tinha coragem de dizer o que realmente via.')),
      page('story', 'A CRIANÇA CORAJOSA', 'Uma voz diferente', p('No meio da praça, uma criança perguntou bem alto:'), d('— Ué! Onde está a roupa nova? Eu só vejo a roupa de baixo!'), p('As pessoas ficaram em silêncio por um instante.')),
      page('story', 'RISADAS E REFLEXÃO', 'Quando a verdade aparece', p('Primeiro veio um cochicho, depois outro. Todos perceberam que tinham sido enganados.'), p('O imperador ficou vermelho de vergonha. Em vez de culpar a criança, resolveu pensar sobre o que aconteceu.')),
      page('story', 'CORAGEM GENTIL', 'Uma lição para o reino', p('O imperador aprendeu a escutar opiniões sinceras. E todos entenderam que não é preciso concordar com uma mentira só para fazer parte do grupo.'), d('— Uma pergunta honesta pode ser mais valiosa do que mil elogios falsos!')),
      page('story', 'A ROUPA MAIS BONITA', 'Vestido de sinceridade', p('No dia seguinte, o imperador vestiu uma roupa bem comum e saiu para conversar com as pessoas.'), p('Descobriu que uma boa conversa aquece muito mais do que qualquer capa mágica.')),
      bibliography('https://www.baixelivros.com.br/infantil/a-roupa-nova-do-imperador-pdf', 'A Roupa Nova do Imperador'),
      challenge('A Roupa Nova do Imperador', 'uma coroa imperial'),
      finish('MEDALHA DA SINCERIDADE', 'A coragem de ser sincero', 'Você percebeu como a verdade pode ajudar uma comunidade. Uma coroa imperial está esperando no guarda-roupa do seu avatar!', '👑 Medalha da Sinceridade conquistada!')
    ]
  },
  {
    id: 'as-fabulas-de-esopo', title: 'Fábulas de Esopo',
    subtitle: 'Quatro bichos, quatro aventuras e boas ideias para conversar',
    subject: 'Fábulas clássicas · persistência, amizade e convivência', ageRange: [5, 9],
    color: '#86b57d', medal: '🐢 Medalha da Sabedoria',
    originalAuthors: ['Esopo (fábulas tradicionalmente atribuídas)'],
    sourceDocument: 'https://www.baixelivros.com.br/infantil/fabulas-de-esopo-pdf',
    sourceNotice: 'Recontos próprios de quatro fábulas tradicionais antigas. O texto da coletânea contemporânea do site não foi reproduzido.',
    rewards: [{ id: 'wooden_tortoise', label: 'Tartaruguinha de madeira de brinquedo' }],
    exercises: [
      { syllable: '🐢', text: 'A tartaruga chegou à linha de chegada sem desistir.' },
      { syllable: '🐇', text: 'A lebre ficou tão confiante que parou para descansar na corrida.' },
      { syllable: '🦁', text: 'O leão descobriu que o pequeno rato também podia ajudá-lo.' },
      { syllable: '🧀', text: 'A raposa elogiou o corvo para tentar pegar seu alimento.' },
      { syllable: '🍇', text: 'A raposa chamou as uvas de azedas porque não conseguiu alcançá-las.' },
      { syllable: '✨', text: 'Cada fábula apresenta uma situação para pensarmos sobre nossas escolhas.' }
    ],
    pages: [
      page('cover', 'HISTÓRIAS DA FLORESTA', 'Fábulas de Esopo', p('Num livro bem antigo moram muitos animais que falam. Eles correm, conversam, se enganam e aprendem. Você quer conhecer quatro historinhas curtinhas?')),
      page('story', 'A LEBRE E A TARTARUGA', 'Uma corrida diferente', p('A lebre adorava mostrar como corria depressa. Um dia, riu do passo lento da tartaruga.'), d('— Vamos disputar uma corrida? — propôs a tartaruga, com um sorriso tranquilo.')),
      page('story', 'PASSO APÓS PASSO', 'Quem chega primeiro?', p('A lebre disparou e ficou tão certa da vitória que resolveu cochilar debaixo de uma árvore.'), p('A tartaruga continuou: passinho, passinho, passinho... Até cruzar a chegada!'), d('— Não foi a velocidade. Foi a vontade de continuar!')),
      page('story', 'O LEÃO E O RATO', 'Um encontro inesperado', p('Um ratinho passou correndo sobre a pata de um leão adormecido. O leão acordou com um rugido.'), d('— Por favor, me deixe ir! Um dia eu posso ajudar você!'), p('O leão riu, mas deixou o pequeno visitante escapar.')),
      page('story', 'UMA REDE EMBARALHADA', 'O pequeno grande amigo', p('Dias depois, o leão ficou preso numa rede. O ratinho ouviu seu chamado e chegou correndo.'), p('Com dentinhos pacientes, roeu os nós até libertar o amigo.'), d('— Viu só? Pequeno não quer dizer incapaz!')),
      page('story', 'O CORVO E A RAPOSA', 'O queijo na árvore', p('Um corvo pousou num galho com um pedacinho de queijo no bico. Uma raposa, lá embaixo, quis comer o queijo.'), d('— Que penas lindas! Aposto que sua voz é maravilhosa! — disse ela.')),
      page('story', 'ELOGIO OU TRUQUE?', 'O queijo escapou', p('O corvo ficou vaidoso. Abriu o bico para cantar... e o queijo caiu!'), p('A raposa o pegou e saiu andando. O corvo aprendeu a prestar atenção quando alguém elogia só para conseguir alguma coisa.')),
      page('story', 'A RAPOSA E AS UVAS', 'Um cacho lá no alto', p('Certa tarde, outra raposa viu uvas redondinhas penduradas numa parreira.'), p('Saltou uma vez, duas, três... As uvas continuaram longe de suas patas.')),
      page('story', 'UMA DESCULPA ENGRAÇADA', 'As uvas estão azedas?', p('Cansada, a raposa virou as costas e resmungou:'), d('— Nem queria essas uvas! Devem estar azedas!'), p('Mas será que estavam mesmo? Às vezes inventamos desculpas quando algo não dá certo.')),
      page('story', 'QUATRO APRENDIZADOS', 'Cada bicho sabe uma coisa', p('A tartaruga ensina persistência. O rato mostra que todos podem ajudar. O corvo lembra que devemos pensar antes de agir. E a raposa nos faz refletir sobre nossas desculpas.'), p('Uma fábula não precisa mandar em ninguém: ela abre espaço para boas conversas.')),
      page('story', 'CONTE UMA NOVA FÁBULA', 'Agora é sua vez!', p('Se você inventasse uma história de animais, quem seriam os personagens? Um beija-flor? Uma capivara? Uma formiga astronauta?'), p('Uma aventura inventada por você também pode ensinar algo sobre amizade e coragem.')),
      bibliography('https://www.baixelivros.com.br/infantil/fabulas-de-esopo-pdf', 'Fábulas de Esopo'),
      challenge('as Fábulas de Esopo', 'uma tartaruguinha de madeira'),
      finish('MEDALHA DA SABEDORIA', 'Quatro aventuras para guardar', 'A lebre, a tartaruga, o rato, o leão, o corvo e a raposa ensinaram muitas coisas! Sua tartaruguinha de madeira foi desbloqueada.', '🐢 Medalha da Sabedoria conquistada!')
    ]
  },
  {
    id: 'a-historia-de-pedro-coelho', title: 'A História de Pedro Coelho',
    subtitle: 'Um coelhinho curioso encontra aventuras num jardim de verduras',
    subject: 'Contos clássicos · natureza, escolhas e cuidado', ageRange: [4, 8],
    color: '#8cb8de', medal: '🥕 Medalha do Jardim',
    originalAuthors: ['Beatrix Potter'], originalPublicationYear: 1902,
    sourceDocument: 'https://www.baixelivros.com.br/infantil/a-historia-de-pedro-coelho',
    sourceNotice: 'O enredo original inglês (1902) é domínio público no Brasil. A edição portuguesa de 2026 no site está marcada Gratuita, não Domínio Público: seu texto e suas ilustrações NÃO foram usados.',
    rewards: [{ id: 'garden_carrot', label: 'Cenoura do jardim de Pedro Coelho' }],
    exercises: [
      { syllable: '🐰', text: 'Pedro era um coelhinho curioso e tinha uma família que cuidava dele.' },
      { syllable: '🥬', text: 'Pedro entrou num jardim que não era dele sem pedir licença.' },
      { syllable: '🥕', text: 'O jardim tinha verduras e cenouras gostosas.' },
      { syllable: '🧥', text: 'Pedro perdeu seu casaquinho durante a correria.' },
      { syllable: '💧', text: 'Pedro encontrou um caminho de volta para casa.' },
      { syllable: '💛', text: 'É importante ouvir os cuidados de quem nos ama e respeitar o espaço dos outros.' }
    ],
    pages: [
      page('cover', 'O COELHINHO CURIOSO', 'A História de Pedro Coelho', p('Era uma vez quatro coelhinhos que moravam com a mãe numa toca aconchegante, sob as raízes de uma árvore. Um deles, Pedro, era tão curioso quanto suas orelhas eram compridas.')),
      page('story', 'HORA DE PASSEAR', 'O conselho da mamãe', p('Numa manhã ensolarada, a mãe coelha entregou lanchinhos aos filhos.'), d('— Podem brincar no bosque, mas não entrem no jardim do senhor McGregor. Lá não é seguro para vocês.'), p('Três irmãos seguiram juntos pela trilha. Pedro ficou olhando para uma cerca.')),
      page('story', 'UM BURACO NA CERCA', 'Que cheiro gostoso!', p('Do outro lado da cerca havia alfaces fofinhas, rabanetes crocantes e cenouras cor de pôr do sol.'), p('Pedro passou por uma pequena abertura para espiar. Só que logo entrou mais do que devia!')),
      page('story', 'UM BANQUETE VERDE', 'Alface, rabanete e mais!', p('Pedro beliscou uma folha, depois outra. Encheu a barriga e começou a sentir sede.'), d('— Será que encontro alguma água? — murmurou.'), p('Foi então que ouviu passos pesados entre os canteiros.')),
      page('story', 'SOCORRO, O JARDINEIRO!', 'Uma corrida atrapalhada', p('O dono do jardim apareceu carregando uma enxada. Ao ver Pedro, tentou enxotá-lo.'), p('O coelhinho disparou entre as couves, desviou de um regador e correu atrás de um vaso.')),
      page('story', 'CADÊ MEU CASAQUINHO?', 'Um susto entre as batatas', p('Na pressa, o casaquinho azul de Pedro ficou preso na rede que protegia algumas plantas.'), p('Ele conseguiu escapar do tecido e correu com a pelagem toda bagunçada.')),
      page('story', 'O REGADOR GIGANTE', 'Um esconderijo barulhento', p('Pedro se escondeu atrás de um regador cheio de água. O metal fez PLOM! quando ele esbarrou.'), p('O jardineiro olhou em volta, mas Pedro ficou quietinho até os passos se afastarem.')),
      page('story', 'O CAMINHO DE VOLTA', 'Onde fica a cerca?', p('Tudo parecia diferente quando se está com medo. Pedro passou por vasos, arbustos e canteiros até reconhecer um portão.'), p('Com cuidado, encontrou a abertura por onde tinha entrado.')),
      page('story', 'A TOCA ACONCHEGANTE', 'De volta para casa', p('Pedro chegou cansado, com as orelhas caídas e sem o casaquinho.'), d('— Que susto, meu pequeno! — disse sua mãe. — Venha descansar.'), p('Pedro contou o que aconteceu. E ela escutou com muito carinho.')),
      page('story', 'CHÁ E DESCANSO', 'Depois do susto', p('A mãe cuidou de Pedro, ofereceu água e o deixou repousar na caminha quentinha.'), p('Os irmãos trouxeram notícias do bosque e Pedro prometeu pensar melhor antes de entrar onde não conhecia.')),
      page('story', 'UM NOVO PASSEIO', 'Curiosidade com cuidado', p('No dia seguinte, Pedro foi passear novamente, desta vez junto com a família.'), p('Descobriu que havia muitas aventuras bonitas do lado de fora da cerca — sem assustar ninguém!')),
      bibliography('https://www.baixelivros.com.br/infantil/a-historia-de-pedro-coelho', 'A História de Pedro Coelho',
        [{ title: 'Project Gutenberg — The Tale of Peter Rabbit (original inglês, 1902)', url: 'www.gutenberg.org/ebooks/14838' }]),
      challenge('Pedro Coelho', 'uma cenoura de brinquedo'),
      finish('MEDALHA DO JARDIM', 'A curiosidade aprende a cuidar', 'Pedro voltou para casa e aprendeu uma boa lição. Agora você ganhou sua medalha e pode brincar com a cenoura de seu avatar!', '🥕 Medalha do Jardim conquistada!')
    ]
  }
];

for (const book of books) {
  const normalized = {
    schemaVersion: 1, language: 'pt-BR', ...book,
    protagonistMode: 'fixed', adaptation: 'Texto original da Prateleira Mágica, inspirado na narrativa em domínio público',
    cover: illustration(book.id, 0),
    pages: book.pages.map((item, i) => ({ ...item, illustration: illustration(book.id, i) }))
  };
  const target = path.join(root, 'books', `${book.id}.json`);
  const content = JSON.stringify(normalized, null, 2) + '\n';
  if (check && (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== content)) {
    throw Error(`Livro clássico desatualizado: ${book.id}`);
  }
  if (!check) fs.writeFileSync(target, content);
}
console.log(`✓ ${books.length} recontos infantis autorais de clássicos em domínio público (${books.map(b => b.pages.length).join(', ')} páginas)`);
