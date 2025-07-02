import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types";
import { getIo } from "@/lib/socket-server";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function Socket(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (!res.socket.server.io) {
    console.log("New Socket.io server...");
    const httpServer = res.socket.server as any;
    const io = getIo(httpServer);
    res.socket.server.io = io;
  }
  res.end();
}