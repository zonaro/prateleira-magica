/**
 * Livro original sobre escovação + transcrição licenciada da edição da Rapunzel.
 * Fonte Rapunzel: PDF fornecido, adaptação de Sueli Maria de Regino (2016).
 * A licença no próprio PDF autoriza reproduzir e divulgar o TEXTO citando a fonte.
 * As ilustrações são nossas e não reproduzem as imagens daquela edição.
 * Use --check para detectar dados desatualizados sem alterar arquivos.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const art = (id, i) => `assets/illustrations/capitulos/${id}/${String(i + 1).padStart(2, '0')}.svg`;
const paragraph = (text) => ({ kind: 'paragraph', text });
const dialogue = (text) => ({ kind: 'dialogue', text });
const page = (type, sticker, chapter, title, ...blocks) => ({ type, sticker, chapter, title, blocks });

function saveBook(book) {
  const text = JSON.stringify({ schemaVersion: 1, language: 'pt-BR', ...book,
    pages: book.pages.map((item, index) => ({ ...item, illustration: art(book.id, index) })) }, null, 2) + '\n';
  const dest = path.join(root, 'books', `${book.id}.json`);
  if (check) {
    if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== text) throw Error(`Livro desatualizado: ${book.id}`);
  } else fs.writeFileSync(dest, text);
}

const dentalId = 'o-clube-dos-dentinhos';
saveBook({
  id: dentalId, title: '{{nome}} e o Clube dos Dentinhos',
  subtitle: 'Escova macia, sorriso saudável e muito carinho',
  subject: 'Saúde · higiene bucal e escovação', ageRange: [4, 8],
  cover: art(dentalId, 0), color: '#76c8d4', medal: '🦷 Medalha do Sorriso',
  rewards: [{ id: 'toothbrush', label: 'Escova de dentes de brinquedo' }],
  exercises: [
    { syllable: '🦷', text: 'Escovo os dentes pelo menos duas vezes ao dia.' },
    { syllable: '🌙', text: 'Escovar antes de dormir é muito importante.' },
    { syllable: '🪥', text: 'Uso escova macia e movimentos suaves, sem machucar a gengiva.' },
    { syllable: '🫧', text: 'Um adulto coloca a quantidade adequada de pasta com flúor.' },
    { syllable: '💧', text: 'Não engulo a pasta e peço ajuda para cuspir.' },
    { syllable: '🧵', text: 'Um adulto me ajuda a limpar entre os dentes quando necessário.' },
    { syllable: '🤝', text: 'Posso pedir ajuda para escovar todos os cantinhos.' }
  ],
  pages: [
    page('cover', 'OLÁ, DENTINHOS!', 'O espelho encantado 🦷', '{{nome}} e o Clube dos Dentinhos',
      paragraph('{{nome}} entrou no banheiro e ouviu um PLOC! O espelho mostrou um dente sorridente, chamado Dentinho Brilhante.'),
      dialogue('— Nossa boca trabalha muito: fala, mastiga e sorri. Quer aprender a cuidar dela com carinho?')),
    page('story', 'SOMOS UMA EQUIPE', 'Capítulo 1 · Nossos dentes', 'Os pequenos companheiros',
      paragraph('Os dentinhos de leite ajudam a mastigar, sorrir e falar. Com o tempo, muitos deles abrem espaço para os dentes permanentes.'),
      dialogue('— Mesmo os dentes que vão cair precisam de cuidados todos os dias!')),
    page('story', 'PLACAS PEGAJOSAS', 'Capítulo 2 · Limpeza', 'A melequinha invisível',
      paragraph('Pedacinhos de comida e uma película de micróbios podem ficar grudados nos dentes. Chamamos essa película de [[placa bacteriana]].'),
      paragraph('Se ela fica por muito tempo, pode ajudar a aparecer a cárie. Por isso nossa escovinha entra em ação!')),
    page('story', 'ESCOVA MACIA', 'Capítulo 3 · Escovação', 'A dança gentil da escova',
      paragraph('Com uma escova macia, {{nome}} aprendeu a fazer movimentos suaves em todas as faces dos dentes: do lado de fora, do lado de dentro e onde a gente mastiga.'),
      dialogue('— Não precisa esfregar com força! Cuide da gengiva com delicadeza.')),
    page('story', 'DOIS MINUTINHOS', 'Capítulo 4 · Rotina', 'A música do tic-tac',
      paragraph('O Dentinho Brilhante tocou uma música de aproximadamente dois minutos. Esse é um bom tempo para escovar com calma!'),
      paragraph('A escovação acontece pelo menos duas vezes ao dia. Antes de dormir, ela é especialmente importante.')),
    page('story', 'PASTA NA MEDIDA', 'Capítulo 5 · Flúor', 'Um pouquinho já ajuda',
      paragraph('A pasta de dentes com [[flúor]] ajuda a proteger contra cáries. Um adulto escolhe a pasta e coloca a quantidade adequada para a idade e para a capacidade de cuspir.'),
      dialogue('— A espuma não é comida! Depois, cuspimos e pedimos ajuda se necessário.')),
    page('story', 'ENTRE OS DENTES', 'Capítulo 6 · Fio dental', 'O lugar da escova não alcança',
      paragraph('Às vezes os dentes ficam bem juntinhos e a escova não alcança o espacinho entre eles. Nessas horas, o [[fio dental]] pode ajudar.'),
      paragraph('Um adulto pode passar o fio com cuidado para não machucar a gengiva.')),
    page('story', 'ÁGUA E AMIGOS', 'Capítulo 7 · Hábitos', 'Cuidados além da escova',
      paragraph('Beber água, ter refeições variadas e não beliscar doces o tempo todo também faz parte dos cuidados com os dentes.'),
      paragraph('A escova é pessoal: não devemos emprestá-la. Depois de usar, ela precisa ficar limpa e guardada direitinho.')),
    page('story', 'CONSULTA COM CARINHO', 'Capítulo 8 · Dentista', 'O guardião dos sorrisos',
      paragraph('A dentista mostrou um espelhinho e contou que pode ajudar a descobrir problemas cedo. É normal ter dúvidas ou ficar inseguro.'),
      dialogue('— Você pode perguntar tudo e pedir uma pausa quando precisar. Os adultos estão aqui para ajudar!')),
    page('story', 'VOCÊ CONSEGUE!', 'Capítulo 9 · Apoio', 'Escovar junto é melhor',
      paragraph('{{nome}} tentou escovar sozinho, mas pediu ajuda para alcançar os cantinhos. O adulto responsável terminou de conferir com carinho.'),
      dialogue('— Aprender leva tempo! O importante é cuidar da boca, sem medo e sem vergonha.')),
    { ...page('story', 'FONTES PARA OS ADULTOS', 'Biblioteca do sorriso 📚', 'De onde vêm essas dicas?',
      paragraph('Estas fontes são para responsáveis. Os endereços aparecem apenas como texto, sem links clicáveis. O uso de flúor e a quantidade de pasta devem seguir a orientação profissional adequada para a idade.')),
      interactive: 'bibliography', bibliography: [
        { title: 'Ministério da Saúde — Saúde bucal na primeira infância', url: 'www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-da-crianca/primeira-infancia/saude-bucal' },
        { title: 'Ministério da Saúde — Diretriz de higiene bucal na infância', url: 'bvsms.saude.gov.br/bvs/publicacoes/diretriz_odontologica_higiene_bucal_infancia.pdf' },
        { title: 'Associação Dental Americana — Escovas dentais', url: 'www.ada.org/resources/ada-library/oral-health-topics/toothbrushes' }
      ] },
    page('challenge', 'DESAFIO DO SORRISO', 'Missão da escovação 🎯', 'Sete jeitos de cuidar da boca',
      paragraph('Marque cada frase que você aprendeu. Se precisar, peça ajuda para ler. No final, uma escova de dentes de brinquedo estará esperando pelo seu avatar!')),
    { ...page('finish', 'MEDALHA DO SORRISO', 'Muito bem, {{nome}}!', 'Sorriso bem cuidado!',
      paragraph('Você descobriu a escovação gentil, a ajuda dos adultos, o flúor e os cuidados com seus dentinhos. A escova de brinquedo está desbloqueada!')),
      medal: '🦷 Medalha do Sorriso conquistada!' }
  ]
});

const raw = fs.readFileSync(path.join(root, 'books/rapunzel-fonte.txt'), 'utf8');
if (!raw.includes('Sueli Maria de Regino') || !raw.includes('podem ser utilizados,')
    || !raw.includes('reproduzidos e divulgados livremente, com citação da fonte.')) {
  throw Error('Fonte ou permissão de reprodução de Rapunzel não encontrada');
}
const source = raw.slice(raw.indexOf('Era uma vez um casal'), raw.indexOf('Este texto é parte integrante'))
  .replace(/\s+/g, ' ').trim();
const chapters = [
  ['Era uma vez um casal', 'UM GRANDE DESEJO', 'O início do conto', 'Um sonho de família'],
  ['Um dia, espiando pela janela', 'O JARDIM VIZINHO', 'Capítulo 1 · O jardim', 'Os rapôncios da bruxa'],
  ['Os dias foram se passando', 'O DESEJO CRESCE', 'Capítulo 2 · Uma vontade', 'A salada desejada'],
  ['A mulher não respondeu.', 'NA NOITE SILENCIOSA', 'Capítulo 3 · O muro', 'O marido entra na horta'],
  ['Depois de algum tempo, porém', 'GOTEL APARECE', 'Capítulo 4 · A promessa', 'A senhora do jardim'],
  ['A bruxa, então, respondeu:', 'UMA TROCA INJUSTA', 'Capítulo 5 · A escolha', 'O preço dos rapôncios'],
  ['Quando o bebê nasceu', 'CHEGOU RAPUNZEL', 'Capítulo 6 · A menina', 'O nome de uma flor'],
  ['O tempo foi passando e, a cada dia', 'A TORRE MISTERIOSA', 'Capítulo 7 · A floresta', 'O quarto no alto da torre'],
  ['A torre não tinha portas', 'TRANÇAS DE OURO', 'Capítulo 8 · O segredo', 'Uma escada de cabelos'],
  ['Assim que ouvia o chamado', 'UMA CANÇÃO NA FLORESTA', 'Capítulo 9 · A voz', 'O príncipe ouve Rapunzel'],
  ['O príncipe seguiu o som', 'DE ONDE VEM A MÚSICA?', 'Capítulo 10 · Procura', 'O mistério da janelinha'],
  ['Uma tarde, o príncipe', 'UM SEGREDO DESCOBERTO', 'Capítulo 11 · A árvore', 'O príncipe observa a torre'],
  ['No dia seguinte, quando escureceu', 'UM ENCONTRO', 'Capítulo 12 · A visita', 'As tranças chegam ao chão'],
  ['A jovem ficou muito assustada', 'CONVERSAS NA TORRE', 'Capítulo 13 · Amizade', 'Rapunzel conhece o visitante'],
  ['Como a bruxa costumava', 'FIOS DE SEDA', 'Capítulo 14 · Um plano', 'Uma escada para a liberdade'],
  ['A bruxa, que pensava', 'GOTEL DESCOBRE', 'Capítulo 15 · A descoberta', 'Uma surpresa para Gotel'],
  ['Furiosa, a bruxa', 'UMA TRISTE SEPARAÇÃO', 'Capítulo 16 · O deserto', 'As tranças são cortadas'],
  ['Depois de castigar Rapunzel', 'A ARMADILHA DA TORRE', 'Capítulo 17 · A espera', 'O príncipe volta à janela'],
  ['Ele viu as tranças serem jogadas', 'UM GRANDE SUSTO', 'Capítulo 18 · A busca', 'Rapunzel não está ali'],
  ['O rapaz, desesperado', 'PERDIDO NA FLORESTA', 'Capítulo 19 · A travessia', 'O príncipe perde a visão'],
  ['No deserto, onde havia sido abandonada', 'CORAGEM NO DESERTO', 'Capítulo 20 · Rapunzel', 'Rapunzel cuida de seus filhos'],
  ['Um dia, depois de atravessar', 'UM CANTO CONHECIDO', 'Capítulo 21 · Reencontro', 'A voz que mostrou o caminho'],
  ['Assim que viu o príncipe', 'LÁGRIMAS DE ALEGRIA', 'Capítulo 22 · Esperança', 'Um abraço mágico'],
  ['Então, o príncipe levou', 'FINAL FELIZ', 'Capítulo 23 · O palácio', 'Juntos outra vez']
];
const positions = chapters.map(([anchor]) => source.indexOf(anchor));
if (positions.some((p) => p < 0) || positions.some((p, i) => i && p <= positions[i-1])) {
  throw Error(`Trecho da transcrição não encontrado ou fora de ordem: ${positions}`);
}
const sourcePages = chapters.map(([, sticker, chapter, title], index) => {
  const content = source.slice(positions[index], positions[index+1] ?? source.length).trim();
  if (content.length < 40) throw Error(`Capítulo muito curto: ${chapter}`);
  // Preservamos todas as palavras e pontuação da edição licenciada; quebramos
  // apenas os blocos visuais de diálogo para leitura mais confortável.
  const blocks = content.split(/\s+(?=―)/).filter(Boolean).map((text) =>
    (/^―/.test(text) ? dialogue : paragraph)(text.trim()));
  return { ...page(index ? 'story' : 'cover', sticker, chapter, index ? title : 'Rapunzel', ...blocks),
    ...(index===0 ? { tip: 'Versão clássica: contém separação familiar e um acidente. Recomendamos leitura acompanhada de um adulto.' } : {}) };
});
const reconstructed = sourcePages.flatMap((p) => p.blocks.map((b) => b.text)).join(' ')
  .replace(/\s+/g, ' ').trim();
if (reconstructed !== source) throw Error('A transcrição da Rapunzel perdeu ou alterou texto na divisão das páginas');

const rapunzelId = 'rapunzel-contos-dos-grimm';
saveBook({
  id: rapunzelId, title: 'Rapunzel', subtitle: 'O conto clássico dos irmãos Grimm, com ilustrações originais',
  subject: 'Contos clássicos · literatura e imaginação', ageRange: [7, 9],
  protagonistMode: 'fixed',
  originalAuthors: ['Jacob Grimm', 'Wilhelm Grimm'],
  adaptation: 'Sueli Maria de Regino', adaptationYear: 2016,
  sourceNotice: 'Biblioteca Bilíngue de Literatura Infantil e Juvenil – Libras/Português. Reprodução textual permitida com citação da fonte, conforme aviso do PDF.',
  sourceDocument: 'https://domainpublic.wordpress.com/wp-content/uploads/2022/03/rapunzel.pdf',
  cover: art(rapunzelId, 0), color: '#ac8aca', medal: '🌸 Medalha dos Contos',
  rewards: [{ id: 'rapunzel', label: 'Cabelo de Rapunzel: tranças muito compridas' }],
  exercises: [
    { syllable: '🥬', text: 'O nome Rapunzel veio dos rapôncios do jardim.' },
    { syllable: '🏰', text: 'Rapunzel morou numa torre no meio da floresta.' },
    { syllable: '🎶', text: 'O príncipe encontrou a torre seguindo uma canção.' },
    { syllable: '🪢', text: 'Rapunzel e o príncipe planejaram uma escada de seda.' },
    { syllable: '💜', text: 'Mesmo separados, eles continuaram procurando um ao outro.' },
    { syllable: '🌟', text: 'No final, Rapunzel reencontra o príncipe e sua família fica junta.' }
  ],
  pages: [
    ...sourcePages,
    { ...page('story', 'FONTES E DIREITOS', 'Para famílias e educadores 📚', 'Sobre esta edição',
      paragraph('História dos irmãos Grimm, com texto adaptado por Sueli Maria de Regino em 2016. Esta transcrição preserva o texto do PDF e apresenta ilustrações vetoriais inéditas da Prateleira Mágica.'),
      paragraph('O PDF declara que os textos das adaptações em Libras e Português podem ser usados, reproduzidos e divulgados livremente com citação da fonte. As imagens do PDF não foram copiadas.')),
      interactive: 'bibliography', bibliography: [
        { title: 'PDF da edição adaptada por Sueli Maria de Regino', url: 'domainpublic.wordpress.com/wp-content/uploads/2022/03/rapunzel.pdf' },
        { title: 'Biblioteca Bilíngue de Literatura Infantil e Juvenil – Libras/Português', url: 'www.bibliolibras.com.br' }
      ] },
    page('challenge', 'DESAFIO DO CONTO', 'Hora de recordar 🎯', 'O que você descobriu com Rapunzel?',
      paragraph('Leia as frases sobre o conto e marque as que você reconhece. Ao concluir, o cabelo muito comprido de Rapunzel ficará disponível para o avatar!')),
    { ...page('finish', 'MEDALHA DOS CONTOS', 'Uma história para guardar', 'As tranças de Rapunzel',
      paragraph('Você conheceu o conto completo dos irmãos Grimm, na adaptação de Sueli Maria de Regino. Agora pode usar no avatar um cabelo inspirado nas longas tranças de Rapunzel!')),
      medal: '🌸 Medalha dos Contos conquistada!' }
  ]
});

console.log(`✓ Escovação: 13 páginas; Rapunzel: ${sourcePages.length+3} páginas (${source.length} caracteres fiéis à fonte)`);
