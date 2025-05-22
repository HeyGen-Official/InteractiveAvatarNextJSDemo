import { LivekitVoiceChat, LivekitVoiceChatConfig } from './LiveKitVoiceChat';
import { WebSocketVoiceChat, WebSocketVoiceChatConfig } from './WebSocketVoiceChat';
import {
  AbstractVoiceChat,
  AbstractVoiceChatImplementation,
  VoiceChatConfig,
} from './base';

export enum VoiceChatTransport {
  LIVEKIT = 'livekit',
  WEBSOCKET = 'websocket',
}

interface VoiceChatClassMap {
  [VoiceChatTransport.LIVEKIT]: LivekitVoiceChat;
  [VoiceChatTransport.WEBSOCKET]: WebSocketVoiceChat;
}

interface VoiceChatInitialConfig<T extends VoiceChatTransport> {
  voiceChatInstance: VoiceChatClassMap[T];
  initialConfig: Omit<Parameters<VoiceChatClassMap[T]['startVoiceChat']>[0], 'config'>;
}

export class VoiceChatFactory extends AbstractVoiceChat<VoiceChatConfig> {
  private voiceChat: AbstractVoiceChatImplementation;
  private initialConfig: Omit<
    Parameters<typeof this.voiceChat.startVoiceChat>[0],
    'config'
  >;

  constructor({
    voiceChatInstance,
    initialConfig,
  }: VoiceChatInitialConfig<VoiceChatTransport>) {
    super();
    this.initialConfig = initialConfig;
    this.voiceChat = voiceChatInstance;
  }

  public get isMuted(): boolean {
    return this.voiceChat.isMuted;
  }

  public get isVoiceChatting(): boolean {
    return this.voiceChat.isVoiceChatting;
  }

  public getDeviceId(): Promise<string | undefined> {
    return this.voiceChat.getDeviceId();
  }

  public async startVoiceChat({ config }: VoiceChatConfig) {
    await this.voiceChat.startVoiceChat({ ...this.initialConfig, config });
  }

  public async stopVoiceChat() {
    await this.voiceChat.stopVoiceChat();
  }

  public mute() {
    this.voiceChat.mute();
  }

  public unmute() {
    this.voiceChat.unmute();
  }

  public async setDeviceId(deviceId: string) {
    await this.voiceChat.setDeviceId(deviceId);
  }

  static createLiveKitVoiceChat(voiceChatConfig: LivekitVoiceChatConfig) {
    return new this({
      voiceChatInstance: new LivekitVoiceChat(),
      initialConfig: voiceChatConfig,
    });
  }

  static createWebSocketVoiceChat(voiceChatConfig: WebSocketVoiceChatConfig) {
    return new this({
      voiceChatInstance: new WebSocketVoiceChat(),
      initialConfig: voiceChatConfig,
    });
  }
}
