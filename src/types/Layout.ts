import { Widgets } from "blessed";

export type LayoutType = 'index' | 'channel' | 'private';

export type CreateLayoutCallback = (screen: Widgets.Screen) => Layout;

export interface Layout {
  type: LayoutType;
  elements: Widgets.BlessedElement[];
  focusOrder: Widgets.BlessedElement[];
  onActivate?: () => void;
  OnDeactivate?: () => void;
}
