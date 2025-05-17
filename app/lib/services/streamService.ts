export interface StreamStatus {
  streamId: string;
  status: boolean;
}

export const streamService = {
  async updateStreamStatus(streamId: string, status: boolean): Promise<StreamStatus> {
    try {
      const response = await fetch('/api/stream-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ streamId, status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update stream status');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in streamService:', error);
      throw error;
    }
  },

  async getStreamStatus(): Promise<StreamStatus> {
    try {
      const response = await fetch('/api/stream-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get stream status');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in streamService:', error);
      throw error;
    }
  }
}; 