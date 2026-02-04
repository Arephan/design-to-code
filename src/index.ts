#!/usr/bin/env node

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  visible?: boolean;
  children?: FigmaNode[];
  fills?: Array<{ type: string; color?: { r: number; g: number; b: number; a: number } }>;
  strokes?: Array<{ type: string; color?: { r: number; g: number; b: number; a: number } }>;
  effects?: Array<{ type: string }>;
  constraints?: { horizontal: string; vertical: string };
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  characters?: string;
  fontSize?: number;
  fontWeight?: number;
}

export interface ComponentConfig {
  framework: 'react' | 'vue' | 'svelte';
  outputDir: string;
  typescript: boolean;
  tailwind: boolean;
  includeStyles: boolean;
}

export class DesignToCode {
  private config: ComponentConfig;

  constructor(config: Partial<ComponentConfig> = {}) {
    this.config = {
      framework: config.framework || 'react',
      outputDir: config.outputDir || './components',
      typescript: config.typescript !== false,
      tailwind: config.tailwind !== false,
      includeStyles: config.includeStyles !== false
    };
  }

  /**
   * Extract component props from Figma node
   */
  extractProps(node: FigmaNode): Record<string, any> {
    const props: Record<string, any> = {
      id: node.id,
      name: this.sanitizeName(node.name),
      type: node.type,
      children: node.children?.length || 0
    };

    if (node.absoluteBoundingBox) {
      props.dimensions = {
        width: node.absoluteBoundingBox.width,
        height: node.absoluteBoundingBox.height
      };
    }

    if (node.fills && node.fills.length > 0) {
      props.backgroundColor = this.colorToHex(node.fills[0]);
    }

    if (node.characters) {
      props.text = node.characters;
      props.fontSize = node.fontSize || 14;
      props.fontWeight = node.fontWeight || 400;
    }

    return props;
  }

  /**
   * Generate React component code
   */
  generateReactComponent(node: FigmaNode, props: Record<string, any>): string {
    const componentName = this.toPascalCase(props.name);
    const isTS = this.config.typescript;
    const ext = isTS ? 'tsx' : 'jsx';
    
    const typeAnnotation = isTS ? ': React.FC<Props>' : '';
    const propsInterface = isTS ? `
interface Props {
  children?: React.ReactNode;
  className?: string;
}
` : '';

    const styles = this.config.tailwind 
      ? this.generateTailwindClasses(props)
      : this.generateCSSClasses(props);

    const code = `import React${isTS ? ', { FC }' : ''} from 'react';
${this.config.includeStyles && !this.config.tailwind ? `import styles from './${componentName}.module.css';\n` : ''}

${propsInterface}
/**
 * ${componentName} Component
 * Auto-generated from Figma design
 * Original Figma ID: ${props.id}
 */
const ${componentName}${typeAnnotation} = ({ children, className = '' }) => {
  return (
    <div
      className="${styles} \${className}"
      role="presentation"
      data-testid="${this.toKebabCase(componentName)}"
    >
      {children}
    </div>
  );
};

export default ${componentName};
export { ${componentName} };
`;

    return code;
  }

