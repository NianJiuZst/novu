import fg from 'fast-glob';
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import type { DiscoveredStep, StepDiscoveryResult, ValidationError } from '../types';

interface StepMetadata {
  stepId?: string;
  workflowId?: string;
  type?: string;
}

interface AnalyzedStepFile {
  filePath: string;
  relativePath: string;
  metadata: StepMetadata;
  hasDefaultExport: boolean;
  hasReactEmailImport: boolean;
  parseErrors: string[];
}

const STEP_FILE_PATTERN = '**/*.step.{ts,tsx,js,jsx}';

export async function discoverStepFiles(stepsDir: string): Promise<StepDiscoveryResult> {
  const matchedStepFiles = await fg([STEP_FILE_PATTERN], {
    cwd: stepsDir,
    absolute: false,
    onlyFiles: true,
  });

  const relativeStepFiles = matchedStepFiles.sort((a, b) => a.localeCompare(b));
  const analyses = relativeStepFiles.map((relativePath) =>
    analyzeStepFile(path.resolve(stepsDir, relativePath), relativePath)
  );
  const duplicateStepIdErrors = buildDuplicateStepIdErrors(analyses);

  const steps: DiscoveredStep[] = [];
  const errors: ValidationError[] = [];

  for (const analysis of analyses) {
    const fileErrors = [...buildValidationErrors(analysis), ...(duplicateStepIdErrors.get(analysis.filePath) ?? [])];
    if (fileErrors.length > 0) {
      errors.push({
        filePath: path.relative(process.cwd(), analysis.filePath),
        errors: fileErrors,
      });
      continue;
    }

    const { stepId, workflowId, type } = analysis.metadata;
    if (stepId && workflowId && type) {
      steps.push({
        stepId,
        workflowId,
        type,
        filePath: analysis.filePath,
        relativePath: analysis.relativePath,
      });
    }
  }

  return {
    valid: errors.length === 0,
    matchedFiles: relativeStepFiles.length,
    steps,
    errors,
  };
}

function analyzeStepFile(filePath: string, relativePath: string): AnalyzedStepFile {
  const sourceCode = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.Latest, true, getScriptKind(filePath));

  const metadata: StepMetadata = {};
  let hasDefaultExport = false;
  let hasReactEmailImport = false;

  function visit(node: ts.Node) {
    if (ts.isVariableStatement(node) && hasModifier(node.modifiers, ts.SyntaxKind.ExportKeyword)) {
      for (const declaration of node.declarationList.declarations) {
        if (
          !ts.isIdentifier(declaration.name) ||
          !declaration.initializer ||
          !ts.isStringLiteral(declaration.initializer)
        ) {
          continue;
        }

        const exportName = declaration.name.text;
        const exportValue = declaration.initializer.text;

        if (exportName === 'stepId') {
          metadata.stepId = exportValue;
        }

        if (exportName === 'workflowId') {
          metadata.workflowId = exportValue;
        }

        if (exportName === 'type') {
          metadata.type = exportValue;
        }
      }
    }

    if (ts.isFunctionDeclaration(node) && hasModifier(node.modifiers, ts.SyntaxKind.DefaultKeyword)) {
      hasDefaultExport = true;
    }

    if (ts.isExportAssignment(node) && !node.isExportEquals) {
      hasDefaultExport = true;
    }

    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      if (node.exportClause.elements.some((el) => el.name.text === 'default')) {
        hasDefaultExport = true;
      }
    }

    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      if (node.moduleSpecifier.text === '@react-email/components') {
        hasReactEmailImport = true;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  const parseDiagnostics = (sourceFile as ts.SourceFile & { parseDiagnostics?: readonly ts.DiagnosticWithLocation[] })
    .parseDiagnostics;

  return {
    filePath,
    relativePath,
    metadata,
    hasDefaultExport,
    hasReactEmailImport,
    parseErrors: (parseDiagnostics ?? []).map((diagnostic) => formatParseDiagnostic(sourceFile, diagnostic)),
  };
}

function buildValidationErrors(analysis: AnalyzedStepFile): string[] {
  const errors: string[] = [...analysis.parseErrors];

  if (!analysis.metadata.stepId) {
    errors.push("Missing required export: 'stepId' (must be a string literal)");
  }

  if (!analysis.metadata.workflowId) {
    errors.push("Missing required export: 'workflowId' (must be a string literal)");
  }

  if (!analysis.metadata.type) {
    errors.push("Missing required export: 'type' (must be a string literal)");
  } else if (analysis.metadata.type !== 'email') {
    errors.push(`Invalid type: '${analysis.metadata.type}' (must be 'email')`);
  }

  if (!analysis.hasDefaultExport) {
    errors.push('Missing default function export');
  }

  if (!analysis.hasReactEmailImport) {
    errors.push("Missing import from '@react-email/components'");
  }

  return errors;
}

function buildDuplicateStepIdErrors(analyses: AnalyzedStepFile[]): Map<string, string[]> {
  const stepIdToFiles = new Map<string, AnalyzedStepFile[]>();

  for (const analysis of analyses) {
    if (!analysis.metadata.stepId) {
      continue;
    }

    const files = stepIdToFiles.get(analysis.metadata.stepId) ?? [];
    files.push(analysis);
    stepIdToFiles.set(analysis.metadata.stepId, files);
  }

  const duplicateErrors = new Map<string, string[]>();

  for (const [stepId, files] of stepIdToFiles) {
    if (files.length <= 1) {
      continue;
    }

    const relativePaths = files.map((file) => path.relative(process.cwd(), file.filePath));

    for (const file of files) {
      const currentFilePath = path.relative(process.cwd(), file.filePath);
      const duplicateLocations = relativePaths.filter((candidate) => candidate !== currentFilePath);
      const entryErrors = duplicateErrors.get(file.filePath) ?? [];
      entryErrors.push(`Duplicate stepId: '${stepId}' is also defined in ${duplicateLocations.join(', ')}`);
      duplicateErrors.set(file.filePath, entryErrors);
    }
  }
  return duplicateErrors;
}

function getScriptKind(filePath: string): ts.ScriptKind {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case '.ts':
      return ts.ScriptKind.TS;
    case '.tsx':
      return ts.ScriptKind.TSX;
    case '.js':
      return ts.ScriptKind.JS;
    case '.jsx':
      return ts.ScriptKind.JSX;
    default:
      return ts.ScriptKind.Unknown;
  }
}

function hasModifier(modifiers: readonly ts.ModifierLike[] | undefined, kind: ts.SyntaxKind): boolean {
  return (modifiers ?? []).some((modifier) => modifier.kind === kind);
}

function formatParseDiagnostic(sourceFile: ts.SourceFile, diagnostic: ts.DiagnosticWithLocation): string {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
  const position = sourceFile.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
  return `Syntax error at ${position.line + 1}:${position.character + 1}: ${message}`;
}
