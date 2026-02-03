# Design to Code 🎨→💻

Convert Figma designs to clean, production-ready React, Vue, or Svelte components. **Not screenshots. Real code.**

## Features

✨ **Multi-Framework Support**
- React (JSX)
- Vue 3 (SFC)
- Svelte (Reactive)

🎯 **Smart Component Generation**
- Figma components → type-safe React/Vue/Svelte components
- Automatic prop extraction from design patterns
- Responsive sizing from Figma layouts
- Text layers become real text (not images)

⚡ **Production-Ready Output**
- Clean, readable code
- TypeScript support
- Component index for easy imports
- No bundle bloat

🔗 **Figma API Integration**
- Direct API access (no screenshot conversion)
- Supports components, frames, and groups
- Respects visibility and naming

## Installation

```bash
npm install -g design-to-code
# or
npm install design-to-code
```

## Quick Start

### 1. Get a Figma API Token

1. Go to [Figma Settings](https://www.figma.com/settings/credentials)
2. Create a **Personal access token**
3. Copy it to your environment: `export FIGMA_TOKEN=your_token_here`

### 2. Convert a Design

```bash
d2c --figma https://figma.com/file/abc123/MyDesign --framework react
```

**Output:** `components/` directory with React components

### 3. Import and Use

```tsx
import { Button, Card, Header } from './components';

export default function App() {
  return (
    <div>
      <Header />
      <Card>
        <Button>Click me</Button>
      </Card>
    </div>
  );
}
```

## Usage

### CLI Options

```bash
d2c --help

# Required
--figma <url|id>     Figma file URL or file ID

# Optional
-r, --framework      Target: react (default), vue, svelte
-t, --token          Figma API token (default: FIGMA_TOKEN env)
-o, --output         Output directory (default: ./components)

# Examples
d2c --figma https://figma.com/file/abc123/Design --framework react
d2c -f abc123 -r vue -o ./src/components
FIGMA_TOKEN=token d2c --figma abc123 --framework svelte
```

### Programmatic API

```typescript
import { fetchFigmaFile, convertFigmaToCode } from 'design-to-code';

const figmaData = await fetchFigmaFile('abc123', 'figma_token');
const result = await convertFigmaToCode(figmaData, 'react');

// result.components: { 'Button.tsx': '...', 'Card.tsx': '...' }
// result.index: 'export { Button } from ...'
```

## How It Works

### 1. **Figma API Fetch**
   - Pulls file structure directly from Figma API
   - Extracts components, frames, and layout information
   - No need to export images or screenshots

### 2. **Smart Component Detection**
   - Identifies Figma components and frames
   - Extracts sizing, colors, typography
   - Recognizes text layers as real content

### 3. **Code Generation**
   - Converts design elements to HTML/CSS
   - Adds TypeScript types for props
   - Creates framework-specific syntax (React/Vue/Svelte)

### 4. **Output**
   - One file per Figma component
   - Auto-generated index file
   - Ready to use in your project

## Examples

### React Component

**Input:** Figma component named "Button"

**Output:** `Button.tsx`
```tsx
import React from 'react';

interface ButtonProps {
  label?: string;
  variant?: string;
}

export const Button: React.FC<ButtonProps> = ({ label, variant }) => {
  return (
    <div style={{ width: 120px; height: 48px; }}>
      {label || 'Button'}
    </div>
  );
};

export default Button;
```

### Vue Component

**Input:** Same Figma component

**Output:** `Button.tsx`
```vue
<template>
  <div style="width: 120px; height: 48px;">
    {{ label || 'Button' }}
  </div>
</template>

<script>
export default {
  name: 'Button',
  props: {
    label: String,
    variant: String,
  },
};
</script>

<style scoped>
div {
  box-sizing: border-box;
}
</style>
```

### Svelte Component

**Input:** Same Figma component

**Output:** `Button.tsx`
```svelte
<script>
  export let label;
  export let variant;
</script>

<div style="width: 120px; height: 48px;">
  {label || 'Button'}
</div>

<style>
  div {
    box-sizing: border-box;
  }
</style>
```

## Workflow

1. **Design in Figma** — Create components and frames
2. **Convert** — Run `d2c --figma <url> --framework react`
3. **Customize** — Enhance with interactivity and styling
4. **Ship** — Use components in your app

## Pro Tips

### 🎯 Naming Conventions
Use clear names in Figma:
- ✅ `Button`, `Card`, `HeaderNav`
- ❌ `Frame 1`, `Group 2`, `Component copy`

### 🔗 Template Variables
Use `${variableName}` in text layers to extract props:

**Figma text:** `"Hello, ${userName}"`

**Generated prop:** `userName?: string`

### 📦 Component Organization
- One Figma file per design system
- Use frames for page-level layouts
- Use components for reusable UI elements

### 🎨 Colors & Styling
- Extract Figma fills → CSS background colors
- Extract strokes → CSS borders
- Font sizes and families → CSS properties

## Limitations & Future

### Current
- ✅ Text, rectangles, groups, components
- ✅ Sizing and positioning
- ✅ Basic color extraction

### Coming Soon
- 🚧 Advanced styling (shadows, gradients, effects)
- 🚧 Image layers (optimized export)
- 🚧 Figma interactions → React state
- 🚧 Tailwind CSS generation
- 🚧 Storybook integration

## API Key Storage

### Recommended (Secure)
```bash
# Add to ~/.bashrc or ~/.zshrc
export FIGMA_TOKEN='figd_...'
```

### Alternative (CLI)
```bash
d2c --figma abc123 --token figd_...
```

### Never
```bash
# Don't commit to git!
# Don't hardcode in source
```

## Troubleshooting

### "Invalid Figma token"
- Check token at https://figma.com/settings/credentials
- Ensure it has API access enabled
- Recreate if necessary

### "File not found"
- Verify file ID/URL is correct
- Check that file is shared/accessible
- Ensure token has read access

### Missing components
- Check that Figma file has named components
- Verify components aren't hidden
- Ensure proper naming (no special chars)

## Contributing

Found a bug? Want a feature?

```bash
git clone https://github.com/Arephan/design-to-code
cd design-to-code
npm install
npm run dev -- --help
```

## License

MIT — Use freely in personal and commercial projects.

## See Also

- **Figma API**: https://www.figma.com/developers/api
- **React**: https://react.dev
- **Vue**: https://vuejs.org
- **Svelte**: https://svelte.dev

---

**Made with ❤️ by Arephan**

Save hours converting designs. Generate clean code. Ship faster.
