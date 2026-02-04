# design-to-code

Convert Figma designs to clean React/Vue/Svelte components. **Real code, not screenshots.**

## Features

✨ **Multi-Framework Support**
- React (JSX/TSX)
- Vue (Single File Components)
- Svelte (Component Format)

🎨 **Smart Component Generation**
- Extract design properties (colors, dimensions, typography)
- Generate production-ready components
- Optional Tailwind CSS support
- Full TypeScript support

🔄 **Batch Processing**
- Convert multiple Figma JSON exports at once
- Automatic component naming and organization
- Flexible output directory structure

📊 **Intelligent Prop Extraction**
- Dimensions and positioning
- Colors and background styles
- Typography properties (font size, weight)
- Component hierarchy preservation

## Installation

```bash
npm install -g design-to-code
# or
npx design-to-code --help
```

## Quick Start

### 1. Export from Figma

In Figma:
1. Right-click your design file
2. Select "Copy link"
3. Visit the link and export as JSON (Menu → Export → JSON)
4. Save as `design.json`

### 2. Generate Components

```bash
design-to-code convert design.json --framework react --output ./components
```

### 3. Use Generated Components

```tsx
import Button from './components/Button';

export function App() {
  return <Button>Click me</Button>;
}
```

## Usage

### Convert Single File

```bash
design-to-code convert <figma-json> [options]

Options:
  -f, --framework   react|vue|svelte (default: react)
  -o, --output      Output directory (default: ./components)
  -t, --typescript  Generate TypeScript (default: true)
  --tailwind        Use Tailwind CSS (default: false)
  -v, --verbose     Verbose output
```

Example:
```bash
design-to-code convert design.json -f vue -o ./src/components --tailwind
```

### Batch Process

Convert all JSON files in a directory:

```bash
design-to-code batch ./figma-exports -f react -o ./components
```

## Output Examples

### React Component
```tsx
import React from 'react';

interface Props {
  children?: React.ReactNode;
  className?: string;
}

const Button: React.FC<Props> = ({ children, className = '' }) => {
  return (
    <div
      className="w-[100px] h-[40px] bg-[#6366F1] {className}"
      role="presentation"
      data-testid="button"
    >
      {children}
    </div>
  );
};

export default Button;
```

### Vue Component
```vue
<template>
  <div
    :class="['w-[100px] h-[40px] bg-[#6366F1]', className]"
    role="presentation"
    :data-testid="testId"
  >
    <slot></slot>
  </div>
</template>

<script lang="ts">
export default {
  name: 'Button',
  props: {
    className: {
      type: String,
      default: ''
    }
  }
}
</script>
```

### Svelte Component
```svelte
<script lang="ts">
  let className = '';
  export { className as class };
  
  const testId = 'button';
</script>

<div
  class="w-[100px] h-[40px] bg-[#6366F1] {className}"
  role="presentation"
  data-testid="{testId}"
>
  <slot></slot>
</div>
```

## Configuration

### TypeScript

Generate TypeScript components by default:
```bash
design-to-code convert design.json --typescript
```

Disable TypeScript:
```bash
design-to-code convert design.json --typescript=false
```

### Styling

#### CSS Modules (Default)
Components use generated CSS modules with scoped styling.

#### Tailwind CSS
Generate components using Tailwind utility classes:
```bash
design-to-code convert design.json --tailwind
```

#### Custom CSS
Edit generated `.module.css` files after generation.

## Workflow

1. **Design in Figma**
   - Organize components in frames
   - Use consistent naming (PascalCase recommended)
   - Label variants clearly

2. **Export from Figma**
   - Menu → File → Export as JSON
   - Save `design.json`

3. **Generate Code**
   ```bash
   design-to-code convert design.json -f react
   ```

4. **Customize**
   - Review generated components
   - Add business logic
   - Customize styling as needed
   - Update prop interfaces

5. **Deploy**
   - Commit components to your repo
   - Use in your application
   - Update components by re-running conversion

## Advanced Usage

### Programmatic API

```typescript
import DesignToCode from 'design-to-code';

const converter = new DesignToCode({
  framework: 'react',
  outputDir: './components',
  typescript: true,
  tailwind: true,
  includeStyles: true
});

const node = {
  id: '123',
  name: 'Button',
  type: 'COMPONENT',
  children: []
};

const { code, filename } = converter.generateComponent(node);
console.log(code);  // React component code
```

### Process Multiple Designs

```typescript
const nodes = [/* Figma nodes */];
const components = converter.processDesign(nodes);

for (const component of components) {
  fs.writeFileSync(component.filename, component.code);
}
```

## Limitations

- Figma frames and components are converted to basic div structures
- Complex animations and interactions require manual implementation
- Image assets should be handled separately (not embedded in exports)
- Some advanced Figma features (constraints, masks) may need post-processing

## Roadmap

- [ ] Figma API integration (direct export)
- [ ] CSS Grid/Flexbox layout generation
- [ ] Storybook integration
- [ ] Component story generation
- [ ] Design system token extraction
- [ ] Responsive breakpoints support
- [ ] Animation support

## Contributing

Issues, feature requests, and PRs welcome!

## License

MIT

---

**⚡ Turn Figma designs into production React/Vue/Svelte code instantly.**
