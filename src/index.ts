import type { AstroConfig, AstroIntegration } from 'astro';
import AutoImport from 'astro-auto-import';
import remarkDirective from 'remark-directive';

import createEmbedPlugin from './remark-plugin.ts';

const importNamespace = 'AuToImPoRtEdAstroCusToMEmbed';

/**
 * Embeds can be triggered by a single URL or a directive.
 */
export type EmbedsOption = {
    componentName: string;

	/**
	 * path to import component from (default is 'src/components/embeds')
	 */
    importPath?: string;

    /**
     * for matching single urls on a single line
	 * function that should return a string with the argument to pass to the component or undefined if it doesn't match
     * 
     * @param url 
     * @returns
     */
    urlMatcher?: (url: string) => string | undefined | null;

    /**
     * what argument to pass the url as to the component (default is 'href')
     */
    urlArgument?: string;

    /**
     * for matching a directive, name of the directive, can also be an array of names
     * 
     * @param directive 
     * @returns 
     */
    directiveName?: string | string[];
}

/**
 * Astro embed MDX integration.
 */
export default function customEmbeds({
	embeds = [],
}: {
	embeds?: EmbedsOption[]
} = {}) {
	const AstroCustomEmbeds: AstroIntegration = {
		name: 'astro-custom-embeds',
		hooks: {
			'astro:config:setup': ({ config, updateConfig }) => {
				checkIntegrationsOrder(config);
				updateConfig({
					markdown: {
						remarkPlugins: [
                            remarkDirective,
							createEmbedPlugin({ embeds, importNamespace }),
						],
					},
				});
			},
		},
	};

	const imports: Record<string, [string, string][]> = {};

	for(const embed of embeds) {
		let importPath = embed.importPath ?? 'src/components/embeds';

		if(!imports[importPath]) {
			imports[importPath] = [];
		}

		imports[importPath].push([embed.componentName, importNamespace + '_' + embed.componentName]);
	}


	return [
		AutoImport({
			imports: [
				imports
			],
		}),
		AstroCustomEmbeds,
	];
}

function checkIntegrationsOrder({ integrations }: AstroConfig) {
	const indexOf = (name: string) =>
		integrations.findIndex((i) => i.name === name);
	const mdxIndex = indexOf('@astrojs/mdx');
	const embedIndex = indexOf('astro-custom-embeds');

	if (mdxIndex > -1 && mdxIndex < embedIndex) {
		throw new Error(
			'MDX integration configured before astro-custom-embeds.\n' +
				'Please move `mdx()` after `customEmbeds()` in the `integrations` array in astro.config.ts.'
		);
	}
}