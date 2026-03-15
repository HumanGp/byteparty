/**
 * BUGS IN THIS FILE:
 * - [MODULE_NOT_FOUND]: I currently have a tsconfig file which has a compilerOptions configs which contains a baseUrl value of "./src"
 *   and a paths value of {"@/*": ["*"]}, and a include property which has value  ["src\/**\/*"] (ignore back ticks escape)
 *   so this enables me to import some modules with a `@` annotation with respect to src directory
 *   but it is strange that when i import types with this annotation, it works but when i import events module it raises errors
 *   in this current file and other files are included in the require stack error, but when i replace the events module import with
 *   normal dot tree reference it works and the require stack doesn't complain.
 */

import { EventBus } from "../../events/EventBus";
import { Layout } from '@/types/Layout';
import * as blessed from 'blessed';
import { Widgets } from 'blessed';
import {
  channelInputProps,
  channelLabelProps,
  connectBtnProps,
  connectionBoxProps,
  containerProps,
  footerProps,
  nickInputProps,
  nickLabelProps,
  quickConnectProps,
  serverInputProps,
  serverLabelProps
} from "../UI/ui";


export function createIndexLayout(screen: Widgets.Screen): Layout {

  /*=======================================================*
   |              BLESSED TUI ELEMENTS                     |
   *=======================================================*/

  const container = blessed.box({ parent: screen, ...containerProps });
  //@ts-expect-error: type fg incompability  string & number
  const connectionBox = blessed.box({ parent: container, ...connectionBoxProps });
  const nickLabel = blessed.text({ parent: connectionBox, ...nickLabelProps });
  const nickInput = blessed.textbox({ parent: connectionBox, ...nickInputProps });
  const serverLabel = blessed.text({ parent: connectionBox, ...serverLabelProps });
  const serverInput = blessed.textbox({ parent: connectionBox, ...serverInputProps });
  const channelLabel = blessed.text({ parent: connectionBox, ...channelLabelProps });
  const channelInput = blessed.textbox({ parent: connectionBox, ...channelInputProps });
  const connectBtn = blessed.button({ parent: connectionBox, ...connectBtnProps });
  //@ts-expect-error: type fg incompability string & number
  const quickConnect = blessed.list({ parent: container, ...quickConnectProps });
  const footer = blessed.box({ parent: container, ...footerProps });

  // Handle connection
  const connect = () => {
    const nick = nickInput.getValue() || 'guest';
    const server = serverInput.getValue() || 'irc.libera.chat';
    const channel = channelInput.getValue() || '#byteparty';

    // Emit connection event and Switch to channel layout
    const eventBus = EventBus.getInstance();

    eventBus.emit("irc:server_connect", server, 6667, nick, channel);
  };

  connectBtn.on('press', connect);
  connectBtn.key(['enter'], connect);

  // Quick connect selection
  quickConnect.on('select', (item, index) => {
    switch (index) {
      case 0:
        serverInput.setValue('irc.libera.chat');
        channelInput.setValue('#byteparty');
        break;
      case 1:
        serverInput.setValue('irc.libera.chat');
        channelInput.setValue('#irchelp');
        break;
      case 2:
        serverInput.setValue('irc.oftc.net');
        channelInput.setValue('#debian');
        break;
      case 3:
        serverInput.setValue('irc.efnet.org');
        channelInput.setValue('#mirc');
        break;
      case 4:
        // Custom - just focus server input
        serverInput.focus();
        return;
    }
    connect();
  });


  // Enter in inputs moves to next field
  nickInput.on('submit', () => serverInput.focus());
  serverInput.on('submit', () => channelInput.focus());
  channelInput.on('submit', connect);

  return {
    type: 'index',
    elements: [container, connectionBox, quickConnect, footer],
    focusOrder: [nickInput, serverInput, channelInput, quickConnect],
  };
}
