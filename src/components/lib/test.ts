import { APP_UI } from "../UI/APP_UI";

/*=======================================================*
 |                     TESTING                           |
 *=======================================================*/

/**
 * Simulates hundreds of conversations happening simultaneously in the app
 * Creates realistic chat patterns with users, channels, and system messages
 */

export class DemoSimulator {
  public isSimulating = false;
  private intervalIds: NodeJS.Timeout[] = [];

  // Simulation configurations
  private config = {
    userCount: 50,
    channelCount: 10,
    groupCount: 5,
    messageInterval: { min: 100, max: 2000 }, // ms between messages
    conversationBursts: { min: 3, max: 10 }, // messages per conversation burst
    burstInterval: { min: 5000, max: 15000 }, // ms between bursts
  };

  // User data for simulation
  private users = [
    "ghost",
    "byteBot",
    "codeNinja",
    "pixelPirate",
    "dataDancer",
    "cyberSamurai",
    "neonKnight",
    "matrixMage",
    "binaryBard",
    "quantumQueen",
    "cryptoCat",
    "serverSerpent",
    "debugDruid",
    "loopLich",
    "arrayAdept",
    "functionFox",
    "classCleric",
    "objectOgre",
    "variableValkyrie",
    "syntaxSiren",
    "protocolPhoenix",
    "apiAlchemist",
    "cloudCorsair",
    "terminalTitan",
    "shellShaman",
    "gitGoblin",
    "repoRanger",
    "mergeMage",
    "commitCleric",
    "branchBarbarian",
    "kernelKnight",
    "daemonDruid",
    "processPirate",
    "threadThief",
    "memoryMage",
    "cacheCorsair",
    "bufferBard",
    "stackShaman",
    "heapHerald",
    "queueQueen",
    "networkNecro",
    "packetPaladin",
    "routerRogue",
    "switchSorcerer",
    "firewallFury",
    "encryptorElf",
    "decryptorDwarf",
    "hashHuntress",
    "saltSamurai",
    "keyKeeper",
  ];

  private channels = [
    "#main-hall",
    "#byteparty",
    "#cyberlounge",
    "#coders-corner",
    "#retro-gaming",
    "#music-chat",
    "#tech-talk",
    "#art-gallery",
    "#book-club",
    "#food-fight",
    "#random",
    "#help-desk",
    "#showcase",
    "#vent-space",
    "#game-night",
  ];

  private groups = [
    "Development Team",
    "Gaming Buddies",
    "Study Group",
    "Music Lovers",
    "Movie Club",
    "Book Worms",
    "Foodies United",
    "Travel Crew",
    "Fitness Friends",
    "Art Collective",
  ];

  // Common message patterns
  private greetings = [
    "Hey everyone!",
    "Good morning!",
    "What's up?",
    "How's it going?",
    "Yo!",
    "Hello there!",
    "Hi folks!",
    "Greetings!",
    "Sup?",
    "Howdy!",
  ];

  private questions = [
    "Does anyone know how to fix this bug?",
    "What's your favorite programming language?",
    "Any recommendations for good movies?",
    "Has anyone tried the new game?",
    "What music are you listening to?",
    "Need help with my project...",
    "Best IDE for JavaScript?",
    "Linux or Windows for development?",
    "Favorite coffee shop to work from?",
    "Best practices for React hooks?",
  ];

  private responses = [
    "I can help with that!",
    "That's a great question.",
    "I've been wondering the same thing.",
    "Let me check...",
    "According to the docs...",
    "In my experience...",
    "Have you tried...",
    "I think you should...",
    "Maybe consider...",
    "One approach could be...",
  ];

  private reactions = [
    "😂",
    "😄",
    "😮",
    "😍",
    "👏",
    "🔥",
    "💯",
    "🎉",
    "🤔",
    "👍",
    "❤️",
    "✨",
    "🌟",
    "💫",
    "🙌",
    "👀",
    "💀",
    "🤯",
    "🥳",
    "🎯",
  ];

  private codeSnippets = [
    "`const x = 42;`",
    "```js\nfunction hello() {\n  console.log('world');\n}\n```",
    "`npm install awesome-package`",
    "`git commit -m 'fix: resolve issue'`",
    "```python\ndef greet(name):\n    return f'Hello {name}'\n```",
    "`docker run -it ubuntu`",
    "`SELECT * FROM users WHERE active = true;`",
    "`<div className='app'>Hello World</div>`",
    "`System.out.println('Java');`",
    "`print('Python is awesome')`",
  ];

