import { EventBus } from "../events/EventBus";
import { Widgets } from "blessed";

type TabType = "private" | "groups" | "channels" | "server";

interface ChatTab {
  id: string;
  type: TabType;
  label: string;
  messages: string[];
  userListItems: string[];
  unreadCount?: number;
}

export class TabManager {
  private static instance: TabManager | null = null;

  private tabs: Map<string, ChatTab> = new Map();
  private tabOrder: string[] = [];
  private activeTabId: string = "server"; //default
  private tabSegments: { start: number; end: number; tabId: string }[] = [];

  private constructor(
    private screen: Widgets.Screen,
    private messageElement: Widgets.ListElement,
    private userList: Widgets.ListElement,
    private tabBar: Widgets.BoxElement
  ) {
    this._defaultTabs_init();
    this._keybinds_init();
    this.renderTabBar();
  }

  public static getInstance(
    screen: Widgets.Screen,
    messageElement: Widgets.ListElement,
    userList: Widgets.ListElement,
    tabBar: Widgets.BoxElement
  ) {
    if (!TabManager.instance) {
      TabManager.instance = new TabManager(
        screen,
        messageElement,
        userList,
        tabBar
      );
    }

    return TabManager.instance;
  }

  private _defaultTabs_init() {
    // Main server tab
    this.createTab({
      id: "server",
      type: "server",
      label: "ByteParty Main",
      messages: ["Welcome to ByteParty!"],
      userListItems: this.buildGlobalUserList(),
    });

    // Channels tab
    this.createTab({
      id: "channels",
      type: "channels",
      label: "Channels",
      messages: ["Channel directory"],
      userListItems: this.buildChannelsList(),
    });

    // Groups tab
    this.createTab({
      id: "groups",
      type: "groups",
      label: "Groups",
      messages: ["Your groups"],
      userListItems: this.buildGroupsList(),
    });

    this.switchToTab("server");
  }

  private createTab(tab: ChatTab) {
    this.tabs.set(tab.id, tab);
    if (!this.tabOrder.includes(tab.id)) {
      this.tabOrder.push(tab.id);
    }
  }

  public openPrivateChat(username: string) {
    const id = `pm:${username.toLowerCase()}`;
    if (!this.tabs.has(id)) {
      this.createTab({
        id,
        type: "private",
        label: `@${username}`,
        messages: [`Private chat with ${username}`],
        userListItems: [`@${username} (Online)`],
        unreadCount: 0,
      });
    }
    this.switchToTab(id);
  }

  public openChannel(channel: string) {
    const id = channel;
    if (!this.tabs.has(id)) {
      this.createTab({
        id,
        type: "channels",
        label: channel,
        messages: [`Now viewing ${channel}`],
        userListItems: [`${channel} (42 users)`],
        unreadCount: 0,
      });
    }
    this.switchToTab(id);
  }

  public switchToTab(tabId: string) {
    if (!this.tabs.has(tabId)) return;

    const tab = this.tabs.get(tabId)!;
    this.activeTabId = tabId;

    // Update message list
    this.messageElement.clearItems();
    tab.messages.forEach((msg) => this.messageElement.addItem(msg));
    this.messageElement.setScrollPerc(100);

    // Update user list
    this.userList.clearItems();
    tab.userListItems.forEach((item) => this.userList.addItem(item));

    // Update status bar or title
    // APP_UI.getInstance().statusBarManager.setCurrentFocus(tab.label);

    this.screen.render();
  }

  // Helper to add message to current tab
  public addMessageToCurrent(text: string, sender: string = "Someone") {
    const tab = this.tabs.get(this.activeTabId);
    if (!tab) return;

    const timestamp = new Date().toLocaleTimeString();
    const line = `{cyan-fg}${sender}{/cyan-fg} [${timestamp}]: ${text}`;
    tab.messages.push(line);

    // If this tab is active, show it immediately
    if (this.activeTabId === tab.id) {
      this.messageElement.addItem(line);
      this.messageElement.setScrollPerc(100);
      this.screen.render();
    } else {
      tab.unreadCount = (tab.unreadCount || 0) + 1;
      //  update tab label with (3) unread later
    }
  }

