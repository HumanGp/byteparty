/*------------------------------------------------------------------------*\
 *                          APP STATE LAYOOUTS
 *------------------------------------------------------------------------*/
import { CreateLayoutCallback, Layout, LayoutType } from "@/types/Layout";
import { Widgets } from "blessed";
import { FocusManager } from "./FocusManager";

export class LayoutManager {
  private currentLayout: LayoutType = 'index';
  private layouts: Map<LayoutType, Layout> = new Map();

  constructor(
    private screen: Widgets.Screen,
    private focusManager: FocusManager) {
  }

  registerLayouts(layout: LayoutType, callback: CreateLayoutCallback) {
    this.layouts.set(layout, callback(this.screen));
    // after elements generetion hide them 
    this.layouts.get(layout)?.elements.forEach(el => el.hide());
    // ... more layouts later
  }

  switchTo(layout: LayoutType) {
    // Hide all elements from current layout 
    this.layouts.get(this.currentLayout)?.elements.forEach(el => el.hide());
    this.focusManager.clearRegisteredList();

    // Show and focus new layout 
    const newLayout = this.layouts.get(layout);
    newLayout?.elements.forEach(el => {
      el.show();
      // register layout elements to focus manager 
      this.focusManager.register(el);
    });
    newLayout?.onActivate?.();


    // Update focus 
    if (newLayout?.focusOrder.length) {
      newLayout.focusOrder[0]?.focus();
    };

    this.currentLayout = layout;
    this.screen.render();
  }
}