  private systemEvents = [
    "{green-fg}🟢 @{user} has joined the chat{/green-fg}",
    "{yellow-fg}🟡 @{user} is now away{/yellow-fg}",
    "{red-fg}🔴 @{user} has left the chat{/red-fg}",
    "{blue-fg}📢 System maintenance in 5 minutes{/blue-fg}",
    "{purple-fg}🎮 Game night starting in #game-night{/purple-fg}",
    "{cyan-fg}📚 Study session scheduled for tomorrow{/cyan-fg}",
    "{magenta-fg}🎵 Now playing in #music-chat: {song}{/magenta-fg}",
    "{green-fg}📈 Server stats: {users} users online, {channels} active channels{/green-fg}",
  ];

  private ui: APP_UI;

  constructor(ui: APP_UI) {
    this.ui = ui;
    this.initializeUsers();
  }

  
  /**
   * Initialize simulated users
   */
  private initializeUsers(): void {
    // Shuffle users for variety
    this.users = this.shuffleArray([...this.users]);
    this.channels = this.shuffleArray([...this.channels]);
    this.groups = this.shuffleArray([...this.groups]);
  }

  /**
   * Start the conversation simulation
   */
  public startSimulation(): void {
    this.ui.addSystemMessage('initialized simulate ');

    if (this.isSimulating) {
      this.ui.addSystemMessage("Simulation is already running!");
      return;
    }

    this.isSimulating = true;
    this.ui.addSystemMessage("🚀 Starting chat simulation with 50+ users...");

    // Start different types of conversations
    this.startMainChannelActivity();
    this.startRandomPrivateChats();
    this.startGroupConversations();
    this.startSystemEvents();
    this.startChannelSpecificActivity();
    this.startCodeReviewSession();
    this.startGamingChat();
    this.startMusicStream();

    this.ui.addSystemMessage(
      "✅ Chat simulation active. Type /stopsim to stop."
    );
  }

  /**
   * Stop all simulation activity
   */
  public stopSimulation(): void {
    this.isSimulating = false;
    this.intervalIds.forEach((id) => clearInterval(id));
    this.intervalIds = [];
    this.ui.addSystemMessage("🛑 Chat simulation stopped.");
  }

  /**
   * Start main channel activity (high traffic)
   */
  private startMainChannelActivity(): void {
    const mainChannelSim = () => {
      if (!this.isSimulating) return;

      // Simulate conversation bursts
      const burstCount = this.randomInt(3, 8);

      for (let i = 0; i < burstCount; i++) {
        setTimeout(() => {
          if (!this.isSimulating) return;

          const user = this.randomUser();
          const messageType = Math.random();

          let message = "";
          if (messageType < 0.3) {
            message = this.randomGreeting();
          } else if (messageType < 0.6) {
            message = this.randomQuestion();
          } else if (messageType < 0.8) {
            message = this.randomResponse();
          } else {
            message = this.randomCodeSnippet();
          }

          this.simulateMessage(user, "#main-hall", message);
        }, i * this.randomInt(200, 800));
      }
    };

    // Run every 3-8 seconds
    const interval = setInterval(mainChannelSim, this.randomInt(3000, 8000));
    this.intervalIds.push(interval);
  }

  /**
   * Start random private chats between users
   */
  private startRandomPrivateChats(): void {
    const privateChatSim = () => {
      if (!this.isSimulating) return;

      // Start 1-3 private conversations
      const conversationCount = this.randomInt(1, 4);

      for (let i = 0; i < conversationCount; i++) {
        const user1 = this.randomUser();
        const user2 = this.randomUser();

        if (user1 === user2) continue;

        // Simulate a back-and-forth conversation
        this.simulatePrivateConversation(user1, user2);
      }
    };

    // Run every 10-20 seconds
    const interval = setInterval(privateChatSim, this.randomInt(10000, 20000));
    this.intervalIds.push(interval);
  }

