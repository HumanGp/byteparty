import { Socket, createConnection } from "net"; // fix import from net, not dgram

export function startClient(): Socket {
  console.log("SERVER IS CONNECTING");

  const socket = createConnection(
    {
      host: "irc.libera.chat",
      port: 6667,
    },
    () => {
      console.log("Server has connected");

      // Send IRC login commands
      socket.write("NICK MyFirstBot\r\n");
      socket.write("USER mybot 0 * :Learning IRC\r\n");
    }
  );

  
 
  socket.on("error", (err: Error) => {
    console.log(err);
  });

  socket.on("close", () => {
    console.log("Connection closed");
  });

  return socket;
}