  private _keybinds_init() {
    const bus = EventBus.getInstance();

    bus.on("tab:one", () => this.switchToTab("server"));
    bus.on("tab:two", () => this.switchToTab("channels"));
    bus.on("tab:three", () => this.switchToTab("groups"));

    // Alt+1, Alt+2, etc. for first 9 tabs
    for (let i = 1; i <= 9; i++) {
      bus.on(`tab:${i}`, () => {
        if (this.tabOrder[i - 1]) {
          this.switchToTab(this.tabOrder[i - 1]!);
        }
      });
    }

    this.tabBar.on("mouseover", (data: any) => {
      const hoverX = data.x;
      for (const segment of this.tabSegments) {
        if (hoverX >= segment.start && hoverX < segment.end) {
          //styles update
          break;
        }
      }
    });
  }

  // Dummy builders 
  private buildGlobalUserList(): string[] {
    return [
      "==== ONLINE USERS ====",
      "@Alice: Online",
      "@Bob: Away",
      "@Charlie: Gaming",
    ];
  }

  private buildChannelsList(): string[] {
    return [
      "==== CHANNELS ====",
      "#general (120)",
      "#random (45)",
      "#help (12)",
    ];
  }

  private buildGroupsList(): string[] {
    return [
      "==== GROUPS ====",
      "Cyber Lounge",
      "Node.js Devs",
      "Terminal Wizards",
    ];
  }


  public getActiveTabId() {
    return this.activeTabId;
  }

  public getActiveTab() {
    return this.tabs.get(this.activeTabId);
  }

  private renderTabBar() {
    this.tabSegments = []; // reset

    let content = "";
    const maxWidth = (this.tabBar.width as number) - 4; // leave padding
    let currentPos = 2; // start after left padding

    for (let i = 0; i < this.tabOrder.length; i++) {
      const id = this.tabOrder[i];
      const tab = this.tabs.get(id!)!;
      const isActive = id === this.activeTabId;
      const unread = tab.unreadCount! > 0 ? ` (${tab.unreadCount})` : "";
      let label = tab.label + unread;

      // Truncate long labels
      if (label.length > 20) {
        label = label.substring(0, 17) + "...";
      }

      let formattedLabel = "";

      if (isActive) {
        formattedLabel = `{bold}{#d4af37-bg}{black-fg}${label}{/black-fg}{/#d4af37-bg}{/bold}`;
      } else {
        formattedLabel = `{underline}${label}{/underline}`;
      }

      const plainLabel = label; // for length calculation (without tags)
      const displayText = ` ${formattedLabel} `;

      // Check if we can fit this tab
      if (currentPos + plainLabel.length + 3 > maxWidth && i > 0) {
        content += " ...";
        break;
      }

      // Record segment for click detection
      this.tabSegments.push({
        start: currentPos,
        end: currentPos + plainLabel.length + 2, // +2 for spaces
        tabId: id!,
      });

      content += displayText;
      currentPos += plainLabel.length + 3; // +3 for spaces + separator

      // Add separator except after last
      if (i < this.tabOrder.length - 1 && i < this.tabOrder.length - 1) {
        content += "{gray-fg}|{/gray-fg}";
        currentPos += 1;
      }
    }

    // Left-align with padding
    this.tabBar.setContent(" " + content);

    // Re-attach click handler every render (safe)
    this.setupTabBarClick();

    this.screen.render();
  }

  private setupTabBarClick() {
    // Remove previous listener to avoid duplicates
    this.tabBar.removeAllListeners("click");

    this.tabBar.on("click", (data: any) => {
      const clickX = data.x;

      for (const segment of this.tabSegments) {
        if (clickX >= segment.start && clickX < segment.end) {
          this.switchToTab(segment.tabId);
          return;
        }
      }
    });
  }
}
