import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { NextApiResponseServerIo } from "@/types";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
  if (!res.socket.server.io) {
    console.log("*First use, starting socket.io");

    const httpServer = res.socket.server as unknown as NetServer;
    const io = new ServerIO(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
    });

    io.on('connection', (socket) => {
      console.log('Socket.IO: A client connected');

      socket.on('order.complete', (orderId) => {
        console.log(`Socket.IO: Received order.complete for ${orderId}`);
        socket.broadcast.emit('order.completed', orderId);
      });

      socket.on('order.reopen', (orderId) => {
        console.log(`Socket.IO: Received order.reopen for ${orderId}`);
        socket.broadcast.emit('order.reopened', orderId);
      });

      socket.on('disconnect', () => {
        console.log('Socket.IO: A client disconnected');
      });
    });

    res.socket.server.io = io;
  }
  res.end();
};

export default ioHandler; 