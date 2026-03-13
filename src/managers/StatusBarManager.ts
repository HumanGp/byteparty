import { Widgets } from "blessed";

export class StatusBarManager {
  private statusBar: Widgets.BoxElement;
  private screen: Widgets.Screen;

  // Data sources
  private connectionStatus: string = "Disconnected";
  private userCount: number = 0;
  private channelCount: number = 0;
  private groupCount: number = 0;
  private messageCount: number = 0;
  private queuedMessages: number = 0;
  private currentFocusName: string = "Input";
  private isModalOpen: boolean = false;
  private isDropdownOpen: boolean = false;

  // Update interval
  private updateInterval?: NodeJS.Timeout;

  constructor(statusBar: Widgets.BoxElement, screen: Widgets.Screen) {
    this.statusBar = statusBar;
    this.screen = screen;
  }

  /**
   * Start automatic updates (time + dynamic info)
   */
  public startUpdates(): void {
    this.update();
    this.updateInterval = setInterval(() => this.update(), 1000);
  }

  public stopUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined!;
    }
  }

  /**
   * Public setters for dynamic data
   */
  public setConnectionStatus(status: string): void {
    this.connectionStatus = status;
    this.update();
  }

  public setCounts(users: number, channels: number, groups: number): void {
    this.userCount = users;
    this.channelCount = channels;
    this.groupCount = groups;
    this.update();
  }

  public setMessageCount(count: number): void {
    this.messageCount = count;
    this.update();
  }

  public setQueuedMessages(count: number): void {
    this.queuedMessages = count;
    this.update();
  }

  public setCurrentFocus(name: string): void {
    this.currentFocusName = name;
    this.update();
  }

  public setModalOpen(open: boolean): void {
    this.isModalOpen = open;
    this.update();
  }

  public setDropdownOpen(open: boolean): void {
    this.isDropdownOpen = open;
    this.update();
  }

  /**
   * Force an immediate update (e.g. after adding a message)
   */
  public update(): void {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    let content = "";

    // Left: Connection
    const connectionColor = this.connectionStatus.includes("Connected")
      ? "{green-fg}●{/green-fg}"
      : this.connectionStatus.includes("Connecting")
      ? "{yellow-fg}●{/yellow-fg}"
      : "{red-fg}●{/red-fg}";
    content += `${connectionColor} {bold}${this.connectionStatus}{/bold}`;

    // Middle: Focus
    content += " | ";
    content += `Focus: {#d4af37-fg}{bold}${this.currentFocusName}{/bold}{/#d4af37-fg}`;

    // Right: Stats
    content += " | ";
    content += `🗣  :${this.userCount} `;
    content += `🕬  :${this.channelCount} `;
    content += `🗫  :${this.groupCount} `;
    content += `| 🕰  :${time}`;
    content += ` | 🗨  :${this.messageCount}`;

    // Indicators
    if (this.queuedMessages > 0) {
      content += ` {yellow-fg}(+${this.queuedMessages} queued){/yellow-fg}`;
    }
    if (this.isModalOpen) {
      content += ` {magenta-fg}[Modal Open]{/magenta-fg}`;
    }
    if (this.isDropdownOpen) {
      content += ` {cyan-fg}[Dropdown]{/cyan-fg}`;
    }

    this.statusBar.setContent(content);
    this.screen.render();
  }

  /**
   * Show a temporary overriding message (e.g. "Refreshing...", alerts)
   */
  public showTemporary(message: string, duration: number = 3000): void {
    const original = this.statusBar.getContent();
    this.statusBar.setContent(`{bold}${message}{/bold}`);
    this.screen.render();

    setTimeout(() => {
      this.statusBar.setContent(original);
      this.update();
    }, duration);
  }

  /**
   * Visual alert flash (e.g. on connection change)
   */
  public alert(color: string = "#d4af37", blinks: number = 3): void {
    let count = 0;
    const originalStyle = { ...this.statusBar.style };

    const flash = () => {
      if (count >= blinks * 2) {
        this.statusBar.style = originalStyle;
        this.update();
        return;
      }

      if (count % 2 === 0) {
        this.statusBar.style.fg = "#2a1f1d";
        this.statusBar.style.bg = color;
      } else {
        this.statusBar.style = originalStyle;
      }
      this.screen.render();
      count++;
      setTimeout(flash, 200);
    };

    flash();
  }
}
