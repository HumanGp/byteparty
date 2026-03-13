import { Layout } from '@/types/Layout';
import * as blessed from 'blessed';
import { Widgets } from 'blessed';
import { APP_UI } from '../UI/APP_UI';

export function createIndexLayout(screen: Widgets.Screen): Layout {
  const container = blessed.box({
    parent: screen,
    top: 9, // immediately after the header which created dynamically by the typewritter
    left: 0,
    width: '100%',
    height: '100%',
    style: { bg: '#000000' }
  });

  // Simple connection form 
  const connectionBox = blessed.box({
    parent: container,
    top: 0,
    left: 'center',
    width: 60,
    height: 8,
    //@ts-expect-error: fg border property type incompability 'string' and 'number'
    border: { type: 'line', fg: '#d4af37' },
    style: { fg: '#e8d8b5', bg: '#000000' }
  });

  const nickLabel = blessed.text({
    parent: connectionBox,
    top: 1,
    left: 2,
    content: 'Nick:',
    style: { fg: '#d4af37' }
  });

  const nickInput = blessed.textbox({
    parent: connectionBox,
    top: 1,
    left: 10,
    width: 30,
    height: 1,
    inputOnFocus: true,
    value: 'guest' + Math.floor(Math.random() * 1000),
    style: {
      fg: 'white',
      bg: '#1a1a1a',
      focus: { fg: '#d4af37', bg: '#2a2a2a' }
    }
  });

  const serverLabel = blessed.text({
    parent: connectionBox,
    top: 3,
    left: 2,
    content: 'Server:',
    style: { fg: '#d4af37' }
  });

  const serverInput = blessed.textbox({
    parent: connectionBox,
    top: 3,
    left: 10,
    width: 30,
    height: 1,
    inputOnFocus: true,
    value: 'irc.libera.chat',
    style: {
      fg: 'white',
      bg: '#1a1a1a',
      focus: { fg: '#d4af37', bg: '#2a2a2a' }
    }
  });

  const channelLabel = blessed.text({
    parent: connectionBox,
    top: 5,
    left: 2,
    content: 'Channel:',
    style: { fg: '#d4af37' }
  });

  const channelInput = blessed.textbox({
    parent: connectionBox,
    top: 5,
    left: 10,
    width: 30,
    height: 1,
    inputOnFocus: true,
    value: '#byteparty',
    style: {
      fg: 'white',
      bg: '#1a1a1a',
      focus: { fg: '#d4af37', bg: '#2a2a2a' }
    }
  });

  const connectBtn = blessed.button({
    parent: connectionBox,
    bottom: 0,
    right: 0,
    width: 20,
    height: 1,
    content: '{bold}[ Connect ]{/bold}',
    tags: true,
    style: {
      fg: 'black',
      bg: '#d4af37',
      focus: { fg: '#d4af37', bg: 'white' },
      hover: { bg: '#e8d8b5' }
    },
    mouse: true,
    keys: true
  });

  // Quick connect to popular networks (like an IRC client's server list)
  const quickConnect = blessed.list({
    parent: container,
    top: 9, // immediately after connectionBox
    left: 'center',
    width: 60,
    height: 6,
    label: ' Quick Connect ',
    //@ts-expect-error: fg border property type incompability 'string' and 'number'
    border: { type: 'line', fg: '#d4af37' },
    style: {
      fg: '#e8d8b5',
      bg: '#000000',
      selected: { fg: '#d4af37', bg: '#2a1f1d' }
    },
    items: [
      '{cyan-fg}➤{/cyan-fg} irc.libera.chat  - #byteparty',
      '{cyan-fg}➤{/cyan-fg} irc.libera.chat  - #irchelp',
      '{cyan-fg}➤{/cyan-fg} irc.oftc.net     - #debian',
      '{cyan-fg}➤{/cyan-fg} irc.efnet.org    - #mirc',
      '{cyan-fg}➤{/cyan-fg} Custom connection...'
    ],
    keys: true,
    vi: true
  });

  // Footer with classic IRC-style status line
  const footer = blessed.box({
    parent: container,
    bottom: 1,
    left: 0,
    width: '100%',
    height: 1,
    content: '{reverse} [Tab:nav] [Enter:connect] [F1:help] [F2:servers] [F10:quit] {/reverse}',
    tags: true,
    style: { fg: 'black', bg: '#d4af37' }
  });

  // Handle connection
  const connect = () => {
    const nick = nickInput.getValue() || 'guest';
    const server = serverInput.getValue() || 'irc.libera.chat';
    const channel = channelInput.getValue() || '#byteparty';

    // Switch to channel layout
    const app = APP_UI.getInstance();
    app.connectToServer(server, 6667, nick, channel);
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

  // Tab navigation between inputs and quick connect
  const elements = [nickInput, serverInput, channelInput, connectBtn, quickConnect];
  let currentElement = 0;

  container.key(['tab'], () => {
    currentElement = (currentElement + 1) % elements.length;
    elements[currentElement]!.focus();
  });

  container.key(['S-tab'], () => {
    currentElement = (currentElement - 1 + elements.length) % elements.length;
    elements[currentElement]!.focus();
  });

  // Enter in inputs moves to next field
  nickInput.on('submit', () => serverInput.focus());
  serverInput.on('submit', () => channelInput.focus());
  channelInput.on('submit', connect);

  return {
    type: 'index',
    elements: [container,
	   // motd,
	    connectionBox, quickConnect, footer],
    focusOrder: [nickInput, serverInput, channelInput, connectBtn, quickConnect],
    onActivate: () => {
      nickInput.focus();
    }
  };
}
