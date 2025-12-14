import * as fs from "fs";
import * as path from "path";
import { Widgets } from "blessed";
import { EventBus } from "../events/EventBus";
import keybinds from "../config/keybinds.json";

interface KeybindConfig {
  global?: Record<string, string>;
  [component: string]: Record<string, string> | undefined;
}

export class KeybindManager {
  private static instance: KeybindManager | null = null;
  private config: KeybindConfig;
  private eventBus: EventBus;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.config = keybinds as KeybindConfig;
  }

  public static getInstance(): KeybindManager {
    if (!KeybindManager.instance) {
      KeybindManager.instance = new KeybindManager();
    }
    return KeybindManager.instance;
  }

  public registerGlobal(screen: Widgets.Screen): void {
    const global = this.config.global || {};
    Object.entries(global).forEach(([key, action]) => {
      screen.key([key], () => {
        this.eventBus.emit(action);
      });
    });
  }

  public registerForElement(element: Widgets.BlessedElement, componentName: string): void {
    const bindings = this.config[componentName];
    if (!bindings) return;

    Object.entries(bindings).forEach(([key, action]) => {
      element.key([key], () => {
        this.eventBus.emit(action);
      });
    });
  }
}
