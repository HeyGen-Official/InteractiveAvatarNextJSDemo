import { createLocalAudioTrack, LocalAudioTrack, Room, Track } from 'livekit-client';
import { AbstractVoiceChatImplementation, VoiceChatConfig } from './base';
import { sleep } from '../utils';

export interface LivekitVoiceChatConfig extends VoiceChatConfig {
  room: Room;
}

export class LivekitVoiceChat extends AbstractVoiceChatImplementation<LivekitVoiceChatConfig> {
  private room: Room | null = null;
  private track: LocalAudioTrack | null = null;

  public getDeviceId(): Promise<string | undefined> {
    return this.track?.getDeviceId() ?? Promise.resolve(undefined);
  }

  protected async _startVoiceChat(voiceChatConfig: LivekitVoiceChatConfig) {
    this.room = voiceChatConfig.room;
    this.track = await createLocalAudioTrack({
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      deviceId: voiceChatConfig.config?.deviceId,
    });
    await this.room.localParticipant.publishTrack(this.track);
    if (!voiceChatConfig.config?.defaultMuted) {
      this.unmute();
    }else{
      this.mute();
    }
    await sleep(4000);
  }

  protected async _stopVoiceChat() {
    if (this.room?.localParticipant) {
      this.room.localParticipant.getTrackPublications().forEach((publication) => {
        if (publication.track && publication.track.kind === Track.Kind.Audio) {
          publication.track.stop();
        }
      });
    }
    if (this.track) {
      this.track.stop();
      this.track = null;
    }
  }

  protected async _setDeviceId(deviceId: string): Promise<void> {
    if (this.track) {
      await this.track.setDeviceId(deviceId);
    }
  }

  protected _mute(): void {
    if (this.track && !this.track.isMuted) {
      this.track.mute();
    }
  }

  protected _unmute(): void {
    if (this.track && this.track.isMuted) {
      this.track.unmute();
    }
  }
}
