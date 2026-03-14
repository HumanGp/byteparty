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

class App {
  private ui!: APP_UI;
  private eventBus: EventBus;
  private bootAnimation!: BootAnimation;

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.ui = APP_UI.getInstance();
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
   |                  CONNECT TO IRC SERVER                |                  |
   *=======================================================*/
  public connectToServer(server: string, port: string, nick: string, channel: string) {
    // connect to server and update layout  

    //TODO: IRC SERVER CONNECTION

    // render channel layout after server connection success
    this.ui._channelLayout_init_();
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
      this.connectToServer(server, port, nick, channel);
    });

    return;
  }

}

// Start the chat
const chat = new App();
chat.start();
