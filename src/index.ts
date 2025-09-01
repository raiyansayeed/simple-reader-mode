/**
 * Simple Reader Mode Library
 * A lightweight alternative to Mozilla's Readability library
 * Can be used in alternative JS environments like React Native
 */

import { parse, HTMLElement } from 'node-html-parser';

export interface ReaderModeOptions {
  minWordCount?: number;
  debug?: boolean;
}

export interface ExtractResult {
  html: string;
  title?: string;
  wordCount: number;
}

export class SimpleReaderMode {
  private static readonly NOISE_SELECTORS = [
    'header',
    'footer',
    'nav',
    'aside',
    '.sidebar',
    '.ad',
    '.promo',
    '.popup',
    '[class*="ad-"]',
    '[id*="ad-"]',
    '.advertisement',
    '.social-share',
    '.comments',
    '.related',
    '.newsletter',
    '.subscription',
    '.cookie-banner',
    '.modal',
    '.overlay',
    'script',
    'style',
    'noscript',
  ];

  private static readonly CANDIDATE_SELECTORS = [
    'article',
    'main',
    '.content',
    '.post',
    '.article-body',
    '.entry-content',
    '.post-content',
    '.story-body',
    '.article-content',
    '[role="main"]',
  ];

  private static readonly MIN_WORD_COUNT = 50;

  /**
   * Remove noise elements from the document
   */
  private static removeNoise(doc: HTMLElement): void {
    this.NOISE_SELECTORS.forEach((selector) => {
      const elements = doc.querySelectorAll(selector);
      elements.forEach((el) => el.remove());
    });
  }

  /**
   * Find the main content block by analyzing word count
   */
  private static findMainBlock(doc: HTMLElement): HTMLElement | null {
    const candidates: HTMLElement[] = [];

    // Collect all candidate elements
    this.CANDIDATE_SELECTORS.forEach((selector) => {
      const element = doc.querySelector(selector);
      if (element) {
        candidates.push(element);
      }
    });

    // Filter candidates by minimum word count
    const validCandidates = candidates.filter((el) => {
      const text = el.textContent?.trim() || '';
      const wordCount = text.split(/\s+/).filter((word: string) => word.length > 0).length;
      return wordCount > this.MIN_WORD_COUNT;
    });

    if (validCandidates.length === 0) {
      // Fallback: look for any div with substantial text content
      const divs = Array.from(doc.querySelectorAll('div'));
      const substantialDivs = divs.filter((div) => {
        const text = div.textContent?.trim() || '';
        const wordCount = text.split(/\s+/).filter((word: string) => word.length > 0).length;
        return wordCount > this.MIN_WORD_COUNT;
      });

      if (substantialDivs.length === 0) return null;

      // Sort by text length and return the largest
      substantialDivs.sort((a, b) => {
        const aText = a.textContent?.length || 0;
        const bText = b.textContent?.length || 0;
        return bText - aText;
      });

      return substantialDivs[0];
    }

    // Sort by text length and return the largest candidate
    validCandidates.sort((a, b) => {
      const aText = a.textContent?.length || 0;
      const bText = b.textContent?.length || 0;
      return bText - aText;
    });

    return validCandidates[0];
  }

  /**
   * Wrap content with minimal CSS for readable formatting
   */
  private static wrapWithCss(innerHtml: string, title?: string): string {
    const titleHtml = title ? `<h1 class="article-title">${title}</h1>` : '';

    return `
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
              font-size: 18px; 
              line-height: 1.6; 
              max-width: 800px;
              margin: 0 auto;
              word-wrap: break-word;
            }
            img { 
              max-width: 100%; 
              height: auto; 
              display: block; 
              margin: 16px auto; 
              border-radius: 8px;
            }
            h1, h2, h3, h4, h5, h6 { 
              margin-top: 1.2em; 
              margin-bottom: 0.6em; 
              font-weight: bold; 
              line-height: 1.3;
            }
            h1 { font-size: 2em; }
            h2 { font-size: 1.5em; }
            h3 { font-size: 1.25em; }
            p { 
              margin-bottom: 16px; 
              text-align: justify;
            }
            a { 
              color: #007AFF; 
              text-decoration: underline; 
            }
            blockquote {
              border-left: 4px solid #007AFF;
              padding: 12px 16px;
              margin: 16px 0;
              background-color: #f8f9fa;
              border-radius: 4px;
              font-style: italic;
            }
            pre, code {
              background-color: #f8f9fa;
              border-radius: 4px;
              font-family: 'Courier New', monospace;
            }
            pre {
              padding: 12px;
              overflow-x: auto;
              margin: 16px 0;
            }
            code {
              padding: 2px 6px;
            }
            ul, ol {
              padding-left: 24px;
              margin-bottom: 16px;
            }
            li {
              margin-bottom: 8px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0;
            }
            th, td {
              padding: 8px;
              border: 1px solid #ddd;
              text-align: left;
            }
            th {
              background-color: #f8f9fa;
              font-weight: bold;
            }
            .article-title {
              font-size: 2.2em;
              margin-bottom: 24px;
              line-height: 1.2;
              color: #1a1a1a;
            }
            .article-content {
              max-width: 100%;
            }
            figure {
              margin: 16px 0;
              text-align: center;
            }
            figcaption {
              font-size: 0.9em;
              color: #666;
              margin-top: 8px;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          ${titleHtml}
          <div class="article-content">
            ${innerHtml}
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Extract readable content from HTML string
   */
  public static extract(htmlContent: string, _options: ReaderModeOptions = {}): ExtractResult {
    // Create a DOM parser
    const doc = parse(htmlContent);

    // Extract title from the document
    const titleElement = doc.querySelector('title');
    const title = titleElement?.textContent?.trim();

    // Step 1: Remove noise
    this.removeNoise(doc);

    // Step 2: Find main content block
    const mainBlock = this.findMainBlock(doc);

    let finalHtml: string;
    let wordCount = 0;

    if (mainBlock) {
      finalHtml = this.wrapWithCss(mainBlock.innerHTML, title);
      const text = mainBlock.textContent?.trim() || '';
      wordCount = text.split(/\s+/).filter((word: string) => word.length > 0).length;
    } else {
      // Fallback: use body content
      const bodyElement = doc.querySelector('body');
      const bodyContent = bodyElement?.innerHTML || doc.innerHTML;
      finalHtml = this.wrapWithCss(bodyContent, title);
      const text = bodyElement?.textContent?.trim() || doc.textContent?.trim() || '';
      wordCount = text.split(/\s+/).filter((word: string) => word.length > 0).length;
    }

    return {
      html: finalHtml,
      title,
      wordCount,
    };
  }

  /**
   * Fetch and extract readable content from a URL
   */
  public static async extractFromUrl(
    url: string,
    options: ReaderModeOptions = {}
  ): Promise<ExtractResult> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const htmlContent = await response.text();
      return this.extract(htmlContent, options);
    } catch (error) {
      throw new Error(
        `Failed to fetch content from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

// Export convenience functions
export function extract(html: string, options?: ReaderModeOptions): ExtractResult {
  return SimpleReaderMode.extract(html, options);
}

export async function extractFromUrl(url: string, options?: ReaderModeOptions): Promise<ExtractResult> {
  return SimpleReaderMode.extractFromUrl(url, options);
}

// Default export
export default SimpleReaderMode;