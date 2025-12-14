import * as blessed from "blessed";
import { Widgets } from "blessed";
import { headerProps, loadingScreenProps } from "../components/UI/ui";

export class BootAnimation {
  private screen: Widgets.Screen;
  private onComplete: () => void;

  // Elements
  private loadingScreen!: Widgets.BoxElement;
  private header!: Widgets.BoxElement;

  // Typewriter state
  private bannerLines = [
    "  ________          _____       ________                 _____         ",
    " ___  __ )_____  ____  /______ ___  __ \\______ ___________  /______  __",
    " __  __  |__  / / /_  __/_  _ \\__  /_/ /_  __ \\`/__  ___/_  __/__  / / /",
    " _  /_/ / _  /_/ / / /_  /  __/_  ____/ / /_/ / _  /    / /_  _  /_/ / ",
    " /_____/  _\\__, /  \\__/  \\___/ /_/      \\__,_/  /_/     \\__/  _\\__, /  ",
    "         /____/                                              /____/   ",
    "                         T H E   C H A T   T H A T   B Y T E S !      ",
  ];

  private logoAscii = [
    "     ███ █████   █████ █████ █████    █████████  ███████████  ███████████ ███      ",
    "    ██░ ░░███   ░░███ ░░███ ░░███    ███░░░░░███░░███░░░░░███░█░░░███░░░█░░░███    ",
    "   ██    ░███    ░███  ░███  ░███ █ ███     ░░░  ░███    ░███░   ░███  ░   ░░░███  ",
    " ███     ░███████████  ░███████████░███          ░██████████     ░███        ░░░███",
    "░░░██    ░███░░░░░███  ░░░░░░░███░█░███    █████ ░███░░░░░░      ░███         ███░ ",
    "  ░░██   ░███    ░███        ░███░ ░░███  ░░███  ░███            ░███       ███░   ",
    "   ░░███ █████   █████       █████  ░░█████████  █████           █████    ███░     ",
    "    ░░░ ░░░░░   ░░░░░       ░░░░░    ░░░░░░░░░  ░░░░░           ░░░░░    ░░░       ",
  ].map((line) => {
    const leadingMatch = line.match(/^\s*/);
    if (!leadingMatch) return line;
    const leading = leadingMatch[0].replace(/ /g, "\u00A0");
    return leading + line.slice(leadingMatch[0].length);
  });

  private currentLine = 0;
  private currentChar = 0;
  private typingSpeed = 10; // ms
  private isTyping = false;

  constructor(screen: Widgets.Screen, onComplete: () => void) {
    this.screen = screen;
    this.onComplete = onComplete;
  }

  public start(): void {
    this.createLoadingScreen();
    this.screen.append(this.loadingScreen);
    this.screen.render();

    // Start typewriter after logo has been visible for a bit
    setTimeout(() => {
      this.fadeOutLoadingScreen(() => {
        this.createHeader();
        this.screen.append(this.header);
        this.screen.render();
        this.typeNextLine();
      });
    }, 5000);
  }

  private createLoadingScreen(): void {
    this.loadingScreen = blessed.box({
      ...loadingScreenProps,
      content: this.getCenteredLogo(),
      style: {
        ...loadingScreenProps.style,
        bg: this.getGradientBackground(),
      },
    });
  }

  private getCenteredLogo(): string {
    const width = this.screen.width as number;
    const height = this.screen.height as number;
    const asciiHeight = this.logoAscii.length;

    const verticalPadding = Math.max(
      0,
      Math.floor((height - asciiHeight - 8) / 2)
    );
    let content = "\n".repeat(verticalPadding);

    this.logoAscii.forEach((line) => {
      const padding = Math.max(0, Math.floor((width - line.length) / 2));
      content +=
        " ".repeat(padding) + "{#ff6b6b-fg}" + line + "{/#ff6b6b-fg}\n";
    });

    content += "\n";
    const poweredByLines = [
      "╔══════════════════════════════════════════════════════════════════╗",
      "║                    powered by HumanGpt                           ║",
      "╚══════════════════════════════════════════════════════════════════╝",
    ];

    const boxWidth = 70;
    const boxPadding = Math.max(0, Math.floor((width - boxWidth) / 2));
    poweredByLines.forEach((line) => {
      content +=
        " ".repeat(boxPadding) + "{#a08c76-fg}" + line + "{/#a08c76-fg}\n";
    });

    const remaining =
      height - verticalPadding - asciiHeight - 7 - poweredByLines.length;
    content += "\n".repeat(Math.max(0, remaining));

    return content;
  }

  private fadeOutLoadingScreen(callback: () => void): void {
    let step = 0;
    const steps = 10;
    const interval = setInterval(() => {
      const opacity = 1 - step / steps;
      const fg = this.interpolateColor("#ff6b6b", "#1a1a1a", opacity);
      const bg = this.interpolateColor("#1a1a1a", "#000000", opacity);

      this.loadingScreen.style.fg = fg;
      this.loadingScreen.style.bg = bg;
      this.screen.render();

      step++;
      if (step > steps) {
        clearInterval(interval);
        this.loadingScreen.detach();
        callback();
      }
    }, 50);
  }

  private interpolateColor(
    color1: string,
    color2: string,
    factor: number
  ): string {
    const parse = (hex: string) => {
      const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return res
        ? {
            r: parseInt(res[1]!, 16),
            g: parseInt(res[2]!, 16),
            b: parseInt(res[3]!, 16),
          }
        : { r: 0, g: 0, b: 0 };
    };

    const c1 = parse(color1);
    const c2 = parse(color2);
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  private createHeader(): void {
    this.header = blessed.box({
      ...headerProps,
    });
  }

  private typeNextLine(): void {
    if (this.currentLine >= this.bannerLines.length) {
      this.isTyping = false;
      setTimeout(() => this.onComplete(), 800);
      return;
    }

    const line = this.bannerLines[this.currentLine];
    this.currentChar = 0;
    this.typeCharacter(line!);
  }

  private typeCharacter(line: string): void {
    if (this.currentChar >= line.length) {
      this.currentLine++;
      this.showCursorBlink(() => {
        setTimeout(() => this.typeNextLine(), 100);
      });
      return;
    }

    const linesSoFar =
      this.bannerLines.slice(0, this.currentLine).join("\n") + "\n";
    const currentProgress = line.substring(0, this.currentChar + 1);
    this.header.setContent(
      linesSoFar + currentProgress + "{#d4af37-fg}_{/#d4af37-fg}"
    );

    this.screen.render();
    this.currentChar++;

    setTimeout(() => this.typeCharacter(line), this.typingSpeed);
  }

  private showCursorBlink(callback: () => void): void {
    let blinks = 0;
    const max = 6;
    const speed = 200;

    const blink = () => {
      if (blinks >= max) {
        const finalContent = this.bannerLines
          .slice(0, this.currentLine + 1)
          .join("\n");
        this.header.setContent(finalContent);
        this.screen.render();
        callback();
        return;
      }

      const base = this.bannerLines.slice(0, this.currentLine + 1).join("\n");
      this.header.setContent(
        blinks % 2 === 0 ? base + "{#d4af37-fg}_{/#d4af37-fg}" : base
      );
      this.screen.render();
      blinks++;
      setTimeout(blink, speed);
    };

    blink();
  }

  private getGradientBackground(): string {
    const gradientColors = [
      "#0a0a0a",
      "#0f0f0f",
      "#141414",
      "#191919",
      "#1e1e1e",
      "#232323",
      "#282828",
      "#2d2d2d",
    ];

    return "#1a1a1a";
  }
}
