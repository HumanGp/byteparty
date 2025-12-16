/**
 * TERMINAL CHAT - ByteParty
 */

import { Socket } from "net";
import { APP_UI } from "./src/components/UI/APP_UI";
import { DemoSimulator } from "./src/components/lib/test";
import { startClient } from "./src/core/irc/client"; // Changed from Client to startClient for clarity

class ByteParty {
  private ui: APP_UI;
  private chatSimulator: DemoSimulator;
  private ircSocket?: Socket; // store IRC socket

  constructor() {
    this.ui = APP_UI.getInstance();
    this.chatSimulator = new DemoSimulator(this.ui);
  }

  public async start(): Promise<void> {
    // Render initial UI
    this.ui.screen.render();

    // Boot application with callback
    this.ui.bootApplication(() => {
      this.onBootComplete();
    });
  }

  private onBootComplete(): void {
    // Welcome messages
    this.ui.addSystemMessage(
      "Welcome to Westhetic Chat! Type /help for commands."
    );
    this.ui.addSystemMessage("Connected users: 12");
    this.ui.addSystemMessage(
      "Type /simulate to start chat simulation with 50+ users"
    );

    // Focus input box
    this.ui.inputBox.focus();
    this.ui.screen.render();

    // Setup command handlers
    this.setupSimulationCommands();
  }

  private setupSimulationCommands(): void {
    const originalHandleCommand = (this.ui as any).handleCommand;

    (this.ui as any).handleCommand = (command: string) => {
      const parts = command.substring(1).split(" "); // Remove "/" prefix
      const cmd = parts[0]?.toLowerCase();

      switch (cmd) {
        case "connect":
          // Connect to IRC server
          const socket = startClient(); // startClient returns the connected socket
          this.ircSocket = socket;
          this.setupSocketListeners(socket);
          break;

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

  private setupSocketListeners(socket: Socket): void {
    let buffer = "";

    // Handle incoming data
    socket.on("data", (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split("\r\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        this.ui.addSystemMessage(line);

        // Respond to PING
        if (line.startsWith("PING")) {
          const pong = line.replace("PING", "PONG");
          socket.write(`${pong}\r\n`);
        }
      }
    });

    // Handle errors
    socket.on("error", (err: Error) => {
      this.ui.addSystemMessage(`❌ IRC Error: ${err.message}`);
    });

    // Handle disconnect
    socket.on("close", () => {
      this.ui.addSystemMessage("🔌 IRC Disconnected");
    });
  }
}

// Start the chat
const chat = new ByteParty();
chat.start();