  /**
   * Start group conversations
   */
  private startGroupConversations(): void {
    const groupSim = () => {
      if (!this.isSimulating) return;

      const group = this.randomGroup();
      const userCount = this.randomInt(3, 7);
      const users = this.getRandomUsers(userCount);

      // Simulate group discussion
      users.forEach((user, index) => {
        setTimeout(() => {
          if (!this.isSimulating) return;

          const message = this.randomFromArray([
            this.randomQuestion(),
            this.randomResponse(),
            `In ${group}, we should discuss...`,
            `I agree with @${
              users[(index - 1 + users.length) % users.length]
            }!`,
            `${this.randomReaction()} ${this.randomReaction()}`,
          ]);

          this.simulateGroupMessage(user, group, message);
        }, index * this.randomInt(500, 1500));
      });
    };

    // Run every 15-30 seconds
    const interval = setInterval(groupSim, this.randomInt(15000, 30000));
    this.intervalIds.push(interval);
  }

  /**
   * Start system events and notifications
   */
  private startSystemEvents(): void {
    const systemEventSim = () => {
      if (!this.isSimulating) return;

      const event = this.randomSystemEvent();
      this.ui.addSystemMessage(event);
    };

    // Run every 20-40 seconds
    const interval = setInterval(systemEventSim, this.randomInt(20000, 40000));
    this.intervalIds.push(interval);
  }

  /**
   * Start channel-specific activity
   */
  private startChannelSpecificActivity(): void {
    this.channels.forEach((channel, index) => {
      const channelSim = () => {
        if (!this.isSimulating) return;

        const user = this.randomUser();
        let message = "";

        switch (channel) {
          case "#music-chat":
            message = this.randomFromArray([
              `Now playing: ${this.randomSong()}`,
              `Anyone listening to ${this.randomArtist()}?`,
              `Just discovered this amazing album!`,
              `🎵 ${this.randomSong()} 🎵`,
            ]);
            break;

          case "#game-night":
            message = this.randomFromArray([
              `Anyone up for ${this.randomGame()}?`,
              `Just got a new high score!`,
              `Need a team for the raid tonight`,
              `🏆 Victory! 🏆`,
            ]);
            break;

          case "#coders-corner":
            message = this.randomFromArray([
              this.randomCodeSnippet(),
              `Getting error: ${this.randomError()}`,
              `Just finished implementing ${this.randomFeature()}`,
              `PR ready for review: ${this.randomPR()}`,
            ]);
            break;

          default:
            message = this.randomFromArray([
              this.randomGreeting(),
              this.randomQuestion(),
              this.randomResponse(),
            ]);
        }

        this.simulateMessage(user, channel, message);
      };

      // Each channel has different activity levels
      const interval = setInterval(
        channelSim,
        this.randomInt(5000 + index * 1000, 15000 + index * 2000)
      );
      this.intervalIds.push(interval);
    });
  }

  /**
   * Simulate a code review session
   */
  private startCodeReviewSession(): void {
    const codeReviewSim = () => {
      if (!this.isSimulating) return;

      const reviewer = this.randomUser();
      const author = this.randomUser();

      if (reviewer === author) return;

      // Simulate code review conversation
      setTimeout(() => {
        this.simulateMessage(
          author,
          "#coders-corner",
          `PR ready: ${this.randomPR()}`
        );
      }, 0);

      setTimeout(() => {
        this.simulateMessage(
          reviewer,
          "#coders-corner",
          `@${author} Looking at it now...`
        );
      }, 2000);

      setTimeout(() => {
        this.simulateMessage(
          reviewer,
          "#coders-corner",
          `Found an issue on line ${this.randomInt(
            1,
            100
          )}: ${this.randomError()}`
        );
      }, 5000);

      setTimeout(() => {
        this.simulateMessage(
          author,
          "#coders-corner",
          `Fixed! Thanks @${reviewer}`
        );
      }, 8000);

      setTimeout(() => {
        this.simulateMessage(
          reviewer,
          "#coders-corner",
          `LGTM! ${this.randomReaction()}`
        );
      }, 11000);
    };

    // Run code review every 45-90 seconds
    const interval = setInterval(codeReviewSim, this.randomInt(45000, 90000));
    this.intervalIds.push(interval);
  }

