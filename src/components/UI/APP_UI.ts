import * as blessed from "blessed";
import { Widgets } from "blessed";
import {
  menuConfig_props,
  modalContent_config,
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
import { MessageFormatter } from "../../utils/MessageFormatter";
import { FocusManager } from "../../managers/FocusManager";
import { ModalManager } from "../../managers/ModalManager";
import { DropdownManager } from "../../managers/DropdownManager";
import { StatusBarManager } from "../../managers/StatusBarManager";
import { EventBus } from "../../events/EventBus";
import { KeybindManager } from "../../managers/KeybindManager";
import { TabManager } from "../../managers/TabManager";
import { LayoutManager } from "../../managers/LayoutManager";
import { createIndexLayout } from "../Layouts/IndexLayout";
import { createChannelLayout } from "../Layouts/ChannelLayout";

interface InfoModalProps {
  title: string;
  content: string;
  height: number;
  width: number;
}

type MenuModalType = "key-binds" | "servers" | "region" | "help";

export class APP_UI {
  private static instance: APP_UI | null = null;
  private messageFormatter!: MessageFormatter;
  private focusManager!: FocusManager;
  private modalManager!: ModalManager;
  private dropdownManager!: DropdownManager;
  private tabManager!: TabManager;
  private layoutManager!: LayoutManager;
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



  private messageQueue: string[] = [];

  // keyboard shortcuts
  private shortcuts = new Map<string, () => void>();
  private isModalOpen: boolean = false;

  // menu , modals and dropdown hidden menu
  private menuActions: Map<string, () => void> = new Map();

  // menu modal content config
  private menuConfigs = { ...menuConfig_props };
  private constructor() {
    this.screen = BlessedScreen.getInstance();
  }

  public static getInstance() {
    if (!APP_UI.instance) {
      APP_UI.instance = new APP_UI();
    }
    return APP_UI.instance;
  }

  /*
   * TODO: instead of initializing all elements
   * - initialize what you want , when you need
   * */

  _managers_init_() {
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

  /*======================================================
   |                     LAYOUTS                         |
    =====================================================*/

  _layouts_init_(): void {
    // create layout manager and initialize focusManager  
    this.focusManager = FocusManager.getInstance();
    this.layoutManager = new LayoutManager(this.screen, this.focusManager);


    // Register all layouts 
    this.layoutManager.registerLayouts('index', createIndexLayout);
    this.layoutManager.registerLayouts('channel', createChannelLayout);
  }

  _indexLayout_init_(): void {
    this.layoutManager.switchTo('index');
  }

  _channelLayout_init_(): void {
    this.layoutManager.switchTo('channel');
  }

  /*=======================================================*
   |       KEYBOARD AND  ELEMENT FOCUS MANAGEMENT         |
   *=======================================================*/

  // ================= KEYBOARD SHORTCUTS =====================

  _KeyboardShortcuts_init_(): void {
    const keybinds = KeybindManager.getInstance();
    const bus = EventBus.getInstance();

    // Global shortcuts (work anywhere)
    keybinds.registerGlobal(this.screen);
    bus.on("modal:help", () => this.showHelpModal());
    bus.on("modal:stats", () => this.showStats());
    bus.on("ui:escape", () => this.handleEscapeKey());
    bus.on("ui:refresh", () => this.refreshInterface());
    bus.on("statusbar:toggle", () => this.toggleStatusDetails());

    // Component-specific shortcuts

    //input
    keybinds.registerForElement(this.inputBox, "inputBox");
    bus.on("input:clear", () => {
      this.inputBox.clearValue();
      this.screen.render();
    });



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
Users: ${""
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

  private handleEscapeKey(): void {
    if (this.modalManager.isOpen()) {
      this.modalManager.closeTop();
    } /*else if (!this.focusManager.focusInput()) {
      this.inputBox.clearValue();
      this.screen.render();
    }*/
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
    // this.addSystemMessage("Refreshing interface...");
    this.screen.realloc(); // Recalculate layout
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
      border: {
        //@ts-expect-error: type incompatibility string & number 
        type: "line", fg: "#d4af37", // Gold border
      },
      style: {
        fg: "#e8d8b5",
        bg: "#2a1f1d",
      },
    });

    modal.focus();
    modal.on("submit", (response: boolean) => {
      if (response) {
        this.EventBus.emit("app:quit");
      }
      //this.focusManager.focusInput();
      this.screen.render();
    });

    this.screen.render();
  }

  private activateSelectedMenuItem(): void {
    //@ts-expect-error
    const selected = this.menuBar.selected;
    const items = ["key-binds", "servers", "region", "help"];
    if (selected >= 0 && selected < items.length) {
      this.showModal("menu", items[selected]! as MenuModalType);
    }
  }

  /*=======================================================*
   |                  MESSAGE  LOGS                        |
   *=======================================================*/

  // INPUT LOGS
  _events_init_() {
    // Handle input submission
    this.inputBox.on("submit", (value: string) => {
      this.handleInputSubmit(value);
    });

  }

  private handleInputSubmit(value: string): void {
    if (value.trim()) {
      // Add user message to chat
      this.addUserMessage(value);

      // Clear input
      this.inputBox.clearValue();
      // Re-focus the input box
      // this.focusManager.focusInput();

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

  }

  // Process queued messages
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
   |                     MAIN MENU                         |
   *=======================================================*/

  private promptCustomServer(): void {
    const modal = blessed.box({
      parent: this.screen,
      top: "center",
      left: "center",
      width: 50,
      height: 8,
      content: "{bold}Custom Server Setup{/bold}",
      tags: true,
      border: {
        //@ts-expect-error: fg type incompatibility 'string' and 'number'
        type: "line", fg: "#d4af37", // Gold border
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
      this.EventBus.emit("irc:server_connect", host, port, 'my_nick', 'channel');
      this.screen.render();
    });

    // Handle Enter in inputs
    hostInput.on("submit", () => portInput.focus());
    portInput.on("submit", () => connectButton.focus());

    this.screen.render();
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
      //this.executeMenuAction(selectedAction, menuType);
    });

    // Handle Enter key
    optionList.key(["enter"], () => {
      //@ts-expect-error
      const selected = optionList.selected;
      const selectedAction = config.items[selected]!.action;
      //this.executeMenuAction(selectedAction, menuType);
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
