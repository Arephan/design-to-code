#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { parseArgs } from 'util';
import { convertFigmaToCode } from './converter.js';
import { fetchFigmaFile } from './figma-client.js';
import * as colors from 'picocolors';

const args = parseArgs({
  options: {
    figma: { type: 'string', short: 'f', description: 'Figma file URL' },
    token: { type: 'string', short: 't', description: 'Figma API token (or use FIGMA_TOKEN env)' },
    framework: { type: 'string', short: 'r', description: 'Target framework: react|vue|svelte' },
    output: { type: 'string', short: 'o', description: 'Output directory (default: ./components)' },
    help: { type: 'boolean', short: 'h', description: 'Show help' },
    version: { type: 'boolean', short: 'v', description: 'Show version' },
  },
  allowPositionals: true,
});

if (args.values.help) {
  console.log(`
${colors.cyan('design-to-code')} ${colors.gray('1.0.0')}

${colors.bold('Convert Figma designs to clean code.')}

${colors.bold('Usage:')}
  d2c --figma <url> --framework react [options]
  d2c --figma <url> --framework vue
  d2c --figma <url> --framework svelte

${colors.bold('Options:')}
  -f, --figma <url>        Figma file URL (or file ID)
  -r, --framework <name>   Target framework: react, vue, or svelte (default: react)
  -t, --token <token>      Figma API token (default: FIGMA_TOKEN env var)
  -o, --output <dir>       Output directory (default: ./components)
  -h, --help               Show this help message
  -v, --version            Show version

${colors.bold('Examples:')}
  d2c --figma https://figma.com/file/abc123/MyDesign --framework react
  d2c -f abc123 -r vue -o ./src/components
  FIGMA_TOKEN=abc123 d2c --figma abc123 --framework svelte

${colors.bold('Environment:')}
  FIGMA_TOKEN              Your Figma API personal access token
  CLAUDE_API_KEY           Anthropic Claude API key (for code generation)
`);
  process.exit(0);
}

if (args.values.version) {
  console.log('design-to-code 1.0.0');
  process.exit(0);
}

async function main() {
  try {
    const figmaUrl = args.values.figma as string;
    const framework = (args.values.framework as string) || 'react';
    const token = (args.values.token as string) || process.env.FIGMA_TOKEN;
    const outputDir = (args.values.output as string) || './components';

    if (!figmaUrl) {
      console.error(colors.red('❌ Error: --figma is required'));
      console.error('Run with --help for usage');
      process.exit(1);
    }

    if (!token) {
      console.error(colors.red('❌ Error: FIGMA_TOKEN not set and --token not provided'));
      console.error('Get your token from https://www.figma.com/developers/api#access-tokens');
      process.exit(1);
    }

    if (!['react', 'vue', 'svelte'].includes(framework)) {
      console.error(colors.red(`❌ Error: framework must be react, vue, or svelte`));
      process.exit(1);
    }

    console.log(colors.cyan('🎨 Design to Code Converter'));
    console.log(colors.gray(`Framework: ${framework} | Output: ${outputDir}`));
    console.log();

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Step 1: Fetch Figma file
    console.log(colors.yellow('📥 Fetching Figma file...'));
    const figmaData = await fetchFigmaFile(figmaUrl, token);

    if (!figmaData) {
      console.error(colors.red('❌ Failed to fetch Figma file'));
      process.exit(1);
    }

    console.log(colors.green(`✓ Loaded: ${figmaData.name}`));
    console.log(colors.gray(`  Components: ${figmaData.componentCount} | Frames: ${figmaData.frameCount}`));

    // Step 2: Convert to code
    console.log(colors.yellow('⚙️  Converting to code...'));
    const result = await convertFigmaToCode(figmaData, framework);

    if (!result) {
      console.error(colors.red('❌ Conversion failed'));
      process.exit(1);
    }

    // Step 3: Write output files
    console.log(colors.yellow('💾 Writing components...'));
    let fileCount = 0;

    for (const [filename, content] of Object.entries(result.components)) {
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, content);
      fileCount++;
      console.log(colors.gray(`  ✓ ${filename}`));
    }

    // Write index file
    const indexContent = result.index;
    const indexPath = path.join(outputDir, 'index.ts');
    fs.writeFileSync(indexPath, indexContent);
    console.log(colors.gray(`  ✓ index.ts`));

    console.log();
    console.log(colors.green('✅ Success!'));
    console.log(colors.gray(`Generated ${fileCount} components in ${outputDir}/`));
    console.log(colors.gray(`Next: Import from ${outputDir}/index.ts`));

  } catch (error) {
    console.error(colors.red('❌ Error:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
