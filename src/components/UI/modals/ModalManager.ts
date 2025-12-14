import { Widgets } from "blessed";

/**
 * Centralized manager for all modals.
 * Handles opening, closing, escape keys, and focus restoration.
 */

export class ModalManager {
  private stack: Widgets.BoxElement[] = [];
  private screen: Widgets.Screen;
  private onModalStateChange?: (isOpen: boolean) => void;
  private previousFocus?: Widgets.BlessedElement;

  constructor(
    screen: Widgets.Screen,
    onModalStateChange?: (isOpen: boolean) => void
  ) {
    this.screen = screen;
    this.onModalStateChange = onModalStateChange!;
  }

  /**
   * Opens a modal and manages focus + escape handling automatically.
   */
  public open(modal: Widgets.BoxElement): void {
    // Store current focus to restore later
    this.previousFocus = this.screen.focused as Widgets.BlessedElement;

    // Add to stack
    this.stack.push(modal);

    // Append to screen if not already parented
    if (modal.parent !== this.screen) {
      this.screen.append(modal);
    }

    // Standard escape handling
    modal.key(["escape"], () => {
      this.closeTop();
    });

    // Focus the modal
    modal.focus();

    // Notify (useful for status bar updates)
    this.onModalStateChange?.(true);

    this.screen.render();
  }

  /**
   * Closes the topmost modal
   */
  public closeTop(): void {
    const modal = this.stack.pop();
    if (!modal) return;

    modal.detach(); // safer than destroy() if you reuse modals
    // Or modal.destroy() if it's one-time use

    // Restore previous focus if we have one
    if (this.stack.length === 0 && this.previousFocus) {
      // Small delay to avoid race conditions with blessed
      setTimeout(() => {
        this.previousFocus?.focus();
        this.screen.render();
      }, 50);
    }

    // If there are still modals open, focus the new top one
    if (this.stack.length > 0) {
      this.stack[this.stack.length - 1]!.focus();
    }

    // Notify if no modals left
    if (this.stack.length === 0) {
      this.onModalStateChange?.(false);
    }

    this.screen.render();
  }

  /**
   * Closes all modals at once
   */
  public closeAll(): void {
    while (this.stack.length > 0) {
      const modal = this.stack.pop();
      modal?.detach();
    }
    this.previousFocus?.focus();
    this.onModalStateChange?.(false);
    this.screen.render();
  }

  /**
   * Check if any modal is currently open
   */
  public isOpen(): boolean {
    return this.stack.length > 0;
  }

  /**
   * Get the topmost modal (useful for rare overrides)
   */
  public getTop(): Widgets.BoxElement | null {
    return this.stack[this.stack.length - 1] || null;
  }
}

