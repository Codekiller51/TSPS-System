import { NextRequest, NextResponse } from 'next/server';
import { TempAdminManager } from '@/lib/temp-admin';

export async function POST(request: NextRequest) {
  try {
    // This endpoint can be called by a cron job or scheduled task
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CLEANUP_TOKEN;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const tempAdminManager = new TempAdminManager();
    const result = await tempAdminManager.cleanupExpiredTempAdmins();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in temp admin cleanup API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}