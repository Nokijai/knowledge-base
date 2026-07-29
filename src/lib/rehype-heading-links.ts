/**
 * Rehype plugin: adds anchor links (permalink) to h2/h3 headings.
 * The heading text is wrapped in a link target for sharing.
 */

import type { Root, Element, ElementContent } from 'hast';
import { visit } from 'unist-util-visit';

export default function rehypeHeadingLinks() {
  return (tree: Root) => {
    visit(tree, 'element', (node, _index, parent) => {
      if (!['h2', 'h3'].includes(node.tagName)) return;
      if (!parent) return;

      const id = node.properties?.id;
      if (!id || typeof id !== 'string') return;

      // Append a permalink anchor inside the heading
      const anchor: Element = {
        type: 'element',
        tagName: 'a',
        properties: {
          href: `#${id}`,
          className: ['heading-link'],
          ariaHidden: 'true',
        },
        children: [
          {
            type: 'element',
            tagName: 'span',
            properties: { className: ['heading-link-icon'] },
            children: [{ type: 'text', value: '#' }],
          } as Element,
        ],
      };

      node.children.push(anchor as ElementContent);
    });
  };
}