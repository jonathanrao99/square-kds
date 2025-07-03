import { NextResponse } from 'next/server';
import { squareClient } from '@/lib/square';

export async function GET() {
  try {
    console.log("Fetching locations from Square API...");
    const locationsResponse = await squareClient.locations.list();
    const locations: unknown[] = locationsResponse.locations ?? [];

    const activeLocations = locations
      .filter((location): location is { status: string; id: string; name?: string } =>
        typeof location === 'object' && location !== null &&
        'status' in location && 'id' in location &&
        typeof (location as { status?: unknown }).status === 'string' &&
        typeof (location as { id?: unknown }).id === 'string'
      )
      .filter(location => location.status === 'ACTIVE' && location.id)
      .map(location => ({
        id: location.id!,
        name: location.name || `Location ${location.id}`,
      }));

    console.log("Active locations fetched:", activeLocations);
    return NextResponse.json({ locations: activeLocations });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}