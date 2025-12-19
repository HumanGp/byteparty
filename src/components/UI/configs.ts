/*=======================================================*
 |               CONFIGURATION OBJECTS                   |
 *=======================================================*/

//================ ~ Modal configurations ~ =============

export const menuConfig_props = {
  "key-binds": {
    title: "Key Bindings",
    items: [
      { label: "F1 - Help", action: "showHelp" },
      { label: "F2 - Confetti", action: "throwConfetti" },
      { label: "F3 - Stats", action: "showStats" },
      { label: "Tab - Navigate", action: "focusNext" },
      { label: "Ctrl+C - Quit", action: "quit" },
      { label: "ESC - Close Modal", action: "closeModal" },
    ],
  },
  servers: {
    title: "IRC Servers",
    items: [
      { label: "Libera.Chat (Default)", action: "connectLibera" },
      { label: "Freenode", action: "connectFreenode" },
      { label: "IRCNet", action: "connectIRCNet" },
      { label: "EFNet", action: "connectEFNet" },
      { label: "QuakeNet", action: "connectQuakeNet" },
      { label: "Add Custom Server...", action: "addCustomServer" },
    ],
  },
  region: {
    title: "Region Settings",
    items: [
      { label: "North America", action: "setRegionNA" },
      { label: "Europe", action: "setRegionEU" },
      { label: "Asia", action: "setRegionAS" },
      { label: "Australia", action: "setRegionAU" },
      { label: "South America", action: "setRegionSA" },
      { label: "Africa", action: "setRegionAF" },
    ],
  },
  help: {
    title: "Help & Commands",
    items: [
      { label: "Quick Start Guide", action: "showQuickStart" },
      { label: "IRC Commands", action: "showIRCCommands" },
      { label: "Chat Commands", action: "showChatCommands" },
      { label: "User Guide", action: "showUserGuide" },
      { label: "Keyboard Shortcuts", action: "showKeyBinds" },
      { label: "About ByteParty", action: "showAbout" },
    ],
  },
};

export const onlineusersConfig_props = {
  online: [
    { name: "@ByteBot", status: "🤖", role: "Bot" },
    { name: "@CodeNinja", status: "🥷", role: "Moderator" },
    { name: "@PixelPirate", status: "🏴‍☠️", role: "User" },
    { name: "@DataDancer", status: "💃", role: "User" },
    { name: "@CyberByte", status: "🦾", role: "VIP" },
  ],
  channels: [
    { name: "#byteparty", users: 42, topic: "Main ByteParty channel" },
    { name: "#retrobytes", users: 18, topic: "Retro computing" },
    { name: "#cyberlounge", users: 25, topic: "Cyberpunk & tech" },
    { name: "#musicbytes", users: 31, topic: "Music sharing" },
  ],
  groups: [
    { name: "Westhetic Crew", users: 12, private: true },
    { name: "Terminal Masters", users: 8, private: false },
    { name: "ASCII Artists", users: 15, private: true },
  ],
};

export const modalContent_config = {
  helpContent: `

  {bold}Navigation:{/bold}
  Tab / Shift+Tab    Cycle focus between panels
  Ctrl+I             Focus input box
  Ctrl+M             Focus message list
  Ctrl+U             Focus user list
  Ctrl+B             Focus menu bar
  ESC                Return to input / Close modal
  
  {bold}Input Box:{/bold}
  Up/Down            Command history
  Ctrl+Enter         Send message
  Ctrl+U             Clear input
  @                  Autocomplete user
  #                  Autocomplete channel
  
  {bold}Message List:{/bold}
  Page Up/Down       Scroll pages
  Home/End           Jump to top/bottom
  /                  Search in messages
  n / N              Find next/previous
  Ctrl+C             Copy message
  r                  Reply to message
  m                  Mark read/unread
  
  {bold}User List:{/bold}
  Enter              Quick action on selected
  Space              Context menu
  m                  Message user
  i                  Invite user
  v                  View profile
  b                  Block user
  /                  Filter users
  f                  Toggle filter
  g                  Toggle grouping
  
  {bold}Menu Bar:{/bold}
  Left/Right         Navigate menu
  Enter              Select menu item
  1-4                Quick menu access
  
  {bold}Global:{/bold}
  F1                 This help
  F2                 Throw confetti
  F3                 Show stats
  F5                 Refresh
  Ctrl+L             Clear chat
  :                  Command mode
  Ctrl+Q             Quit with confirmation
  Ctrl+H             Toggle user list
  Ctrl+J             Toggle menu bar
  Ctrl+P             Take screenshot
  
  {bold}Pro Tip:{/bold}
  Most actions work without clicking!
      `,
  guide: `
  {bold}Quick Start Guide{/bold}

  1. {bold}Connect to Server{/bold}
     - Click "Servers" menu
     - Choose a server

  2. {bold}Join a Channel{/bold}
     - Type /join #channelname
     - Or click channels in user list

  3. {bold{Chat{/bold}
     - Type in the input box
     - Press Enter to send

  4. {bold}Private Messages{/bold}
     - Click a username
     - Select "Start Byte Session"

  {bold}Pro Tip:{/bold}
  Use Tab to navigate between panels!
      `,
  IRCcommands: `
  {bold}IRC Commands{/bold}

  /nick <name>     - Change nickname
  /join #channel   - Join channel
  /part [#channel] - Leave channel
  /msg <user> <msg>- Private message
  /whois <user>    - User information
  /list            - List channels
  /quit [message]  - Disconnect
  /me <action>     - Action message

  {bold}Channel Operators:{/bold}
  /kick <user>     - Remove user
  /ban <user>      - Ban user
  /topic <text>    - Change topic
  /mode <settings> - Change modes
      `,
  chatCommands: `
  {bold}ByteParty Chat Commands{/bold}

  /help            - Show this help
  /clear           - Clear chat
  /nick <name>     - Change nickname
  /join #channel   - Join channel
  /msg @user <msg> - Private message
  /ignore @user    - Ignore user
  /confetti        - Throw confetti!
  /stats           - Show statistics
  /theme <name>    - Change theme

  {bold}Fun Commands:{/bold}
  /dance           - Start dance party
  /byte            - Byte count
  /invite @user    - Invite to party
      `,
  userGuide: `
  {bold}ByteParty User Guide{/bold}

  {bold}Navigation:{/bold}
  • Tab/Shift+Tab - Move between panels
  • Up/Down       - Scroll messages
  • Enter         - Select/Activate
  • ESC           - Close/Back

  {bold}User Interactions:{/bold}
  • Click username - Open context menu
  • Enter on user  - Start private chat
  • @mention       - Auto-complete users

  {bold}Menu System:{/bold}
  • Key Binds - Keyboard shortcuts
  • Servers   - Connect to IRC servers
  • Region    - Regional settings
  • Help      - Guides and commands

  {bold}Tips:{/bold}
  • Press F1 for quick help
  • Use /clear to clean chat
  • Middle-click to copy text
      `,
  about: `
    {bold}{#d4af37-fg}ByteParty v1.0{/#d4af37-fg}{/bold}
  
    The Chat That Bytes!
  
    {bold}Features:{/bold}
    • Modern IRC client
    • Beautiful terminal UI
    • Text wrapping
    • Menu system
    • Private chats
    • File sharing (coming soon)
  
    {bold}Credits:{/bold}
    • Built with Blessed.js
    • Open Source
  
    {bold}License:{/bold}
    MIT License - Free to use and modify
  
    {bold}GitHub:{/bold}
    github.com/humangp/byteparty
        `,
};
