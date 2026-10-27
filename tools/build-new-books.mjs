// Conteúdo autoral e dados dos livros. Execute com `node tools/build-new-books.mjs`.
// As imagens individuais são geradas por `node tools/illustrate-books.mjs`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const art = (id, n) => `assets/illustrations/capitulos/${id}/${String(n + 1).padStart(2, '0')}.svg`;
const paragraph = (text) => ({ kind: 'paragraph', text });
const dialogue = (text) => ({ kind: 'dialogue', text });
const page = (type, sticker, chapter, title, ...blocks) => ({ type, sticker, chapter, title, blocks });
function book(base, entries) {
  const result = { schemaVersion: 1, language: 'pt-BR', ...base,
    pages: entries.map((item, index) => ({ ...item, illustration: art(base.id, index) })) };
  const destination = path.join(root, 'books', `${base.id}.json`);
  const serialized = `${JSON.stringify(result, null, 2)}\n`;
  if (check) {
    if (!fs.existsSync(destination) || fs.readFileSync(destination, 'utf8') !== serialized) {
      throw Error(`Livro gerado desatualizado: ${base.id}`);
    }
  } else fs.writeFileSync(destination, serialized);
  return result;
}

const letters = [
  ['A', 'ABELHA', 'árvore', 'A abelha voou até uma árvore e pousou numa flor amarela.'],
  ['B', 'BOLA', 'borboleta', 'A bola quicou no jardim e uma borboleta acompanhou a brincadeira.'],
  ['C', 'CASA', 'cachorro', 'A casa tinha uma porta azul. Um cachorro abanou o rabinho ao entrar!'],
  ['D', 'DADO', 'dinossauro', 'O dado rolou: um, dois, três! Um dinossauro de brinquedo veio jogar.'],
  ['E', 'ESTRELA', 'elefante', 'A estrela brilhou sobre o elefante, que olhou para o céu encantado.'],
  ['F', 'FLOR', 'foguete', 'Uma flor apontou para o foguete de papel que subia pelo céu.'],
  ['G', 'GATO', 'girassol', 'Um gato curioso se escondeu atrás de um girassol gigante.'],
  ['H', 'HIPOPÓTAMO', 'helicóptero', 'O hipopótamo viu um helicóptero de brinquedo passar bem alto. O H pode ficar quietinho em algumas palavras!'],
  ['I', 'ILHA', 'iguana', 'Numa ilha verde, uma iguana descansava tomando um solzinho.'],
  ['J', 'JACARÉ', 'janela', 'O jacaré desenhado apareceu perto de uma janela. Que susto divertido!'],
  ['K', 'KIWI', 'karatê', 'O kiwi verdinho entrou na roda de palavras. K aparece em nomes e palavras que vieram de outros idiomas!'],
  ['L', 'LUA', 'livro', 'A Lua iluminou o livro que {{nome}} lia antes de dormir.'],
  ['M', 'MACACO', 'montanha', 'O macaco de pelúcia sonhou em visitar uma montanha.'],
  ['N', 'NAVIO', 'nuvem', 'O navio navegou no mar e uma nuvem fez sombra nas velas.'],
  ['O', 'OVO', 'ovelha', 'Uma ovelha olhou para o ovo no desenho e inventou uma história.'],
  ['P', 'PATO', 'pipoca', 'O pato fez quá-quá enquanto o milho de pipoca estourava: POP!'],
  ['Q', 'QUEIJO', 'quintal', 'O queijo apareceu no lanche do quintal. Quase sempre Q anda junto do U!'],
  ['R', 'RELÓGIO', 'rato', 'O relógio fazia TIC-TAC. Um ratinho de brinquedo dançava junto.'],
  ['S', 'SOL', 'sapo', 'O sol sorriu para um sapo que saltou no lago.'],
  ['T', 'TARTARUGA', 'trem', 'A tartaruga de brinquedo passeou devagar ao lado de um trem.'],
  ['U', 'UVA', 'urso', 'Um urso de pelúcia segurou uma uva de brinquedo no piquenique.'],
  ['V', 'VIOLÃO', 'vaca', 'A vaca do sítio ouviu o violão tocar uma canção baixinha.'],
  ['W', 'WAFFLE', 'web', 'O waffle do desenho parecia um quadradinho crocante. W aparece em palavras de outras línguas, como web.'],
  ['X', 'XÍCARA', 'xilofone', 'A xícara ficou ao lado de um xilofone. A letra X pode ter sons diferentes!'],
  ['Y', 'YAKISOBA', 'yoga', 'O yakisoba é um prato com macarrão e legumes. Y também aparece em palavras emprestadas de outros idiomas.'],
  ['Z', 'ZEBRA', 'zíper', 'A zebra abriu o zíper da mochila de faz de conta. Zzz... a aventura vai dormir!']
];
const alphabetId = 'a-aventura-do-abc';
const alphabetPages = [page('cover', 'A, B, C... VAMOS LÁ!', 'O grande passeio das letras 🔤', '{{nome}} e a Aventura do ABC',
  paragraph('Uma biblioteca se transformou num tapete de letras! {{nome}} encontrou 26 portinhas. Atrás de cada uma morava uma letra e duas palavras.'),
  dialogue('— Vamos do A ao Z? Você pode apontar, escutar e inventar suas próprias palavras!'))];
