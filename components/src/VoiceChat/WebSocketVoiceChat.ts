import { AbstractVoiceChatImplementation, VoiceChatConfig } from './base';
import { convertFloat32ToS16PCM, sleep } from '../utils';
import protobuf from 'protobufjs';

export interface WebSocketVoiceChatConfig extends VoiceChatConfig {
  webSocket: globalThis.WebSocket;
  audioRawFrame: protobuf.Type;
}

export class WebSocketVoiceChat extends AbstractVoiceChatImplementation<WebSocketVoiceChatConfig> {
  private audioContext: AudioContext | null = null;
  private webSocket: globalThis.WebSocket | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private mediaStreamAudioSource: MediaStreamAudioSourceNode | null = null;
  private mediaDevicesStream: MediaStream | null = null;
  private audioRawFrame: protobuf.Type | null = null;

  public getDeviceId(): Promise<string | undefined> {
    return Promise.resolve(
      this.mediaDevicesStream?.getTracks()[0]?.getSettings().deviceId
    );
  }

  protected async _startVoiceChat(voiceChatConfig: WebSocketVoiceChatConfig) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Cannot start voice chat without media devices');
    }
    this.webSocket = voiceChatConfig.webSocket;
    this.audioRawFrame = voiceChatConfig.audioRawFrame;

    this.audioContext = new window.AudioContext({
      latencyHint: 'interactive',
      sampleRate: 16000,
    });
    if (!voiceChatConfig.config?.defaultMuted) {
      this.unmute();
    }
    const devicesStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
        deviceId: voiceChatConfig.config?.deviceId,
      },
    });
    this.mediaDevicesStream = devicesStream;

    this.mediaStreamAudioSource =
      this.audioContext?.createMediaStreamSource(devicesStream);
    this.scriptProcessor = this.audioContext?.createScriptProcessor(512, 1, 1);

    this.mediaStreamAudioSource.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContext?.destination);

    this.scriptProcessor.onaudioprocess = (event) => {
      if (!this.webSocket || !this.audioRawFrame) {
        return;
      }
      let audioData: Float32Array;
      if (this.isMuted) {
        audioData = new Float32Array(512);
      } else {
        audioData = event.inputBuffer.getChannelData(0);
      }
      const pcmS16Array = convertFloat32ToS16PCM(audioData);
      const pcmByteArray = new Uint8Array(pcmS16Array.buffer);
      const frame = this.audioRawFrame.create({
        audio: {
          audio: Array.from(pcmByteArray),
          sampleRate: 16000,
          numChannels: 1,
        },
      });
      const encodedFrame = new Uint8Array(this.audioRawFrame.encode(frame).finish());
      this.webSocket?.send(encodedFrame);
    };

    // though room has been connected, but the stream may not be ready.
    await sleep(2000);
  }

  protected async _stopVoiceChat() {
    if (this.audioContext) {
      this.audioContext = null;
    }
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    if (this.mediaStreamAudioSource) {
      this.mediaStreamAudioSource.disconnect();
      this.mediaStreamAudioSource = null;
    }
    if (this.mediaDevicesStream) {
      this.mediaDevicesStream?.getTracks()?.forEach((track) => track.stop());
      this.mediaDevicesStream = null;
    }
  }

  protected async _setDeviceId(deviceId: ConstrainDOMString): Promise<void> {
    if (this.webSocket && this.audioRawFrame) {
      await this._stopVoiceChat();
      await this._startVoiceChat({
        webSocket: this.webSocket,
        audioRawFrame: this.audioRawFrame,
        config: {
          deviceId,
          defaultMuted: this.isMuted,
        },
      });
    }
  }
}
