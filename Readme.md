# Astro Custom Embeds Integration

This Astro integration allows you to easily add custom embeds that replace URLs (or directives) in `mdx` files with your custom components.

So for example you can replace a YouTube URL with an embedded youtube player, or a Twitter URL with an embedded tweet.

This integration is based on the [astro-embed](https://github.com/delucis/astro-embed) integration by delucis, with the ability to easily add your own custom embeds (and the option to use directives).

> [!WARNING]
> This integration is still in early development and might have some bugs or might change in the future.

## Installation

First, install the integration via npm:

```bash
npm install astro-custom-embeds
```

## Configure

To use the custom embeds integration, add it to your `astro.config.ts` file (**BEFORE** the `mdx` integration):

```ts
import { defineConfig } from 'astro/config';
import customEmbeds from 'astro-custom-embeds';

export default defineConfig({
    integrations: [customEmbeds( ...options ), mdx()],
});
```

The `customEmbeds` function takes an options object with the following properties:

```ts
{
    embeds: [{
        componentName: string;

        /**
         * path to import component from (default is 'src/components/embeds')
         */
        importPath?: string;

        /**
         * for matching single urls on a single line
         * function that should return a string with the argument to pass to the component or undefined if it doesn't match
         */
        urlMatcher?: (url: string) => string | undefined;

        /**
         * what argument to pass the matched part of the url as to the component (default is 'href')
         */
        urlArgument?: string;

        /**
         * for matching a directive, name of the directive, can also be an array of names
         */
        directiveName?: string | string[];
    }]
}
```

so for example, to replace YouTube URLs with a youtube embed, you could install [`astro-embed`](https://github.com/delucis/astro-embed) and then change your `astro.config.ts` to:

```ts
// returns id of youtube video url or undefined if it's not a youtube url
import youtubeMatcher from '@astro-community/astro-embed-youtube/matcher';
import customEmbeds from 'astro-custom-embeds';

// https://astro.build/config
export default defineConfig({
  integrations: [customEmbeds({
    embeds: [
      {
        componentName: 'YouTube',
        urlArgument: 'id',
        urlMatcher: youtubeMatcher,
        importPath: 'astro-embed',
        directiveName: 'youtube'
      }
    ]
  }), mdx()],
});
```

## Usage

In your `mdx` files you can add a YouTube video by just adding a youtube link (as long as it's on its own line):

```md

https://www.youtube.com/watch?v=dQw4w9WgXcQ

```

Or you can use the `youtube` directive:

```md

:youtube[https://www.youtube.com/watch?v=dQw4w9WgXcQ]

```

## Making your own custom embeds

To make your own custom embeds, you need first a function that takes a URL and returns the argument to pass to the component, or `undefined` if it doesn't match (e.g. by using a regex).

For a simple example, here's a function that matches all `https://` URLs:

```ts
// src/components/urlMatcher.ts
export default function urlMatcher(url: string): string | undefined {
    if (url.startsWith('https://')) {
        return url;
    }
    return undefined;
}
```

And a component that renders this URL:

```astro
---
// src/components/Link.astro
const { href } = Astro.props;
---

<a {href}>Click me!</a>
```

You also need to export this component as a named export, recommend is having a `embeds.ts` file in your `src/components` folder, where you export all your embeds:

```ts
// src/components/embeds.ts
export { default as Link } from './Link.astro';
```

Then you can use this in your `astro.config.ts`:

```ts
import urlMatcher from './src/components/urlMatcher';
import customEmbeds from 'astro-custom-embeds';

export default defineConfig({
    integrations: [customEmbeds({
        embeds: [
            {
                componentName: 'Link',
                urlArgument: 'href', // this is the default
                urlMatcher,
                importPath: 'src/components/embeds', // this is the default
            }
        ]
    }), mdx()],
});
```

Now all paragraphs with just one link in your `mdx` files will be replaced with the `Link` component.

### Notes

- all components must be exported as named exports, so for example these options **WOULD NOT** work:

```ts
{
    componentName: 'Link',
    urlArgument: 'href',
    urlMatcher,
    importPath: 'src/components/Link.astro',
}
```

- embeds will process in the order they are defined in the `embeds` array, so if you have multiple embeds that could match the same URL, the first one will be used (so a general URL matcher should always be the last one)

## License

MIT