for (const [letter, word, partner, story] of letters) {
  alphabetPages.push(page('story', `${letter} DE ${word}`, `Letra ${letter} · ${letters.findIndex((item) => item[0] === letter) + 1} de 26`,
    `Olá, letra ${letter}!`,
    paragraph(`A letra [[${letter}]] encontrou a palavra [[${word.toLocaleLowerCase('pt-BR')}]] e chamou ${partner} para brincar.`),
    paragraph(story),
    dialogue(`— ${letter} está aqui! Que outra palavra começa com essa letra?`)));
}
alphabetPages.push(page('challenge', 'DESAFIO DE LETRINHAS', 'Missão A até Z 🎯', 'Vamos brincar com as 26 letras?',
  paragraph('Leia ou escute cada frase e marque a letra que você reconhece. Você não precisa saber tudo de cor: aprender é descobrir!')));
alphabetPages.push({ ...page('finish', 'ABC LIBERADO!', 'Você chegou até o Z!', 'O alfabeto inteiro festejou!',
  paragraph('Você conheceu as 26 letras e muitos mundos que cabem em palavras. Seus três blocos de empilhar A, B e C estão liberados no avatar!')),
  medal: '🔤 Medalha do ABC conquistada!' });
book({ id: alphabetId, title: '{{nome}} e a Aventura do ABC', subtitle: 'Uma história para cada letra do alfabeto',
  subject: 'Alfabetização · letras e vocabulário', ageRange: [4, 8],
  cover: art(alphabetId, 0), color: '#efac63', medal: '🔤 Medalha do ABC',
  rewards: [{ id: 'abc_blocks', label: 'Blocos de empilhar A, B e C' }],
  exercises: ['A abelha começa com A.', 'Bola começa com B.', 'Casa começa com C.',
    'K, W e Y também fazem parte do alfabeto.', 'Lua começa com L.',
    'O Z de zebra fecha nosso passeio pelo ABC.'].map((text, index) => ({ syllable: ['A', 'B', 'C', 'K', 'L', 'Z'][index], text }))
}, alphabetPages);

