import { Server as NetServer, Socket } from "net";
import { NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";

export type NextApiResponseServerIo = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

export interface LineItem {
  uid: string;
  quantity: string;
  name?: string;
}

export interface Order {
  id: string;
  createdAt: string;
  state: string;
  lineItems: LineItem[];
  source?: {
    name: string;
  }
} 