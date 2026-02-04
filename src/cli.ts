#!/usr/bin/env node

import yargs, { Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import DesignToCode, { FigmaNode } from './index';

interface ConvertOptions {
  'figma-json': string;
  framework: 'react' | 'vue' | 'svelte';
  output: string;
  typescript: boolean;
  tailwind: boolean;
  verbose: boolean;
  _: string[];
}

interface BatchOptions {
  directory: string;
  framework: 'react' | 'vue' | 'svelte';
  output: string;
  verbose: boolean;
  _: string[];
}

async function main() {
  try {
    const argv = yargs(hideBin(process.argv))
      .command(
        'convert <figma-json>',
        'Convert Figma JSON export to components',
        (yargs: Argv) =>
          yargs
            .positional('figma-json', {
              describe: 'Path to exported Figma JSON file',
              type: 'string'
            } as any)
            .option('framework', {
              alias: 'f',
              describe: 'Target framework',
              choices: ['react', 'vue', 'svelte'],
              default: 'react'
            })
            .option('output', {
              alias: 'o',
              describe: 'Output directory',
              default: './components'
            })
            .option('typescript', {
              alias: 't',
              describe: 'Generate TypeScript',
              type: 'boolean',
              default: true
            })
            .option('tailwind', {
              alias: 'tw',
              describe: 'Use Tailwind CSS',
              type: 'boolean',
              default: false
            })
      )
      .command(
        'batch <directory>',
        'Convert multiple Figma JSON files in a directory',
        (yargs: Argv) =>
          yargs
            .positional('directory', {
              describe: 'Directory containing Figma JSON files',
              type: 'string'
            } as any)
            .option('framework', {
              alias: 'f',
              describe: 'Target framework',
              choices: ['react', 'vue', 'svelte'],
              default: 'react'
            })
            .option('output', {
              alias: 'o',
              describe: 'Output directory',
              default: './components'
            })
      )
      .option('verbose', {
        alias: 'v',
        describe: 'Verbose output',
        type: 'boolean',
        default: false
      })
      .help()
      .alias('help', 'h');

    const parsed = await argv;

    if ((parsed as any)._[0] === 'convert') {
      await handleConvert(
        (parsed as any)['figma-json'] as string,
        parsed as any
      );
    } else if ((parsed as any)._[0] === 'batch') {
      await handleBatch(
        (parsed as any)['directory'] as string,
        parsed as any
      );
    } else {
      console.log(chalk.yellow('No command specified. Use --help for usage.'));
    }
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function handleConvert(figmaJsonPath: string, options: any) {
  if (!fs.existsSync(figmaJsonPath)) {
    throw new Error(`File not found: ${figmaJsonPath}`);
  }

  const figmaData = fs.readJsonSync(figmaJsonPath);
  const converter = new DesignToCode({
    framework: options.framework,
    outputDir: options.output,
    typescript: options.typescript,
    tailwind: options.tailwind
  });

  await fs.ensureDir(options.output);

  let componentCount = 0;
  const processNode = async (node: FigmaNode) => {
    if (node.type === 'COMPONENT' || node.type === 'FRAME') {
      const { code, filename } = converter.generateComponent(node);
      const filepath = path.join(options.output, filename);
      
      await fs.writeFile(filepath, code);
      componentCount++;
      
      if (options.verbose) {
        console.log(chalk.green('✓'), `Generated ${filename}`);
      }
    }

    if (node.children) {
      for (const child of node.children) {
        await processNode(child);
      }
    }
  };

  if (figmaData.document?.children) {
    for (const child of figmaData.document.children) {
      await processNode(child);
    }
  }

  console.log(chalk.green.bold(`\n✓ Generated ${componentCount} components`));
  console.log(chalk.cyan(`  Output: ${path.resolve(options.output)}`));
  console.log(chalk.cyan(`  Framework: ${options.framework}`));
  console.log(chalk.cyan(`  TypeScript: ${options.typescript ? 'yes' : 'no'}`));
}

async function handleBatch(directory: string, options: any): Promise<void> {
  if (!fs.existsSync(directory)) {
    throw new Error(`Directory not found: ${directory}`);
  }

  const files = fs.readdirSync(directory).filter((f: string) => f.endsWith('.json'));
  
  if (files.length === 0) {
    console.log(chalk.yellow('No JSON files found in directory'));
    return;
  }

  let totalComponents = 0;

  for (const file of files) {
    const filepath = path.join(directory, file);
    
    if (options.verbose) {
      console.log(chalk.blue(`Processing ${file}...`));
    }

    try {
      const figmaData = fs.readJsonSync(filepath);
      const converter = new DesignToCode({
        framework: options.framework,
        outputDir: options.output
      });

      await fs.ensureDir(options.output);

      const processNode = async (node: FigmaNode): Promise<void> => {
        if (node.type === 'COMPONENT' || node.type === 'FRAME') {
          const { code, filename } = converter.generateComponent(node);
          const outpath = path.join(options.output, filename);
          
          await fs.writeFile(outpath, code);
          totalComponents++;
          
          if (options.verbose) {
            console.log(chalk.green('  ✓'), filename);
          }
        }

        if (node.children) {
          for (const child of node.children) {
            await processNode(child);
          }
        }
      };

      if (figmaData.document?.children) {
        for (const child of figmaData.document.children) {
          await processNode(child);
        }
      }
    } catch (error) {
      console.error(chalk.red(`Error processing ${file}:`), error instanceof Error ? error.message : error);
    }
  }

  console.log(chalk.green.bold(`\n✓ Batch complete`));
  console.log(chalk.cyan(`  Total components: ${totalComponents}`));
  console.log(chalk.cyan(`  Output: ${path.resolve(options.output)}`));
}

main().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
