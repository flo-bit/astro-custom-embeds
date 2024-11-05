import { type Node, select, selectAll, } from 'unist-util-select';
import { visit } from 'unist-util-visit'
import type { EmbedsOption } from '.';

export default function createPlugin({ embeds = [], importNamespace }: { embeds: EmbedsOption[], importNamespace: string }) {
    /**
     * Get the name of the embed component for this URL
     * @param {string} url URL to test
     * @returns Component node for this URL or undefined if none matched
     */
    function getComponentForUrl(url: string) {
        for (const embed of embeds) {
            const { componentName, urlArgument = 'href', urlMatcher } = embed;

            if (!urlMatcher) continue;

            let match = urlMatcher(url);

            if (!match) continue;

            // MDX custom component node.
            return {
                type: 'mdxJsxFlowElement',
                name: `${importNamespace}_${componentName}`,
                attributes: [{ type: 'mdxJsxAttribute', name: urlArgument, value: match }],
                children: [],
            };
        }
        return undefined;
    }

    function getComponentForDirective(node: Node) {
        for (const embed of embeds) {
            const { componentName, urlArgument = 'href', directiveName } = embed;

            // @ts-expect-error
            if (!directiveName || !node.name) continue;

            // @ts-expect-error
            if (directiveName === node.name || (Array.isArray(directiveName) && directiveName.includes(node.name))) {
                // get attributes from node
                // @ts-expect-error
                const attributes = node.attributes ?? {};

                // turn into array
                const attributeArray = Object.keys(attributes).map((key) => {
                    return { type: 'mdxJsxAttribute', name: key, value: attributes[key] }
                });

                // if there's one child and it's either a link node with a text node child or a text node
                // add that as a attribute using the urlArgument
                // @ts-expect-error
                if (node.children && node.children.length === 1) {
                    // @ts-expect-error
                    const child = node.children[0];
                    if (child.type === 'link') {
                        if (child.children.length === 1 && child.children[0].type === 'text') {
                            attributeArray.push({ type: 'mdxJsxAttribute', name: urlArgument, value: child.url });
                        }
                    } else if (child.type === 'text') {
                        attributeArray.push({ type: 'mdxJsxAttribute', name: urlArgument, value: child.value });
                    }
                }

                return {
                    type: 'mdxJsxFlowElement',
                    name: `${importNamespace}_${componentName}`,
                    attributes: attributeArray,
                    children: [],
                };
            }
        }
        return undefined
    }

    type Link = Node & {
        url?: string;
        value?: string;
        children?: Node[];
    };

    function transformer(tree: Node) {
        visit(tree, function (node) {
            if (
                node.type === 'containerDirective' ||
                node.type === 'leafDirective' ||
                node.type === 'textDirective'
            ) {
                let component = getComponentForDirective(node);
                if (component) {
                    // @ts-expect-error We’re overriding the initial node type with arbitrary data.
                    for (const key in component) node[key] = component[key];
                }
            }
        });

        const paragraphs = selectAll('paragraph', tree);
        paragraphs.forEach((paragraph) => {
            const link: Link | null = select(':scope > link:only-child', paragraph);
            if (!link) return;

            const { url, children } = link;
            // We’re only interested in HTTP links
            if (!url || !url.startsWith('http')) return;
            // URLs should have a single child
            if (!children || children.length !== 1) return;

            // The child should be a text node with a value matching the URL
            const child = children[0];
            if (
                !child ||
                child.type !== 'text' ||
                !('value' in child) ||
                child.value !== url
            ) {
                return;
            }

            const component = getComponentForUrl(url);
            if (component) {
                // @ts-expect-error We’re overriding the initial node type with arbitrary data.
                for (const key in component) paragraph[key] = component[key];
            }
        });

        return tree;
    }

    return function attacher() {
        return transformer;
    };
}