const nhaId = 'a-trilha-do-nha-nhe-nhi-nho-nhu';
const nhaPages = [
  page('cover', 'NH FAZ MÁGICA!', 'A trilha do NH 🐣', '{{nome}} e a Trilha do NH',
    paragraph('Duas letrinhas, N e H, resolveram andar juntinhas: NH! Quando se unem, fazem um som especial, como em ni[[nho]].'),
    dialogue('— Vamos experimentar NHA, NHE, NHI, NHO e NHU, cada uma com sua brincadeira?')),
  page('story', 'NHA · ARANHA', 'Primeira parada · NHA', 'A aranha na montanha',
    paragraph('Uma [[aranha]] teceu uma rede ao lado da [[montanha]]. A [[galinha]] veio passear por perto.'),
    dialogue('— Ara-NHA! Gali-NHA! Monta-NHA! O NH deixa as duas letras com um som só.')),
  page('story', 'NHE · CONHECER', 'Segunda parada · NHE', 'Você já me conhece?',
    paragraph('— Quero [[conhecer]] seus desenhos! — disse a amiga. Depois pegou um barquinho na [[banheira]] de brinquedo.'),
    paragraph('Co-NHE-cer e ba-NHEI-ra têm NH seguido de E. Em "banheira", o E encontra também o I!')),
  page('story', 'NHI · COMPANHIA', 'Terceira parada · NHI', 'Boa companhia!',
    paragraph('{{nome}} chamou uma amiga para fazer [[companhia]] na brincadeira. Com-pa-NHI-a: olhe o pedacinho NHI escrito na palavra!'),
    dialogue('— É uma combinação menos comum em palavras do dia a dia. Mas existe e merece seu lugar na nossa trilha!')),
  page('story', 'NHO · NINHO', 'Quarta parada · NHO', 'O ninho e a minhoca',
    paragraph('No [[ninho]], um passarinho piava contente. Perto dali, a [[minhoca]] cavava um caminho.'),
    dialogue('— Ni-NHO! Mi-NHO-ca! Até o ba-NHO pode ter NHO!')),
  page('story', 'NHU · NENHUMA', 'Quinta parada · NHU', 'Nenhuma amizade fica de fora',
    paragraph('— [[Nenhuma]] amiga vai ficar sozinha! — disse {{nome}}. "Ne-NHU-ma" guarda o som NHU.'),
    paragraph('Também ouvimos NHU em "nenhum". Agora o time inteiro está reunido!')),
  page('story', 'ESCUTE UMA SÍLABA', 'Hora de escutar 👂', 'Ouça o NH passear',
    paragraph('Vamos tentar juntos, devagarinho: [[NHA]], [[NHE]], [[NHI]], [[NHO]], [[NHU]].'),
    paragraph('N e H aparecem juntinhos na escrita, mas fazemos um único som consonantal. Podemos pedir ajuda e repetir quantas vezes quisermos!')),
  page('story', 'PALAVRAS AMIGAS', 'Jogo de descobertas 🔍', 'Onde o NH se escondeu?',
    paragraph('Procure o pedacinho NH em aranha, conhecer, companhia, ninho e nenhuma. Ele pode morar no meio da palavra!'),
    dialogue('— Ler não é correr. Ler é descobrir pedacinho por pedacinho!')),
  page('challenge', 'DESAFIO DO NH', 'Missão das cinco combinações 🎯', 'NHA, NHE, NHI, NHO, NHU!',
    paragraph('Escute ou leia cada frase. Marque quando encontrar o som ou o grupo de letras NH. Você conseguiu!')),
  { ...page('finish', 'MEDALHA DO NH', 'Grande descoberta, {{nome}}!', 'Dois amigos, cinco vogais!',
    paragraph('Você aprendeu a reconhecer e brincar com NHA, NHE, NHI, NHO e NHU. Continue procurando NH em histórias e músicas!')),
    medal: '🐣 Medalha do NH conquistada!' }
];
book({ id: nhaId, title: '{{nome}} e a Trilha do NH', subtitle: 'Aranha, conhecer, companhia, ninho e nenhuma!',
  subject: 'Alfabetização · dígrafo NH e pronúncia', ageRange: [5, 8],
  cover: art(nhaId, 0), color: '#9b83dc', medal: '🐣 Medalha do NH',
  exercises: [
    { syllable: 'NHA', text: 'A araNHA teceu sua teia perto da montanha.' },
    { syllable: 'NHE', text: 'Quero coNHEcer novas histórias.' },
    { syllable: 'NHI', text: 'Sua compaNHIa me faz bem.' },
    { syllable: 'NHO', text: 'O passarinho canta no niNHO.' },
    { syllable: 'NHU', text: 'NeNHUma pessoa precisa ficar de fora.' }
  ]
}, nhaPages);

