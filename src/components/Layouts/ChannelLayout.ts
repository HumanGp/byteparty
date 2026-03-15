import { Layout } from "@/types/Layout";
import { Widgets } from "blessed";
import * as blessed from 'blessed';
import { inputBoxProps, menuProps, statusBarProps, userListProps } from "../UI/ui";
import { APP_UI } from "../UI/APP_UI";

export function createChannelLayout(screen: Widgets.Screen): Layout {

  /*=======================================================*
   |              BLESSED TUI ELEMENTS                     |
   *=======================================================*/

  //@ts-expect-error: property fg type incopatibilty number & string
  const menuBar = blessed.listbar({ ...menuProps, parent: screen });
  const messageList = blessed.list({ ...userListProps, parent: screen });
  const statusBar = blessed.box({ ...statusBarProps, parent: screen });
  const userList = blessed.box({ ...statusBarProps, parent: screen });
  //@ts-expect-error: property fg type incopatibilty number & string
  const inputBox = blessed.textbox({ ...inputBoxProps, parent: screen });

  const app_ui = APP_UI.getInstance();
  // register elements on focusManager


  //TODO: handle element events here

  return {
    type: 'channel',
    elements: [menuBar, messageList, statusBar, userList, inputBox],
    focusOrder: [inputBox, messageList, menuBar, userList], // statusBar does npt need focus
    // no need for a callback, the inputBox will be focused since it's element at index 0 on focusOrder
  }
}