  /**
   * Generate Vue component code
   */
  generateVueComponent(node: FigmaNode, props: Record<string, any>): string {
    const componentName = this.toPascalCase(props.name);
    const styles = this.config.tailwind
      ? this.generateTailwindClasses(props)
      : this.generateCSSClasses(props);

    const code = `<template>
  <div
    :class="['${styles}', className]"
    role="presentation"
    :data-testid="testId"
  >
    <slot></slot>
  </div>
</template>

<script${this.config.typescript ? ' lang="ts"' : ''}>
${this.config.typescript ? `
interface Props {
  className?: string;
}

export default {
  name: '${componentName}',
  props: {
    className: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      testId: '${this.toKebabCase(componentName)}'
    };
  }
};
` : `
export default {
  name: '${componentName}',
  props: {
    className: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      testId: '${this.toKebabCase(componentName)}'
    };
  }
};
`}
</script>

<style${this.config.tailwind ? '' : ' scoped'}>
${!this.config.tailwind ? this.generateCSSContent(props) : '/* Tailwind CSS is enabled */'}
</style>
`;

    return code;
  }

  /**
   * Generate Svelte component code
   */
  generateSvelteComponent(node: FigmaNode, props: Record<string, any>): string {
    const componentName = this.toPascalCase(props.name);
    const styles = this.config.tailwind
      ? this.generateTailwindClasses(props)
      : this.generateCSSClasses(props);

    const code = `<script${this.config.typescript ? ' lang="ts"' : ''}>
  let className = '';
  export { className as class };
  
  ${this.config.typescript ? `
  interface Props {
    class?: string;
  }
  ` : ''}

  const testId = '${this.toKebabCase(componentName)}';
</script>

<div
  class="${styles} {className}"
  role="presentation"
  data-testid="{testId}"
>
  <slot></slot>
</div>

<style${!this.config.tailwind ? ' scoped' : ''}>
  ${!this.config.tailwind ? `
  div {
    ${Object.entries(this.styleObjectToCSS(props)).join('\n    ')}
  }
  ` : '/* Tailwind CSS is enabled */'}
</style>
`;

    return code;
  }

  /**
   * Generate Tailwind classes from design props
   */
  private generateTailwindClasses(props: Record<string, any>): string {
    const classes: string[] = [];

    if (props.dimensions) {
      classes.push(`w-[${Math.round(props.dimensions.width)}px]`);
      classes.push(`h-[${Math.round(props.dimensions.height)}px]`);
    }

    if (props.backgroundColor) {
      const hex = props.backgroundColor;
      classes.push(`bg-[${hex}]`);
    }

    if (props.fontSize) {
      const size = Math.round(props.fontSize / 4);
      classes.push(`text-${size > 16 ? `[${props.fontSize}px]` : size}`);
    }

    return classes.join(' ');
  }

  /**
   * Generate CSS classes from design props
   */
  private generateCSSClasses(props: Record<string, any>): string {
    return 'component-auto-generated';
  }

  /**
   * Generate CSS content
   */
  private generateCSSContent(props: Record<string, any>): string {
    const styles = this.styleObjectToCSS(props);
    return Object.entries(styles)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n');
  }

  /**
   * Convert style object to CSS
   */
  private styleObjectToCSS(props: Record<string, any>): Record<string, string> {
    const css: Record<string, string> = {};

    if (props.dimensions) {
      css['width'] = `${props.dimensions.width}px`;
      css['height'] = `${props.dimensions.height}px`;
    }

    if (props.backgroundColor) {
      css['background-color'] = props.backgroundColor;
    }

    if (props.fontSize) {
      css['font-size'] = `${props.fontSize}px`;
    }

    if (props.fontWeight) {
      css['font-weight'] = `${props.fontWeight}`;
    }

    return css;
  }

  /**
   * Convert color object to hex
   */
  private colorToHex(fill: any): string {
    if (fill.type !== 'SOLID' || !fill.color) return '#000000';
    
    const { r, g, b } = fill.color;
    const toHex = (n: number) => {
      const hex = Math.round(n * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  /**
   * Sanitize component name
   */
  private sanitizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Convert to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[\s\-_]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Convert to kebab-case
   */
  private toKebabCase(str: string): string {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
  }

  /**
   * Generate component from Figma node
   */
  generateComponent(node: FigmaNode): { code: string; filename: string } {
    const props = this.extractProps(node);
    const componentName = this.toPascalCase(props.name);
    
    let code = '';
    let ext = '';

    switch (this.config.framework) {
      case 'react':
        code = this.generateReactComponent(node, props);
        ext = this.config.typescript ? 'tsx' : 'jsx';
        break;
      case 'vue':
        code = this.generateVueComponent(node, props);
        ext = 'vue';
        break;
      case 'svelte':
        code = this.generateSvelteComponent(node, props);
        ext = 'svelte';
        break;
    }

    return {
      code,
      filename: `${componentName}.${ext}`
    };
  }

  /**
   * Process multiple nodes into components
   */
  processDesign(nodes: FigmaNode[]): Array<{ code: string; filename: string }> {
    return nodes.map(node => this.generateComponent(node));
  }
}

export default DesignToCode;
