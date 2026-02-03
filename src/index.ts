export { convertFigmaToCode, type ConversionResult } from './converter.js';
export { fetchFigmaFile, type FigmaFile, type FigmaNode } from './figma-client.js';

export default {
  version: '1.0.0',
  name: 'design-to-code',
  description: 'Convert Figma designs to clean React/Vue/Svelte code',
};
