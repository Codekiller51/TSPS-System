import { NextRequest, NextResponse } from 'next/server';
import { TempAdminManager } from '@/lib/temp-admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Only allow main admins to create temp admins
    if (!user || user.user_metadata?.role !== 'admin' || user.user_metadata?.temp_admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, expiresAt, permissions, createdBy, reason } = body;

    // Validate required fields
    if (!email || !expiresAt || !permissions || !createdBy || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const tempAdminManager = new TempAdminManager();
    const result = await tempAdminManager.createTempAdmin({
      email,
      password,
      expiresAt: new Date(expiresAt),
      permissions,
      createdBy,
      reason,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        tempAdmin: result.tempAdmin,
        password: result.password, // Only returned if generated
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in temp admin create API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}