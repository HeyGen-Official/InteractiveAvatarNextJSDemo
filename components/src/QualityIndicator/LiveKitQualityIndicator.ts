import {
  Room,
  RoomEvent,
  ParticipantEvent,
  ConnectionQuality as LiveKitConnectionQuality,
  ConnectionState as LiveKitConnectionState,
} from 'livekit-client';
import { AbstractConnectionQualityIndicator, ConnectionQuality } from './base';

export class LiveKitConnectionQualityIndicator extends AbstractConnectionQualityIndicator<Room> {
  private room: Room | null = null;
  private liveKitConnectionQuality: LiveKitConnectionQuality =
    LiveKitConnectionQuality.Unknown;
  private liveKitConnectionState: LiveKitConnectionState | null = null;

  private handleConnectionQualityChanged = (quality: LiveKitConnectionQuality) => {
    this.liveKitConnectionQuality = quality;
    this.handleStatsChanged();
  };

  private handleConnectionStateChanged = (state: LiveKitConnectionState) => {
    this.liveKitConnectionState = state;
    this.handleStatsChanged();
  };

  protected _start(room: Room) {
    this.room = room;
    this.room.localParticipant.on(
      ParticipantEvent.ConnectionQualityChanged,
      this.handleConnectionQualityChanged
    );
    this.room.on(RoomEvent.ConnectionStateChanged, this.handleConnectionStateChanged);
  }

  protected _stop() {
    if (this.room) {
      this.room.localParticipant.off(
        RoomEvent.ConnectionQualityChanged,
        this.handleConnectionQualityChanged
      );
      this.room.off(RoomEvent.ConnectionStateChanged, this.handleConnectionStateChanged);
    }
  }

  protected calculateConnectionQuality(): ConnectionQuality {
    if (
      [LiveKitConnectionQuality.Lost, LiveKitConnectionQuality.Poor].includes(
        this.liveKitConnectionQuality
      )
    ) {
      return ConnectionQuality.BAD;
    }

    if (
      this.liveKitConnectionState &&
      [
        LiveKitConnectionState.Disconnected,
        LiveKitConnectionState.Reconnecting,
        LiveKitConnectionState.SignalReconnecting,
      ].includes(this.liveKitConnectionState)
    ) {
      return ConnectionQuality.BAD;
    }

    return ConnectionQuality.GOOD;
  }
}
