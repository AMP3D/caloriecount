import { createWorker } from 'tesseract.js';

export interface NutritionOcrResult {
  calories?: number;
  carbs?: number;
  fat?: number;
  protein?: number;
  servingSize?: number;
}

const parseNumber = (text: string): number | undefined => {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);

  return isNaN(parsed) ? undefined : parsed;
};

const extractField = (text: string, patterns: RegExp[]): number | undefined => {
  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return parseNumber(match[1]);
    }
  }

  return undefined;
};

const G_SUFFIX = /[g9]\b/;
const NUM = /(\d+\.?\d*)/;

const buildPatterns = (label: RegExp): RegExp[] => {
  const num = NUM.source;
  const g = G_SUFFIX.source;
  const sep = `[^\\d\\n]{0,5}`;

  return [
    new RegExp(`${label.source}${sep}${num}\\s*${g}`),
    new RegExp(`${label.source}${sep}${num}`),
  ];
};

const parseNutritionText = (text: string): NutritionOcrResult => {
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\n+/g, '\n')
    .toLowerCase();

  console.log('OCR text:', normalized);

  const calories = extractField(normalized, [
    /calories\s*[:\s]*(\d{2,4})/,
    /calories\s+(\d{2,4})/,
  ]);

  const fat = extractField(normalized, buildPatterns(/total\s*fat/));

  const carbs = extractField(normalized, buildPatterns(/total\s*carb(?:ohydrate)?s?/));

  const protein = extractField(normalized, buildPatterns(/protein/));

  const servingSize = extractField(normalized, [
    /serving\s*size[^(]*\((\d+\.?\d*)\s*[g9]\)/,
    /serving\s*size[^(]*\((\d+\.?\d*)\s*[a-z]*\)/,
    /serving\s*size\s*[:\s]*(\d+\.?\d*)\s*[g9]/,
  ]);

  return { calories, carbs, fat, protein, servingSize };
};

export const recognizeNutritionLabel = async (imageBlob: Blob): Promise<NutritionOcrResult> => {
  const worker = await createWorker('eng');
  const { data } = await worker.recognize(imageBlob);

  await worker.terminate();

  if (!data.text) {
    return {};
  }

  return parseNutritionText(data.text);
};
