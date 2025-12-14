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

      // Global escape to quit (handled by App class later)
      BlessedScreen.instance.key(["C-c"], () => {
        // We don't call process.exit here — emit event instead
        // But for now, fallback if nothing listens
        process.exit(0);
      });
    }

    return BlessedScreen.instance;
  }

  /**
   *  Destroy the screen (useful for tests or hot reloads)
   */
  public static destroy(): void {
    if (BlessedScreen.instance) {
      BlessedScreen.instance.destroy();
      BlessedScreen.instance = null;
    }
  }
}
