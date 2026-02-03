import { FigmaFile, FigmaNode } from './figma-client.js';

export interface ConversionResult {
  components: Record<string, string>;
  index: string;
}

export async function convertFigmaToCode(
  figmaFile: FigmaFile,
  framework: 'react' | 'vue' | 'svelte'
): Promise<ConversionResult> {
  const components: Record<string, string> = {};

  // Filter out hidden/invalid nodes
  const validNodes = figmaFile.nodes.filter(n => n.visible !== false && n.name);

  for (const node of validNodes) {
    const filename = sanitizeFileName(node.name);
    const code = generateComponentCode(node, framework);
    components[`${filename}.tsx`] = code;
  }

  // Generate index file
  const indexFile = generateIndexFile(validNodes, framework);

  return {
    components,
    index: indexFile,
  };
}

function generateComponentCode(node: FigmaNode, framework: string): string {
  const name = toPascalCase(node.name);
  const props = extractPropsFromNode(node);

  let code = '';

  if (framework === 'react') {
    code = generateReactComponent(name, node, props);
  } else if (framework === 'vue') {
    code = generateVueComponent(name, node, props);
  } else if (framework === 'svelte') {
    code = generateSvelteComponent(name, node, props);
  }

  return code;
}

function generateReactComponent(name: string, node: FigmaNode, props: string[]): string {
  const propString = props.length > 0 ? `{ ${props.join(', ')} }` : '';
  const dimensions = node.absoluteBoundingBox
    ? `width: ${Math.round(node.absoluteBoundingBox.width)}px; height: ${Math.round(node.absoluteBoundingBox.height)}px;`
    : '';

  return `import React from 'react';

interface ${name}Props {
  ${props.map(p => `${p}?: string | number;`).join('\n  ')}
}

export const ${name}: React.FC<${name}Props> = (${propString}) => {
  return (
    <div style={{ ${dimensions} }}>
      {/* ${node.name} Component */}
      ${generateReactChildren(node)}
    </div>
  );
};

export default ${name};
`;
}

function generateVueComponent(name: string, node: FigmaNode, props: string[]): string {
  const propsSection =
    props.length > 0
      ? `\n  props: {\n    ${props.map(p => `${p}: String,`).join('\n    ')}\n  },`
      : '';

  const dimensions = node.absoluteBoundingBox
    ? `width: ${Math.round(node.absoluteBoundingBox.width)}px; height: ${Math.round(node.absoluteBoundingBox.height)}px;`
    : '';

  return `<template>
  <div style="${dimensions}">
    <!-- ${node.name} Component -->
    ${generateVueChildren(node)}
  </div>
</template>

<script>
export default {
  name: '${name}',${propsSection}
};
</script>

<style scoped>
div {
  box-sizing: border-box;
}
</style>
`;
}

function generateSvelteComponent(name: string, node: FigmaNode, props: string[]): string {
  const exportProps = props.map(p => `export let ${p};`).join('\n');

  const dimensions = node.absoluteBoundingBox
    ? `width: ${Math.round(node.absoluteBoundingBox.width)}px; height: ${Math.round(node.absoluteBoundingBox.height)}px;`
    : '';

  return `<script>
  ${exportProps}
</script>

<div style="${dimensions}">
  <!-- ${node.name} Component -->
  ${generateSvelteChildren(node)}
</div>

<style>
  div {
    box-sizing: border-box;
  }
</style>
`;
}

function generateReactChildren(node: FigmaNode): string {
  if (!node.children || node.children.length === 0) {
    return node.textContent ? `<p>${node.textContent}</p>` : '';
  }

  return node.children
    .filter(c => c.visible !== false)
    .map(child => {
      if (child.type === 'TEXT') {
        return `      <p>${child.textContent || child.name}</p>`;
      }
      return `      <div>{/* ${child.name} */}</div>`;
    })
    .join('\n');
}

function generateVueChildren(node: FigmaNode): string {
  if (!node.children || node.children.length === 0) {
    return node.textContent ? `<p>${node.textContent}</p>` : '';
  }

  return node.children
    .filter(c => c.visible !== false)
    .map(child => {
      if (child.type === 'TEXT') {
        return `    <p>${child.textContent || child.name}</p>`;
      }
      return `    <div><!-- ${child.name} --></div>`;
    })
    .join('\n');
}

function generateSvelteChildren(node: FigmaNode): string {
  if (!node.children || node.children.length === 0) {
    return node.textContent ? `<p>${node.textContent}</p>` : '';
  }

  return node.children
    .filter(c => c.visible !== false)
    .map(child => {
      if (child.type === 'TEXT') {
        return `  <p>${child.textContent || child.name}</p>`;
      }
      return `  <div><!-- ${child.name} --></div>`;
    })
    .join('\n');
}

function generateIndexFile(nodes: FigmaNode[], framework: string): string {
  const imports = nodes
    .filter(n => n.visible !== false && n.name)
    .map(node => {
      const name = toPascalCase(node.name);
      const filename = sanitizeFileName(node.name);
      return `export { default as ${name} } from './${filename}';`;
    })
    .join('\n');

  if (framework === 'vue') {
    return `// Vue Components\n${imports}\n`;
  }

  return `// ${framework} Components\n${imports}\n`;
}

function extractPropsFromNode(node: FigmaNode): string[] {
  const props = new Set<string>();

  // Add common props
  if (node.children) {
    node.children.forEach(child => {
      if (child.type === 'TEXT' && child.textContent?.includes('${')) {
        // Extract template variables
        const matches = child.textContent.match(/\$\{(\w+)\}/g);
        if (matches) {
          matches.forEach(m => props.add(m.slice(2, -1)));
        }
      }
    });
  }

  return Array.from(props);
}

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .slice(0, 50);
}

function toPascalCase(str: string): string {
  return str
    .split(/[\s\-_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '');
}