  /**
   * Simulate gaming chat activity
   */
  private startGamingChat(): void {
    const gamingSim = () => {
      if (!this.isSimulating) return;

      const players = this.getRandomUsers(4);
      const game = this.randomGame();

      players.forEach((player, index) => {
        setTimeout(() => {
          if (!this.isSimulating) return;

          const messages = [
            `Ready up for ${game}!`,
            `I'll play ${this.randomClass()}`,
            `Strategy: ${this.randomStrategy()}`,
            `GLHF! ${this.randomReaction()}`,
          ];

          this.simulateMessage(
            player,
            "#game-night",
            messages[index] || "Let's go!"
          );
        }, index * 1000);
      });
    };

    // Run every 30-60 seconds
    const interval = setInterval(gamingSim, this.randomInt(30000, 60000));
    this.intervalIds.push(interval);
  }

  /**
   * Simulate music streaming chat
   */
  private startMusicStream(): void {
    const musicSim = () => {
      if (!this.isSimulating) return;

      const dj = this.randomUser();
      const song = this.randomSong();
      const artist = this.randomArtist();

      this.simulateMessage(
        dj,
        "#music-chat",
        `🎧 Now playing: "${song}" by ${artist}`
      );

      // Listener reactions
      setTimeout(() => {
        if (!this.isSimulating) return;

        const listeners = this.getRandomUsers(3);
        listeners.forEach((listener, index) => {
          setTimeout(() => {
            this.simulateMessage(
              listener,
              "#music-chat",
              this.randomFromArray([
                `${this.randomReaction()} Love this track!`,
                `${artist} is amazing!`,
                `Added to my playlist!`,
                `🎵🎵🎵`,
              ])
            );
          }, index * 1500);
        });
      }, 3000);
    };

    // Run every 40-80 seconds
    const interval = setInterval(musicSim, this.randomInt(40000, 80000));
    this.intervalIds.push(interval);
  }

  /**
   * Simulate a private conversation between two users
   */
  private simulatePrivateConversation(user1: string, user2: string): void {
    const messages = [
      {
        from: user1,
        to: user2,
        text: `Hey @${user2}, ${this.randomGreeting()}`,
      },
      {
        from: user2,
        to: user1,
        text: `Hi @${user1}! ${this.randomResponse()}`,
      },
      { from: user1, to: user2, text: this.randomQuestion() },
      {
        from: user2,
        to: user1,
        text: `I think ${this.randomResponse().toLowerCase()}`,
      },
      { from: user1, to: user2, text: `Thanks! ${this.randomReaction()}` },
    ];

    messages.forEach((msg, index) => {
      setTimeout(() => {
        if (!this.isSimulating) return;

        // Simulate private message
        this.ui.addSystemMessage(`[DM] @${msg.from} → @${msg.to}: ${msg.text}`);
      }, index * this.randomInt(1500, 3500));
    });
  }

  /**
   * Simulate a message in a channel
   */
  private simulateMessage(user: string, channel: string, text: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `{cyan-fg}@${user}{/cyan-fg} [${timestamp}] in ${channel}: ${text}`;

    // Add to message list
    this.ui.messageList.addItem(formatted);
    this.ui.messageList.setScrollPerc(100);

    // Occasionally add to user list activity indicator
    if (Math.random() < 0.3) {
      this.updateUserActivity(user, channel);
    }

    this.ui.screen.render();
  }

  /**
   * Simulate a group message
   */
  private simulateGroupMessage(
    user: string,
    group: string,
    text: string
  ): void {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `{magenta-fg}@${user}{/magenta-fg} [${timestamp}] in ${group}: ${text}`;

    this.ui.messageList.addItem(formatted);
    this.ui.messageList.setScrollPerc(100);
    this.ui.screen.render();
  }

  /**
   * Update user activity indicator
   */
  private updateUserActivity(user: string, channel: string): void {
    // This would update the user list in a real implementation
    // For now, just log it
    if (Math.random() < 0.1) {
      this.ui.addSystemMessage(`📝 @${user} is active in ${channel}`);
    }
  }

  /**
   * Helper methods for random data generation
   */
  private randomUser(): string {
    return this.randomFromArray(this.users);
  }

  private randomChannel(): string {
    return this.randomFromArray(this.channels);
  }

  private randomGroup(): string {
    return this.randomFromArray(this.groups);
  }

