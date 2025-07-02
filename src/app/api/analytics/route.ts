import { NextResponse } from 'next/server';
import { SquareClient, SquareEnvironment } from 'square';
import { Client as LegacyClient } from 'square/legacy';
import { Order } from '@/types';

if (!process.env.SQUARE_ACCESS_TOKEN) {
    throw new Error("SQUARE_ACCESS_TOKEN is not set in the environment variables.");
}

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: process.env.SANDBOX === 'true' ? SquareEnvironment.Sandbox : SquareEnvironment.Production,
});

const legacyClient = new LegacyClient({
  bearerAuthCredentials: {
    accessToken: process.env.SQUARE_ACCESS_TOKEN!,
  },
});
const ordersApi = legacyClient.ordersApi;

export async function GET() {
    try {
        const locationsResponse = await client.locations.list();
        const locationIds = (locationsResponse.locations ?? [])
            .filter(l => l.status === 'ACTIVE' && l.id)
            .map(l => l.id!);

        if (locationIds.length === 0) {
            return NextResponse.json({
                totalTickets: 0,
                avgCompletionTime: '0m 0s',
                busiestHour: 'N/A',
                topItem: 'N/A',
                rushOrders: 0,
            });
        }

        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const completedOrdersResponse = await ordersApi.searchOrders({
            locationIds,
            query: {
                filter: {
                    stateFilter: { states: ['COMPLETED'] },
                    dateTimeFilter: { closedAt: { startAt: twentyFourHoursAgo.toISOString(), endAt: now.toISOString() } },
                },
            },
        });

        const allOrders: Order[] = JSON.parse(
            JSON.stringify(completedOrdersResponse, (_, value) =>
                typeof value === 'bigint' ? value.toString() : value
            )
        ).orders ?? [];

        let totalCompletionTime = 0;
        let completedOrderCount = 0;
        let rushOrders = 0;
        const hourlyOrderCount: { [key: string]: number } = {};
        const itemSales: { [key: string]: number } = {};

        allOrders.forEach(order => {
            if (order.closedAt && order.createdAt) {
                const created = new Date(order.createdAt).getTime();
                const closed = new Date(order.closedAt).getTime();
                totalCompletionTime += (closed - created);
                completedOrderCount++;

                const hour = new Date(order.createdAt).getHours();
                hourlyOrderCount[hour] = (hourlyOrderCount[hour] || 0) + 1;
            }

            if (order.isRush) {
                rushOrders++;
            }

            order.lineItems.forEach(item => {
                if (item.name) {
                    itemSales[item.name] = (itemSales[item.name] || 0) + parseInt(item.quantity);
                }
            });
        });

        const avgCompletionTimeMs = completedOrderCount > 0 ? totalCompletionTime / completedOrderCount : 0;
        const avgMinutes = Math.floor(avgCompletionTimeMs / (1000 * 60));
        const avgSeconds = Math.floor((avgCompletionTimeMs % (1000 * 60)) / 1000);
        const avgCompletionTimeString = `${avgMinutes}m ${avgSeconds}s`;

        let busiestHour = 'N/A';
        let maxOrdersInHour = 0;
        for (const hour in hourlyOrderCount) {
            if (hourlyOrderCount[hour] > maxOrdersInHour) {
                maxOrdersInHour = hourlyOrderCount[hour];
                busiestHour = `${hour}:00 - ${parseInt(hour) + 1}:00`;
            }
        }

        let topItem = 'N/A';
        let maxItemSales = 0;
        for (const item in itemSales) {
            if (itemSales[item] > maxItemSales) {
                maxItemSales = itemSales[item];
                topItem = item;
            }
        }

        return NextResponse.json({
            totalTickets: allOrders.length,
            avgCompletionTime: avgCompletionTimeString,
            busiestHour,
            topItem,
            rushOrders,
        });

    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
