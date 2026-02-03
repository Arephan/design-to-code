import axios from 'axios';

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  visible?: boolean;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fills?: Array<{ type: string; color?: { r: number; g: number; b: number; a: number } }>;
  strokes?: Array<{ type: string; color?: { r: number; g: number; b: number; a: number } }>;
  strokeWeight?: number;
  cornerRadius?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  textContent?: string;
  children?: FigmaNode[];
}

export interface FigmaFile {
  id: string;
  name: string;
  nodes: FigmaNode[];
  componentCount: number;
  frameCount: number;
  raw?: any;
}

export async function fetchFigmaFile(urlOrId: string, token: string): Promise<FigmaFile | null> {
  try {
    // Extract file ID from URL or use directly
    const fileId = extractFileId(urlOrId);

    const response = await axios.get(
      `https://api.figma.com/v1/files/${fileId}`,
      {
        headers: {
          'X-Figma-Token': token,
          'Content-Type': 'application/json',
        },
      }
    );

    const { document, name } = response.data;

    // Walk the document tree and extract components/frames
    const nodes: FigmaNode[] = [];
    const componentCount = countComponentsInNode(document);
    const frameCount = countFramesInNode(document);

    walkFigmaTree(document, nodes);

    return {
      id: fileId,
      name,
      nodes,
      componentCount,
      frameCount,
      raw: document,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Invalid Figma token. Check your API credentials.');
      }
      if (error.response?.status === 404) {
        throw new Error('Figma file not found. Check the file ID or URL.');
      }
    }
    throw error;
  }
}

function extractFileId(urlOrId: string): string {
  // Handle Figma URL format: https://figma.com/file/{ID}/...
  const match = urlOrId.match(/\/file\/([a-zA-Z0-9]+)\//);
  if (match) {
    return match[1];
  }
  // Otherwise assume it's already an ID
  return urlOrId;
}

function walkFigmaTree(node: FigmaNode, result: FigmaNode[]) {
  if (node.visible === false) return;

  if (node.type === 'COMPONENT' || node.type === 'FRAME') {
    result.push(node);
  }

  if (node.children) {
    for (const child of node.children) {
      walkFigmaTree(child, result);
    }
  }
}

function countComponentsInNode(node: FigmaNode): number {
  let count = node.type === 'COMPONENT' ? 1 : 0;
  if (node.children) {
    for (const child of node.children) {
      count += countComponentsInNode(child);
    }
  }
  return count;
}

function countFramesInNode(node: FigmaNode): number {
  let count = node.type === 'FRAME' ? 1 : 0;
  if (node.children) {
    for (const child of node.children) {
      count += countFramesInNode(child);
    }
  }
  return count;
}

// Stub for potential future Anthropic integration
export async function generateComponentCode(
  node: FigmaNode,
  framework: string,
  apiKey: string
): Promise<string> {
  // This would integrate with Claude API for intelligent code generation
  // For now, return a basic template
  return `// Generated from: ${node.name}
export const ${toPascalCase(node.name)} = () => {
  return <div>{/* Component */}</div>;
};`;
}

function toPascalCase(str: string): string {
  return str
    .split(/[\s\-_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}
