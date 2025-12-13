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

class ByteParty {
  private ui!: APP_UI;
  private chatSimulator!: DemoSimulator;

  constructor() {
    this.ui = APP_UI.getInstance();
    this.chatSimulator = new DemoSimulator(this.ui);
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
}

// Start the chat
const chat = new ByteParty();
chat.start();
