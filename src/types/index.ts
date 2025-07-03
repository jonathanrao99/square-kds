import { Server as NetServer, Socket } from "net";
import { NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";
import { Order as SquareApiOrder } from 'square/legacy';

export type NextApiResponseServerIo = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

// Square API specific types
export type SquareOrder = SquareApiOrder;

export interface LineItem {
  uid: string;
  quantity: string;
  name?: string;
  note?: string; // Added for special instructions
}

export interface Order {
  id: string;
  createdAt: string;
  state: string;
  lineItems: LineItem[];
  ticketName?: string;
  isRush?: boolean;
  completedAt?: string;
  source?: {
    name?: string;
  }
  isPaid?: boolean;
  // Add other properties from SquareApiOrder that you might use directly
  locationId?: string;
  version?: bigint;
} 