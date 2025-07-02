import { Server as NetServer, Socket } from "net";
import { NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";
import { Order as SquareApiOrder, OrderLineItem, OrderSource, Location as SquareApiLocation, OrderTender } from 'square/legacy';

export type NextApiResponseServerIo = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

// Square API specific types
export interface SquareOrder extends SquareApiOrder {}
export interface SquareLocation extends SquareApiLocation {}

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
  tenders?: OrderTender[];
} 