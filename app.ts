/**
'##::::'##:'##::::'##:'##::::'##::::'###::::'##::: ##::'######:::'########::'########:
 ##:::: ##: ##:::: ##: ###::'###:::'## ##::: ###:: ##:'##... ##:: ##.... ##:... ##..::
 ##:::: ##: ##:::: ##: ####'####::'##:. ##:: ####: ##: ##:::..::: ##:::: ##:::: ##::::
 #########: ##:::: ##: ## ### ##:'##:::. ##: ## ## ##: ##::'####: ########::::: ##::::
 ##.... ##: ##:::: ##: ##. #: ##: #########: ##. ####: ##::: ##:: ##.....:::::: ##::::
 ##:::: ##: ##:::: ##: ##:.:: ##: ##.... ##: ##:. ###: ##::: ##:: ##::::::::::: ##::::
 ##:::: ##:. #######:: ##:::: ##: ##:::: ##: ##::. ##:. ######::: ##::::::::::: ##::::
..:::::..:::.......:::..:::::..::..:::::..::..::::..:::......::::..::::::::::::..:::::
                        TERMINAL CHAT - ByteParty
*/


import { APP_UI } from "./src/components/UI/APP_UI";
import { DemoSimulator } from "./src/components/lib/test";
import { EventBus } from "./src/events/EventBus";

class App {
  private static instance: App | null = null;
  private ui!: APP_UI;
  private chatSimulator!: DemoSimulator;
  private eventBus: EventBus;
  private running = false;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.ui = APP_UI.getInstance();
    this.chatSimulator = new DemoSimulator(this.ui);
    this.setupGlobalEventListeners();
  }

  public static getInstance(): App {
    if (!App.instance) {
      App.instance = new App();
    }
    return App.instance;
  }

  public async start(): Promise<void> {
    this.ui.screen.render();
    this.ui.bootApplication(() => {
    this.onBootComplete();
    });
  }

  private onBootComplete(): void {
    this.ui.addSystemMessage(
      "Welcome to Westhetic Chat! Type /help for commands."
    );
    this.ui.addSystemMessage("Connected users: 12");

    //  simulation command
    this.ui.addSystemMessage(
      "Type /simulate to start chat simulation with 50+ users"
    );

    // Focus the input box
    this.ui.inputBox.focus();
    this.ui.screen.render();

    //  simulation command handler
    this.setupSimulationCommands();
  }

  private setupSimulationCommands(): void {
    const originalHandleCommand = (this.ui as any).handleCommand;

    (this.ui as any).handleCommand = (command: string) => {
      const parts = command.substring(1).split(" ");
      const cmd = parts[0]!.toLowerCase();

      switch (cmd) {
        case "simulate":
        case "sim":
        case "//sssiiimmm":
          this.chatSimulator.startSimulation();
          break;

        case "stopsim":
        case "stopsimulation":
          this.chatSimulator.stopSimulation();
          break;

        case "simstatus":
          this.ui.addSystemMessage(
            this.chatSimulator.isSimulating
              ? "Simulation is ACTIVE with 50+ users"
              : "Simulation is INACTIVE"
          );
          break;

        default:
          // Call original handler
          if (originalHandleCommand) {
            originalHandleCommand.call(this.ui, command);
          }
      }
    };
  }

  public setupGlobalEventListeners(): void {
    // Quit request from UI
    this.eventBus.on("app:quit", () => {

      this.quit();
    });

    // Connection events, etc.
    this.eventBus.on(
      "connection:status",
      (status: "Connected" | "Connecting" | "Disconnected" | "Error") => {
        this.ui.updateConnectionStatus(status);
      }
    );

    // Any other cross-cutting concerns
  }

  public quit(): void {
    this.ui.statusBarManager.stopUpdates();
    this.ui.addSystemMessage("Shutting down ByteParty... Goodbye!");
    // Give UI time to show message
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  }
}

// Start the chat
const chat = App.getInstance();
chat.start();
