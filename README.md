# Simple Reader Mode

A lightweight TypeScript library for extracting readable content from web pages. This is a simple alternative to Mozilla's Readability library without dependency on jsdom, making it suitable for use in alternative JavaScript environments like React Native.

![Reader mode example](./docs/assets/reader_mode_example.png)

## Features

- 🚀 Lightweight and fast
- 📱 Works in React Native and other non-browser environments
- 🎯 Smart content extraction with noise removal
- 💅 Beautiful default styling for extracted content
- 🔧 TypeScript support with full type definitions
- 🌐 URL fetching support with proper user agent

## Installation

```bash
npm install simple-reader-mode
# or
yarn add simple-reader-mode
# or
pnpm add simple-reader-mode
```

## Usage

### Basic Usage

```typescript
import { extract } from 'simple-reader-mode';

// Extract content from HTML string
const htmlContent = '<html>...</html>';
const result = extract(htmlContent);

console.log(result.html);     
console.log(result.title);    
console.log(result.wordCount);
```

### Extract from URL

```typescript
import { extractFromUrl } from 'simple-reader-mode';

// Fetch and extract content from a URL
const url = 'https://example.com/article';
const result = await extractFromUrl(url);

console.log(result.html);
console.log(result.title);
console.log(result.wordCount);
```


## React Native Usage

This library works seamlessly in React Native projects:

```typescript
import { extractFromUrl } from 'simple-reader-mode';
import { WebView } from 'react-native-webview';

const ArticleReader = ({ url }) => {
  const [content, setContent] = useState('');

  useEffect(() => {
    extractFromUrl(url).then(result => {
      setContent(result.html);
    });
  }, [url]);

  return <WebView source={{ html: content }} />;
};
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file for details.