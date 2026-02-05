import * as fs from 'fs';
import ora from 'ora';
import * as path from 'path';
import { cyan, green, red, yellow } from 'picocolors';
import prompts from 'prompts';
import { loadConfig } from './config/loader';
import type { EmailStepConfig, NovuConfig } from './config/schema';
import { isInteractive } from './helpers/environment';
import { discoverEmailTemplates } from './helpers/template-discovery';
import {
  generateStepIdFromFilename,
  generateWorkflowIdFromStepId,
  validateStepId,
  validateWorkflowId,
} from './helpers/validation';
import { generateStepFile } from './templates/step-file';

interface InitOptions {
  config?: string;
  force?: boolean;
  out?: string;
  dryRun?: boolean;
}

export async function emailInit(options: InitOptions): Promise<void> {
  try {
    const config = await loadConfig(options.config);

    if (config) {
      await runInitWithConfig(config, options);
    } else {
      if (!isInteractive()) {
        console.error(red('❌ No novu.config.ts found'));
        console.error('');
        console.error('In CI/non-interactive mode, you must provide a config file.');
        console.error('');
        console.error('Create novu.config.ts with your step definitions:');
        console.error('');
        console.error(cyan('  export default {'));
        console.error(cyan('    steps: {'));
        console.error(cyan('      email: {'));
        console.error(cyan("        'welcome-email': {"));
        console.error(cyan("          template: 'emails/welcome.tsx',"));
        console.error(cyan("          workflowId: 'onboarding',"));
        console.error(cyan('        },'));
        console.error(cyan('      },'));
        console.error(cyan('    },'));
        console.error(cyan('  };'));
        console.error('');
        console.error('Or run this command interactively locally first to generate the config.');
        process.exit(1);
      }

      await runInitInteractive(options);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Configuration validation errors:')) {
      const parts = error.message.split('\n');
      const configPath = parts[0].replace('Config file: ', '');
      const errorsPart = parts.slice(1).join('\n');

      console.error('');
      console.error(red('✖ Configuration validation failed'));
      console.error('');
      console.error(`Config file: ${cyan(configPath)}`);
      console.error('');
      console.error(red('Errors:'));
      console.error(errorsPart);
      console.error('');
    } else {
      console.error('');
      console.error(red('❌ Init failed:'), error instanceof Error ? error.message : error);
      console.error('');
    }
    process.exit(1);
  }
}

async function runInitWithConfig(config: NovuConfig, options: InitOptions): Promise<void> {
  const rootDir = process.cwd();
  const configPath = options.config || 'novu.config.ts';

  console.log(cyan(`\n🔍 Reading configuration from ${configPath}\n`));

  const spinner = ora('Validating configuration...').start();

  const emailSteps = Object.entries(config.steps.email);
  spinner.text = `Found ${emailSteps.length} step definition(s)`;

  const errors: string[] = [];
  for (const [stepId, emailConfig] of emailSteps) {
    const templateAbsPath = path.resolve(rootDir, emailConfig.template);
    if (!fs.existsSync(templateAbsPath)) {
      errors.push(`Template not found: ${emailConfig.template} (step: ${stepId})`);
    }
  }

  if (errors.length > 0) {
    spinner.fail('Validation failed');
    console.error('');
    console.error(red('Errors:'));
    for (const error of errors) {
      console.error(red(`  • ${error}`));
    }
    console.error('');
    process.exit(1);
  }

  spinner.succeed('Configuration valid');
  console.log('');

  console.log('Steps to generate:');

  const stepIdWidth = Math.max('Step ID'.length, ...emailSteps.map(([id]) => id.length)) + 2;
  const workflowIdWidth = Math.max('Workflow ID'.length, ...emailSteps.map(([, cfg]) => cfg.workflowId.length)) + 2;
  const templateWidth = Math.max('Template'.length, ...emailSteps.map(([, cfg]) => cfg.template.length)) + 2;

  console.log(
    '┌' + '─'.repeat(stepIdWidth) + '┬' + '─'.repeat(workflowIdWidth) + '┬' + '─'.repeat(templateWidth) + '┐'
  );
  console.log(
    '│ ' +
      'Step ID'.padEnd(stepIdWidth - 1) +
      '│ ' +
      'Workflow ID'.padEnd(workflowIdWidth - 1) +
      '│ ' +
      'Template'.padEnd(templateWidth - 1) +
      '│'
  );
  console.log(
    '├' + '─'.repeat(stepIdWidth) + '┼' + '─'.repeat(workflowIdWidth) + '┼' + '─'.repeat(templateWidth) + '┤'
  );

  for (const [stepId, emailConfig] of emailSteps) {
    console.log(
      '│ ' +
        stepId.padEnd(stepIdWidth - 1) +
        '│ ' +
        emailConfig.workflowId.padEnd(workflowIdWidth - 1) +
        '│ ' +
        emailConfig.template.padEnd(templateWidth - 1) +
        '│'
    );
  }

  console.log(
    '└' + '─'.repeat(stepIdWidth) + '┴' + '─'.repeat(workflowIdWidth) + '┴' + '─'.repeat(templateWidth) + '┘'
  );
  console.log('');

  if (options.dryRun) {
    console.log(yellow('🔍 Dry run mode - no files will be created'));
    console.log('');
    return;
  }

  const outDir = options.out || config.outDir || './novu';
  const stepsDir = path.resolve(rootDir, outDir);

  console.log(green(`📁 Generating step handlers in ${outDir}\n`));

  if (!fs.existsSync(stepsDir)) {
    fs.mkdirSync(stepsDir, { recursive: true });
  }

  let createdCount = 0;
  let skippedCount = 0;

  for (const [stepId, emailConfig] of emailSteps) {
    const stepFilePath = path.join(stepsDir, `${stepId}.step.tsx`);

    if (fs.existsSync(stepFilePath) && !options.force) {
      console.log(yellow(`   ⊘ ${stepId}.step.tsx`) + ' (exists, use --force to overwrite)');
      skippedCount++;
      continue;
    }

    const templateAbsPath = path.resolve(rootDir, emailConfig.template);
    const relativeImportPath = path.relative(stepsDir, templateAbsPath);

    const importPath = relativeImportPath.replace(/\\/g, '/').replace(/\.(tsx?|jsx?)$/, '');

    const finalImportPath = importPath.startsWith('.') ? importPath : `./${importPath}`;

    const stepFileContent = generateStepFile(finalImportPath, emailConfig);

    fs.writeFileSync(stepFilePath, stepFileContent, 'utf8');

    console.log(green(`   ✓ ${stepId}.step.tsx`));
    createdCount++;
  }

  console.log('');
  console.log(green(`✅ Generated ${createdCount} step handler(s)`));
  if (skippedCount > 0) {
    console.log(yellow(`   Skipped ${skippedCount} file(s)`));
  }

  console.log('');
  console.log(cyan('📝 Next steps:'));
  console.log('   1. Review the generated files in ' + outDir);
  console.log('   2. Customize handlers if needed');
  console.log("   3. Run 'npx novu email publish' to deploy");
  console.log('');
}

