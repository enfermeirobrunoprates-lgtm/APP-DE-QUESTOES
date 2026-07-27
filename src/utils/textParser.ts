import { DraftQuestion, OptionLabel } from '../types';

/**
 * Deterministic, client-side text parser for study questions.
 * Handles single or multiple questions without any AI / external API dependency.
 */
export function parseQuestionsFromText(rawText: string): DraftQuestion[] {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  const cleanedInput = rawText.replace(/\r\n/g, '\n').trim();

  // Regex to detect question start markers at line boundaries:
  // Examples: "1.", "01)", "2 -", "Questão 1", "QUESTÃO 05:", "Q1."
  const questionMarkerRegex = /(?:^|\n)\s*(?:quest[ãa]o\s+|q\.\s*)?0*(\d{1,3})\s*[\.\)\-–:]\s+/gim;

  const matches: { index: number; length: number; numStr: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = questionMarkerRegex.exec(cleanedInput)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      numStr: match[1],
    });
  }

  let blocks: string[] = [];

  if (matches.length >= 2) {
    // Multiquestion case: split into blocks by question start markers
    for (let i = 0; i < matches.length; i++) {
      const startIndex = matches[i].index;
      const endIndex = i + 1 < matches.length ? matches[i + 1].index : cleanedInput.length;
      const blockText = cleanedInput.slice(startIndex, endIndex).trim();
      if (blockText.length > 0) {
        blocks.push(blockText);
      }
    }
  } else {
    // Single question case (either 0 or 1 marker match)
    blocks = [cleanedInput];
  }

  // Regex to identify option lines (e.g. "a) Option", "A. Option", "b- Option", "C: Option")
  const optionRegex = /^\s*([A-Ea-e])\s*[\.\)\-–:]\s*(.+)$/;

  const questions: DraftQuestion[] = [];

  blocks.forEach((block, blockIdx) => {
    const lines = block.split('\n');
    let firstOptionLineIndex = -1;

    // Find first line that matches option pattern
    for (let i = 0; i < lines.length; i++) {
      if (optionRegex.test(lines[i])) {
        firstOptionLineIndex = i;
        break;
      }
    }

    let rawStemLines: string[] = [];
    const rawOptions: { label: string; text: string }[] = [];

    if (firstOptionLineIndex !== -1) {
      rawStemLines = lines.slice(0, firstOptionLineIndex);

      // Collect options starting from firstOptionLineIndex
      for (let i = firstOptionLineIndex; i < lines.length; i++) {
        const line = lines[i];
        const optMatch = line.match(optionRegex);
        if (optMatch) {
          rawOptions.push({
            label: optMatch[1].toUpperCase(),
            text: optMatch[2].trim(),
          });
        } else if (rawOptions.length > 0 && line.trim().length > 0) {
          // Multiline option continuation
          rawOptions[rawOptions.length - 1].text += ' ' + line.trim();
        }
      }
    } else {
      // No option lines found in block: treat whole block as stem
      rawStemLines = lines;
    }

    // Join stem lines and clean up leading question numbers/markers
    let stemText = rawStemLines.join('\n').trim();
    stemText = stemText.replace(/^\s*(?:quest[ãa]o\s+|q\.\s*)?0*\d{1,3}\s*[\.\)\-–:]\s*/i, '').trim();

    if (!stemText && rawOptions.length === 0) {
      return; // Skip completely empty block
    }

    // Extract potential tags from stem (e.g. "(FCC / 2023 / TRT)" or "[ENEM 2021]")
    const extractedTags: string[] = [];
    const tagMatch = stemText.match(/^[\(\[](.*?(?:banca|prova|ano|concurso|enem|vunesp|cebraspe|fcc|fgv|ibfc|cesgranrio|\d{4}).*?)[\)\]]\s*/i);
    if (tagMatch) {
      extractedTags.push(tagMatch[1].trim());
      stemText = stemText.replace(tagMatch[0], '').trim();
    }

    // Clean up leading bullet points or stray symbols from stem
    stemText = stemText.replace(/^[\s•\-\*\)\:]+/, '').trim();

    // Clean up options: remove leading bullet points, symbols, or repeated letters
    const labels: OptionLabel[] = ['A', 'B', 'C', 'D', 'E'];
    const formattedOptions = rawOptions.map((opt, idx) => {
      let cleanText = opt.text.trim();
      // Remove repeated leading letter if present (e.g., "A) texto" inside option text)
      cleanText = cleanText.replace(/^[A-Ea-e][\.\)\-–:]\s*/, '');
      // Remove leading bullet points or stray symbols
      cleanText = cleanText.replace(/^[\s•\-\*\)\:]+/, '').trim();
      
      return {
        label: labels[idx] || (opt.label as OptionLabel) || 'A',
        text: cleanText || '[trecho não identificado]',
      };
    });

    // Estimate difficulty based on stem word count
    const wordCount = stemText.split(/\s+/).length;
    let difficulty: 'Fácil' | 'Médio' | 'Difícil' = 'Médio';
    if (wordCount < 20) {
      difficulty = 'Fácil';
    } else if (wordCount > 70) {
      difficulty = 'Difícil';
    }

    questions.push({
      id: `draft-parsed-${Date.now()}-${blockIdx}`,
      stem: stemText || 'Sem enunciado',
      options: formattedOptions,
      correctAnswer: '' as OptionLabel, // Always empty initially
      explanation: '', // Always empty initially
      tags: extractedTags,
      difficulty,
    });
  });

  return questions;
}
