import * as blessed from 'blessed';
import { Widgets } from "blessed";

/**
 * Centralized manager for context dropdown menus.
 * Handles creation, positioning, selection, and auto-closing.
 */
export class DropdownManager {
  private screen: Widgets.Screen;
  private activeDropdown: Widgets.ListElement | null = null;
  private onCloseCallback?: () => void;

  constructor(screen: Widgets.Screen) {
    this.screen = screen;
  }

  /**
   * Shows a dropdown at the specified position.
   * @param items Array of strings (with blessed tags supported)
   * @param position { x, y } relative to screen
   * @param onSelect Callback when an item is selected (receives text and index)
   * @param onClose Optional callback when dropdown closes
   */
  public show(
    items: string[],
    position: { x: number; y: number },
    onSelect: (itemText: string, index: number) => void,
    onClose?: () => void
  ): void {
    this.close(); // Close any existing

    this.onCloseCallback = onClose!;

    // Calculate optimal width
    const plainItems = items.map(i => i.replace(/\{[^}]+\}/g, ""));
    const maxWidth = Math.max(...plainItems.map(i => i.length)) + 4;

    // Create the dropdown list
    this.activeDropdown = blessed.list({
      parent: this.screen,
      top: position.y,
      left: position.x,
      width: maxWidth,
      height: items.length + 2,
      items: items,
      tags: true,
      mouse: true,
      keys: true,
      vi: true,
      shadow: true,
      //@ts-expect-error
      border: { type: "line", fg: "#ff6b6b" },
      style: {
        bg: "#2a1f1d",
        item: { fg: "#a08c76" },
        selected: { bg: "#ff6b6b", fg: "white" },
      },
    });

    // Selection handling
    this.activeDropdown.on("select", (item: any, index: number) => {
      const text = item.getText();
      if (text.includes("────") || text === "Close") {
        this.close();
        return;
      }
      this.close();
      onSelect(text, index);
    });

    // Enter key
    this.activeDropdown.key(["enter"], () => {
      //@ts-expect-error
      const selected = this.activeDropdown!.selected;
      const text = this.activeDropdown!.getItem(selected).getText();
      if (text.includes("────") || text === "Close") {
        this.close();
      } else {
        this.close();
        onSelect(text, selected);
      }
    });

    // Escape
    this.activeDropdown.key(["escape"], () => this.close());

    // Click outside to close
    const clickHandler = (data: any) => {
      if (!this.activeDropdown) return;
      const { x, y } = data;
      const left = this.activeDropdown.left as number;
      const top = this.activeDropdown.top as number;
      const width = this.activeDropdown.width as number;
      const height = this.activeDropdown.height as number;

      if (x < left || x > left + width || y < top || y > top + height) {
        this.close();
      }
    };

    this.screen.once("click", clickHandler);
    // Store to remove later
    (this.activeDropdown as any)._outsideClickHandler = clickHandler;

    this.activeDropdown.focus();
    this.screen.render();
  }

  /**
   * Closes the current dropdown if open
   */
  public close(): void {
    if (!this.activeDropdown) return;

    // Remove outside click listener
    const handler = (this.activeDropdown as any)._outsideClickHandler;
    if (handler) {
      this.screen.removeListener("click", handler);
    }

    this.activeDropdown.detach();
    this.activeDropdown = null;

    this.onCloseCallback?.();
    this.screen.render();
  }

  /**
   * Check if a dropdown is currently open
   */
  public isOpen(): boolean {
    return this.activeDropdown !== null;
  }
}
