import { describe, expect, it } from 'vitest';
import { detectCsvDelimiter, parseDelimitedRows } from '../services/import/csvParse';

describe('parseDelimitedRows', () => {
  it('respeta comillas y comas dentro del campo', () => {
    const s = `a,b,c\n1,"hello, world",3`;
    const rows = parseDelimitedRows(s, ',');
    expect(rows).toEqual([
      ['a', 'b', 'c'],
      ['1', 'hello, world', '3'],
    ]);
  });

  it('permite saltos de línea dentro de comillas', () => {
    const s = `col1,col2\n"line1\nline2","x"`;
    const rows = parseDelimitedRows(s, ',');
    expect(rows).toHaveLength(2);
    expect(rows[1]![0]).toContain('\n');
  });
});

describe('detectCsvDelimiter', () => {
  it('prefiere coma si hay más comas que punto y coma en la cabecera', () => {
    expect(detectCsvDelimiter('Nombre,Plataformas,Descripción')).toBe(',');
  });

  it('usa punto y coma si domina en la primera línea', () => {
    expect(detectCsvDelimiter('Nombre;Plataformas;Descripción')).toBe(';');
  });
});
