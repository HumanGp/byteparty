import * as net from 'net';
import { EventEmitter } from 'events';
import { EventBus } from '../events/EventBus';

interface IRCConfig {
  server: string;
  port: number;
  nick: string;
  username?: string;
  realname?: string;
  channel: string;
}

export class IRCService extends EventEmitter {
  private socket: net.Socket | null = null;
  private connected = false;
  private config: IRCConfig | null = null;
  private messageBuffer = '';
  private eventBus: EventBus;

  constructor() {
    super();
    this.eventBus = EventBus.getInstance();
    this.setupEventListeners();

    console.log('initialized')
  }

  private setupEventListeners() {
    this.eventBus.on('irc:server_connect', (server: string, port: number, nick: string, channel: string) => {
      this.connect({ server, port, nick, channel });
    });

     this.eventBus.on('irc:send_message', (target: string, message: string) => {
      this.sendMessage(target, message);
     });

    this.eventBus.on('irc:join_channel', (channel: string) => {
      this.joinChannel(channel);
    });

    this.eventBus.on('irc:part_channel', (channel: string) => {
      this.partChannel(channel);
    });

    this.eventBus.on('irc:quit', (message?: string) => {
      this.quit(message);
    });
  }

  public connect(config: IRCConfig): void {
    this.config = config;
    
    try {
      this.socket = net.createConnection({
        host: config.server,
        port: config.port
      }, () => {
        console.log(`Connected to ${config.server}:${config.port}`);
        this.connected = true;
        
        // IRC registration sequence
        this.sendRaw(`NICK ${config.nick}`);
        this.sendRaw(`USER ${config.nick} 0 * :${config.realname || config.nick}`);
        
        // Emit connection event for UI
        this.eventBus.emit('irc:connected', config.server, config.port);
      });

      this.setupSocketHandlers();
      
    } catch (error) {
      this.eventBus.emit('irc:error', `Connection failed: ${error}`);
    }
  }

  private setupSocketHandlers(): void {
    if (!this.socket) return;

    this.socket.on('data', (data: Buffer) => {
      this.handleData(data.toString());
    });

    this.socket.on('error', (error: Error) => {
      this.eventBus.emit('irc:error', `Socket error: ${error.message}`);
      this.connected = false;
    });

    this.socket.on('close', () => {
      this.eventBus.emit('irc:disconnected');
      this.connected = false;
      this.socket = null;
    });
  }

  private handleData(data: string): void {
    // IRC messages end with \r\n
    this.messageBuffer += data;
    const lines = this.messageBuffer.split('\r\n');
    
    // Keep the last incomplete line in the buffer
    this.messageBuffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.trim()) {
        this.parseIRCMessage(line);
      }
    }
  }

  private parseIRCMessage(line: string): void {
    // Basic IRC message parsing
    // Format: [:prefix] command [params...] :trailing
    
    let prefix = '';
    let command = '';
    const params: string[] = [];
    
    let remaining = line;
    
    // Check for prefix
    if (remaining.startsWith(':')) {
      const spaceIndex = remaining.indexOf(' ');
      if (spaceIndex > -1) {
        prefix = remaining.substring(1, spaceIndex);
        remaining = remaining.substring(spaceIndex + 1);
      }
    }
    
    // Get command
    const spaceIndex = remaining.indexOf(' ');
    if (spaceIndex > -1) {
      command = remaining.substring(0, spaceIndex);
      remaining = remaining.substring(spaceIndex + 1);
    } else {
      command = remaining;
      remaining = '';
    }
    
    // Parse params
    while (remaining.length > 0) {
      if (remaining.startsWith(':')) {
        // Trailing parameter
        params.push(remaining.substring(1));
        break;
      }
      
      const nextSpace = remaining.indexOf(' ');
      if (nextSpace > -1) {
        params.push(remaining.substring(0, nextSpace));
        remaining = remaining.substring(nextSpace + 1);
      } else {
        params.push(remaining);
        break;
      }
    }
    
    // Emit parsed message
    this.eventBus.emit('irc:raw_message', { prefix, command, params });
    
    // Handle specific numeric responses and commands
    this.handleIRCEvent(command, prefix, params);
  }

  private handleIRCEvent(command: string, prefix: string, params: string[]): void {
    switch (command) {
      case '001': // RPL_WELCOME
        this.eventBus.emit('irc:registered');
        // Join channel after successful registration
        if (this.config?.channel) {
          this.joinChannel(this.config.channel);
        }
        break;
        
      case 'PRIVMSG':
        if (prefix.includes('!')) {
          const nick = prefix.split('!')[0];
          const channel = params[0];
          const message = params[1];
          this.eventBus.emit('irc:message', nick, channel, message);
        }
        break;
        
      case 'JOIN':
        if (prefix.includes('!')) {
          const nick = prefix.split('!')[0];
          const channel = params[0];
          this.eventBus.emit('irc:join', nick, channel);
        }
        break;
        
      case 'PART':
        if (prefix.includes('!')) {
          const nick = prefix.split('!')[0];
          const channel = params[0];
          this.eventBus.emit('irc:part', nick, channel);
        }
        break;
        
      case 'QUIT':
        if (prefix.includes('!')) {
          const nick = prefix.split('!')[0];
          const message = params[0];
          this.eventBus.emit('irc:quit_user', nick, message);
        }
        break;
        
      case 'PING':
        // Respond to PING with PONG
        this.sendRaw(`PONG :${params[0]}`);
        break;
        
      // Numeric replies for names list
      case '353': // RPL_NAMREPLY
        const channel = params[2];
        const names = params[3]!.split(' ');
        this.eventBus.emit('irc:names', channel, names);
        break;
        
      case '366': // RPL_ENDOFNAMES
        this.eventBus.emit('irc:names_end', params[1]);
        break;
    }
  }

  public sendMessage(target: string, message: string): void {
    if (!this.connected || !this.socket) {
      this.eventBus.emit('irc:error', 'Not connected to server');
      return;
    }
    
    this.sendRaw(`PRIVMSG ${target} :${message}`);
  }

  public joinChannel(channel: string): void {
    this.sendRaw(`JOIN ${channel}`);
  }

  public partChannel(channel: string, message?: string): void {
    if (message) {
      this.sendRaw(`PART ${channel} :${message}`);
    } else {
      this.sendRaw(`PART ${channel}`);
    }
  }

  public quit(message?: string): void {
    if (message) {
      this.sendRaw(`QUIT :${message}`);
    } else {
      this.sendRaw('QUIT');
    }
    
    if (this.socket) {
      this.socket.end();
      this.socket.destroy();
    }
  }

  private sendRaw(line: string): void {
    if (this.socket && this.connected) {
      this.socket.write(line + '\r\n');
      console.log('>', line); // Debug
    }
  }

  public isConnected(): boolean {
    return this.connected;
  }
}
