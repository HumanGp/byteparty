export interface InfoModalProps {
    title: string;
    content: string;
    height: number;
    width: number;
}

export type MenuModalType =
    | "keybinds"
    | "servers"
    | "region"
    | "help";

export interface MenuConfig {
  [i: string]: {
    title: string;
    items: Array<{ label: string; action: string }>;
  };
}

export type ExecuteMenuAction = (action: string, menuType: string) => void;

