export const CATEGORIES = [
  'Anatomia',
  'Fisiologia',
  'Farmacologia',
  'Patologia',
  'Clínica Médica',
  'Cirurgia',
  'Pediatria',
  'Ginecologia e Obstetrícia',
  'Semiologia',
  'Preventiva',
];

export const normalizeText = (text) =>
  String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

/**
 * Aceita:
 *   Pergunta | Resposta
 *   Pergunta | Resposta | Explicação
 *   Pergunta | Resposta | Explicação | tag1, tag2
 */
export const parseFlashcardTxt = (text) => {
  const lines = normalizeText(text).split('\n');
  const items = [];
  const errors = [];

  lines.forEach((line, index) => {
    const raw = line.trim();
    if (!raw || raw.startsWith('#') || raw.startsWith('//')) return;

    const parts = raw.split('|').map((p) => p.trim());
    if (parts.length < 2) {
      errors.push({
        line: index + 1,
        reason: 'Use o formato "Pergunta | Resposta | Explicação (opcional)".',
      });
      return;
    }

    const [question, answer, explanation = '', rawTags = ''] = parts;
    if (!question || !answer) {
      errors.push({ line: index + 1, reason: 'Pergunta e resposta são obrigatórias.' });
      return;
    }

    const tags = rawTags
      ? rawTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    items.push({
      id: crypto.randomUUID(),
      question,
      answer,
      explanation,
      tags,
    });
  });

  return { items, errors, totalLines: lines.length };
};

const stripOptionPrefix = (opt) =>
  String(opt || '')
    .trim()
    .replace(/^[A-Da-d]\s*[)\].:-]\s*/, '');

const stripBrackets = (txt) =>
  String(txt || '')
    .trim()
    .replace(/^\[(.*)\]$/, '$1')
    .trim();

/**
 * Aceita separador `;` ou `|`:
 *   Pergunta ; A) Op1 ; B) Op2 ; C) Op3 ; D) Op4 ; B ; [Explicação opcional]
 */
export const parseQuizTxt = (text) => {
  const lines = normalizeText(text).split('\n');
  const items = [];
  const errors = [];

  lines.forEach((line, index) => {
    const raw = line.trim();
    if (!raw || raw.startsWith('#') || raw.startsWith('//')) return;

    const delimiter = raw.includes(';') ? ';' : '|';
    const parts = raw.split(delimiter).map((p) => p.trim());
    if (parts.length < 6) {
      errors.push({
        line: index + 1,
        reason:
          'Esperado: "Pergunta; Opção A; Opção B; Opção C; Opção D; Letra (A-D); Explicação".',
      });
      return;
    }

    const question = parts[0];
    const options = [
      stripOptionPrefix(parts[1]),
      stripOptionPrefix(parts[2]),
      stripOptionPrefix(parts[3]),
      stripOptionPrefix(parts[4]),
    ];
    const correct = (parts[5] || '').toUpperCase().replace(/[^A-D]/g, '');
    const explanation = stripBrackets(parts.slice(6).join(delimiter));

    if (!question || options.some((o) => !o) || !['A', 'B', 'C', 'D'].includes(correct)) {
      errors.push({
        line: index + 1,
        reason: 'Verifique se todas as 4 alternativas existem e se o gabarito é A, B, C ou D.',
      });
      return;
    }

    items.push({
      id: crypto.randomUUID(),
      question,
      options,
      correct,
      explanation,
    });
  });

  return { items, errors, totalLines: lines.length };
};
