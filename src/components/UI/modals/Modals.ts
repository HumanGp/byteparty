import type { ExecuteMenuAction, InfoModalProps, MenuConfig, MenuModalType } from "@/types/Modals";
import { Widgets } from "blessed";
import * as blessed from "blessed";
import { MenuModalOptionListProps, MenuModalProps, MenuModalTitleBoxProps, ModalFooterProps, ModalProps, ModalTitleBoxProps } from "../ui";
import { ModalManager } from "../../../managers/ModalManager";


/**
 * show modal function can be invoked by two type of scenarios
 * - info modal display
 * - menu modal display
 * 
 * INFO MODAL DISPLAY
 * info modal display requires the following arguments
 *  - screen (parent screen blessed element)
 *  - modalManager (an instance of a ModalManger)
 *  - modalParams (InfoModalProps)
 * 
 * MENU MODAL DISPLAY
 * menu modal callback depends on hard coded menu configs and expects the following argments
 * - screen (parent screen blessed element)
 * - modalManager (an instance of ModalManager)
 * - menuType (MenuModalType)
 * - menuConfig (MenuConfig)
 * - executeMenuAction (a callabck function for executing actons in the menu config)
 */

// function overloads signatures
export function showModal(
  type: "info",
  screen: Widgets.Screen,
  modalManager: ModalManager,
  modalParams: InfoModalProps
): void;

export function showModal(
  type: "menu",
  screen: Widgets.Screen,
  modalManager: ModalManager,
  menuType: MenuModalType,
  menuConfig: MenuConfig,
  executeMenuAction: ExecuteMenuAction
)

export function showModal(
  type: "info" | "menu",
  screen: Widgets.Screen,
  modalManager: ModalManager,
  modalParams?: InfoModalProps,
  menuType?: MenuModalType,
  menuConfig?: MenuConfig,
  executeMenuAction?: ExecuteMenuAction
): void {

  // Type guard to check if modalParams is infoModalProps
  const isInfoModal = (params: any): params is InfoModalProps => {
    return params && typeof params === "object" && "title" in params;
  };



  if (type === "info" && isInfoModal(modalParams)) {
    showInfoModal({ modalParams, screen, modalManager });
  } else if (type === "menu") {
    showMenuModal({ menuType, screen, modalManager, menuConfig, executeMenuAction });
  } else {
    /**
     * TODO: Toast an error
     * - Invalid parameters for showModal type ${type}
     */
  }
}

function showInfoModal({
  modalParams,
  screen,
  modalManager,
}: {
  modalParams: InfoModalProps;
  screen: Widgets.Screen;
  modalManager: ModalManager;
}): void {
  const { title, content, width, height } = modalParams;

  //@ts-expect-error: ModalProps type incompatibility with blessed box
  const modal = blessed.box({
    parent: screen,
    width,
    height,
    content,
    ...ModalProps,
  });

  const titleBox = blessed.box({
    parent: modal,
    content: `{bold}{#d4af37-fg}${title}{/#d4af37-fg}{/bold}`,
    ...ModalTitleBoxProps,
  });

  // Modal key events
  modal.key(["escape", "enter", "space", "C-x"], () => {
    modalManager.closeTop();
  });

  modalManager.open(modal);
}

function showMenuModal({
  menuType,
  screen,
  modalManager,
  menuConfig,
  executeMenuAction
}: {
  menuType: MenuModalType;
  screen: Widgets.Screen;
  modalManager: ModalManager;
  menuConfig: MenuConfig;
  executeMenuAction: ExecuteMenuAction;
}): void {
  const config = menuConfig[menuType];
  if (!config) {
    /**
     * TODO: error toast
     *  - No config found for meny type $menuType
     *  */
    console.error(`No config found for menu type: ${menuType}`);
    return;
  }

  // modal container
  //@ts-expect-error: MenuModal type incompatibility with blessed box
  const modal = blessed.box({
    parent: screen,
    ...MenuModalProps,
  });

  // Create title
  const title = blessed.box({
    parent: modal,
    content: `{bold}{#d4af37-fg}${config.title}{/#d4af37-fg}{/bold}`,
    ...MenuModalTitleBoxProps,
  });

  // list of options
  //@ts-expect-error: MenuModalOptionListProps type incompatibility with blessed list (fg) prop
  const optionList = blessed.list({
    parent: modal,
    height: config.items.length + 2,
    items: config.items.map((item) => item.label),
    ...MenuModalOptionListProps,
  });

  // handle option selection
  optionList.on("select", (item: any, index: number) => {
    const selectedAction = config.items[index]!.action;
    executeMenuAction(selectedAction, menuType)
  });

  // handle Enter
  optionList.key(["enter"], () => {
    //@ts-expect-error: `selected` property missing in blessed List
    const selected = optionList.selected;
    const selectedAction = config.items[selected]!.action;
    executeMenuAction(selectedAction, menuType);
  });

  // escape key
  optionList.key(["escape"], () => modalManager.closeTop());

  //close instruction
  //@ts-expect-error: ModalFooterProps type incompatibility with blessed box
  const footer = blessed.box({
    parent: modal,
    ...ModalFooterProps,
  });

  // Position and size the modal
  const modalHeight = config.items.length + 6;
  const modalWidth = Math.max(
    ...config.items.map((item) => item.label.length),
    config.title.length
  ) + 10;

  modal.width = modalWidth;
  modal.height = modalHeight;

  modalManager.open(modal);
  optionList.focus();
}
