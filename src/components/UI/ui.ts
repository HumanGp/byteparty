/*=======================================================*
 |             BYTEPARTY UI COMPONENTS                   |
 *=======================================================*/

//=================== main components ===================\\

export const screenProps = {
  smartCSR: true,
  title: "ByteParty - Westhetic IRC",
  cursor: {
    artificial: true,
    shape: "block",
    blink: true,
    color: ''
  },
  fullUnicode: true,
  style: { bg: 'black' }
} as const;

export const headerProps = {
  top: 0,
  left: "center",
  width: "100%",
  height: 8,
  content: '',
  tags: true,
  style: {
    fg: "#d4af37",
    // bg: "#2a1f1d"
  },
};

export const loadingScreenProps = {
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  content:
    "{center}{bold}{#d4af37-fg}ByteParty is starting...{/#d4af37-fg}{/bold}{/center}",
  tags: true,
  style: { fg: "#d4af37", bg: "black" },
};

export const messageBoxProps = {
  top: 10,
  left: 0,
  width: "80%",
  height: "85%-8",
  tags: true,
  content: "",
  alwaysScroll: true,
  scrollable: true,
  scrollbar: {
    ch: "█",
    style: {
      fg: "#d4af37",
    },
  },
  style: {
    fg: "#e8d8b5",
  },
  mouse: true,
  keys: true,
  vi: true,
  items: [],
  wrap: true,
};

export const userListProps = {
  top: 10,
  left: "80%+2",
  width: "20%-3",
  height: "85%-8",
  // label: " {bold}BYTE BUDDIES{/bold} ",
  tags: true,
  style: {
    selected: { bg: "#daa520", fg: "#2a1f1d" },
    item: { fg: "#a08c76" },
    scrollbar: { bg: "#ffc46bff" },
  },

  scrollable: true,
  mouse: true,
  keys: true,
  vi: true,
  items: [
    "{bold}{#d4af37-fg}=== ONLINE USERS ==={/#d4af37-fg}{/bold}",
    "  @ByteBot",
    "  @CodeNinja",
    "  @PixelPirate",
    "  @DataDancer",
    "  @CyberByte",
    "",
    "{bold}{#d4af37-fg}=== PARTY CHANNELS ==={/#d4af37-fg}{/bold}",
    "  #byteparty",
    "  #retrobytes",
    "  #cyberlounge",
    "  #musicbytes",
    "",
    "{bold}{#d4af37-fg}=== BYTE GROUPS ==={/#d4af37-fg}{/bold}",
    "  Westhetic Crew",
    "  Terminal Masters",
    "  ASCII Artists",
  ],
};

export const statusBarProps = {
  top: "89%",
  height: 1,
  left: 0,
  width: "100%",

  style: {
    fg: "#2a1f1d",

    bold: true,
  },
  content: "",
  tags: true,
};


export const userDropdownProps = {
  top: 0,
  left: 0,
  width: "shrink",
  height: "shrink",
  items: [], // Will be populated dynamically
  tags: true,
  border: { type: "line", fg: "#d4af37" },
  style: {
    selected: { bg: "#d4af37", fg: "#2a1f1d" },
    item: { fg: "#a08c76" },
    bg: "#2a1f1d",
  },
  mouse: true,
  keys: true,
  vi: true,
  shadow: true,
  hidden: true, // Initially hidden
};

export const menuProps = {
  style: {
    selected: { bg: "#daa520", fg: "#2a1f1d" },
    item: { fg: "#a08c76" },
    bg: "#2a1f1d",
  },
  items: {
    "Key Binds": () => { }, // These will be set dynamically
    Servers: () => { },
    Region: () => { },
    Help: () => { },
  },
  top: 8,
  left: 0,
  width: "100%",
  height: 1,
  mouse: true,
  keys: true,
  vi: true,
  tags: true,
  autoCommandKeys: false, // Important: We'll handle commands manually
};

export const inputBoxProps = {
  top: "92%",
  left: 1,
  width: "100%-2",
  height: 4,
  inputOnFocus: true,
  label: "input",
  style: {
    fg: "#e8d8b5",
    bg: "#3a2a25",
    // focus: { fg: "#d4af37", bg: "#4a3a35" },
  },
  border: {
    type: "line",
    fg: "#d4af37", // Gold border
  },
};

export const tabBarProps = {
  top: 9,
  left: 0,
  height: 1,
  width: "100%",
  tags: true,
  mouse: true,
  clickable: true,
  style: {
    bg: "#1a1210",
    fg: "#e8d8b5",
    hover: {
      bg: "#2a201d",
    },
  },
};




/*=======================================================*
 |                      MODALS                           |
 *=======================================================*/

export const ModalProps = {
  top: "center",
  left: "center",
  tags: true,
  border: {
    type: "line",
    fg: "#d4af37", // Gold border
  },
  style: { fg: "#e8d8b5", bg: "#2a1f1d" },
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  vi: true,
  mouse: true,
};

