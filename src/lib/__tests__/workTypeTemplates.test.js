import { WORK_TYPES, DOCS_BY_TYPE, WORK_TYPE_IDS } from '../workTypeTemplates';

const REQUIRED_IDS = ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4', 'GST Filing', 'GST + ITR', 'TDS Return', 'Company ITR'];

describe('WORK_TYPES structure', () => {
  test('contains all 8 required types', () => {
    const ids = WORK_TYPES.map(t => t.id);
    REQUIRED_IDS.forEach(id => expect(ids).toContain(id));
  });
  test('has exactly 8 templates', () => {
    expect(WORK_TYPES).toHaveLength(8);
  });
  test('no duplicate IDs', () => {
    const ids = WORK_TYPES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  test('every template has id, label, description, color, documents', () => {
    WORK_TYPES.forEach(t => {
      expect(t.id).toBeTruthy();
      expect(t.label).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.color).toBeTruthy();
      expect(Array.isArray(t.documents)).toBe(true);
    });
  });
  test('every template has at least 4 documents', () => {
    WORK_TYPES.forEach(t => {
      expect(t.documents.length).toBeGreaterThanOrEqual(4);
    });
  });
  test('no empty document strings', () => {
    WORK_TYPES.forEach(t => {
      t.documents.forEach(d => expect(d.trim()).not.toBe(''));
    });
  });
  test('colors are valid design system values', () => {
    const validColors = ['blue', 'purple', 'amber', 'green', 'red'];
    WORK_TYPES.forEach(t => {
      expect(validColors).toContain(t.color);
    });
  });
});

describe('DOCS_BY_TYPE', () => {
  test('maps every WORK_TYPE id to its document list', () => {
    WORK_TYPES.forEach(t => {
      expect(DOCS_BY_TYPE[t.id]).toEqual(t.documents);
    });
  });
  test('ITR-1 includes Form 16 and Aadhaar', () => {
    const docs = DOCS_BY_TYPE['ITR-1'];
    expect(docs.some(d => d.includes('Form 16'))).toBe(true);
    expect(docs.some(d => d.includes('Aadhaar'))).toBe(true);
  });
  test('Company ITR includes tax audit report', () => {
    const docs = DOCS_BY_TYPE['Company ITR'];
    expect(docs.some(d => d.includes('Tax audit') || d.includes('tax audit'))).toBe(true);
  });
  test('TDS Return includes challan details', () => {
    const docs = DOCS_BY_TYPE['TDS Return'];
    expect(docs.some(d => d.includes('challan') || d.includes('ITNS'))).toBe(true);
  });
});

describe('WORK_TYPE_IDS', () => {
  test('is an array of strings', () => {
    expect(Array.isArray(WORK_TYPE_IDS)).toBe(true);
    WORK_TYPE_IDS.forEach(id => expect(typeof id).toBe('string'));
  });
  test('matches the IDs from WORK_TYPES', () => {
    expect(WORK_TYPE_IDS).toEqual(WORK_TYPES.map(t => t.id));
  });
});