  private randomGreeting(): string {
    return this.randomFromArray(this.greetings);
  }

  private randomQuestion(): string {
    return this.randomFromArray(this.questions);
  }

  private randomResponse(): string {
    return this.randomFromArray(this.responses);
  }

  private randomReaction(): string {
    return this.randomFromArray(this.reactions);
  }

  private randomCodeSnippet(): string {
    return this.randomFromArray(this.codeSnippets);
  }

  private randomSystemEvent(): string {
    const event = this.randomFromArray(this.systemEvents);
    return event
      .replace("{user}", this.randomUser())
      .replace("{users}", this.randomInt(30, 60).toString())
      .replace("{channels}", this.randomInt(8, 15).toString())
      .replace("{song}", this.randomSong());
  }

  private randomSong(): string {
    const songs = [
      "Bohemian Rhapsody",
      "Stairway to Heaven",
      "Imagine",
      "Smells Like Teen Spirit",
      "Billie Jean",
      "Like a Rolling Stone",
      "Hey Jude",
      "Hotel California",
      "Blinding Lights",
      "Shape of You",
      "Bad Guy",
      "Old Town Road",
    ];
    return this.randomFromArray(songs);
  }

  private randomArtist(): string {
    const artists = [
      "Queen",
      "Led Zeppelin",
      "The Beatles",
      "Michael Jackson",
      "Taylor Swift",
      "Billie Eilish",
      "Daft Punk",
      "Radiohead",
      "Kendrick Lamar",
      "Beyoncé",
      "David Bowie",
      "Prince",
    ];
    return this.randomFromArray(artists);
  }

  private randomGame(): string {
    const games = [
      "Chess",
      "Among Us",
      "Valorant",
      "Minecraft",
      "Dota 2",
      "League of Legends",
      "Cyberpunk 2077",
      "Elden Ring",
      "Counter-Strike",
      "Apex Legends",
      "Fortnite",
      "Rocket League",
    ];
    return this.randomFromArray(games);
  }

  private randomError(): string {
    const errors = [
      "TypeError: undefined is not a function",
      "ReferenceError: variable is not defined",
      "SyntaxError: unexpected token",
      "RangeError: maximum call stack size exceeded",
      "404 Not Found",
      "500 Internal Server Error",
      "Connection timeout",
      "Memory leak detected",
      "Cannot read property 'x' of undefined",
      "Promise rejection not handled",
    ];
    return this.randomFromArray(errors);
  }

  private randomFeature(): string {
    const features = [
      "user authentication",
      "real-time notifications",
      "file upload",
      "search functionality",
      "dark mode toggle",
      "responsive design",
      "API integration",
      "database migration",
      "caching layer",
      "WebSocket connection",
      "pagination",
      "export to PDF",
    ];
    return this.randomFromArray(features);
  }

  private randomPR(): string {
    const prs = [
      "Add user profile page",
      "Fix memory leak in renderer",
      "Implement dark theme",
      "Optimize database queries",
      "Refactor message component",
      "Add unit tests",
      "Update dependencies",
      "Improve error handling",
      "Add keyboard shortcuts",
      "Implement search feature",
      "Fix mobile responsiveness",
      "Add loading animations",
    ];
    return `#${this.randomInt(100, 999)}: ${this.randomFromArray(prs)}`;
  }

  private randomClass(): string {
    const classes = [
      "Tank",
      "Healer",
      "DPS",
      "Support",
      "Mage",
      "Warrior",
      "Rogue",
      "Ranger",
      "Cleric",
      "Wizard",
      "Bard",
      "Necromancer",
    ];
    return this.randomFromArray(classes);
  }

  private randomStrategy(): string {
    const strategies = [
      "rush mid",
      "defend the base",
      "split push",
      "team fight at objective",
      "farm early game",
      "gank their carry",
      "control the map",
      "protect the support",
    ];
    return this.randomFromArray(strategies);
  }

  /**
   * Utility methods
   */
  private randomFromArray<T>(array: T[]): T {
    //@ts-expect-error
    return array[Math.floor(Math.random() * array.length)];
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      //@ts-expect-error
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private getRandomUsers(count: number): string[] {
    const shuffled = this.shuffleArray([...this.users]);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }
}









