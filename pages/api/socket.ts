import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types";
import { getIo } from "@/lib/socket-server";
import { Server as ServerIO } from "socket.io";
import { Server as NetServer } from "http";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function Socket(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (!(res.socket as unknown as { server: { io?: ServerIO } }).server.io) {
    console.log("*First use, starting socket.io");

    const httpServer = res.socket.server as NetServer;
    const io = new ServerIO(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
    });

    (res.socket as unknown as { server: { io?: ServerIO } }).server.io = io;
  }
  res.end();
}