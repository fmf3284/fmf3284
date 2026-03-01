import { NextRequest, NextResponse } from 'next/server';
import { LocationsService } from '@/server/services/locations.service';
import { updateLocationSchema } from '@/server/validators/locations.schema';
import { getRequestUser } from '@/server/auth/session';

/**
 * GET /api/locations/[id]
 * Get a single location by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const location = await LocationsService.getLocationById(id);

    if (!location) {
      return NextResponse.json(
        {
          success: false,
          error: 'Location not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: location,
    });
  } catch (error: any) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch location',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/locations/[id]
 * Update a location (protected - requires auth)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add role-based access control (only admins can update locations)
    // if (user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const { id } = await params;
    const body = await request.json();

    // Validate with Zod schema
    const validated = updateLocationSchema.parse(body);

    // Check if location exists
    const existingLocation = await LocationsService.getLocationById(id);
    if (!existingLocation) {
      return NextResponse.json(
        {
          success: false,
          error: 'Location not found',
        },
        { status: 404 }
      );
    }

    const updatedLocation = await LocationsService.updateLocation(id, validated);

    return NextResponse.json({
      success: true,
      data: updatedLocation,
    });
  } catch (error: any) {
    console.error('Error updating location:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid location data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update location',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/locations/[id]
 * Delete a location (protected - requires auth)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add role-based access control (only admins can delete locations)
    // if (user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const { id } = await params;

    // Check if location exists
    const existingLocation = await LocationsService.getLocationById(id);
    if (!existingLocation) {
      return NextResponse.json(
        {
          success: false,
          error: 'Location not found',
        },
        { status: 404 }
      );
    }

    await LocationsService.deleteLocation(id);

    return NextResponse.json({
      success: true,
      message: 'Location deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete location',
      },
      { status: 500 }
    );
  }
}
