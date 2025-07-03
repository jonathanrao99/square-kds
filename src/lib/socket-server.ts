import { Server as ServerIO } from "socket.io";
import { Server as NetServer } from "http";

let io: ServerIO | undefined;

export const getIo = (httpServer?: NetServer) => {
  if (!io) {
    if (!httpServer) {
      throw new Error("Socket.io server not initialized. Pass httpServer to getIo() on first call.");
    }
    io = new ServerIO(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
    });
    console.log("Socket.io server initialized.");
  }
  return io;
};
