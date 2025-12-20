import * as blessed from "blessed";
import { Widgets } from "blessed";
import { screenProps } from "./ui"; 

export class BlessedScreen {
  private static instance: Widgets.Screen | null = null;

  private constructor() { };

  public static getInstance(): Widgets.Screen {
    if (!BlessedScreen.instance) {
      BlessedScreen.instance = blessed.screen({
        ...screenProps,
        smartCSR: true, 
        dockBorders: true, 
        ignoreDockContrast: true,
      });
    }

    return BlessedScreen.instance;
  }
}
