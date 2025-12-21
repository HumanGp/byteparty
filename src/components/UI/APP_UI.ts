import * as blessed from "blessed";
import { Widgets } from "blessed";
import {
  menuConfig_props,
  modalContent_config,
  onlineusersConfig_props,
} from "./configs";
import {
  inputBoxProps,
  MenuModalOptionListProps,
  MenuModalProps,
  MenuModalTitleBoxProps,
  menuProps,
  messageBoxProps,
  ModalFooterProps,
  ModalProps,
  ModalTitleBoxProps,
  statusBarProps,
  tabBarProps,
  userDropdownProps,
  userListProps,
} from "./ui";

import { BlessedScreen } from "./BlessedScreen";
import { BootAnimation } from "../../animations/BootAnimation";
import { MessageFormatter } from "./messages/MessageFormatter";
import { FocusManager } from "./focus/FocusManager";
import { ModalManager } from "./modals/ModalManager";
import { DropdownManager } from "./dropdowns/DropdownManager";
import { StatusBarManager } from "./status/StatusBarManager";
import { EventBus } from "../../events/EventBus";
import { KeybindManager } from "../../input/KeybindManager";
import { TabManager } from "./tabs/TabManager";

interface InfoModalProps {
  title: string;
  content: string;
  height: number;
  width: number;
}

type MenuModalType = "key-binds" | "servers" | "region" | "help";

export class APP_UI {
  private static instance: APP_UI | null = null;

  private bootAnimation!: BootAnimation;
  private messageFormatter!: MessageFormatter;
  private focusManager!: FocusManager;
  private modalManager!: ModalManager;
  private dropdownManager!: DropdownManager;
  private tabManager!: TabManager;
  public statusBarManager!: StatusBarManager;


  private EventBus!: EventBus;

  // UI elements
  public screen!: Widgets.Screen;
  public messageList!: Widgets.ListElement;
  public userList!: Widgets.ListElement;
  public inputBox!: Widgets.TextboxElement;
  public header!: Widgets.BoxElement;
  public messageBoxWidth!: number;
  public menuBar!: Widgets.ListbarElement;
  public statusBar!: Widgets.BoxElement;
  public userDropdown!: Widgets.ListElement;
  public tabBar!: Widgets.BoxElement;

  private onBootComplete: (() => void) | null = null;

  private messageQueue: string[] = [];

  // keyboard shortcuts
  private shortcuts = new Map<string, () => void>();
  private isModalOpen: boolean = false;

  // menu , modals and dropdown hidden menu
  private menuActions: Map<string, () => void> = new Map();

  // menu modal content config
  private menuConfigs = { ...menuConfig_props };
  // user list data structure
  private users = { ...onlineusersConfig_props };

  private constructor() {
    this.screen = BlessedScreen.getInstance();
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

    this.bootAnimation = new BootAnimation(this.screen, () => {
      this._tui_init();
      this.setupEvents();
      this.setupKeyboardShortcuts();
      this.processMessageQueue();

      if (this.onBootComplete) {
        this.onBootComplete();
        this.onBootComplete = null;
      }
    });

    this.bootAnimation.start();
  }

  private _tui_init(): void {
    //@ts-expect-error
    this.menuBar = blessed.listbar(menuProps);
    this.messageList = blessed.list(messageBoxProps);
    this.userList = blessed.list(userListProps);
    this.statusBar = blessed.box(statusBarProps);
    //@ts-expect-error
    this.inputBox = blessed.textbox(inputBoxProps);
    //@ts-expect-error
    this.userDropdown = blessed.list({
      parent: this.userList,
      ...userDropdownProps,
    });

    this.tabBar = blessed.box({
      parent: this.screen,
      ...tabBarProps
    });

    // Append everything — header is already appended by BootAnimation
    this.screen.append(this.messageList);
    this.screen.append(this.userList);
    this.screen.append(this.inputBox);
    this.screen.append(this.menuBar);
    this.screen.append(this.statusBar);
    this.screen.append(this.tabBar);

    // Now safe to create managers
    this.messageBoxWidth = this.messageList.width as number;

    this._managers_init_();

    this.statusBarManager.startUpdates();

    this.focusManager.register(
      this.inputBox,
      this.messageList,
      this.userList,
      this.menuBar
    );

    this.focusManager.focusInput();
    

    // Test messages
    this.addSystemMessage(`MessageList width: ${this.messageBoxWidth}`);
    this.addSystemMessage("Welcome to ByteParty! Animation complete.");
  }

