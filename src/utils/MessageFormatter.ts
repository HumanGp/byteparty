import { Widgets } from "blessed";

/**
 * Handles wrapping long messages in a Blessed ListElement,
 * accounting for Blessed markup tags {bold}, {cyan-fg}, etc.
 * that do NOT count toward visible width.
 */
export class MessageFormatter {
  private messageList: Widgets.ListElement;
  private prefix: string; // e.g. "{green-fg}{bold}⤷{/bold}{/green-fg} "

  constructor(messageList: Widgets.ListElement, prefix: string = "{green-fg}{bold}⤷{/bold}{/green-fg} ") {
    this.messageList = messageList;
    this.prefix = prefix;
  }

  /**
   * Adds a formatted message to the list, handling wrapping for long lines.
   * @param formattedMessage Full string with Blessed tags, e.g. "{cyan-fg}User{/cyan-fg} [12:34]: hello world"
   */
  public add(formattedMessage: string): void {
    const maxWidth = this.getMaxContentWidth();
    const { plainText, timestampPrefix } = this.extractPlainAndTimestamp(formattedMessage);

    // If it fits on one line → simple add
    if (plainText.length <= maxWidth) {
      this.messageList.addItem(`${this.prefix}${formattedMessage}`);
      this.scrollToBottom();
      return;
    }

    // Otherwise → wrap intelligently
    const lines = this.wrapMessage(formattedMessage, plainText, timestampPrefix, maxWidth);
    lines.forEach((line, index) => {
      if (index === 0) {
        this.messageList.addItem(`${this.prefix}${line}`);
      } else {
        this.messageList.addItem(`   ${line}`); // indentation for continuation lines
      }
    });
    this.scrollToBottom();
  }

  private getMaxContentWidth(): number {
    // messageList.width includes borders/padding — safe estimate
    const listWidth = (this.messageList.width as number) || 80;
    // Leave a small buffer; 130/135 was your magic ratio → ~96% usable
    return Math.floor(listWidth * 0.96);
  }

  /**
   * Strips Blessed tags and extracts timestamp prefix if present.
   */
  private extractPlainAndTimestamp(formatted: string): {
    plainText: string;
    timestampPrefix: string;
  } {
    const tagRegex = /\{[^}]+\}/g;
    const plainText = formatted.replace(tagRegex, "");

    // Detect timestamp like "[12:34:56]" followed by ": "
    const timestampMatch = formatted.match(/\[(\d{1,2}:\d{2}:\d{2}\s?(AM|PM)?)\]/);
    let timestampPrefix = "";

    if (timestampMatch) {
      const idx = timestampMatch.index!;
      const end = idx + timestampMatch[0].length;
      // Include ": " after timestamp if present
      const colonSpace = formatted.substring(end, end + 2) === ": " ? ": " : "";
      timestampPrefix = formatted.substring(0, end + colonSpace.length);
    }

    return { plainText, timestampPrefix };
  }

  /**
   * Wraps a long message into multiple lines, preserving formatting.
   */
  private wrapMessage(
    formatted: string,
    plainText: string,
    timestampPrefix: string,
    maxWidth: number
  ): string[] {
    const messageText = plainText.slice(timestampPrefix.replace(/\{[^}]+\}/g, "").length);
    const prefixPlainLength = this.prefix.replace(/\{[^}]+\}/g, "").length;
    const timestampPlainLength = timestampPrefix.replace(/\{[^}]+\}/g, "").length;

    // Available chars on first line
    const firstLineMax = maxWidth - prefixPlainLength - timestampPlainLength;
    // Available chars on continuation lines
    const continuationMax = maxWidth - 3; // 3 spaces indentation

    const words = messageText.split(/\s+/);
    const lines: string[] = [];

    let currentPlain = "";
    let currentFormatted = timestampPrefix;

    const addLine = (isFirst: boolean) => {
      if (currentPlain.trim()) {
        lines.push(isFirst ? currentFormatted + currentPlain : currentPlain.trimStart());
        currentPlain = "";
        currentFormatted = ""; // only timestamp on first line
      }
    };

    for (const word of words) {
      const testPlain = currentPlain ? `${currentPlain} ${word}` : word;
      const isFirstLine = lines.length === 0;

      if (
        (isFirstLine && testPlain.length <= firstLineMax) ||
        (!isFirstLine && testPlain.length <= continuationMax)
      ) {
        currentPlain = testPlain;
        // Rebuild formatted part only for first line
        if (isFirstLine) {
          const wordStartIdx = plainText.indexOf(word, timestampPrefix.replace(/\{[^}]+\}/g, "").length);
          const relativeStart = wordStartIdx - timestampPrefix.replace(/\{[^}]+\}/g, "").length;
          const formattedWord = this.extractOriginalSubstring(formatted, timestampPrefix, relativeStart, word.length);
          currentFormatted += formattedWord + (currentPlain.endsWith(word) ? "" : " ");
        }
      } else {
        addLine(isFirstLine);
        currentPlain = word;
        if (isFirstLine) {
          const wordStartIdx = plainText.indexOf(word, timestampPrefix.replace(/\{[^}]+\}/g, "").length);
          const relativeStart = wordStartIdx - timestampPrefix.replace(/\{[^}]+\}/g, "").length;
          const formattedWord = this.extractOriginalSubstring(formatted, timestampPrefix, relativeStart, word.length);
          currentFormatted = timestampPrefix + formattedWord;
        }
      }
    }

    // Add final line
    if (currentPlain.trim()) {
      lines.push(lines.length === 0 ? currentFormatted + currentPlain : currentPlain.trimStart());
    }

    return lines;
  }

  /**
   * Extracts the original formatted substring corresponding to a plain-text portion.
   * This is the trickiest part — we walk both strings in parallel, skipping tags.
   */
  private extractOriginalSubstring(
    formatted: string,
    timestampPrefix: string,
    plainStartOffset: number,
    plainLength: number
  ): string {
    let plainIdx = 0;
    let formattedIdx = timestampPrefix.length;
    let extracted = "";

    while (plainIdx < plainStartOffset && formattedIdx < formatted.length) {
      if (formatted[formattedIdx] === "{") {
        // Skip entire tag
        const endTag = formatted.indexOf("}", formattedIdx);
        if (endTag !== -1) {
          formattedIdx = endTag + 1;
          continue;
        }
      }
      plainIdx++;
      formattedIdx++;
    }

    // Now extract `plainLength` visible chars
    let extractedCount = 0;
    while (extractedCount < plainLength && formattedIdx < formatted.length) {
      if (formatted[formattedIdx] === "{") {
        const endTag = formatted.indexOf("}", formattedIdx);
        if (endTag !== -1) {
          extracted += formatted.substring(formattedIdx, endTag + 1);
          formattedIdx = endTag + 1;
          continue;
        }
      }
      extracted += formatted[formattedIdx];
      extractedCount++;
      formattedIdx++;
    }

    return extracted;
  }

  private scrollToBottom(): void {
    this.messageList.setScrollPerc(100);
  }
}