export const MenuModalProps = {
  top: "center",
  left: "center",
  width: "shrink",
  height: "shrink",
  content: "",
  tags: true,
  border: {
    type: "line",
    fg: "#d4af37", // Gold border
  },
  style: {
    fg: "#e8d8b5",
    bg: "#2a1f1d",
    border: { fg: "#d4af37" },
  },
  shadow: true,
};

export const ModalTitleBoxProps = {
  top: 0,
  left: 'center',
  width: 'shrink',
  height: 1,
  tags: true
}

export const MenuModalTitleBoxProps = {
  top: 0,
  left: "center",
  width: "100%-2",
  height: 1,
  tags: true,
};

export const ModalOptionListProps = {
  top: 1,
  left: 0,
  width: "100-2",
  tags: true,
  keys: true,
  vi: true,
  mouse: true,
  style: {
    selected: { bg: "#d4af37", fg: "#2a1f1d" },
    item: { fg: "#a08c76" },
  },
  border: {
    type: "line",
    fg: "#d4af37", // Gold border
  },
};

export const ModalFooterProps = {
  bottom: 0,
  left: 0,
  width: "100%-2",
  height: 1,
  content: "{#a08c76-fg}Press ESC to close{/#a08c76-fg}",
  tags: true,
  align: "center",
};

export const MenuModalOptionListProps = {
  top: 1,
  left: 0,
  width: "100%-2",
  tags: true,
  keys: true,
  vi: true,
  mouse: true,
  style: {
    selected: { bg: "#d4af37", fg: "#2a1f1d" },
    item: { fg: "#a08c76" },
  },
  border: {
    type: "line",
    fg: "#d4af37", // Gold border
  },
};

// INDEX LAYOUT COMPONENTS 
export const containerProps = {
  top: 9, // after the header 
  left: 0,
  width: '100%',
  height: '100%',
  style: { bg: '#000000' }
}

export const connectionBoxProps = {
  top: 0,
  left: 'center',
  width: 60,
  height: 8,
  border: {
    type: 'line',
    fg: '#d4af37',
  },
  style: {
    fg: '#e8d8b5',
    bg: '#000000'
  }
}

export const nickLabelProps = {
  top: 1,
  left: 2,
  content: 'Nick',
  style: {
    fg: '#d4af37'
  }
}

export const nickInputProps = {
  top: 1,
  left: 10,
  width: 30,
  height: 1,
  inputOnFocus: true,
  value: 'guest' + Math.floor(Math.random() * 1000),
  style: {
    fg: 'white',
    bg: '#1a1a1a',
    focus: {
      fg: '#d4af37',
      bg: '#2a2a2a'
    }
  }
}

export const serverLabelProps = {
  top: 3,
  left: 2,
  content: 'Server',
  style: {
    fg: '#d4af37'
  }
}

export const serverInputProps = {
  top: 3,
  left: 10,
  width: 30,
  height: 1,
  inputOnFocus: true,
  value: 'irc.libera.chat', // default server option 
  style: {
    fg: 'white',
    bg: '#1a1a1a',
    focus: {
      fg: '#d4af37',
      bg: '#2a2a2a'
    }
  }
}

export const channelLabelProps = {
  top: 5,
  left: 2,
  content: 'Channel',
  style: { fg: '#d4af37' }
}

export const channelInputProps = {
  top: 5,
  left: 10,
  width: 30,
  height: 1,
  inputOnFocus: true,
  value: '#byteparty',
  style: {
    fg: 'white',
    bg: '#1a1a1a',
    focus: {
      fg: '#d4af37',
      bg: '#2a2a2a'
    }
  }
}

export const connectBtnProps = {
  bottom: 0,
  right: 0,
  width: 20,
  height: 1,
  content: '{bold}[ Connect ]{/bold}',
  tags: true,
  style: {
    fg: 'black',
    bg: '#d4af37',
    focus: {
      fg: '#d4af37',
      bg: 'white'
    }
  },
  mouse: true,
  keys: true
}

export const quickConnectProps = {
  top: 9, // immediately after connectionBox
  left: 'center',
  width: 60,
  height: 6,
  label: ' Quick Connect ',
  border: { type: 'line', fg: '#d4af37' },
  style: {
    fg: '#e8d8b5',
    bg: '#000000',
    selected: { fg: '#d4af37', bg: '#2a1f1d' }
  },
  items: [
    '➤ irc.libera.chat  - #byteparty',
    '➤ irc.libera.chat  - #irchelp',
    '➤ irc.oftc.net     - #debian',
    '➤ irc.efnet.org    - #mirc',
    '➤ Custom connection...'
  ],
  keys: true,
  vi: true,
  mouse: true,
  tags: true
}

export const footerProps = {
  bottom: 1,
  left: 0,
  width: '100%',
  height: 1,
  content: '{reverse} [Tab:nav] [Enter:connect] [F1:help] [F2:servers] [F10:quit] {/reverse}',
  tags: true,
  style: { fg: 'black', bg: '#d4af37' }
}
