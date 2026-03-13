/*-------------------------------------------------------------------------
 *                          APP STATE LAYOUT MANAGMENT
 *------------------------------------------------------------------------*/
import { createIndexLayout } from "@/components/Layouts/IndexLayout";
import { CreateLayoutCallback, Layout, LayoutType } from "@/types/Layout";
import { Widgets } from "blessed";

export class LayoutManager {
  private currentLayout: LayoutType = 'index';
  private layouts: Map<LayoutType, Layout> = new Map();

  constructor(private screen: Widgets.Screen) {
  }

  registerLayouts(layout: LayoutType, callback: CreateLayoutCallback) {
    this.layouts.set(layout, callback(this.screen));
    // ... more layouts later
  }

  switchTo(layout: LayoutType) {
    // Hide all elements from current layout 
    this.layouts.get(this.currentLayout)?.elements.forEach(el => el.hide());

    // Show and focus new layout 
    const newLayout = this.layouts.get(layout);
    newLayout?.elements.forEach(el => el.show());
    newLayout?.onActivate?.();

    // Update focus 
    if (newLayout?.focusOrder.length) {
      newLayout.focusOrder[0]?.focus();
    }

    this.currentLayout = layout;
    this.screen.render();
  }
}

