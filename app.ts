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
import { BootAnimation } from "./src/components/animations/BootAnimation";
import { EventBus } from "./src/events/EventBus";
import { IRCService } from "./src/services/IRCService"

class App {
  private ui!: APP_UI;
  private eventBus: EventBus;
  private bootAnimation!: BootAnimation;
  private ircService!: IRCService;

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.ui = APP_UI.getInstance();
    this.ircService = new IRCService();
  }

  public start(): void {
    this.ui.screen.render();
    this.bootApplication();
  }

  private _app_init_(): void {
    // initialize global events and use index layout as default
    this._global_events_init_();
    this.ui._layouts_init_();
    this.ui._indexLayout_init_();
  }

  /*=======================================================*
  |                 BOOT THE APPLICATION                  |
  *=======================================================*/

  public async bootApplication(): Promise<void> {
    this.bootAnimation = new BootAnimation(this.ui.screen, () => this._app_init_());
    this.bootAnimation.start();
  }

   /*=======================================================*
   |                  CONNECT TO IRC SERVER                |
   *=======================================================*/
  public connectToServer(server: string, port: number, nick: string, channel: string) {
    // The IRCService is already listening for this event via its own event listeners
    // So we don't need to do anything here except maybe show a connecting message
    
    //  Show connecting status
    console.log(`Connecting to ${server}:${port} as ${nick}...`);
    
    // The channel layout will be rendered when we actually connect
    // Let's listen for the connection success event
    this.eventBus.once('irc:registered', () => {
      // Now switch to channel layout
      this.ui._channelLayout_init_();
    });
  }

  /*=======================================================*
   |                  EVENT HANDLERS                        |
   *=======================================================*/
  public _global_events_init_(): void {
    // handle quit 
    this.eventBus.on('app:quit', () => {
      console.log('app quit')
    });

    // handle irc server connect
    this.eventBus.on("irc:server_connect", (server: string, port: string, nick: string, channel: string) => {
      this.connectToServer(server, parseInt(port) || 6667, nick, channel);
    });

    return;
  }

}

// Start the chat
const chat = new App();
chat.start();