const diffId = 'o-jardim-das-diferencas';
const diffPages = [
  page('cover', 'CADA UM É ÚNICO!', 'O jardim de gente 🌍', '{{nome}} e o Jardim das Diferenças',
    paragraph('{{nome}} entrou numa praça onde pessoas de muitas aparências, origens, cabelos e histórias brincavam juntas. Era como um jardim com flores diferentes!'),
    dialogue('— Ninguém é uma cópia de ninguém. Que bom que existe tanta diversidade!')),
  page('story', 'NOMES DO CENSO', 'Capítulo 1 · Autodeclaração', 'Como as pessoas se reconhecem?',
    paragraph('No Brasil, o IBGE faz perguntas para conhecer a população. No Censo, cada pessoa pode se identificar nas categorias de cor ou raça: [[branca]], [[preta]], [[parda]], [[amarela]] ou [[indígena]].'),
    paragraph('Essas são palavras usadas na pesquisa e na sociedade, não nomes de lápis para pintar gente! Cada pessoa tem sua história e merece ser ouvida.')),
  page('story', 'RAÍZES INDÍGENAS', 'Capítulo 2 · Primeiros povos', 'Muitas nações, muitas línguas',
    paragraph('Muito antes de o Brasil existir como país, vários povos indígenas já viviam nestas terras, com diferentes línguas, saberes e histórias. Eles continuam aqui, criando, ensinando e defendendo suas comunidades.'),
    paragraph('Às vezes alguém diz "vermelha" ao falar de povos originários. Mas essa não é uma categoria oficial do Censo e não representa a diversidade indígena. Melhor dizer [[indígena]] e, quando souber, o nome do povo!')),
  page('story', 'HISTÓRIAS AFRICANAS', 'Capítulo 3 · África e Brasil', 'Muitos caminhos e muita força',
    paragraph('Povos de muitas regiões da África e seus descendentes ajudaram a construir o Brasil: nas músicas, comidas, conhecimentos, palavras e tantas outras partes da vida.'),
    paragraph('Muitas pessoas africanas foram trazidas à força e escravizadas no passado. Isso foi uma grande injustiça. Conhecer essa história nos ajuda a combater o racismo hoje.'),
    dialogue('— Pessoas pretas têm muitas histórias, famílias, culturas e jeitos de ser. Nunca cabem num estereótipo!')),
  page('story', 'GENTE DE MUITOS LUGARES', 'Capítulo 4 · Migrações', 'Uma mala cheia de histórias',
    paragraph('Ao longo dos séculos, famílias vindas de lugares da Europa, Ásia, África, outros países das Américas e várias regiões do próprio Brasil fizeram novas casas aqui.'),
    paragraph('No Censo existe a categoria "amarela", ligada historicamente à identificação de pessoas com origem asiática. Não significa que a pele delas seja literalmente amarela! E quem se declara branco também pode ter origens e histórias muito diferentes.')),
  page('story', 'MISTURAS E IDENTIDADES', 'Capítulo 5 · Parda', 'Um mosaico brasileiro',
    paragraph('Muitas famílias brasileiras têm ancestrais de origens variadas. A palavra [[parda]] é uma das categorias de autodeclaração do Censo. Ela não conta sozinha toda a história nem define uma receita de mistura.'),
    paragraph('O Brasil tem uma diversidade enorme e muitos encontros entre povos. Não precisamos dizer que é o país mais misturado do mundo para sentir orgulho de tantas histórias!')),
  page('story', 'CABELO, PELE, JEITO', 'Capítulo 6 · Singularidade', 'Um mundo de rostos',
    paragraph('Há peles de muitos tons, cabelos lisos, crespos, ondulados, pessoas altas e baixas, que enxergam ou se movimentam de maneiras diferentes. Nenhum jeito de existir é melhor do que outro.'),
    dialogue('— O tom da pele não diz quem é gentil, inteligente, forte ou bom de brincar! Conheça a pessoa!')),
  page('story', 'DNA EM ESPIRAL', 'Capítulo 7 · Ciência divertida', 'A escadinha enrolada do corpo',
    paragraph('Dentro das células existe o [[DNA]], com informações que ajudam nosso corpo a se desenvolver. Ele parece uma escada torcida, chamada dupla hélice!'),
    paragraph('Quase todo o DNA humano é compartilhado entre as pessoas. Nossa aparência é influenciada por muitos fatores. As categorias de cor ou raça do Censo são formas de identificação social, não cinco tipos de DNA.'),
    dialogue('— Minha dupla hélice de brinquedo vai lembrar que a ciência e as pessoas são cheias de descobertas!')),
  page('story', 'RESPEITO NA PRÁTICA', 'Capítulo 8 · Convivência', 'O combinado da praça',
    paragraph('{{nome}} ouviu um comentário maldoso sobre o cabelo de uma amiga. A turma decidiu parar a brincadeira e dizer com respeito: — Esse comentário machuca. Vamos tratar todos bem.'),
    paragraph('Podemos escutar, aprender os nomes das pessoas, fazer amizades e procurar um adulto de confiança quando alguém sofre preconceito.'),
    dialogue('— Ninguém precisa ser igual para brincar junto!')),
  { ...page('story', 'FONTES PARA A FAMÍLIA', 'Fontes e conversas 📚', 'Onde encontrar mais informações?',
    paragraph('Para responsáveis: termos de cor ou raça refletem autodeclaração e contextos sociais. Os endereços abaixo são textos simples, sem links para crianças clicarem.')),
    interactive: 'bibliography', bibliography: [
      { title: 'IBGE Educa Crianças — Cor ou raça', url: 'educa.ibge.gov.br/criancas/brasil/2848-nosso-povo/19624-cor-ou-raca.html' },
      { title: 'IBGE — Censo 2022, identificação étnico-racial', url: 'www.ibge.gov.br/estatisticas/sociais/populacao/22827-censo-demografico-2022.html?edicao=38698&t=resultados' },
      { title: 'Instituto Nacional de Pesquisa do Genoma Humano — DNA', url: 'www.genome.gov/genetics-glossary/Deoxyribonucleic-Acid-DNA' }
    ] },
  page('challenge', 'DESAFIO DO RESPEITO', 'Missão da amizade 🎯', 'Muitas origens, igual dignidade',
    paragraph('Marque as frases que lembram nossas descobertas. No fim, uma dupla hélice colorida de DNA e uma peteca de brinquedo vão ficar disponíveis para o avatar!')),
  { ...page('finish', 'MEDALHA DA DIVERSIDADE', 'Muito bem, {{nome}}!', 'Um jardim onde todo mundo cabe!',
    paragraph('Você aprendeu que aparência não define valor, que o Brasil tem muitas histórias e que respeitar as diferenças fortalece as amizades. A dupla hélice de DNA e a peteca de brinquedo estão liberadas!')),
    medal: '🤝 Medalha da Diversidade conquistada!' }
];
book({ id: diffId, title: '{{nome}} e o Jardim das Diferenças', subtitle: 'Cada pessoa tem uma história, e todas merecem respeito',
  subject: 'Convivência · diversidade e respeito', ageRange: [6, 9],
  cover: art(diffId, 0), color: '#72ada0', medal: '🤝 Medalha da Diversidade',
  rewards: [{ id: 'dna_helix', label: 'Dupla hélice colorida de DNA (brinquedo)' },
    { id: 'shuttlecock', label: 'Peteca colorida (brinquedo)' }],
  exercises: [
    { syllable: '🤝', text: 'Toda pessoa merece respeito, seja qual for seu tom de pele.' },
    { syllable: '🌿', text: 'Os povos indígenas têm muitas histórias e continuam presentes no Brasil.' },
    { syllable: '🌍', text: 'A cultura brasileira reúne contribuições de povos de muitas origens.' },
    { syllable: '💛', text: 'A palavra amarela do Censo não descreve a cor literal de uma pessoa.' },
    { syllable: '🧬', text: 'Categorias de cor ou raça não são tipos diferentes de DNA.' },
    { syllable: '🌈', text: 'Se alguém sofre preconceito, posso buscar ajuda de um adulto.' }
  ]
}, diffPages);

console.log(`✓ Livros ABC (29 páginas), NH (10 páginas) e Diversidade (12 páginas) ${check ? 'conferidos' : 'gerados'}`);
