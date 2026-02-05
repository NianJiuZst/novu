import fg from 'fast-glob';
import fs from 'fs/promises';
import path from 'path';
import ts from 'typescript';

export type DiscoveredTemplate = {
  filePath: string;
  relativePath: string;
  exports: string[];
};

const DEFAULT_IGNORES = [
  '**/node_modules/**',
  '**/.git/**',
  '**/.next/**',
  '**/dist/**',
  '**/build/**',
  '**/out/**',
  '**/coverage/**',
  '**/.turbo/**',
  '**/.vercel/**',
  '**/.cache/**',
  '**/tmp/**',
  '**/*.test.{ts,tsx,js,jsx}',
  '**/*.spec.{ts,tsx,js,jsx}',
  '**/__tests__/**',
  '**/__mocks__/**',
  '**/test/**',
  '**/tests/**',
  '**/*.stories.{ts,tsx,js,jsx}',
  '**/*.story.{ts,tsx,js,jsx}',
  '**/.storybook/**',
  '**/*.config.{ts,js}',
  '**/*.d.ts',
];

export async function discoverEmailTemplates(rootDir: string = process.cwd()): Promise<DiscoveredTemplate[]> {
  const files = await fg(['**/*.{tsx,jsx,ts,js}'], {
    cwd: rootDir,
    dot: true,
    absolute: false,
    ignore: DEFAULT_IGNORES,
    followSymbolicLinks: true,
  });

  const out: DiscoveredTemplate[] = [];
  const CONCURRENCY = 32;

  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY);
    const batchRes = await Promise.all(
      batch.map(async (relativePath) => {
        const filePath = path.join(rootDir, relativePath);
        const exports = await findReactEmailExportsTsAst(filePath);
        if (!exports.length) return null;
        if (!exports.includes('default')) return null;

        return { filePath, relativePath, exports } satisfies DiscoveredTemplate;
      })
    );
    for (const r of batchRes) if (r) out.push(r);
  }

  return out;
}

async function findReactEmailExportsTsAst(filePath: string): Promise<string[]> {
  let text: string;
  try {
    text = await fs.readFile(filePath, 'utf8');
  } catch {
    return [];
  }

  // Cheap prefilter to avoid parsing everything
  if (!text.includes('@react-email/') && !text.includes('@react-email/components') && !text.includes('react-email')) {
    return [];
  }

  const ext = path.extname(filePath).toLowerCase();
  const scriptKind =
    ext === '.tsx'
      ? ts.ScriptKind.TSX
      : ext === '.ts'
        ? ts.ScriptKind.TS
        : ext === '.jsx'
          ? ts.ScriptKind.JSX
          : ts.ScriptKind.JS;

  const sf = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, /*setParentNodes*/ true, scriptKind);

  let hasReactEmailImport = false;
  let hasJsx = false;

  const exports: string[] = [];

  function visit(node: ts.Node) {
    // imports
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const s = node.moduleSpecifier.text;
      if (s === '@react-email/components' || s.startsWith('@react-email/') || s === 'react-email') {
        hasReactEmailImport = true;
      }
    }

    // JSX usage
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
      hasJsx = true;
    }

    // export default ...
    if (ts.isExportAssignment(node) && !node.isExportEquals) {
      exports.push('default');
    }

    // export named declarations: export const Foo = ..., export function Foo() ...
    if (ts.isVariableStatement(node) && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const d of node.declarationList.declarations) {
        if (ts.isIdentifier(d.name)) exports.push(d.name.text);
      }
    }

    if (ts.isFunctionDeclaration(node) && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      const hasDefault = node.modifiers.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
      if (hasDefault) {
        exports.push('default');
      }
      if (node.name) {
        exports.push(node.name.text);
      }
    }

    // export { Foo, Bar as Baz }
    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const el of node.exportClause.elements) {
        exports.push(el.name.text);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sf);

  if (!hasReactEmailImport || !hasJsx || exports.length === 0) return [];
  return Array.from(new Set(exports));
}
