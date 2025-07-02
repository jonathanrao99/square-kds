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

export interface Modifier {
  uid: string;
  name?: string;
}

export interface LineItem {
  uid: string;
  quantity: string;
  name?: string;
  modifiers?: Modifier[];
}

export interface CashDetails {
    buyerTenderedMoney: Money;
    changeBackMoney: Money;
}

export interface Card {
    cardBrand: string;
    last4: string;
}

export interface CardDetails {
    status: string;
    card: Card;
    entryMethod: string;
}

export interface Tender {
    id: string;
    locationId: string;
    transactionId: string;
    createdAt: string;
    amountMoney: Money;
    tipMoney: Money;
    processingFeeMoney: Money;
    type: string;
    cardDetails?: CardDetails;
    cashDetails?: CashDetails;
}

export interface Customer {
    id: string;
    givenName: string;
    familyName: string;
    emailAddress: string;
}

export interface Money {
    amount: number;
    currency: string;
}

export interface Order {
    id: string;
    locationId: string;
    lineItems: LineItem[];
    state: 'OPEN' | 'COMPLETED' | 'CANCELED' | 'DRAFT';
    totalMoney: Money;
    totalTaxMoney: Money;
    totalDiscountMoney: Money;
    totalTipMoney: Money;
    createdAt: string;
    updatedAt: string;
    closedAt?: string;
    customer?: Customer;
    ticketName?: string;
    source?: {
        name: string;
    };
    isRush?: boolean;
    tenders?: Tender[];
} 