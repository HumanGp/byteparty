import { EventBus } from "../../../events/EventBus";
import { Widgets } from "blessed";

/**
 * Manages tab-cycle focus between UI elements,
 * highlights the active one, and tracks focus state.
 */
export class FocusManager {
  private static instance: FocusManager | null = null;
  private cycle: Widgets.BlessedElement[] = [];
  private currentIndex = 0;
  private onFocusChange?: (
    element: Widgets.BlessedElement,
    index: number
  ) => void;

  private constructor(
    onFocusChange?: (element: Widgets.BlessedElement, index: number) => void
  ) {
    this.onFocusChange = onFocusChange!;
    EventBus.getInstance().on("focus:next", () => this.next());
    EventBus.getInstance().on("focus:previous", () => this.previous());
    EventBus.getInstance().on("focus:input", () => this.focusInput());
    EventBus.getInstance().on("focus:users", () => this.focusUserList());
    EventBus.getInstance().on("focus:menu", () => this.focusMenu());
    EventBus.getInstance().on("focus:messages", () => this.focusMessages());
  }

  public static getInstance(
    onFocusChange?: (element: Widgets.BlessedElement, index: number) => void
  ) {
    if (!FocusManager.instance) {
      FocusManager.instance = new FocusManager(onFocusChange);
    }
    return FocusManager.instance;
  }

  /**
   * Register elements in the order they should be cycled.
   * Call this once during UI initialization.
   */
  public register(...elements: Widgets.BlessedElement[]): void {
    this.cycle = elements.filter((el) => el && typeof el.focus === "function");
    if (this.cycle.length > 0 && this.currentIndex >= this.cycle.length) {
      this.currentIndex = 0;
    }
  }

  /**
   * Focus the next element in the cycle (Tab)
   */
  public next(): void {
    if (this.cycle.length === 0) return;

    this.currentIndex = (this.currentIndex + 1) % this.cycle.length;
    this.focusCurrent();
  }

  /**
   * Focus the previous element in the cycle (Shift+Tab)
   */
  public previous(): void {
    if (this.cycle.length === 0) return;

    this.currentIndex =
      (this.currentIndex - 1 + this.cycle.length) % this.cycle.length;
    this.focusCurrent();
  }

  /**
   * Directly focus a specific element by reference
   */
  public focus(element: Widgets.BlessedElement): boolean {
    const index = this.cycle.indexOf(element);
    if (index !== -1) {
      this.currentIndex = index;
      this.focusCurrent();
      return true;
    }
    return false;
  }

  /**
   * Focus by index (useful for shortcuts like Ctrl+I → input)
   */
  public focusByIndex(index: number): boolean {
    if (index >= 0 && index < this.cycle.length) {
      this.currentIndex = index;
      this.focusCurrent();
      return true;
    }
    return false;
  }

  /**
   * Convenience shortcuts
   */
  public focusInput(): boolean {
    return this.focusByIndex(0);
  }
  public focusMessages(): boolean {
    return this.focusByIndex(1);
  }
  public focusUserList(): boolean {
    return this.focusByIndex(2);
  }
  public focusMenu(): boolean {
    return this.focusByIndex(3);
  }

  /**
   * Get current focused element
   */
  public getCurrent(): Widgets.BlessedElement | null {
    return this.cycle[this.currentIndex] || null;
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public getCycleLength(): number {
    return this.cycle.length;
  }

  /**
   * Highlight the currently focused element
   * Customize this to match your theme
   */
  public highlightCurrent(): void {
    // First, reset all
    this.cycle.forEach((el) => {
      if (el.style && el.style.border) {
        el.style.border = { type: "line", fg: "#d4af37" }; // default/red
      }
    });

    // Then highlight active
    const active = this.cycle[this.currentIndex];
    if (active && active.style && active.style.border) {
      active.style.border = { type: "line", fg: "#00ff00" }; // green = focused
    }
  }

  private focusCurrent(): void {
    const element = this.cycle[this.currentIndex];
    if (element) {
      element.focus();
      this.highlightCurrent();
      this.onFocusChange?.(element, this.currentIndex);
    }
  }
}
