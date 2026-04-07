import { describe, expect, it } from 'vitest';
import { bestMatchIndex, cleanGameTitle, scoreMatch } from '../services/utils/titleUtils';

describe('titleUtils', () => {
  it('normaliza títulos estilo Playnite', () => {
    expect(cleanGameTitle("Marvel's Spider-Man II: Special Edition™")).toBe('marvels spider man 2 special edition');
    expect(cleanGameTitle('THE LEGEND OF ZELDA - Ocarina of Time')).toBe('legend of zelda ocarina of time');
  });

  it('puntúa coincidencia exacta y parcial', () => {
    expect(scoreMatch('Metroid Prime', 'Metroid Prime')).toBe(100);
    expect(scoreMatch('Metroid Prime', 'Metroid Prime Remastered')).toBe(90);
  });

  it('elige el mejor candidato', () => {
    const options = ['Metroid Prime Hunters', 'Metroid Prime', 'Pikmin'];
    expect(bestMatchIndex('Metroid Prime', options)).toBe(1);
  });
});
