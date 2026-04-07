import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseCatalogImport } from '../services/import/catalogImport';
import { parsePlayniteLibraryExporterCsv } from '../services/import/playniteCsvImport';

describe('parsePlayniteLibraryExporterCsv', () => {
  it('mapea cabeceras en español (Library Exporter Advanced)', () => {
    const header =
      'Nombre,Orden de nombre,Plataformas,Descripción,Desarrolladores,Editores,Favorito,Oculto,Géneros,Fecha de Lanzamiento,Serie,Valoración de la comunidad,Valoración de la crítica,Puntuación del usuario,Versión,Id del juego,Id';
    const row =
      '"Mi Juego","",PC (Windows),"<p>Hola, mundo</p>",DevCo,PubCo,True,False,Action;Indie,15/07/2014,Serie X,80,70,65,1.0,gid-1,uuid-1';
    const r = parsePlayniteLibraryExporterCsv(`${header}\n${row}`);
    expect(r.rows).toHaveLength(1);
    const g = r.rows[0]!;
    expect(g.title).toBe('Mi Juego');
    expect(g.platform).toBe('PC');
    expect(g.description).toContain('Hola');
    expect(g.developer).toBe('DevCo');
    expect(g.publisher).toBe('PubCo');
    expect(g.favorite).toBe(1);
    expect(g.genre).toBe('Action, Indie');
    expect(g.releaseYear).toBe(2014);
    expect(g.franchise).toBe('Serie X');
    expect(g.rating).toBe(65);
    expect(g.metadataSource).toBe('import:playnite-csv');
  });

  it('omite filas Oculto=True', () => {
    const h = 'Nombre,Plataformas,Oculto\nA,PC,False\nB,PC,True';
    const r = parsePlayniteLibraryExporterCsv(h);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0]!.title).toBe('A');
    expect(r.notes.some((n) => n.includes('ocultas'))).toBe(true);
  });

  it('parseCatalogImport detecta CSV sin confundir con JSON', () => {
    const h = 'Nombre,Plataformas\nX,PC';
    const r = parseCatalogImport(h);
    expect(r.source).toBe('playnite_csv');
    expect(r.rows).toHaveLength(1);
  });
});

describe('catalogo_playnite.csv (opcional)', () => {
  it('importa el CSV de ejemplo del proyecto si existe', () => {
    const p = join(__dirname, '../catalogo_playnite.csv');
    if (!existsSync(p)) {
      return;
    }
    const r = parsePlayniteLibraryExporterCsv(readFileSync(p, 'utf8'));
    expect(r.rows.length).toBeGreaterThan(50);
    const proto = r.rows.find((x) => x.title.includes('PROTOTYPE'));
    expect(proto?.platform).toBeDefined();
  });
});
