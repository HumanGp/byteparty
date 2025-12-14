export interface IRCMessage {
  prefix?: IRCPrefix | undefined;
  command: string;
  params: string[];
  trailing?: string | undefined;
}
export interface IRCPrefix {
  serverName?: string;
  name?: string;
  user?: string;
  host?: string;
}
export function parseIRCMESSAGE(Message: string): IRCMessage {
  let IntialMessage = Message.replace(/\r\n$/, "").trim();
  const regex = /^([^!@]+)(?:!([^@]+))?(?:@(.+))?$/;
  let prefix: IRCPrefix | undefined;
  let RemainingMessage: string = "";
  if (IntialMessage.startsWith(":")) {
    const spaceIndex = IntialMessage.indexOf(" ");
    const RawPrefix = IntialMessage.slice(1, spaceIndex);
    RemainingMessage = IntialMessage.slice(spaceIndex + 1);

    const prefixMatch = RawPrefix.match(regex);
    if (prefixMatch) {
      prefix = {};
      if (prefixMatch[1]) {
        prefix.name = prefixMatch[1];
      }
      if (prefixMatch[2]) {
        prefix.user = prefixMatch[2];
      }
      if (prefixMatch[3]) {
        prefix.host = prefixMatch[3];
      }
    } else {
      prefix = {
        serverName: RawPrefix,
      };
    }
  }
  //handling command
  const secondspaceIndex = RemainingMessage.indexOf(" ");
  let command: string;
  //checking whether it has next spaceindex or not
  if (secondspaceIndex === -1) {
    command = RemainingMessage;
    RemainingMessage = "";
  } else {
    command = RemainingMessage.slice(0, secondspaceIndex);
    RemainingMessage = RemainingMessage.slice(secondspaceIndex + 1);
  }

  //handling params now
  let params: string[] = [];
  let trailing: string | undefined = undefined;
  //parsing upto remaining string is last
  while (RemainingMessage.length > 0) {
    if (RemainingMessage.startsWith(":")) {
      trailing = RemainingMessage.slice(1);
      break;
    }
    const nextSpaceIndex = RemainingMessage.indexOf(" ");
    if (nextSpaceIndex === -1) {
      params.push(RemainingMessage);
      break;
    } else {
      const param = RemainingMessage.slice(0, nextSpaceIndex);
      params.push(param);
      RemainingMessage = RemainingMessage.slice(nextSpaceIndex + 1);
    }
  }
  return {
    prefix,
    command,
    params,
    trailing,
  };
}