  private _managers_init_() {
    this.statusBarManager = new StatusBarManager(this.statusBar, this.screen);
    this.focusManager = FocusManager.getInstance((_, index) => {
      const names = ["Input", "Messages", "User List", "Menu"];
      this.statusBarManager.setCurrentFocus(names[index] ?? "Unkown");
    });
    this.modalManager = new ModalManager(this.screen, (isOpen) => {
      this.isModalOpen = isOpen;
      this.statusBarManager.setModalOpen(isOpen);
    });
    this.dropdownManager = new DropdownManager(this.screen);
    this.messageFormatter = new MessageFormatter(this.messageList);
    this.tabManager = TabManager.getInstance(this.screen, this.messageList, this.userList, this.tabBar);
    this.screen.enableMouse();
  }


  /*=======================================================*
   |       KEYBOARD AND  ELEMENT FOCUS MANAGEMENT         |
   *=======================================================*/

  // ================= KEYBOARD SHORTCUTS =====================

  private setupKeyboardShortcuts(): void {
    const keybinds = KeybindManager.getInstance();
    const bus = EventBus.getInstance();

    // Global shortcuts (work anywhere)
    keybinds.registerGlobal(this.screen);
    bus.on("modal:help", () => this.showHelpModal());
    bus.on("modal:stats", () => this.showStats());
    bus.on("ui:confetti", () => this.throwConfetti());
    bus.on("ui:escape", () => this.handleEscapeKey());
    bus.on("ui:refresh", () => this.refreshInterface());
    bus.on("ui:screenshot", () => this.takeScreenshot());
    bus.on("message:clear", () => this.clearChat());
    bus.on("mode:command", () => this.enterCommandMode());
    bus.on("mode:search", () => this.enterSearchMode());
    bus.on("statusbar:toggle", () => this.toggleStatusDetails());

    // Component-specific shortcuts

   //input
    keybinds.registerForElement(this.inputBox, "inputBox");
    bus.on("input:history-up", () => this.navigateCommandHistory("up"));
    bus.on("input:history-down", () => this.navigateCommandHistory("down"));
    bus.on("input:message-send", () => this.sendCurrentMessage());
    bus.on("input:clear", () => {
      this.inputBox.clearValue();
      this.screen.render();
    });
    bus.on("input:users-autocomplete", () => {
      setTimeout(() => this.showUserAutocomplete(), 50);
    });
    bus.on("input:channels-autocomplete", () => {
      setTimeout(() => this.showChannelAutocomplete(), 10);
    });
    bus.on('input:word-navigate', (ch, key) => {
    // Word navigation (needs custom implementation)
      // Alt+B, Alt+F
      // Meta key navigation for word movement
      this.handleWordNavigation(key.full);
    })
        // Input
    bus.on('input:cursor-move', () => {
      // Beginning of line
      // Blessed doesn't expose cursor position directly, but we can simulate
      this.inputBox.setValue(this.inputBox.getValue());
      this.screen.render();
    });
    bus.on('input:cursor-end', () => {
      // End of line
      // Similar limitation, but we can focus end
      this.focusManager.focusInput();
      this.screen.render();
    })    

    //messageList
    keybinds.registerForElement(this.messageList, "messageList");
    bus.on("messagelist:pageup", () => {
      this.messageList.scroll(-10);
      this.screen.render();
    });
    bus.on("messagelist:pagedown", () => {
      this.messageList.scroll(10);
      this.screen.render();
    });
    bus.on("messagelist:home", () => {
      this.messageList.setScrollPerc(0);
      this.screen.render();
    });
    bus.on("messagelist:end", () => {
      this.messageList.setScrollPerc(100);
      this.screen.render();
    });
    bus.on("messagelist:search", () => this.searchInMessages());
    bus.on("messagelist:next", () => this.findNextInMessages());
    bus.on("messagelist:previous", () => this.findPreviousInMessages());
    bus.on("messagelist:copy", () => this.copySelectedMessage());
    bus.on("messagelist:reply", () => this.replyToSelectedMessage());
    bus.on("messagelist:read-toggle", () => this.toggleMessageRead());

    //userList
    keybinds.registerForElement(this.userList, "userList");
    bus.on("userlist:enter", () => this.handleUserListEnter());
    bus.on("userlist:space", () => this.showUserContextMenu());
    bus.on("userlist:m", () => this.messageSelectedUser());
    bus.on("userlist:i", () => this.inviteSelectedUser());
    bus.on("userlist:v", () => this.viewSelectedUserProfile());
    bus.on("userlist:b", () => this.blockSelectedUser());
    bus.on("userlist:f", () => this.toggleUserFilter());
    bus.on("userlist:g", () => this.toggleGrouping());
    bus.on("userlist:t", () => this.toggleUserList());
    bus.on("userlist:/", () => this.filterUserList());

    //menuBar
    keybinds.registerForElement(this.menuBar, "menuBar");
    bus.on("menubar:enter", () => this.activateSelectedMenuItem());
    bus.on("menubar:left", () => {
      //@ts-expect-error
      this.menuBar.left();
      this.screen.render();
    });
    bus.on("menubar:right", () => {
      //@ts-expect-error
      this.menuBar.right();
      this.screen.render();
    });
    bus.on("menubar:t", () => this.toggleMenuBar());
    bus.on("menubar:1", () => this.selectMenuItem(0));
    bus.on("menubar:2", () => this.selectMenuItem(1));
    bus.on("menubar:3", () => this.selectMenuItem(2));
    bus.on("menubar:4", () => this.selectMenuItem(4));
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
{cyan-fg}ByteParty Status{/cyan-fg} | Focus: ${this.focusManager.getCurrentIndex()} | Messages: ${
        //@ts-expect-error
        this.messageList.items.length
      } | 
Users: ${
        ""
        /** TODO: */
        //  this.statusInfo.users
      } | Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)}MB
    `
        .trim()
        .replace(/\n/g, " | ");
      this.statusBar.setContent(details);
    }

    this.screen.render();

    // Auto-switch back after 5 seconds
    setTimeout(() => {
      this.statusBarManager.update();
    }, 5000);
  }

  public updateConnectionStatus(
    status: "Connected" | "Connecting" | "Disconnected" | "Error",
    server?: string
  ): void {
    let fullStatus = status;
    if (server) fullStatus += ` (${server})`;
    this.statusBarManager.setConnectionStatus(fullStatus);

    if (status === "Connected") {
      this.statusBarManager.alert("#00ff00");
    } else if (status === "Connecting") {
      this.statusBarManager.alert("#ffff00");
    } else {
      this.statusBarManager.alert("#d4af37");
    }
  }

  private handleEscapeKey(): void {
    if (this.modalManager.isOpen()) {
      this.modalManager.closeTop();
    } else if (!this.focusManager.focusInput()) {
      this.inputBox.clearValue();
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
Focus: ${this.focusManager.getCurrentIndex()}
Elements: ${this.focusManager.getCycleLength()}
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
    this.statusBarManager.showTemporary("Refreshing interface...");
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

  private enterSearchMode(): void {
    this.focusManager.focusInput();
    this.inputBox.setValue("/");
    this.screen.render();
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
      border: {type: "line",fg: "#d4af37", // Gold border
      },
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
      this.focusManager.focusInput();
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
      this.focusManager.focusInput();
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
        this.focusManager.focusInput();
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
      border: {type: "line",fg: "#d4af37", // Gold border
      },
      style: {
        fg: "#e8d8b5",
        bg: "#2a1f1d",
      },
    });

    modal.focus();
    modal.on("submit", (value: string) => {
      this.executeCommand(value);
      this.focusManager.focusInput();
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
        this.focusManager.focusInput();
        break;
      case "focus messages":
        this.focusManager.focusMessages();
        break;
      case "focus users":
        this.focusManager.focusUserList();
        break;
      case "focus menu":
        this.focusManager.focusMenu();
        break;
      default:
        this.addSystemMessage(`Command not found: ${command}`);
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
      this.focusManager.focusInput();

      // Also ensure it's highlighted in focus cycle
      // this.currentFocusIndex = 0; // Input box is index 0
      this.focusManager.highlightCurrent();
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

      this.statusBarManager.setQueuedMessages(0);
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
      this.statusBarManager.setQueuedMessages(this.messageQueue.length);
      return;
    }
    this.addMessage("System", text, "#d4af37");
  }

  private addMessage(
    user: string,
    text: string,
    color: string = "#e8d8b5"
  ): void {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `{${color}-fg}{bold}${user}{/bold}{/${color}-fg} [${timestamp}]: ${text}`;
    this.messageFormatter.add(formatted);
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

    this.focusManager.focusInput();
    this.screen.render();
  }

  private handleChannelAction(
    channel: string,
    action: string,
    index: number
  ): void {
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

    this.focusManager.focusInput();
    this.screen.render();
  }

  private handleGroupAction(
    groupName: string,
    action: string,
    index: number
  ): void {
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

    this.focusManager.focusInput();
    this.screen.render();
  }

  private handleSectionAction(
    sectionType: string,
    action: string,
    index: number
  ): void {
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

    this.focusManager.focusInput();
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
    const user = this.users.online.find((u) => u.name === `@${username}`);
    if (!user) return;

    // Calculate dropdown position near the click
    const position = {
      x: clickData.x + 5,
      y: clickData.y,
    };

    const items = [
      `{bold}${user.name} ${user.status}{/bold}`,
      `Role: ${user.role}`,
      "────────────",
      "{#d4af37-fg}{bold}Start Private Chat{/bold}{/#d4af37-fg}",
      "Send Message",
      "Invite to Channel",
      "View Profile",
      "────────────",
      "Ignore User",
      "{red-fg}Block User{/red-fg}",
      "────────────",
      "Close",
    ];

    this.dropdownManager.show(
      items,
      position,
      (selectedItem: string, index: number) => {
        this.handleUserAction(username, selectedItem, index);
      }
    );
  }

  private showChannelDropdown(channel: string, clickData: any): void {
    const chan = this.users.channels.find((c) => c.name === channel);

    const position = {
      x: clickData.x + 5,
      y: clickData.y,
    };

    const items = [
      `{bold}${channel}{/bold}`,
      `Users: ${chan?.users || 0}`,
      `Topic: ${chan?.topic?.substring(0, 20) || "No topic"}...`,
      "────────────",
      "{#d4af37-fg}{bold}Join Channel{/bold}{/#d4af37-fg}",
      "View Members",
      "Set as Active",
      "────────────",
      "Leave Channel",
      "Mute Notifications",
      "────────────",
      "Close",
    ];

    this.dropdownManager.show(
      items,
      position,
      (selectedItem: string, index: number) => {
        this.handleChannelAction(channel, selectedItem, index);
      }
    );
  }

  private showGroupDropdown(groupName: string, clickData: any): void {
    const group = this.users.groups.find((g) => g.name === groupName);

    const position = {
      x: clickData.x + 5,
      y: clickData.y,
    };

    const items = [
      `{bold}${groupName}{/bold}`,
      `Members: ${group?.users || 0}`,
      `Type: ${group?.private ? "Private Group" : "Public Group"}`,
      "────────────",
      "{#d4af37-fg}{bold}Open Group Chat{/bold}{/#d4af37-fg}",
      "View Members",
      "Invite Friends",
      "────────────",
      "Leave Group",
      "Group Settings",
      "────────────",
      "Close",
    ];

    this.dropdownManager.show(
      items,
      position,
      (selectedItem: string, index: number) => {
        this.handleGroupAction(groupName, selectedItem, index);
      }
    );
  }

  private showSectionDropdown(section: string, clickData: any): void {
    const position = {
      x: clickData.x + 5,
      y: clickData.y,
    };

    let items: string[] = [];
    let sectionType = "";

    if (section.includes("ONLINE USERS")) {
      sectionType = "users";
      items = [
        "{bold}Online Users Filter{/bold}",
        "────────────",
        "{#d4af37-fg}{bold}Show All{/bold}{/#d4af37-fg}",
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
      items = [
        "{bold}Channels Filter{/bold}",
        "────────────",
        "{#d4af37-fg}{bold}Show All{/bold}{/#d4af37-fg}",
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
      items = [
        "{bold}Groups Filter{/bold}",
        "────────────",
        "{#d4af37-fg}{bold}Show All{/bold}{/#d4af37-fg}",
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

    this.dropdownManager.show(
      items,
      position,
      (selectedItem: string, index: number) => {
        this.handleSectionAction(sectionType, selectedItem, index);
      }
    );
  }

  // Action implementations
  private startPrivateChat(username: string): void {
    this.tabManager.openPrivateChat(username);
    this.addSystemMessage(`Starting private chat with ${username}`);
    this.focusManager.focusInput();
  }

  private promptMessageToUser(username: string): void {
    this.inputBox.setValue(`/msg @${username} `);
    this.focusManager.focusInput();
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
    this.tabManager.openChannel(channel);
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
    // this.tabManager.;
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
        this.focusManager.focusInput();

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
      border: {type: "line",fg: "#d4af37", // Gold border
      },
      style: {
        fg: "#e8d8b5",
        bg: "#2a1f1d",
      },
      keys: true,
      vi: true,
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
        this.focusManager.next();
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

    this.focusManager.focusInput();
    this.screen.render();
  }

  private quitApplication(): void {
    this.statusBarManager.stopUpdates();
    this.addSystemMessage("Goodbye! Thanks for using ByteParty.");
    setTimeout(() => process.exit(0), 1000);
  }

  private connectToServer(host: string, port: number): void {
    this.updateConnectionStatus("Connecting", host);
    this.statusBarManager.alert("#d4af37");
    this.addSystemMessage(`Connecting to ${host}:${port}...`);

    // Simulate connection
    setTimeout(() => {
      this.updateConnectionStatus("Connected", host);
      this.statusBarManager.alert("#00ff00");
      this.addSystemMessage(`Connected to ${host}:${port}`);
    }, 2000);
  }

  private promptCustomServer(): void {
    const modal = blessed.box({
      parent: this.screen,
      top: "center",
      left: "center",
      width: 50,
      height: 8,
      content: "{bold}Custom Server Setup{/bold}",
      tags: true,
      //@ts-expect-error
      border: {type: "line",  fg: "#d4af37", // Gold border
      },
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
        focus: { fg: "#d4af37", bg: "#5a4a45" },
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
        focus: { fg: "#d4af37", bg: "#5a4a45" },
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
        bg: "#d4af37",
        focus: { fg: "#d4af37", bg: "white" },
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
    //@ts-expect-error
    const modal = blessed.box({
      parent: this.screen,
      width: width,
      height: height,
      content: content,
      ...ModalProps,
    });

    const titleBox = blessed.box({
      parent: modal,
      content: `{bold}{#d4af37-fg}${title}{/#d4af37-fg}{/bold}`,
      ...ModalTitleBoxProps,
    });

    // Modal key events
    modal.key(["escape", "enter", "space", "C-x"], () => {
      this.modalManager.closeTop();
    });

    this.modalManager.open(modal);
  }

  private showMenuModal(menuType: MenuModalType): void {
    const config = this.menuConfigs[menuType as keyof typeof this.menuConfigs];
    if (!config) {
      console.error(`No config found for menu type: ${menuType}`);
      return;
    }

    // Create modal container
    //@ts-expect-error
    const modal = blessed.box({
      parent: this.screen,
      ...MenuModalProps,
    });

    // Create title
    const title = blessed.box({
      parent: modal,
      content: `{bold}{#d4af37-fg}${config.title}{/#d4af37-fg}{/bold}`,
      ...MenuModalTitleBoxProps,
    });

    // Create list of options
    //@ts-expect-error
    const optionList = blessed.list({
      parent: modal,
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

    // escape key for optionList
    optionList.key(["escape"], () => this.modalManager.closeTop());

    // Add close instruction
    //@ts-expect-error
    const footer = blessed.box({
      parent: modal,
      ...ModalFooterProps,
    });

    // Position and size the modal
    const modalHeight = config.items.length + 6; // Items + title + borders + footer
    const modalWidth =
      Math.max(
        ...config.items.map((item) => item.label.length),
        config.title.length
      ) + 10;

    modal.width = modalWidth;
    modal.height = modalHeight;

    this.modalManager.open(modal);
    // Focus the option list
    optionList.focus();
  }
}
