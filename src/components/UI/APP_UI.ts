import * as blessed from 'blessed';
import { Widgets } from "blessed";
import { menuConfig_props, modalContent_config, onlineusersConfig_props } from "./configs";
import {
  headerProps,
  inputBoxProps,
  loadingScreenProps,
  MenuModalOptionListProps,
  MenuModalProps,
  MenuModalTitleBoxProps,
  menuProps,
  messageBoxProps,
  ModalFooterProps,
  ModalProps,
  ModalTitleBoxProps,
  screenProps,
  statusBarProps,
  userDropdownProps,
  userListProps,
} from"./ui";    

interface InfoModalProps {
  title: string;
  content: string;
  height: number;
  width: number;
}

type MenuModalType = "key-binds" | "servers" | "region" | "help";

export class APP_UI {
  private static instance: APP_UI | null = null;

  // UI elements
  public screen!: Widgets.Screen;
  public messageList!: Widgets.ListElement;
  public userList!: Widgets.ListElement;
  public inputBox!: Widgets.TextboxElement;
  public header!: Widgets.BoxElement;
  public messageBoxWidth!: number;
  public menuBar!: Widgets.ListbarElement;
  public statusBar!: Widgets.BoxElement;
  private statusUpdateInterval: NodeJS.Timeout | null = null;
  private statusInfo: {
    focus: string;
    users: number;
    channels: number;
    groups: number;
    connection: string;
    time: string;
  } = {
    focus: "Input",
    users: 0,
    channels: 0,
    groups: 0,
    connection: "Disconnected",
    time: "",
  };
  public userDropdown!: Widgets.ListElement;

  private onBootComplete: (() => void) | null = null;
  private messageQueue: string[] = [];

  // keyboard shortcuts
  private shortcuts = new Map<string, () => void>();
  private focusCycle: any[] = [];
  private currentFocusIndex = 0;
  private isModalOpen = false;

  // menu , modals and dropdown hidden menu
  private activeModal: Widgets.BoxElement | null = null;
  private menuActions: Map<string, () => void> = new Map();
  private activeDropdown: Widgets.ListElement | null = null;
  private dropdownPosition: { x: number; y: number } = { x: 0, y: 0 };

  // menu modal content config
  private menuConfigs = { ...menuConfig_props };
  // user list data structure
  private users = { ...onlineusersConfig_props };

  // banner + typewriter effect
  public bannerLines = [
    "  ________          _____       ________                 _____         ",
    " ___  __ )_____  ____  /______ ___  __ \\______ ___________  /______  __",
    " __  __  |__  / / /_  __/_  _ \\__  /_/ /_  __ \\`/__  ___/_  __/__  / / /",
    " _  /_/ / _  /_/ / / /_  /  __/_  ____/ / /_/ / _  /    / /_  _  /_/ / ",
    " /_____/  _\\__, /  \\__/  \\___/ /_/      \\__,_/  /_/     \\__/  _\\__, /  ",
    "         /____/                                              /____/   ",
    "                         T H E   C H A T   T H A T   B Y T E S !      ",
  ];

  private currentLine = 0;
  private currentChar = 0;
  private typingSpeed = 10; // ms per character
  private lineDelay = 0.1; // ms between lines
  private isTyping = false;
  private loadingScreen!: Widgets.BoxElement;

  private constructor() {
    this.screen = blessed.screen(screenProps);
  }

  public static getInstance() {
    if (!APP_UI.instance) {
      APP_UI.instance = new APP_UI();
    }

    return APP_UI.instance;
  }

  /*=======================================================*
  |                 BOOT THE APPLICATION                  |
  *=======================================================*/

  public bootApplication(onComplete?: () => void): void {
    if (onComplete) {
      this.onBootComplete = onComplete;
    }

    //logo
    const rawLogoAscii = [
      "     ███ █████   █████ █████ █████    █████████  ███████████  ███████████ ███      ",
      "    ██░ ░░███   ░░███ ░░███ ░░███    ███░░░░░███░░███░░░░░███░█░░░███░░░█░░░███    ",
      "   ██    ░███    ░███  ░███  ░███ █ ███     ░░░  ░███    ░███░   ░███  ░   ░░░███  ",
      " ███     ░███████████  ░███████████░███          ░██████████     ░███        ░░░███",
      "░░░██    ░███░░░░░███  ░░░░░░░███░█░███    █████ ░███░░░░░░      ░███         ███░ ",
      "  ░░██   ░███    ░███        ░███░ ░░███  ░░███  ░███            ░███       ███░   ",
      "   ░░███ █████   █████       █████  ░░█████████  █████           █████    ███░     ",
      "    ░░░ ░░░░░   ░░░░░       ░░░░░    ░░░░░░░░░  ░░░░░           ░░░░░    ░░░       ",
    ];

    const logoAscii = rawLogoAscii.map((line) => {
      const leadingMatch = line.match(/^\s*/);
      if (!leadingMatch) return line;
      const leading = leadingMatch[0].replace(/ /g, "\u00A0"); // convert regular spaces to NBSP
      return leading + line.slice(leadingMatch[0].length);
    });

    this.loadingScreen = blessed.box({
      ...loadingScreenProps,
      content: this.getCenteredLoadingScreen(logoAscii),
      style: {
        ...loadingScreenProps.style,
        bg: this.getGradientBackground(),
      },
    });

    this.screen.append(this.loadingScreen);
    this.screen.render();

    // Start the typewriter animation after a brief delay
    setTimeout(() => {
      this.startTypewriterAnimation();
    }, 5000);
  }

