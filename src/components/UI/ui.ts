/*=======================================================*
 |             BYTEPARTY UI COMPONENTS                   |
 *=======================================================*/

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
  style: {bg: 'black'}
} as const;

export const headerProps = {
  top: 0,
  left: "center",
  width: "100%",
  height: 8, 
  content: '',
  tags: true,
  style: { fg: "#ff6b6b", bg: "#2a1f1d" },
};

export const loadingScreenProps = {
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  content:
    "{center}{bold}{#ff6b6b-fg}ByteParty is starting...{/#ff6b6b-fg}{/bold}{/center}",
  tags: true,
  style: { fg: "#ff6b6b", bg: "black" },
};

export const messageBoxProps = {
  top: 9, 
  left: 0,
  width: "70%",
  height: "85%-8",
  tags: true,
  content: "",
  alwaysScroll: true,
  scrollable: true,
  scrollbar: {
    ch: "█",
    style: { fg: "#ff6b6b", bg: "#8b4513" },
  },
  style: {
    fg: "#e8d8b5",
    bg: "#2a1f1d",
  },
  // padding: {top: 1},
  // border: { type: "bg",ch: '=', fg: "#ff6b6b" },
  mouse: true,
  keys: true,
  vi: true,
  items: [],
  wrap: true,
};

export const userListProps = {
  top: 9,
  left: "70%+2",
  width: "30%-3",
  height: "85%-8",
  label: " {bold}BYTE BUDDIES{/bold} ",
  tags: true,
  style: {
    selected: { bg: "#ff6b6b", fg: "white" },
    item: { fg: "#a08c76" },
    scrollbar: { bg: "#ff6b6b" },
  },
  border: { type: "line", fg: "#ff6b6b" },
  scrollable: true,
  mouse: true,
  keys: true,
  vi: true,
  items: [
    "{bold}{#ff6b6b-fg}=== ONLINE USERS ==={/#ff6b6b-fg}{/bold}",
    "  @ByteBot",
    "  @CodeNinja",
    "  @PixelPirate",
    "  @DataDancer",
    "  @CyberByte",
    "",
    "{bold}{#ff6b6b-fg}=== PARTY CHANNELS ==={/#ff6b6b-fg}{/bold}",
    "  #byteparty",
    "  #retrobytes",
    "  #cyberlounge",
    "  #musicbytes",
    "",
    "{bold}{#ff6b6b-fg}=== BYTE GROUPS ==={/#ff6b6b-fg}{/bold}",
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
    fg: "#a08c76",
    bg: "#2a1f1d",
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
  border: { type: "line", fg: "#ff6b6b" },
  style: {
    selected: { bg: "#ff6b6b", fg: "white" },
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
    selected: { bg: "#ff6b6b", fg: "white" },
    item: { fg: "#a08c76" },
    bg: "#2a1f1d",
  },
  items: {
    "Key Binds": () => {}, // These will be set dynamically
    Servers: () => {},
    Region: () => {},
    Help: () => {},
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
    focus: { fg: "#ff6b6b", bg: "#4a3a35" },
  },
  border: { type: "line", fg: "#ff6b6b" },
  
};





/*=======================================================*
 |                      MODALS                           |
 *=======================================================*/
 
export const ModalProps = {
  top: 'center',
  left: 'center',
  tags: true,
  border: { type: 'line', fg: '#ff6b6b' },
  style: { fg: '#e8d8b5', bg: '#2a1f1d' },
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  vi: true,
  mouse: true,
}

export const MenuModalProps = {
  top: "center",
  left: "center",
  width: "shrink",
  height: "shrink",
  content: "",
  tags: true,
  border: { type: "line", fg: "#ff6b6b" },
  style: {
    fg: "#e8d8b5",
    bg: "#2a1f1d",
    border: { fg: "#ff6b6b" },
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
    selected: { bg: "#ff6b6b", fg: "white" },
    item: { fg: "#a08c76" },
  },
  border: { type: "line", fg: "#8b4513" },
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
    selected: { bg: "#ff6b6b", fg: "white" },
    item: { fg: "#a08c76" },
  },
  border: { type: "line", fg: "#8b4513" },
};