async function runInitInteractive(options: InitOptions): Promise<void> {
  console.log(yellow('\n⚠️  No novu.config.ts found\n'));
  console.log("Let's create one! I'll scan for email templates and help you set up.\n");

  const spinner = ora('Scanning for email templates...').start();
  const templates = await discoverEmailTemplates();

  if (templates.length === 0) {
    spinner.fail('No email templates found');
    console.error('');
    console.error(red('Expected React Email templates in:'));
    console.error('  • emails/**/*.tsx');
    console.error('  • emails/**/*.jsx');
    console.error('  • src/emails/**/*.tsx');
    console.error('  • src/emails/**/*.jsx');
    console.error('');
    console.error('Create your email templates first, then run init again.');
    console.error('');
    console.error(cyan('Learn more: https://react.email/docs/introduction'));
    console.error('');
    process.exit(1);
  }

  spinner.succeed(`Found ${templates.length} template(s):`);
  for (const template of templates) {
    console.log(`     • ${template.relativePath}`);
  }
  console.log('');

  console.log(cyan("📝 Let's configure the templates:\n"));

  const emailSteps: Record<string, EmailStepConfig> = {};
  const existingStepIds = new Set<string>();

  for (const template of templates) {
    console.log(green(`\n📧 ${template.relativePath}`));

    const includeResponse = await prompts({
      type: 'confirm',
      name: 'include',
      message: 'Include this template?',
      initial: true,
    });

    if (!includeResponse.include) {
      console.log(yellow('   Skipped'));
      continue;
    }

    const filename = path.basename(template.relativePath);
    const suggestedStepId = generateStepIdFromFilename(filename);
    const suggestedWorkflowId = generateWorkflowIdFromStepId(suggestedStepId);

    const workflowResponse = await prompts({
      type: 'text',
      name: 'workflowId',
      message: 'Workflow ID:',
      initial: suggestedWorkflowId,
      validate: validateWorkflowId,
    });

    if (!workflowResponse.workflowId) {
      console.log(yellow('\n⚠️  Setup cancelled\n'));
      process.exit(130);
    }

    const stepResponse = await prompts({
      type: 'text',
      name: 'stepId',
      message: 'Step ID:',
      initial: suggestedStepId,
      validate: (value) => validateStepId(value, existingStepIds),
    });

    if (!stepResponse.stepId) {
      console.log(yellow('\n⚠️  Setup cancelled\n'));
      process.exit(130);
    }

    const subjectResponse = await prompts({
      type: 'text',
      name: 'subject',
      message: 'Default subject (optional):',
      initial: '',
    });

    existingStepIds.add(stepResponse.stepId);

    emailSteps[stepResponse.stepId] = {
      template: template.relativePath,
      workflowId: workflowResponse.workflowId,
      ...(subjectResponse.subject && { subject: subjectResponse.subject }),
    };

    console.log('');
  }

  console.log(cyan('💾 Saving configuration to novu.config.ts...'));

  const configContent = generateConfigFile(emailSteps);
  fs.writeFileSync('novu.config.ts', configContent, 'utf8');

  console.log(green('   ✓ Created novu.config.ts\n'));

  const config: NovuConfig = {
    steps: {
      email: emailSteps,
    },
  };

  await runInitWithConfig(config, options);
}

function generateConfigFile(emailSteps: Record<string, EmailStepConfig>): string {
  let content = 'export default {\n  steps: {\n    email: {\n';

  for (const [stepId, config] of Object.entries(emailSteps)) {
    content += `      '${stepId}': {\n`;
    content += `        template: '${config.template}',\n`;
    content += `        workflowId: '${config.workflowId}',\n`;
    if (config.subject) {
      content += `        subject: '${config.subject}',\n`;
    }
    content += `      },\n`;
  }

  content += '    },\n  },\n};\n';

  return content;
}
