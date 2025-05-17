import { NextResponse } from 'next/server';

// In-memory storage for stream status
let currentStreamStatus = {
  streamId: '',
  status: false
};

export async function GET() {
  try {
    return NextResponse.json(currentStreamStatus);
  } catch (error) {
    console.error('Error getting stream status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get stream status' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { streamId, status } = body;

    // Update the current stream status
    currentStreamStatus = { streamId, status };

    // Here you can add your logic to handle the stream status
    // For example, storing it in a database or notifying other services
    console.log(`Stream ${streamId} status updated to: ${status}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Stream status updated successfully',
      streamId,
      status 
    });
  } catch (error) {
    console.error('Error updating stream status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update stream status' },
      { status: 500 }
    );
  }
} 