  private getCenteredLoadingScreen(asciiArt: string[]): string {
    const screenWidth = this.screen.width as number;
    const screenHeight = this.screen.height as number;

    // Calculate vertical position
    const asciiHeight = asciiArt.length;
    const verticalPadding = Math.max(
      0,
      Math.floor((screenHeight - asciiHeight - 5) / 2)
    );

    let content = "";

    // Add top padding
    for (let i = 0; i < verticalPadding; i++) {
      content += "\n";
    }

    // Add ASCII art, centered horizontally
    asciiArt.forEach((line) => {
      const padding = Math.max(0, Math.floor((screenWidth - line.length) / 2));
      content +=
        " ".repeat(padding) + "{#ff6b6b-fg}" + line + "{/#ff6b6b-fg}\n";
    });

    content += "\n";
    const poweredBy =
      "{#a08c76-fg}╔══════════════════════════════════════════════════════════════════╗{/#a08c76-fg}\n";
    const poweredBy2 =
      "{#a08c76-fg}║                    powered by HumanGpt                           ║{/#a08c76-fg}\n";
    const poweredBy3 =
      "{#a08c76-fg}╚══════════════════════════════════════════════════════════════════╝{/#a08c76-fg}";

    // Center the "powered by" box
    const boxWidth = 70;
    const padding = Math.max(0, Math.floor((screenWidth - boxWidth) / 2));

    content += " ".repeat(padding) + poweredBy;
    content += " ".repeat(padding) + poweredBy2;
    content += " ".repeat(padding) + poweredBy3;

    // Add bottom padding
    const remainingLines = screenHeight - verticalPadding - asciiHeight - 7;
    for (let i = 0; i < Math.max(0, remainingLines); i++) {
      content += "\n";
    }

    return content;
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

  private startTypewriterAnimation(): void {
    this.isTyping = true;

    // Create a fade-out effect for the loading screen
    this.fadeOutLoadingScreen(() => {
      // Create the header (empty at first)
      this.header = blessed.box({ ...headerProps });
      this.screen.append(this.header);
      this.screen.render();

      // Start typing the first line
      this.typeNextLine();
    });
  }

  // New fade-out animation for loading screen
  private fadeOutLoadingScreen(callback: () => void): void {
    const fadeSteps = 10;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      // Calculate opacity (from 1 to 0)
      const opacity = 1 - currentStep / fadeSteps;

      // Apply fade effect by changing colors
      const fadedColor = this.interpolateColor("#ff6b6b", "#1a1a1a", opacity);
      const fadedBgColor = this.interpolateColor("#1a1a1a", "#000000", opacity);

      // Update loading screen style
      this.loadingScreen.style = {
        fg: fadedColor,
        bg: fadedBgColor,
      };

      this.screen.render();
      currentStep++;

      if (currentStep > fadeSteps) {
        clearInterval(fadeInterval);
        this.loadingScreen.destroy();
        callback();
      }
    }, 50);
  }

  // Helper method for color interpolation
  private interpolateColor(
    color1: string,
    color2: string,
    factor: number
  ): string {
    // Parse hex colors
    const parseHex = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1]!, 16),
            g: parseInt(result[2]!, 16),
            b: parseInt(result[3]!, 16),
          }
        : { r: 0, g: 0, b: 0 };
    };

    const c1 = parseHex(color1);
    const c2 = parseHex(color2);

    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  private typeNextLine(): void {
    if (this.currentLine >= this.bannerLines.length) {
      this.isTyping = false;

      // delay then initialize ui
      setTimeout(() => {
        this.initializeUI();
        this.setupEvents();
        this.initializeFocusCycle();
        this.setupFocusManagement();
        this.setupKeyboardShortcuts();

        // Process any queued messages
        this.processMessageQueue();
        // Call the completion callback
        if (this.onBootComplete) {
          this.onBootComplete();
          this.onBootComplete = null; // Clear callback after calling
        }
      }, 800); // Brief pause after typing completes
      return;
    }

    const line = this.bannerLines[this.currentLine];
    this.currentChar = 0;

    // Start typing this line character by character
    //@ts-expect-error
    this.typeCharacter(line);
  }

  private typeCharacter(line: string): void {
    if (this.currentChar >= line.length) {
      // Line complete, move to next line after delay
      this.currentLine++;
      this.currentChar = 0;

      // Add cursor blink effect at end of line
      this.showCursorBlink(() => {
        setTimeout(() => {
          this.typeNextLine();
        }, this.lineDelay);
      });

      return;
    }

    // Get the current content
    const currentContent = this.header.getContent();

    // Build the new content with the next character
    const linesSoFar = this.bannerLines.slice(0, this.currentLine);
    const currentLineProgress = line.substring(0, this.currentChar + 1);

    let newContent = "";
    if (linesSoFar.length > 0) {
      newContent = linesSoFar.join("\n") + "\n" + currentLineProgress;
    } else {
      newContent = currentLineProgress;
    }

    // Update the header with typing cursor
    this.header.setContent(newContent + "{#d4af37-fg}_{/#d4af37-fg}");
    this.screen.render();

    this.currentChar++;

    // Schedule next character
    setTimeout(() => {
      this.typeCharacter(line);
    }, this.typingSpeed);
  }

  private showCursorBlink(callback: () => void): void {
    let blinkCount = 0;
    const maxBlinks = 3;
    const blinkSpeed = 200;

    const blink = () => {
      if (blinkCount >= maxBlinks * 2) {
        // Remove cursor and continue
        const linesSoFar = this.bannerLines.slice(0, this.currentLine);
        let newContent = "";
        if (linesSoFar.length > 0) {
          newContent = linesSoFar.join("\n");
        }
        this.header.setContent(newContent);
        this.screen.render();
        callback();
        return;
      }

      const linesSoFar = this.bannerLines.slice(0, this.currentLine);
      let content = "";
      if (linesSoFar.length > 0) {
        content = linesSoFar.join("\n");
      }

      // Alternate between showing and hiding cursor
      if (blinkCount % 2 === 0) {
        this.header.setContent(content + "{#d4af37-fg}_{/#d4af37-fg}");
      } else {
        this.header.setContent(content);
      }

      this.screen.render();
      blinkCount++;

      setTimeout(blink, blinkSpeed);
    };

    blink();
  }

  public initializeUI(): void {
    // Clear the screen and show full banner
    this.screen.remove(this.header);

    // Recreate header with full content
    this.header = blessed.box({
      ...headerProps,
      content: this.bannerLines.join("\n"),
    });

    //@ts-expect-error
    this.menuBar = blessed.listbar(menuProps);

    this.messageList = blessed.list(messageBoxProps); //@ts-expect-error
    this.userList = blessed.list(userListProps);
    this.statusBar = blessed.box(statusBarProps);
    //@ts-expect-error
    this.inputBox = blessed.textbox(inputBoxProps);

    //@ts-expect-error
    this.userDropdown = blessed.list({
      parent: this.userList,
      ...userDropdownProps,
    });

    this.screen.append(this.header);
    this.screen.append(this.messageList);
    this.screen.append(this.userList);
    this.screen.append(this.inputBox);
    this.screen.append(this.menuBar);
    this.screen.append(this.statusBar);

    this.messageBoxWidth = this.messageList.width as number;

    // Initialize status information
    this.updateStatusInfo();

    // Start status updates
    this.startStatusUpdates();

    this.addSystemMessage(`MessageList width: ${this.messageBoxWidth}`);
    this.addSystemMessage(
      `This is an example of a text that am using to test how long the message can go before it becomes too long to render`
    );
  }

  private startStatusUpdates(): void {
    // Update time every second
    this.updateStatusBar();

    this.statusUpdateInterval = setInterval(() => {
      this.updateStatusBar();
    }, 1000);
  }

  private updateStatusInfo(): void {
    // Update user count
    //@ts-expect-error
    const userItems = this.userList.items as string[];
    const onlineUsers = userItems.filter(
      (item) =>
        typeof item === "string" && item.includes("@") && !item.includes("===")
    ).length;

    const channels = userItems.filter(
      (item) => typeof item === "string" && item.includes("#")
    ).length;

    const groups = userItems.filter(
      (item) =>
        typeof item === "string" &&
        !item.includes("@") &&
        !item.includes("#") &&
        !item.includes("===") &&
        item.trim() !== ""
    ).length;

    this.statusInfo.users = onlineUsers;
    this.statusInfo.channels = channels;
    this.statusInfo.groups = groups;

    // Update current time
    const now = new Date();
    this.statusInfo.time = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  private updateStatusBar(): void {
    this.updateStatusInfo();

    const elementNames = ["Input", "Messages", "User List", "Menu"];
    const currentFocusName = elementNames[this.currentFocusIndex] || "Unknown";

    // Build status content
    let statusContent = "";

    // Left section: Connection status
    statusContent += `{cyan-fg}●{/cyan-fg} {bold}${this.statusInfo.connection}{/bold}`;

    // Middle section: Current focus
    statusContent += " | ";
    statusContent += `Focus: {#ff6b6b-fg}{bold}${currentFocusName}{/bold}{/#ff6b6b-fg}`;

    // Right section: Counts and time
    statusContent += " | ";
    statusContent += `🗣  :${this.statusInfo.users} `;
    statusContent += `🕬  :${this.statusInfo.channels} `;
    statusContent += `🗫  :${this.statusInfo.groups} `;
    statusContent += `| 🕰  :${this.statusInfo.time}`;

    // Calculate message count
    //@ts-expect-error
    const messageCount = this.messageList.items.length;
    statusContent += ` | 🗨  :${messageCount}`;

    // Check if there are queued messages
    if (this.messageQueue.length > 0) {
      statusContent += ` {yellow-fg}(+${this.messageQueue.length} queued){/yellow-fg}`;
    }

    // Check if modal is open
    if (this.isModalOpen) {
      statusContent += ` {magenta-fg}[Modal Open]{/magenta-fg}`;
    }

    // Check if dropdown is active
    if (this.activeDropdown) {
      statusContent += ` {cyan-fg}[Dropdown]{/cyan-fg}`;
    }

    this.statusBar.setContent(statusContent);
    this.screen.render();
  }

  /*=======================================================*
   |       KEYBOARD AND  ELEMENT FOCUS MANAGEMENT         |
   *=======================================================*/

  private initializeFocusCycle(): void {
    // focus cycle order
    this.focusCycle = [
      this.inputBox, // 0: Input box (default)
      this.messageList, // 1: Message list
      this.userList, // 2: User List
      this.menuBar, // 3: Menu bar
    ];

    this.currentFocusIndex = 0;
  }

  // ================= KEYBOARD SHORTCUTS =====================

  private setupKeyboardShortcuts(): void {
    // Global shortcuts (work anywhere)
    this.setupGlobalShortcuts();

    // Component-specific shortcuts
    this.setupInputBoxShortcuts();
    this.setupMessageListShortcuts();
    this.setupUserListShortcuts();
    this.setupMenuShortcuts();
  }

  // ******************* GLOBAL SHORTCUTS

  private setupGlobalShortcuts(): void {
    // Toggle status bar details mode
    this.screen.key(["C-s"], () => {
      this.toggleStatusDetails();
    });

    // Tab navigation between elements
    this.screen.key(["tab"], () => {
      this.focusNextElement();
    });

    this.screen.key(["S-tab"], () => {
      this.focusPreviousElement();
    });

    // Quick navigation shortcuts
    this.screen.key(["C-i"], () => {
      // Ctrl+I or Cmd+I
      this.focusInputBox();
    });

    this.screen.key(["C-m"], () => {
      // Ctrl+M or Cmd+M
      this.focusMessageList();
    });

    this.screen.key(["C-u"], () => {
      // Ctrl+U or Cmd+U
      this.focusUserList();
    });

    this.screen.key(["C-b"], () => {
      // Ctrl+B or Cmd+B
      this.focusMenuBar();
    });

    // Modal/Window management
    this.screen.key(["escape"], () => {
      this.handleEscapeKey();
    });

    // Quick actions
    this.screen.key(["f1"], () => {
      this.showHelpModal();
    });

    this.screen.key(["f2"], () => {
      this.throwConfetti();
    });

    this.screen.key(["f3"], () => {
      this.showStats();
    });

    this.screen.key(["f5"], () => {
      this.refreshInterface();
    });

    this.screen.key(["C-l"], () => {
      // Clear screen/chat
      this.clearChat();
    });

    // Command mode
    this.screen.key([":"], () => {
      this.enterCommandMode();
    });

    // Search
    this.screen.key(["/"], () => {
      this.focusInputBox();
      this.inputBox.setValue("/");
      this.screen.render();
    });

    // Quick exit with confirmation
    this.screen.key(["C-q"], () => {
      // this.promptQuit();
      this.quitApplication();
    });

    // Toggle UI elements
    this.screen.key(["C-h"], () => {
      this.toggleUserList();
    });

    this.screen.key(["C-j"], () => {
      this.toggleMenuBar();
    });

    // Screenshot/Log (for debugging)
    this.screen.key(["C-p"], () => {
      this.takeScreenshot();
    });
  }

  // ******************* INPUTBOX ELEMENT SHORTCUTS

  private setupInputBoxShortcuts(): void {
    // Command history
    this.inputBox.key(["up"], () => {
      this.navigateCommandHistory("up");
    });

    this.inputBox.key(["down"], () => {
      this.navigateCommandHistory("down");
    });

    // Quick send (alternative to Enter)
    this.inputBox.key(["C-enter"], () => {
      this.sendCurrentMessage();
    });

    // Clear input
    this.inputBox.key(["C-u"], () => {
      this.inputBox.clearValue();
      this.screen.render();
    });

    // Autocomplete @mentions
    this.inputBox.key(["@"], () => {
      setTimeout(() => this.showUserAutocomplete(), 10);
    });

    // Autocomplete #channels
    this.inputBox.key(["#"], () => {
      setTimeout(() => this.showChannelAutocomplete(), 10);
    });

    // Move cursor
    this.inputBox.key(["C-a"], () => {
      // Beginning of line
      // Blessed doesn't expose cursor position directly, but we can simulate
      this.inputBox.setValue(this.inputBox.getValue());
      this.screen.render();
    });

    this.inputBox.key(["C-e"], () => {
      // End of line
      // Similar limitation, but we can focus end
      this.inputBox.focus();
      this.screen.render();
    });

    // Word navigation (needs custom implementation)
    this.inputBox.key(["M-b", "M-f"], (ch, key) => {
      // Alt+B, Alt+F
      // Meta key navigation for word movement
      this.handleWordNavigation(key.full);
    });
  }

  // ******************* MESSAGELIST ELEMENT SHORTCUTS

  private setupMessageListShortcuts(): void {
    // Enhanced scrolling
    this.messageList.key(["pageup"], () => {
      this.messageList.scroll(-10);
      this.screen.render();
    });

    this.messageList.key(["pagedown"], () => {
      this.messageList.scroll(10);
      this.screen.render();
    });

    this.messageList.key(["home"], () => {
      this.messageList.setScrollPerc(0);
      this.screen.render();
    });

    this.messageList.key(["end"], () => {
      this.messageList.setScrollPerc(100);
      this.screen.render();
    });

    // Search in messages
    this.messageList.key(["/"], () => {
      this.searchInMessages();
    });

    this.messageList.key(["n"], () => {
      this.findNextInMessages();
    });

    this.messageList.key(["N"], () => {
      this.findPreviousInMessages();
    });

    // Copy message
    this.messageList.key(["C-c"], () => {
      this.copySelectedMessage();
    });

    // Reply to selected message
    this.messageList.key(["r"], () => {
      this.replyToSelectedMessage();
    });

    // Mark as read/unread
    this.messageList.key(["m"], () => {
      this.toggleMessageRead();
    });
  }

  // ******************* USERLIST ELEMENT SHORTCUTS

  private setupUserListShortcuts(): void {
    // Quick user actions
    this.userList.key(["enter"], () => {
      this.handleUserListEnter();
    });

    this.userList.key(["space"], () => {
      this.showUserContextMenu();
    });

    this.userList.key(["m"], () => {
      this.messageSelectedUser();
    });

    this.userList.key(["i"], () => {
      this.inviteSelectedUser();
    });

    this.userList.key(["v"], () => {
      this.viewSelectedUserProfile();
    });

    this.userList.key(["b"], () => {
      this.blockSelectedUser();
    });

    // Filter users
    this.userList.key(["/"], () => {
      this.filterUserList();
    });

    this.userList.key(["f"], () => {
      this.toggleUserFilter();
    });

    // Group channels by section
    this.userList.key(["g"], () => {
      this.toggleGrouping();
    });
  }

  // ******************* MENU ELEMENT SHORTCUTS

  private setupMenuShortcuts(): void {
    // Menu navigation with keyboard
    this.menuBar.key(["left"], () => {
      //@ts-expect-error
      this.menuBar.left();
      this.screen.render();
    });

    this.menuBar.key(["right"], () => {
      //@ts-expect-error
      this.menuBar.right();
      this.screen.render();
    });

    this.menuBar.key(["enter"], () => {
      this.activateSelectedMenuItem();
    });

    // Quick menu access
    this.menuBar.key(["1"], () => {
      this.selectMenuItem(0); // Key Binds
    });

    this.menuBar.key(["2"], () => {
      this.selectMenuItem(1); // Servers
    });

    this.menuBar.key(["3"], () => {
      this.selectMenuItem(2); // Region
    });

    this.menuBar.key(["4"], () => {
      this.selectMenuItem(3); // Help
    });
  }

  // ====================== FOCUS MANAGEMENT ======================

  private setupFocusManagement(): void {
    // Track when modals are open
    this.screen.on("element focus", (el: any) => {
      // If a modal element gets focus, mark modal as open
      if (el.parent && el.parent.type === "modal") {
        this.isModalOpen = true;
      }
    });

    // When modal closes, return focus to last focused element
    this.screen.on("element blur", (el: any) => {
      if (el.type === "modal" || (el.parent && el.parent.type === "modal")) {
        this.isModalOpen = false;
        setTimeout(() => {
          this.restorePreviousFocus();
        }, 50);
      }
    });
  }

  private toggleStatusDetails(): void {
    // Toggle between simple and detailed status
    const currentContent = this.statusBar.getContent();

    if (currentContent.includes("Detailed")) {
      // Switch to simple mode
      this.statusBar.setContent("Press Ctrl+S for detailed status");
    } else {
      // Switch to detailed mode
      const details = `
{cyan-fg}ByteParty Status{/cyan-fg} | Focus: ${
        this.currentFocusIndex
      } | Messages: ${
        //@ts-expect-error
        this.messageList.items.length
      } | 
Users: ${this.statusInfo.users} | Memory: ${(
        process.memoryUsage().heapUsed /
        1024 /
        1024
      ).toFixed(1)}MB
    `
        .trim()
        .replace(/\n/g, " | ");
      this.statusBar.setContent(details);
    }

    this.screen.render();

    // Auto-switch back after 5 seconds
    setTimeout(() => {
      this.updateStatusBar();
    }, 5000);
  }

  private alertStatusBar(
    color: string = "#ff6b6b",
    duration: number = 1000
  ): void {
    const originalStyle = { ...this.statusBar.style };
    let blinkCount = 0;
    const maxBlinks = 3;

    const blink = () => {
      if (blinkCount >= maxBlinks * 2) {
        this.statusBar.style = originalStyle;
        this.updateStatusBar();
        return;
      }

      // Alternate between alert color and original
      if (blinkCount % 2 === 0) {
        // this.statusBar.style.bg = color;
        this.statusBar.style.fg = "white";
      } else {
        this.statusBar.style = originalStyle;
      }

      this.screen.render();
      blinkCount++;

      setTimeout(blink, 200);
    };

    blink();
  }

  // Focus Management Methods
  private focusNextElement(): void {
    if (this.isModalOpen) return; // Don't cycle focus when modal is open

    this.currentFocusIndex =
      (this.currentFocusIndex + 1) % this.focusCycle.length;
    this.focusCycle[this.currentFocusIndex].focus();
    this.highlightFocusedElement();
    this.screen.render();
  }

  private focusPreviousElement(): void {
    if (this.isModalOpen) return;

    this.currentFocusIndex =
      (this.currentFocusIndex - 1 + this.focusCycle.length) %
      this.focusCycle.length;
    this.focusCycle[this.currentFocusIndex].focus();
    this.highlightFocusedElement();
    this.screen.render();
  }

  private focusInputBox(): void {
    this.currentFocusIndex = 0;
    this.inputBox.focus();
    this.highlightFocusedElement();
    this.screen.render();
  }

  private focusMessageList(): void {
    this.currentFocusIndex = 1;
    this.messageList.focus();
    this.highlightFocusedElement();
    this.screen.render();
  }

  private focusUserList(): void {
    this.currentFocusIndex = 2;
    this.userList.focus();
    this.highlightFocusedElement();
    this.screen.render();
  }

  private focusMenuBar(): void {
    this.currentFocusIndex = 3;
    this.menuBar.focus();
    this.highlightFocusedElement();
    this.screen.render();
  }

  private highlightFocusedElement(): void {
    // Remove highlight from all elements first
    this.focusCycle.forEach((element) => {
      if (element.style) {
        element.style.border = { type: "line", fg: "#ff6b6b" };
      }
    });

    // Highlight the currently focused element
    const focused = this.focusCycle[this.currentFocusIndex];
    if (focused.style) {
      focused.style.border = { type: "line", fg: "#00ff00" }; // Green border for focus
    }

    // Update status bar with new focus
    this.updateStatusBar();
  }

  public updateConnectionStatus(
    status: "Connected" | "Connecting" | "Disconnected" | "Error",
    server?: string
  ): void {
    this.statusInfo.connection = status;
    if (server) {
      this.statusInfo.connection += ` (${server})`;
    }
    this.updateStatusBar();
  }

  public showTemporaryStatus(message: string, duration: number = 3000): void {
    const originalContent = this.statusBar.getContent();

    // Show temporary message
    this.statusBar.setContent(`{bold}${message}{/bold}`);
    this.screen.render();

    // Restore original content after duration
    setTimeout(() => {
      this.statusBar.setContent(originalContent);
      this.updateStatusBar();
    }, duration);
  }

  private handleEscapeKey(): void {
    if (this.isModalOpen) {
      this.addSystemMessage("handling escaoe key");
      this.closeActiveModal();
    } else if (this.currentFocusIndex !== 0) {
      // Return to input box
      this.focusInputBox();
    } else {
      // If already in input box, clear it
      this.inputBox.clearValue();
      this.screen.render();
    }
  }

  private closeActiveModal(): void {
    if (this.activeModal) {
      this.activeModal.destroy();
      this.activeModal = null;
      this.inputBox.focus();
      this.screen.render();
    }
  }

  // Action Methods
  private showHelpModal(): void {
    const helpContent = modalContent_config["helpContent"];
    this.showModal("info", {
      title: "Keyboard Shortcuts",
      content: helpContent,
      height: 35,
      width: 70,
    });
  }

  private throwConfetti(): void {
    const confetti = ["✨", "🎉", "🌟", "💫", "🔥"];
    const random = confetti[Math.floor(Math.random() * confetti.length)];
    this.addSystemMessage(`${random} Keyboard shortcut confetti! ${random}`);
  }

  private showStats(): void {
    const stats = `
{bold}Interface Statistics{/bold}
Focus: ${this.currentFocusIndex}
Elements: ${this.focusCycle.length}
Messages: ${
      //@ts-expect-error
      this.messageList.items.length
    }
Users: 5
Channels: 4
Groups: 3
    `.trim();

    this.showModal("info", {
      title: "Stats",
      content: stats,
      height: 10,
      width: 30,
    });
  }

  private refreshInterface(): void {
    this.addSystemMessage("Refreshing interface...");
    this.screen.realloc(); // Recalculate layout
    this.screen.render();
  }

  private clearChat(): void {
    this.messageList.clearItems();
    this.addSystemMessage("Chat cleared");
    this.screen.render();
  }

  private enterCommandMode(): void {
    this.showCommandPalette();
  }

  private promptQuit(): void {
    const modal = blessed.question({
      parent: this.screen,
      top: "center",
      left: "center",
      width: 30,
      height: 8,
      content: "Are you sure you want to quit ByteParty?",
      tags: true,
      //@ts-expect-error
      border: { type: "line", fg: "#ff6b6b" },
      style: {
        fg: "#e8d8b5",
        bg: "#2a1f1d",
      },
    });

    modal.focus();
    modal.on("submit", (response: boolean) => {
      if (response) {
        this.quitApplication();
      }
      this.inputBox.focus();
      this.screen.render();
    });

    this.screen.render();
  }

  private toggleUserList(): void {
    if (this.userList.hidden) {
      this.userList.show();
      this.addSystemMessage("User list shown");
    } else {
      this.userList.hide();
      this.addSystemMessage("User list hidden");
    }
    this.screen.render();
  }

  private toggleMenuBar(): void {
    if (this.menuBar.hidden) {
      this.menuBar.show();
      this.addSystemMessage("Menu bar shown");
    } else {
      this.menuBar.hide();
      this.addSystemMessage("Menu bar hidden");
    }
    this.screen.render();
  }

  private takeScreenshot(): void {
    //Logic to  save the screen state will go here
    this.addSystemMessage("📸 Screenshot captured (simulated)");

    // Create a visual feedback
    const flash = blessed.box({
      parent: this.screen,
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      style: { bg: "white", opacity: 0.3 },
    });

    this.screen.append(flash);
    this.screen.render();

    setTimeout(() => {
      flash.destroy();
      this.screen.render();
    }, 100);
  }

  private navigateCommandHistory(direction: "up" | "down"): void {
    // Implementation for command history
    this.addSystemMessage(`Command history ${direction} (simulated)`);
  }

  private sendCurrentMessage(): void {
    const value = this.inputBox.getValue();
    if (value.trim()) {
      // this.sendMessage(value);
      this.inputBox.clearValue();
      this.screen.render();
    }
  }

  private showUserAutocomplete(): void {
    // Implementation for @mention autocomplete
    const currentValue = this.inputBox.getValue();
    if (currentValue.includes("@")) {
      this.addSystemMessage("User autocomplete (simulated)");
    }
  }

  private showChannelAutocomplete(): void {
    // Implementation for #channel autocomplete
    const currentValue = this.inputBox.getValue();
    if (currentValue.includes("#")) {
      this.addSystemMessage("Channel autocomplete (simulated)");
    }
  }

  private handleWordNavigation(key: string): void {
    // Would need custom implementation for word navigation
    this.addSystemMessage(`Word navigation: ${key}`);
  }

  private searchInMessages(): void {
    // Logic will be implemented here
    // this.showSearchDialog();
  }

  private findNextInMessages(): void {
    this.addSystemMessage("Find next");
  }

  private findPreviousInMessages(): void {
    this.addSystemMessage("Find previous");
  }

  private copySelectedMessage(): void {
    //@ts-expect-error
    const selected = this.messageList.selected;
    if (selected >= 0) {
      const item = this.messageList.getItem(selected);
      this.addSystemMessage(`Copied: ${item.getText().substring(0, 30)}...`);
    }
  }

  private replyToSelectedMessage(): void {
    //@ts-expect-error
    const selected = this.messageList.selected;
    if (selected >= 0) {
      this.inputBox.setValue("> ");
      this.inputBox.focus();
      this.screen.render();
    }
  }

  private toggleMessageRead(): void {
    this.addSystemMessage("Message marked");
  }

  private showUserContextMenu(): void {
    // Show dropdown menu at selected user
    //@ts-expect-error
    const selected = this.userList.selected;
    if (selected >= 0) {
      const item = this.userList.getItem(selected);
      const text = item.getText().trim();
      if (text.startsWith("@")) {
        // Simulate a click at the selected position
        this.showContextMenuAtSelected();
      }
    }
  }

  private messageSelectedUser(): void {
    //@ts-expect-error
    const selected = this.userList.selected;
    if (selected >= 0) {
      const item = this.userList.getItem(selected);
      const text = item.getText().trim();
      if (text.startsWith("@")) {
        const username = text.substring(1);
        this.inputBox.setValue(`@${username} `);
        this.focusInputBox();
        this.screen.render();
      }
    }
  }

  private inviteSelectedUser(): void {
    this.addSystemMessage("Invite sent");
  }

  private viewSelectedUserProfile(): void {
    //@ts-expect-error
    const selected = this.userList.selected;
    if (selected >= 0) {
      const item = this.userList.getItem(selected);
      const text = item.getText().trim();
      if (text.startsWith("@")) {
        const username = text.substring(1);
        this.showUserProfile(username);
      }
    }
  }

  private blockSelectedUser(): void {
    this.addSystemMessage("User blocked");
  }

  private filterUserList(): void {
    // Logic will be implemented here
    // this.showFilterDialog();
  }

  private toggleUserFilter(): void {
    this.addSystemMessage("Filter toggled");
  }

  private toggleGrouping(): void {
    this.addSystemMessage("Grouping toggled");
  }

  private selectMenuItem(index: number): void {
    //@ts-expect-error
    if (index < this.menuBar.items.length) {
      this.menuBar.select(index);
      this.activateSelectedMenuItem();
    }
  }

  private activateSelectedMenuItem(): void {
    //@ts-expect-error
    const selected = this.menuBar.selected;
    const items = ["key-binds", "servers", "region", "help"];
    if (selected >= 0 && selected < items.length) {
      this.showModal("menu", items[selected]! as MenuModalType);
    }
  }

  private showCommandPalette(): void {
    const modal = blessed.prompt({
      parent: this.screen,
      top: "center",
      left: "center",
      width: 40,
      height: 5,
      label: " Command Palette ",
      tags: true,
      //@ts-expect-error
      border: { type: "line", fg: "#ff6b6b" },
      style: {
        fg: "#e8d8b5",
        bg: "#2a1f1d",
      },
    });

    modal.focus();
    modal.on("submit", (value: string) => {
      this.executeCommand(value);
      this.inputBox.focus();
      this.screen.render();
    });

    modal.key(["escape"], () => {
      modal.destroy();
      this.inputBox.focus();
      this.screen.render();
    });

    this.screen.render();
  }

  private executeCommand(command: string): void {
    // Handle command palette commands
    const cmd = command.toLowerCase().trim();

    switch (cmd) {
      case "clear":
        this.clearChat();
        break;
      case "help":
        this.showHelpModal();
        break;
      case "stats":
        this.showStats();
        break;
      case "refresh":
        this.refreshInterface();
        break;
      case "focus input":
        this.focusInputBox();
        break;
      case "focus messages":
        this.focusMessageList();
        break;
      case "focus users":
        this.focusUserList();
        break;
      case "focus menu":
        this.focusMenuBar();
        break;
      default:
        this.addSystemMessage(`Command not found: ${command}`);
    }
  }

  private showStatusMessage(message: string, duration: number = 2000): void {
    this.showTemporaryStatus(message, duration);
  }

  private restorePreviousFocus(): void {
    // Restore focus to where it was before modal opened
    if (
      this.currentFocusIndex >= 0 &&
      this.currentFocusIndex < this.focusCycle.length
    ) {
      this.focusCycle[this.currentFocusIndex].focus();
      this.screen.render();
    }
  }

  /*=======================================================*
   |                  MESSAGE  LOGS                        |
   *=======================================================*/

  // INPUT LOGS
  private setupEvents() {
    // Handle input submission
    this.inputBox.on("submit", (value: string) => {
      this.handleInputSubmit(value);
    });

    // Also handle user list clicks for dropdowns
    this.userList.on("click", (data: any) => {
      this.handleUserListClick(data);
    });
  }

  private handleInputSubmit(value: string): void {
    if (value.trim()) {
      // Add user message to chat
      this.addUserMessage(value);

      // Clear input
      this.inputBox.clearValue();
      // Re-focus the input box
      this.inputBox.focus();

      // Also ensure it's highlighted in focus cycle
      this.currentFocusIndex = 0; // Input box is index 0
      this.highlightFocusedElement();
      this.screen.render();

      // Handle commands (if starts with /)
      if (value.startsWith("/")) {
        this.handleCommand(value);
      }
    }
  }

  private addUserMessage(text: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `{cyan-fg}⤷ <you>{/cyan-fg} [${timestamp}]: ${text}`;

    this.messageList.addItem(formatted);
    this.messageList.setScrollPerc(100); // Auto-scroll to bottom
    this.screen.render();
  }

  private handleCommand(command: string): void {
    const parts = command.substring(1).split(" ");
    const cmd = parts[0]!.toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case "help":
        this.showHelpModal();
        break;
      case "clear":
        this.messageList.clearItems();
        this.addSystemMessage("Chat cleared");
        break;
      case "nick":
      case "n":
        if (args[0]) {
          this.addSystemMessage(`Changed nickname to ${args[0]}`);
        } else {
          this.addSystemMessage("Usage: /nick <newname>");
        }
        break;
      case "join":
      case "j":
        if (args[0]) {
          this.addSystemMessage(`Joined ${args[0]}`);
        } else {
          this.addSystemMessage("Usage: /join #channelname");
        }
        break;
      case "msg":
      case "m":
        if (args.length >= 2) {
          const user = args[0];
          const message = args.slice(1).join(" ");
          this.addSystemMessage(`To ${user}: ${message}`);
        } else {
          this.addSystemMessage("Usage: /msg <user> <message>");
        }
        break;
      case "quit":
      case "q":
        this.promptQuit();
        break;
      case "confetti":
        this.throwConfetti();
        break;
      case "stats":
        this.showStats();
        break;
      case "theme":
        if (args[0]) {
          this.addSystemMessage(`Theme changed to ${args[0]}`);
        } else {
          this.addSystemMessage("Usage: /theme <name>");
        }
        break;
      default:
        this.addSystemMessage(
          `Unknown command: ${cmd}. Type /help for commands.`
        );
    }
  }

  // Process queued messages
  // since some logs might be logged while messageList is not yet appended to the screen
  private processMessageQueue(): void {
    if (this.messageQueue.length > 0 && this.messageList) {
      // Process in reverse order so first messages appear first
      const messages = [...this.messageQueue];
      this.messageQueue = [];

      // Add a small delay between messages for natural display
      messages.forEach((msg, index) => {
        setTimeout(() => {
          this.addMessage("System", msg, "#d4af37");
        }, index * 50); // 50ms delay between each queued message
      });
    }
  }

  public addSystemMessage(text: string): void {
    // Check if message is about connection
    if (
      text.toLowerCase().includes("connecting") ||
      text.toLowerCase().includes("connected")
    ) {
      if (text.toLowerCase().includes("connecting")) {
        this.updateConnectionStatus("Connecting");
      } else if (text.toLowerCase().includes("connected")) {
        // Extract server name if possible
        const serverMatch = text.match(/to ([\w\.:]+)/);
        this.updateConnectionStatus(
          "Connected",
          serverMatch ? serverMatch[1] : undefined
        );
      }
    }

    // If UI is not initialized yet, queue the message
    if (!this.messageList) {
      this.messageQueue.push(text);
      return;
    }
    this.addMessage("System", text, "#d4af37");
  }

  private stopStatusUpdates(): void {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = null;
    }
  }

  private addMessage(
    user: string,
    text: string,
    color: string = "#e8d8b5"
  ): void {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `{${color}-fg}{bold}${user}{/bold}{/${color}-fg} [${timestamp}]: ${text}`;

    this.messageLogger(formatted);
    this.screen.render();
  }

  private messageLogger(text: string) {
    // Calculate max characters per line based on message box width
    // Use 90% of the width for message content (leaving some padding)
    /* HERE IS WHAT I HAVE REALIZED (BLESSED TEXT MODIFIERS TO NOT APPLY ON THE MAX CHARACTERS THEY ARE NOT RENDRED ON THE MESSAGELIST BUT THEIR EFFECT IS SEEN SO 
     YOU NEED TO USE THE LENGTH OF THE PARSED TEXT TO SEE THE MAX CHARS THE SCREEN CAN TAKE, BECAUSE IF YOU COUNT THE NON PARSED TEXT YOU WILL INCLUDE TEXT MODIFIERS TOO IN THE FINAL RESULT 
    )
     - A messageList of width 135 can take upto 130 max characters (parsed text) on the new log
     135 -> 130
     current*/
    const maxChars = Math.floor(((this.messageBoxWidth as number) * 130) / 135);

    const { parsed, originalStamp } = this.decodestr(text);

    const newLog = (log: string) => {
      const newLogChar = "{green-fg}{bold}⤷{/bold}{/green-fg} ";
      this.messageList.addItem(`${newLogChar}${log}`);
      this.messageList.setScrollPerc(100);
    };

    const appendLog = (message: string) => {
      // Add with proper indentation (no newLogChar for continuation lines)
      this.messageList.addItem("   " + message);
      this.messageList.setScrollPerc(100);
    };

    if (parsed.length > maxChars) {
      this.handleLongLogs(
        { parsed, originalStamp },
        maxChars,
        newLog,
        appendLog
      );
    } else {
      newLog(text); // Use original text with formatting
    }
  }

  /* Blessed supports text modifiers like {bold}, to highlight or format rendered text
     Since MessageList is a Blessed List element there is no text-wrap option for overflow text
     We have to create a custom way of handling long text so we have to decode and filter off text
     modifiers to calculate the length of text to render on the Message box per line
  */
  private decodestr(str: string): { parsed: string; originalStamp: string } {
    let originalStamp = "";
    let plainText = "";

    // Remove formatting tags to get plain text for length calculation
    plainText = str
      .replace(/\{[\w#-]+\}/g, "") // Remove opening tags
      .replace(/\{\/[\w#-]+\}/g, "") // Remove closing tags
      .replace(/\{\/[\w#-]+-(fg|bg)\}/g, ""); // Remove color tags

    // Try to extract timestamp pattern for formatting
    const timestampMatch = str.match(/\[(\d{1,2}:\d{2}:\d{2})\s?(AM|PM)?\]/);

    if (timestampMatch) {
      // Find the portion up to and including the timestamp
      const timestampIndex = timestampMatch.index || 0;
      const timestampEnd = timestampIndex + timestampMatch[0].length;

      // Look for the colon and space after timestamp
      let stampEnd = timestampEnd;
      if (str.substring(timestampEnd, timestampEnd + 2) === ": ") {
        stampEnd += 2;
      }

      originalStamp = str.substring(0, stampEnd);
    }

    return {
      parsed: plainText,
      originalStamp: originalStamp,
    };
  }

  private handleLongLogs(
    { parsed, originalStamp }: { parsed: string; originalStamp: string },
    maxChars: number,
    newLog: (log: string) => void,
    appendLog: (message: string) => void
  ): void {
    // Extract just the message text (after timestamp)
    const messageText = parsed.slice(originalStamp.length).trim();

    // Calculate available space for message content on the first line
    // This accounts for the timestamp and any prefix characters in the original stamp
    const stampPlainText = originalStamp.replace(/\{[^}]+\}/g, ""); // Remove blessed tags
    const stampLength = stampPlainText.length;

    // The prefix character "{green-fg}{bold}⤷{/bold}{/green-fg} " adds extra length
    const newLogPrefix = "{green-fg}{bold}⤷{/bold}{/green-fg} ";
    const prefixLength = newLogPrefix.replace(/\{[^}]+\}/g, "").length;

    // Calculate available space for first line message content
    const firstLineAvailableChars = maxChars - (prefixLength + stampLength + 1); // +1 for space

    // Split message into words
    const words = messageText.split(/\s+/);

    // Build lines for the message content only
    const messageLines: string[] = [];
    let currentLine = "";

    // First line - limited by available space
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= firstLineAvailableChars) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          messageLines.push(currentLine);
          currentLine = word;
        } else {
          // Word is too long for the first line, need to split it
          messageLines.push(word.substring(0, firstLineAvailableChars));
          currentLine = word.substring(firstLineAvailableChars);
        }
      }
    }

    // Add the last line if there's content
    if (currentLine) {
      messageLines.push(currentLine);
    }

    // For subsequent lines (after the first), we have more space available
    // because we don't have the timestamp prefix
    const subsequentLineAvailableChars = maxChars - 3; // 3 spaces for indentation

    // If we have more than one line, we might need to re-wrap the subsequent lines
    const finalMessageLines: string[] = [];

    if (messageLines.length > 0) {
      // First line stays as-is (already calculated with timestamp space constraints)
      finalMessageLines.push(messageLines[0]!);

      // Process remaining lines, potentially breaking them further
      for (let i = 1; i < messageLines.length; i++) {
        const line = messageLines[i]!;

        if (line.length <= subsequentLineAvailableChars) {
          finalMessageLines.push(line);
        } else {
          // Need to break this line further
          const subWords = line.split(/\s+/);
          let subCurrentLine = "";

          for (const word of subWords) {
            const testSubLine = subCurrentLine
              ? `${subCurrentLine} ${word}`
              : word;
            if (testSubLine.length <= subsequentLineAvailableChars) {
              subCurrentLine = testSubLine;
            } else {
              if (subCurrentLine) {
                finalMessageLines.push(subCurrentLine);
                subCurrentLine = word;
              } else {
                // Word is too long, need to hard break it
                let startIdx = 0;
                while (startIdx < word.length) {
                  const chunk = word.substring(
                    startIdx,
                    startIdx + subsequentLineAvailableChars
                  );
                  finalMessageLines.push(chunk);
                  startIdx += subsequentLineAvailableChars;
                }
              }
            }
          }

          if (subCurrentLine) {
            finalMessageLines.push(subCurrentLine);
          }
        }
      }
    }

    // Now log the lines with proper formatting
    if (finalMessageLines.length > 0) {
      // First line gets the full formatting with timestamp
      const firstLineContent = originalStamp
        ? `${originalStamp} ${finalMessageLines[0]}`
        : finalMessageLines[0]!;

      // Use the newLog function which adds the prefix
      newLog(firstLineContent);
    }

    // Append remaining lines with indentation
    for (let i = 1; i < finalMessageLines.length; i++) {
      appendLog(finalMessageLines[i]!);
    }
  }

  /*=======================================================*
   |                     USER LIST                         |
   *=======================================================*/

  // =================== EVENT HANDLERS ===================

  private handleUserListClick(data: any): void {
    // Get the clicked item position
    const itemIndex = this.getClickedItemIndex(data);
    if (itemIndex === -1) return;

    const item = this.userList.getItem(itemIndex);
    const itemText = item.getText().trim();

    // Determine what was clicked
    if (itemText.startsWith("@")) {
      // User clicked
      this.showUserDropdown(itemText.substring(1), data);
    } else if (itemText.startsWith("#")) {
      // Channel clicked
      this.showChannelDropdown(itemText, data);
    } else if (itemText.includes("===")) {
      // Section header - show filter options
      this.showSectionDropdown(itemText, data);
    } else if (
      itemText &&
      !itemText.startsWith(" ") &&
      !itemText.includes("===")
    ) {
      // Group clicked
      this.showGroupDropdown(itemText, data);
    }
  }

  private handleUserListEnter(): void {
    //@ts-expect-error
    const selectedIndex = this.userList.selected;
    if (selectedIndex < 0) return;

    const item = this.userList.getItem(selectedIndex);
    const itemText = item.getText().trim();

    if (itemText.startsWith("@")) {
      // Quick action: start private chat
      this.startPrivateChat(itemText.substring(1));
    } else if (itemText.startsWith("#")) {
      // Quick action: join channel
      this.joinChannel(itemText);
    } else if (
      itemText &&
      !itemText.startsWith(" ") &&
      !itemText.includes("===")
    ) {
      // Quick action: open group
      this.openGroupChat(itemText);
    }
  }

  private handleUserAction(
    username: string,
    action: string,
    index: number
  ): void {
    this.closeActiveDropdown();

    switch (index) {
      case 3: // Start Private Chat
        this.startPrivateChat(username);
        break;
      case 4: // Send Message
        this.promptMessageToUser(username);
        break;
      case 5: // Invite to Channel
        this.inviteUserToChannel(username);
        break;
      case 6: // View Profile
        this.showUserProfile(username);
        break;
      case 8: // Ignore User
        this.ignoreUser(username);
        break;
      case 9: // Block User
        this.blockUser(username);
        break;
    }

    this.inputBox.focus();
    this.screen.render();
  }

  private handleChannelAction(
    channel: string,
    action: string,
    index: number
  ): void {
    this.closeActiveDropdown();

    switch (index) {
      case 4: // Join Channel
        this.joinChannel(channel);
        break;
      case 5: // View Members
        this.showChannelMembers(channel);
        break;
      case 6: // Set as Active
        this.setActiveChannel(channel);
        break;
      case 8: // Leave Channel
        this.leaveChannel(channel);
        break;
      case 9: // Mute Notifications
        this.muteChannel(channel);
        break;
    }

    this.inputBox.focus();
    this.screen.render();
  }

  private handleGroupAction(
    groupName: string,
    action: string,
    index: number
  ): void {
    this.closeActiveDropdown();

    switch (index) {
      case 4: // Open Group Chat
        this.openGroupChat(groupName);
        break;
      case 5: // View Members
        this.showGroupMembers(groupName);
        break;
      case 6: // Invite Friends
        this.inviteToGroup(groupName);
        break;
      case 8: // Leave Group
        this.leaveGroup(groupName);
        break;
      case 9: // Group Settings
        this.showGroupSettings(groupName);
        break;
    }

    this.inputBox.focus();
    this.screen.render();
  }

  private handleSectionAction(
    sectionType: string,
    action: string,
    index: number
  ): void {
    this.closeActiveDropdown();

    let message = "";

    switch (index) {
      case 2: // Show All
        message = `Showing all ${sectionType}`;
        break;
      case 3: // Filter options
        message = `Filter applied to ${sectionType}`;
        break;
      case 4: // More filters
        message = `Filter applied to ${sectionType}`;
        break;
      case 6: // Sort options
        message = `Sorted ${sectionType}`;
        break;
      case 7: // More sort options
        message = `Sorted ${sectionType}`;
        break;
      case 8: // Even more sort options
        message = `Sorted ${sectionType}`;
        break;
      case 9: // Refresh/Discover
        message =
          sectionType === "users"
            ? "Refreshed user list"
            : `Discovering ${sectionType}`;
        break;
      case 10: // Create new
        message = `Creating new ${sectionType.slice(0, -1)}`;
        this.promptCreateNew(sectionType);
        break;
    }

    if (message) {
      this.addSystemMessage(message);
    }

    this.inputBox.focus();
    this.screen.render();
  }

  private getClickedItemIndex(data: any): number {
    // Calculate which item was clicked based on y position
    const listTop = this.userList.top as number;
    const itemHeight = 1; // Each list item is 1 row high

    const clickY = data.y - listTop;
    const itemIndex = Math.floor(clickY);
    //@ts-expect-error
    return itemIndex >= 0 && itemIndex < this.userList.items.length
      ? itemIndex
      : -1;
  }

  private showUserDropdown(username: string, clickData: any): void {
    this.closeActiveDropdown();

    const user = this.users.online.find((u) => u.name === `@${username}`);
    if (!user) return;

    // Calculate dropdown position near the click
    this.dropdownPosition = {
      x: clickData.x + 5,
      y: clickData.y,
    };

    const dropdownItems = [
      `{bold}${user.name} ${user.status}{/bold}`,
      `Role: ${user.role}`,
      "────────────",
      "{#ff6b6b-fg}{bold}Start Private Chat{/bold}{/#ff6b6b-fg}",
      "Send Message",
      "Invite to Channel",
      "View Profile",
      "────────────",
      "Ignore User",
      "{red-fg}Block User{/red-fg}",
      "────────────",
      "Close",
    ];

    this.createDropdown(
      dropdownItems,
      (selectedItem: string, index: number) => {
        this.handleUserAction(username, selectedItem, index);
      }
    );
  }

  private createDropdown(
    items: string[],
    onSelect: (item: string, index: number) => void
  ): void {
    // Close any existing dropdown
    this.closeActiveDropdown();

    // Calculate dropdown size
    const maxWidth =
      Math.max(...items.map((item) => item.replace(/\{[^}]+\}/g, "").length)) +
      4;

    // Create dropdown list
    this.activeDropdown = blessed.list({
      parent: this.screen,
      top: this.dropdownPosition.y,
      left: this.dropdownPosition.x,
      width: maxWidth,
      height: items.length + 2,
      items: items,
      tags: true,
      //@ts-expect-error
      border: { type: "line", fg: "#ff6b6b" },
      style: {
        selected: { bg: "#ff6b6b", fg: "white" },
        item: { fg: "#a08c76" },
        bg: "#2a1f1d",
      },
      mouse: true,
      keys: true,
      vi: true,
      shadow: true,
    });

    // Handle selection
    this.activeDropdown.on("select", (item: any, index: number) => {
      const itemText = item.getText();
      if (itemText === "Close" || itemText.includes("────")) {
        this.closeActiveDropdown();
      } else {
        onSelect(itemText, index);
      }
    });

    // Handle Enter key
    this.activeDropdown.key(["enter"], () => {
      //@ts-expect-error
      const selected = this.activeDropdown!.selected;
      const itemText = this.activeDropdown!.getItem(selected).getText();
      if (itemText === "Close" || itemText.includes("────")) {
        this.closeActiveDropdown();
      } else {
        onSelect(itemText, selected);
      }
    });

    // Close on escape
    this.activeDropdown.key(["escape"], () => {
      this.closeActiveDropdown();
    });

    // Close when clicking outside
    this.screen.on("click", (data: any) => {
      if (this.activeDropdown && !this.isClickInsideDropdown(data)) {
        this.closeActiveDropdown();
      }
    });

    this.activeDropdown.focus();
    this.screen.render();
  }

  private isClickInsideDropdown(data: any): boolean {
    if (!this.activeDropdown) return false;

    const dropdown = this.activeDropdown;
    const left = dropdown.left as number;
    const top = dropdown.top as number;
    const width = dropdown.width as number;
    const height = dropdown.height as number;

    return (
      data.x >= left &&
      data.x <= left + width &&
      data.y >= top &&
      data.y <= top + height
    );
  }

  private closeActiveDropdown(): void {
    if (this.activeDropdown) {
      this.activeDropdown.destroy();
      this.activeDropdown = null;
      this.screen.render();
    }
  }

  private showChannelDropdown(channel: string, clickData: any): void {
    this.closeActiveDropdown();

    const chan = this.users.channels.find((c) => c.name === channel);

    this.dropdownPosition = {
      x: clickData.x + 5,
      y: clickData.y,
    };

    const dropdownItems = [
      `{bold}${channel}{/bold}`,
      `Users: ${chan?.users || 0}`,
      `Topic: ${chan?.topic?.substring(0, 20) || "No topic"}...`,
      "────────────",
      "{#ff6b6b-fg}{bold}Join Channel{/bold}{/#ff6b6b-fg}",
      "View Members",
      "Set as Active",
      "────────────",
      "Leave Channel",
      "Mute Notifications",
      "────────────",
      "Close",
    ];

    this.createDropdown(
      dropdownItems,
      (selectedItem: string, index: number) => {
        this.handleChannelAction(channel, selectedItem, index);
      }
    );
  }

  private showGroupDropdown(groupName: string, clickData: any): void {
    this.closeActiveDropdown();

    const group = this.users.groups.find((g) => g.name === groupName);

    this.dropdownPosition = {
      x: clickData.x + 5,
      y: clickData.y,
    };

    const dropdownItems = [
      `{bold}${groupName}{/bold}`,
      `Members: ${group?.users || 0}`,
      `Type: ${group?.private ? "Private Group" : "Public Group"}`,
      "────────────",
      "{#ff6b6b-fg}{bold}Open Group Chat{/bold}{/#ff6b6b-fg}",
      "View Members",
      "Invite Friends",
      "────────────",
      "Leave Group",
      "Group Settings",
      "────────────",
      "Close",
    ];

    this.createDropdown(
      dropdownItems,
      (selectedItem: string, index: number) => {
        this.handleGroupAction(groupName, selectedItem, index);
      }
    );
  }

  private showSectionDropdown(section: string, clickData: any): void {
    this.closeActiveDropdown();

    this.dropdownPosition = {
      x: clickData.x + 5,
      y: clickData.y,
    };

    let dropdownItems: string[] = [];
    let sectionType = "";

    if (section.includes("ONLINE USERS")) {
      sectionType = "users";
      dropdownItems = [
        "{bold}Online Users Filter{/bold}",
        "────────────",
        "{#ff6b6b-fg}{bold}Show All{/bold}{/#ff6b6b-fg}",
        "Show Only Friends",
        "Show Only Moderators",
        "Show Only Bots",
        "────────────",
        "Sort by Name (A-Z)",
        "Sort by Activity",
        "Sort by Status",
        "────────────",
        "Refresh List",
        "Close",
      ];
    } else if (section.includes("CHANNELS")) {
      sectionType = "channels";
      dropdownItems = [
        "{bold}Channels Filter{/bold}",
        "────────────",
        "{#ff6b6b-fg}{bold}Show All{/bold}{/#ff6b6b-fg}",
        "Show Only Joined",
        "Show Popular (>20 users)",
        "Show by Topic",
        "────────────",
        "Sort by Users",
        "Sort by Name",
        "Sort by Activity",
        "────────────",
        "Discover New Channels",
        "Create New Channel",
        "Close",
      ];
    } else if (section.includes("GROUPS")) {
      sectionType = "groups";
      dropdownItems = [
        "{bold}Groups Filter{/bold}",
        "────────────",
        "{#ff6b6b-fg}{bold}Show All{/bold}{/#ff6b6b-fg}",
        "Show Only My Groups",
        "Show Public Groups",
        "Show Private Groups",
        "────────────",
        "Sort by Members",
        "Sort by Name",
        "Sort by Activity",
        "────────────",
        "Discover Groups",
        "Create New Group",
        "Close",
      ];
    }

    this.createDropdown(
      dropdownItems,
      (selectedItem: string, index: number) => {
        this.handleSectionAction(sectionType, selectedItem, index);
      }
    );
  }

  // Action implementations
  private startPrivateChat(username: string): void {
    this.addSystemMessage(`Starting private chat with ${username}`);
    this.inputBox.focus();
  }

  private promptMessageToUser(username: string): void {
    this.inputBox.setValue(`/msg @${username} `);
    this.inputBox.focus();
    this.screen.render();
  }

  private inviteUserToChannel(username: string): void {
    this.addSystemMessage(`Invited @${username} to current channel`);
  }

  private showUserProfile(username: string): void {
    const profile = `
  {bold}Profile: @${username}{/bold}
  Status: Online
  Role: User
  Joined: Today
  Messages: 42
  Channels: #byteparty, #cyberlounge
  Bio: ByteParty enthusiast!
      `.trim();

    this.showInfoModal_userlist("User Profile", profile, 10, 40);
  }

  private ignoreUser(username: string): void {
    this.addSystemMessage(
      `Ignored @${username}. You won't see their messages.`
    );
  }

  private blockUser(username: string): void {
    this.addSystemMessage(
      `Blocked @${username}. They can no longer contact you.`
    );
  }

  private joinChannel(channel: string): void {
    this.addSystemMessage(`Joined ${channel}`);
  }

  private showChannelMembers(channel: string): void {
    const members = ["@ByteBot", "@CodeNinja", "@PixelPirate", "@DataDancer"];
    const membersText = members.join("\n");
    this.showInfoModal_userlist(`Members of ${channel}`, membersText, 10, 30);
  }

  private setActiveChannel(channel: string): void {
    this.addSystemMessage(`Set ${channel} as active chat`);
  }

  private leaveChannel(channel: string): void {
    this.addSystemMessage(`Left ${channel}`);
  }

  private muteChannel(channel: string): void {
    this.addSystemMessage(`Muted notifications for ${channel}`);
  }

  private openGroupChat(groupName: string): void {
    this.addSystemMessage(`Opened group chat: ${groupName}`);
  }

  private showGroupMembers(groupName: string): void {
    const members = ["@You", "@ByteBot", "@CodeNinja"];
    const membersText = members.join("\n");
    this.showInfoModal_userlist(`Members of ${groupName}`, membersText, 8, 30);
  }

  private inviteToGroup(groupName: string): void {
    this.addSystemMessage(`Opened invite dialog for ${groupName}`);
  }

  private leaveGroup(groupName: string): void {
    this.addSystemMessage(`Left group: ${groupName}`);
  }

  private showGroupSettings(groupName: string): void {
    this.addSystemMessage(`Opened settings for ${groupName}`);
  }

  private promptCreateNew(sectionType: string): void {
    const typeName = sectionType.slice(0, -1); // Remove 's'
    this.inputBox.setValue(`/create${typeName} `);
    this.inputBox.focus();
    this.screen.render();
  }

  private showInfoModal_userlist(
    title: string,
    content: string,
    height: number,
    width: number
  ): void {
    const modal = blessed.box({
      parent: this.screen,
      top: "center",
      left: "center",
      width: width,
      height: height,
      content: content,
      tags: true,
      //@ts-expect-error
      border: { type: "line", fg: "#ff6b6b" },
      style: {
        fg: "#e8d8b5",
        bg: "#2a1f1d",
      },
      keys: true,
      vi: true,
    });

    modal.key(["escape", "enter"], () => {
      modal.destroy();
      this.inputBox.focus();
      this.screen.render();
    });

    modal.focus();
    this.screen.render();
  }

  private showContextMenuAtSelected(): void {
    //@ts-expect-error
    const selectedIndex = this.userList.selected;
    if (selectedIndex < 0) return;

    const item = this.userList.getItem(selectedIndex);
    const itemText = item.getText().trim();

    // Simulate a click at the selected item position
    const listTop = this.userList.top as number;
    const fakeClickData = {
      x: (this.userList.left as number) + 2,
      y: listTop + selectedIndex,
    };

    if (itemText.startsWith("@")) {
      this.showUserDropdown(itemText.substring(1), fakeClickData);
    } else if (itemText.startsWith("#")) {
      this.showChannelDropdown(itemText, fakeClickData);
    } else if (itemText.includes("===")) {
      this.showSectionDropdown(itemText, fakeClickData);
    } else if (
      itemText &&
      !itemText.startsWith(" ") &&
      !itemText.includes("===")
    ) {
      this.showGroupDropdown(itemText, fakeClickData);
    }
  }

  /*=======================================================*
   |                     MAIN MENU                         |
   *=======================================================*/

  private executeMenuAction(action: string, menuType: string): void {
    this.closeActiveModal();

    switch (action) {
      // Key Binds actions
      case "showHelp":
        this.addSystemMessage("Opening help...");
        this.showHelpModal();
        break;
      case "throwConfetti":
        this.throwConfetti();
        break;
      case "showStats":
        this.showStats();
        break;
      case "focusNext":
        this.focusNextElement();
        break;
      case "quit":
        this.quitApplication();
        break;
      case "closeModal":
        // Already closed
        break;

      // Server actions
      case "connectLibera":
        this.connectToServer("irc.libera.chat", 6667);
        break;
      case "connectFreenode":
        this.connectToServer("irc.freenode.net", 6667);
        break;
      case "connectIRCNet":
        this.connectToServer("irc.ircnet.com", 6667);
        break;
      case "connectEFNet":
        this.connectToServer("irc.efnet.org", 6667);
        break;
      case "connectQuakeNet":
        this.connectToServer("irc.quakenet.org", 6667);
        break;
      case "addCustomServer":
        this.promptCustomServer();
        break;

      // Region actions
      case "setRegionNA":
        this.setRegion("North America");
        break;
      case "setRegionEU":
        this.setRegion("Europe");
        break;
      case "setRegionAS":
        this.setRegion("Asia");
        break;
      case "setRegionAU":
        this.setRegion("Australia");
        break;
      case "setRegionSA":
        this.setRegion("South America");
        break;
      case "setRegionAF":
        this.setRegion("Africa");
        break;

      // Help actions
      case "showQuickStart":
        this.showQuickStartGuide();
        break;
      case "showIRCCommands":
        this.showIRCCommands();
        break;
      case "showChatCommands":
        this.showChatCommands();
        break;
      case "showUserGuide":
        this.showUserGuide();
        break;
      case "showKeyBinds":
        this.showModal("menu", "key-binds"); // Recursive call
        break;
      case "showAbout":
        this.showAboutDialog();
        break;

      default:
        this.addSystemMessage(`Action ${action} not implemented`);
    }

    this.inputBox.focus();
    this.screen.render();
  }

  private quitApplication(): void {
    this.stopStatusUpdates();
    this.addSystemMessage("Goodbye! Thanks for using ByteParty.");
    setTimeout(() => process.exit(0), 1000);
  }

  private connectToServer(host: string, port: number): void {
    this.updateConnectionStatus("Connecting", host);
    this.alertStatusBar("#ff6b6b");
    this.addSystemMessage(`Connecting to ${host}:${port}...`);

    // Simulate connection
    setTimeout(() => {
      this.updateConnectionStatus("Connected", host);
      this.alertStatusBar("#00ff00");
      this.addSystemMessage(`Connected to ${host}:${port}`);
    }, 2000);
  }

  private promptCustomServer(): void {
    this.closeActiveModal();

    const modal = blessed.box({
      parent: this.screen,
      top: "center",
      left: "center",
      width: 50,
      height: 8,
      content: "{bold}Custom Server Setup{/bold}",
      tags: true,
      //@ts-expect-error
      border: { type: "line", fg: "#ff6b6b" },
      style: {
        fg: "#e8d8b5",
        bg: "#2a1f1d",
      },
    });

    const hostInput = blessed.textbox({
      parent: modal,
      top: 2,
      left: 2,
      width: "90%",
      height: 1,
      inputOnFocus: true,
      label: "Host:",
      style: {
        fg: "white",
        bg: "#4a3a35",
        focus: { fg: "#ff6b6b", bg: "#5a4a45" },
      },
    });

    const portInput = blessed.textbox({
      parent: modal,
      top: 4,
      left: 2,
      width: "90%",
      height: 1,
      inputOnFocus: true,
      label: "Port:",
      style: {
        fg: "white",
        bg: "#4a3a35",
        focus: { fg: "#ff6b6b", bg: "#5a4a45" },
      },
    });

    const connectButton = blessed.button({
      parent: modal,
      bottom: 1,
      left: "center",
      width: "shrink",
      height: 1,
      content: "{bold}Connect{/bold}",
      tags: true,
      style: {
        fg: "white",
        bg: "#ff6b6b",
        focus: { fg: "#ff6b6b", bg: "white" },
      },
    });

    hostInput.focus();

    // Handle connect button
    connectButton.on("press", () => {
      const host = hostInput.getValue();
      const port = parseInt(portInput.getValue()) || 6667;

      modal.destroy();
      this.connectToServer(host, port);
      this.screen.render();
    });

    // Handle Enter in inputs
    hostInput.on("submit", () => portInput.focus());
    portInput.on("submit", () => connectButton.focus());

    // Handle escape
    modal.key(["escape"], () => {
      modal.destroy();
      this.inputBox.focus();
      this.screen.render();
    });

    this.activeModal = modal;
    this.screen.render();
  }

  private setRegion(region: string): void {
    this.addSystemMessage(`Region set to: ${region}`);
    // Implementation for region-specific settings
  }

  private showQuickStartGuide(): void {
    const guide = modalContent_config["guide"].trim();

    this.showModal("info", {
      title: "Quick Start Guide",
      content: guide,
      height: 20,
      width: 60,
    });
  }

  private showIRCCommands(): void {
    const commands = modalContent_config["IRCcommands"].trim();

    this.showModal("info", {
      title: "IRC commands",
      content: commands,
      height: 25,
      width: 50,
    });
  }

  private showChatCommands(): void {
    const commands = modalContent_config["chatCommands"].trim();

    this.showModal("info", {
      title: "Chat Commands",
      content: commands,
      height: 25,
      width: 60,
    });
  }

  private showUserGuide(): void {
    const guide = modalContent_config["userGuide"].trim();
    this.showModal("info", {
      title: "User Guide",
      content: guide,
      height: 25,
      width: 60,
    });
  }

  private showAboutDialog(): void {
    const about = modalContent_config["about"].trim();
    this.showModal("info", {
      title: "About BytePaty",
      content: about,
      height: 20,
      width: 50,
    });
  }

  /*=======================================================*
 |                     MODAL                             |
 *=======================================================*/

  // Function overload signatures
  public showModal(type: "info", modalParams: InfoModalProps): void;
  public showModal(type: "menu", modalParams: MenuModalType): void;

  public showModal(
    type: "info" | "menu",
    modalParams: InfoModalProps | MenuModalType
  ): void {
    // Type guard to check if modalParams is InfoModalProps
    const isInfoModal = (params: any): params is InfoModalProps => {
      return params && typeof params === "object" && "title" in params;
    };

    if (type === "info" && isInfoModal(modalParams)) {
      this.showInfoModal(modalParams);
    } else if (type === "menu" && typeof modalParams === "string") {
      this.showMenuModal(modalParams as MenuModalType);
    } else {
      console.error(`Invalid parameters for showModal type: ${type}`);
    }
  }

  private showInfoModal({
    title,
    content,
    width,
    height,
  }: InfoModalProps): void {
    // close any active modal
    this.closeActiveModal();

    // modal ELEMENT and sub-elements
    //@ts-expect-error
    this.activeModal = blessed.box({
      parent: this.screen,
      width: width,
      height: height,
      content: content,
      ...ModalProps,
    });

    const titleBox = blessed.box({
      parent: this.activeModal,
      content: `{bold}{#ff6b6b-fg}${title}{/#ff6b6b-fg}{/bold}`,
      ...ModalTitleBoxProps,
    });

    // Modal key events
    this.activeModal.key(["escape", "enter", "space", "C-x"], () => {
      this.closeActiveModal();
      this.inputBox.focus();
      this.screen.render();
    });

    this.activeModal.focus();
    this.screen.render();
  }

  private showMenuModal(menuType: MenuModalType): void {
    // Close any existing modal
    this.closeActiveModal();

    const config = this.menuConfigs[menuType as keyof typeof this.menuConfigs];
    if (!config) {
      console.error(`No config found for menu type: ${menuType}`);
      return;
    }

    // Create modal container
    //@ts-expect-error
    this.activeModal = blessed.box({
      parent: this.screen,
      ...MenuModalProps,
    });

    // Create title
    const title = blessed.box({
      parent: this.activeModal,
      content: `{bold}{#ff6b6b-fg}${config.title}{/#ff6b6b-fg}{/bold}`,
      ...MenuModalTitleBoxProps,
    });

    // Create list of options
    //@ts-expect-error
    const optionList = blessed.list({
      parent: this.activeModal,
      height: config.items.length + 2,
      items: config.items.map((item) => item.label),
      ...MenuModalOptionListProps,
    });

    // Handle option selection
    optionList.on("select", (item: any, index: number) => {
      const selectedAction = config.items[index]!.action;
      this.executeMenuAction(selectedAction, menuType);
    });

    // Handle Enter key
    optionList.key(["enter"], () => {
      //@ts-expect-error
      const selected = optionList.selected;
      const selectedAction = config.items[selected]!.action;
      this.executeMenuAction(selectedAction, menuType);
    });

    // Add close instruction
    //@ts-expect-error
    const footer = blessed.box({
      parent: this.activeModal,
      ...ModalFooterProps,
    });

    // Add ESC key handler to the modal itself
    this.activeModal.key(["escape"], () => {
      this.closeActiveModal();
      this.inputBox.focus();
      this.screen.render();
    });

    // Also add to the option list (in case it's focused)
    optionList.key(["escape"], () => {
      this.closeActiveModal();
      this.inputBox.focus();
      this.screen.render();
    });

    // Position and size the modal
    const modalHeight = config.items.length + 6; // Items + title + borders + footer
    const modalWidth =
      Math.max(
        ...config.items.map((item) => item.label.length),
        config.title.length
      ) + 10;

    this.activeModal.width = modalWidth;
    this.activeModal.height = modalHeight;

    // Focus the option list
    optionList.focus();
    this.screen.render();
  }
}
