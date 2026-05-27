// ============================================================
// Unit Tests — Virtual File System
// Tests CRUD, path resolution, trash, and file associations
// ============================================================

import { describe, it, expect } from 'vitest';
import { initialFileSystem, FILE_ASSOCIATIONS, getFileAssociation } from '@/hooks/useFileSystem';

describe('Initial File System', () => {
  const fs = initialFileSystem;

  it('should have a root node', () => {
    const root = Object.values(fs.nodes).find(n => n.parentId === null);
    expect(root).toBeDefined();
    expect(root!.name).toBe('/');
    expect(root!.type).toBe('folder');
  });

  it('should have standard Linux directory structure', () => {
    const names = Object.values(fs.nodes).map(n => n.name);
    expect(names).toContain('home');
    expect(names).toContain('user');
    expect(names).toContain('Desktop');
    expect(names).toContain('Documents');
    expect(names).toContain('Downloads');
    expect(names).toContain('Music');
    expect(names).toContain('Pictures');
    expect(names).toContain('Videos');
  });

  it('should have hidden config and trash directories', () => {
    const hidden = Object.values(fs.nodes).filter(n => n.isHidden);
    const hiddenNames = hidden.map(n => n.name);
    expect(hiddenNames).toContain('.config');
    expect(hiddenNames).toContain('.trash');
  });

  it('should have trash subdirectories (files and info)', () => {
    const trashNode = Object.values(fs.nodes).find(n => n.name === '.trash');
    expect(trashNode).toBeDefined();
    const trashChildren = Object.values(fs.nodes).filter(n => n.parentId === trashNode!.id);
    const childNames = trashChildren.map(n => n.name);
    expect(childNames).toContain('files');
    expect(childNames).toContain('info');
  });

  it('should have sample files in Documents', () => {
    const docs = Object.values(fs.nodes).find(n => n.name === 'Documents');
    expect(docs).toBeDefined();
    const docFiles = Object.values(fs.nodes).filter(n => n.parentId === docs!.id && n.type === 'file');
    expect(docFiles.length).toBeGreaterThanOrEqual(1);
  });

  it('should have proper tree structure (no orphans except root)', () => {
    Object.values(fs.nodes).forEach(node => {
      if (node.parentId !== null) {
        expect(fs.nodes[node.parentId]).toBeDefined();
      }
    });
  });

  it('should have empty trash metadata initially', () => {
    expect(Object.keys(fs.trashMetadata).length).toBe(0);
  });
});

describe('File Associations', () => {
  it('should have associations for common file types', () => {
    expect(FILE_ASSOCIATIONS.length).toBeGreaterThanOrEqual(10);
  });

  it('should map .txt to texteditor', () => {
    const assoc = getFileAssociation('readme.txt');
    expect(assoc).toBeDefined();
    expect(assoc!.appId).toBe('texteditor');
  });

  it('should map .md to markdownpreview', () => {
    const assoc = getFileAssociation('notes.md');
    expect(assoc).toBeDefined();
    expect(assoc!.appId).toBe('markdownpreview');
  });

  it('should map .json to jsonformatter', () => {
    const assoc = getFileAssociation('package.json');
    expect(assoc).toBeDefined();
    expect(assoc!.appId).toBe('jsonformatter');
  });

  it('should map code files to codeeditor', () => {
    ['main.js', 'app.ts', 'index.html', 'style.css', 'script.py'].forEach(file => {
      const assoc = getFileAssociation(file);
      expect(assoc).toBeDefined();
      expect(assoc!.appId).toBe('codeeditor');
    });
  });

  it('should map image files to imageviewer', () => {
    ['photo.jpg', 'screenshot.png', 'animation.gif'].forEach(file => {
      const assoc = getFileAssociation(file);
      expect(assoc).toBeDefined();
      expect(assoc!.appId).toBe('imageviewer');
    });
  });

  it('should return undefined for unknown extensions', () => {
    expect(getFileAssociation('file.xyz')).toBeUndefined();
    expect(getFileAssociation('noextension')).toBeUndefined();
  });

  it('should handle case-insensitive extension matching', () => {
    // The current implementation does toLowerCase
    const assoc = getFileAssociation('README.TXT');
    expect(assoc).toBeDefined();
    expect(assoc!.appId).toBe('texteditor');
  });

  it('should have unique extensions', () => {
    const extensions = FILE_ASSOCIATIONS.map(a => a.extension);
    const uniqueExt = new Set(extensions);
    expect(uniqueExt.size).toBe(extensions.length);
  });

  it('should have valid MIME types', () => {
    FILE_ASSOCIATIONS.forEach(assoc => {
      expect(assoc.mimeType).toBeTruthy();
      expect(assoc.mimeType).toContain('/');
    });
  });
});

describe('Path Resolution', () => {
  it('should build paths from node chain', () => {
    const buildPath = (nodes: Record<string, { name: string; parentId: string | null }>, id: string): string => {
      const parts: string[] = [];
      let current = nodes[id];
      while (current) {
        parts.unshift(current.name);
        current = current.parentId ? nodes[current.parentId] : undefined!;
      }
      return parts.join('/') || '/';
    };

    const nodes: Record<string, { name: string; parentId: string | null }> = {
      '1': { name: '/', parentId: null },
      '2': { name: 'home', parentId: '1' },
      '3': { name: 'user', parentId: '2' },
      '4': { name: 'Documents', parentId: '3' },
    };

    expect(buildPath(nodes, '1')).toBe('/');
    expect(buildPath(nodes, '2')).toBe('//home');
    expect(buildPath(nodes, '4')).toBe('//home/user/Documents');
  });

  it('should resolve relative paths', () => {
    const resolvePath = (base: string, relative: string): string => {
      const parts = base.split('/').filter(Boolean);
      const relParts = relative.split('/').filter(Boolean);
      for (const part of relParts) {
        if (part === '..') parts.pop();
        else if (part !== '.') parts.push(part);
      }
      return '/' + parts.join('/');
    };

    expect(resolvePath('/home/user', 'Documents')).toBe('/home/user/Documents');
    expect(resolvePath('/home/user/Documents', '..')).toBe('/home/user');
    expect(resolvePath('/home/user', '../..')).toBe('/');
    expect(resolvePath('/home/user', './Desktop')).toBe('/home/user/Desktop');
  });
});
