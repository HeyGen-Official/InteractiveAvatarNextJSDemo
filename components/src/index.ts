import { Room, RoomEvent, VideoPresets } from 'livekit-client';
import protobuf from 'protobufjs';
import jsonDescriptor from './pipecat.json';
import {
  ConnectionQuality,
  LiveKitConnectionQualityIndicator,
  WebRTCConnectionQualityIndicator,
  QualityIndicatorMixer,
  AbstractConnectionQualityIndicator,
} from './QualityIndicator';
import { AbstractVoiceChat, VoiceChatFactory, VoiceChatTransport } from './VoiceChat';

export { ConnectionQuality } from './QualityIndicator';
export { VoiceChatTransport } from './VoiceChat';

export interface StreamingAvatarApiConfig {
  token: string;
  basePath?: string;
}

export enum AvatarQuality {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}
export enum VoiceEmotion {
  EXCITED = 'excited',
  SERIOUS = 'serious',
  FRIENDLY = 'friendly',
  SOOTHING = 'soothing',
  BROADCASTER = 'broadcaster',
}
export enum ElevenLabsModel {
  eleven_flash_v2_5 = 'eleven_flash_v2_5',
  eleven_multilingual_v2 = 'eleven_multilingual_v2',
}
export interface ElevenLabsSettings {
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
}
export enum STTProvider {
  DEEPGRAM = 'deepgram',
  GLADIA = 'gladia',
}
export interface STTSettings {
  provider?: STTProvider;
  confidence?: number;
}
export interface StartAvatarRequest {
  quality?: AvatarQuality;
  avatarName: string;
  voice?: {
    voiceId?: string;
    rate?: number;
    emotion?: VoiceEmotion;
    elevenlabsSettings?: ElevenLabsSettings;
    model?: ElevenLabsModel;
  };
  knowledgeId?: string;
  language?: string;
  knowledgeBase?: string;
  disableIdleTimeout?: boolean;
  sttSettings?: STTSettings;
  useSilencePrompt?: boolean;
  voiceChatTransport?: VoiceChatTransport;
}

export interface VoiceChatConfig {
  deviceId?: ConstrainDOMString;
  isInputAudioMuted?: boolean;
}

export interface StartAvatarResponse {
  session_id: string;
  access_token: string;
  url: string;
  is_paid: boolean;
  session_duration_limit: number;
}

export enum TaskType {
  TALK = 'talk',
  REPEAT = 'repeat',
}
export enum TaskMode {
  SYNC = 'sync',
  ASYNC = 'async',
}
export interface SpeakRequest {
  text: string;
  task_type?: TaskType; // should use camelCase
  taskType?: TaskType;
  taskMode?: TaskMode;
}

export interface CommonRequest {
  [key: string]: any;
}

// event types --------------------------------
export enum StreamingEvents {
  AVATAR_START_TALKING = 'avatar_start_talking',
  AVATAR_STOP_TALKING = 'avatar_stop_talking',
  AVATAR_TALKING_MESSAGE = 'avatar_talking_message',
  AVATAR_END_MESSAGE = 'avatar_end_message',
  USER_TALKING_MESSAGE = 'user_talking_message',
  USER_END_MESSAGE = 'user_end_message',
  USER_START = 'user_start',
  USER_STOP = 'user_stop',
  USER_SILENCE = 'user_silence',
  STREAM_READY = 'stream_ready',
  STREAM_DISCONNECTED = 'stream_disconnected',
  CONNECTION_QUALITY_CHANGED = 'connection_quality_changed',
}
export type EventHandler = (...args: any[]) => void;
export interface EventData {
  [key: string]: unknown;
  task_id: string;
}

export interface StreamingStartTalkingEvent extends EventData {
  type: StreamingEvents.AVATAR_START_TALKING;
}

export interface StreamingStopTalkingEvent extends EventData {
  type: StreamingEvents.AVATAR_STOP_TALKING;
}

export interface StreamingTalkingMessageEvent extends EventData {
  type: StreamingEvents.AVATAR_TALKING_MESSAGE;
  message: string;
}

export interface StreamingTalkingEndEvent extends EventData {
  type: StreamingEvents.AVATAR_END_MESSAGE;
}

export interface UserTalkingMessageEvent extends EventData {
  type: StreamingEvents.USER_TALKING_MESSAGE;
  message: string;
}

export interface UserTalkingEndEvent extends EventData {
  type: StreamingEvents.USER_END_MESSAGE;
}

type StreamingEventTypes =
  | StreamingStartTalkingEvent
  | StreamingStopTalkingEvent
  | StreamingTalkingMessageEvent
  | StreamingTalkingEndEvent
  | UserTalkingMessageEvent
  | UserTalkingEndEvent;

interface WebsocketBaseEvent {
  [key: string]: unknown;
}
interface UserStartTalkingEvent extends WebsocketBaseEvent {
  event_type: StreamingEvents.USER_START;
}
interface UserStopTalkingEvent extends WebsocketBaseEvent {
  event_type: StreamingEvents.USER_STOP;
}
interface UserSilenceEvent extends WebsocketBaseEvent {
  event_type: StreamingEvents.USER_SILENCE;
  silence_times: number;
  count_down: number;
}

type StreamingWebSocketEventTypes =
  | UserStartTalkingEvent
  | UserStopTalkingEvent
  | UserSilenceEvent;

class APIError extends Error {
  public status: number;
  public responseText: string;

  constructor(message: string, status: number, responseText: string) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.responseText = responseText;
  }
}

const ConnectionQualityIndicatorClass = QualityIndicatorMixer(
  {
    TrackerClass: LiveKitConnectionQualityIndicator,
    getParams: (room: Room) => room,
  },
  {
    TrackerClass: WebRTCConnectionQualityIndicator,
    getParams: (room: Room) => (room.engine.pcManager?.subscriber as any)._pc,
  }
);

class StreamingAvatar {
  public room: Room | null = null;
  public mediaStream: MediaStream | null = null;

  private readonly token: string;
  private readonly basePath: string;
  private eventTarget = new EventTarget();
  private webSocket: globalThis.WebSocket | null = null;
  private audioRawFrame: protobuf.Type | undefined;
  private sessionId: string | null = null;
  private connectionQualityIndicator: AbstractConnectionQualityIndicator<Room>;
  private voiceChat: AbstractVoiceChat | null = null;
  private isLiveKitTransport: boolean = false;

  constructor({ token, basePath = 'https://api.heygen.com' }: StreamingAvatarApiConfig) {
    this.token = token;
    this.basePath = basePath;
    this.connectionQualityIndicator = new ConnectionQualityIndicatorClass((quality) =>
      this.emit(StreamingEvents.CONNECTION_QUALITY_CHANGED, quality)
    );
  }

  public get connectionQuality(): ConnectionQuality {
    return this.connectionQualityIndicator.connectionQuality;
  }

  public get isInputAudioMuted(): boolean {
    return this.voiceChat?.isMuted ?? true;
  }

  public muteInputAudio() {
    this.voiceChat?.mute();
  }

  public unmuteInputAudio() {
    this.voiceChat?.unmute();
  }

  public getVoiceChatDeviceId(): Promise<string | undefined> | undefined {
    return this.voiceChat?.getDeviceId();
  }

  public async setVoiceChatDeviceId(deviceId: ConstrainDOMString) {
    await this.voiceChat?.setDeviceId(deviceId);
  }

  public async createStartAvatar(requestData: StartAvatarRequest): Promise<any> {
    const sessionInfo = await this.newSession(requestData);
    this.sessionId = sessionInfo.session_id;
    this.isLiveKitTransport =
      requestData.voiceChatTransport === VoiceChatTransport.LIVEKIT;
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: VideoPresets.h720.resolution,
      },
    });

    this.room = room;
    this.mediaStream = null;

    room.on(RoomEvent.DataReceived, (roomMessage) => {
      let eventMsg: StreamingEventTypes | null = null;
      try {
        const messageString = new TextDecoder().decode(roomMessage);
        eventMsg = JSON.parse(messageString) as StreamingEventTypes;
      } catch (e) {
        console.error(e);
      }
      if (!eventMsg) {
        return;
      }
      this.emit(eventMsg.type, eventMsg);
    });

    const mediaStream = new MediaStream();
    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind === 'video' || track.kind === 'audio') {
        mediaStream.addTrack(track.mediaStreamTrack);

        const hasVideoTrack = mediaStream.getVideoTracks().length > 0;
        const hasAudioTrack = mediaStream.getAudioTracks().length > 0;
        if (hasVideoTrack && hasAudioTrack && !this.mediaStream) {
          this.mediaStream = mediaStream;
          this.emit(StreamingEvents.STREAM_READY, this.mediaStream);
        }
      }
    });
    room.on(RoomEvent.TrackUnsubscribed, (track) => {
      const mediaTrack = track.mediaStreamTrack;
      if (mediaTrack) {
        mediaStream.removeTrack(mediaTrack);
      }
    });

    room.on(RoomEvent.Disconnected, (reason) => {
      this.emit(StreamingEvents.STREAM_DISCONNECTED, reason);
    });

    try {
      await room.prepareConnection(sessionInfo.url, sessionInfo.access_token);
    } catch (error) {}

    await this.startSession();

    await room.connect(sessionInfo.url, sessionInfo.access_token);
    await this.connectWebSocket({ useSilencePrompt: !!requestData.useSilencePrompt });
    this.initVoiceChat(requestData.voiceChatTransport || VoiceChatTransport.WEBSOCKET);
    this.connectionQualityIndicator.start(room);

    return sessionInfo;
  }

  public async startVoiceChat(config?: VoiceChatConfig) {
    await this.voiceChat?.startVoiceChat({ config: config || {} });
  }

  public async closeVoiceChat() {
    await this.voiceChat?.stopVoiceChat();
  }

  public async newSession(requestData: StartAvatarRequest): Promise<StartAvatarResponse> {
    return this.request('/v1/streaming.new', {
      avatar_name: requestData.avatarName,
      quality: requestData.quality,
      knowledge_base_id: requestData.knowledgeId,
      knowledge_base: requestData.knowledgeBase,
      voice: {
        voice_id: requestData.voice?.voiceId,
        rate: requestData.voice?.rate,
        emotion: requestData.voice?.emotion,
        elevenlabs_settings: {
          ...requestData?.voice?.elevenlabsSettings,
          model_id: requestData.voice?.model,
        },
      },
      language: requestData.language,
      version: 'v2',
      video_encoding: 'H264',
      source: 'sdk',
      disable_idle_timeout: requestData.disableIdleTimeout,
      stt_settings: requestData.sttSettings,
      ia_is_livekit_transport:
        requestData.voiceChatTransport === VoiceChatTransport.LIVEKIT,
      silence_response: requestData.useSilencePrompt,
    });
  }
  public async startSession(): Promise<any> {
    return this.request('/v1/streaming.start', {
      session_id: this.sessionId,
    });
  }
  public async speak(requestData: SpeakRequest): Promise<any> {
    const taskType = requestData.taskType || requestData.task_type || TaskType.TALK;
    const taskMode = requestData.taskMode || TaskMode.ASYNC;

    // livekit/websocket text transport supports only async talk task
    if (taskType === TaskType.TALK && taskMode === TaskMode.ASYNC) {
      if (this.isLiveKitTransport && this.room) {
        this.sendLivekitMessage(requestData.text);
        return;
      }

      if (!this.isLiveKitTransport && this.webSocket && this.audioRawFrame) {
        this.sendWebsocketMessage(requestData.text);
        return;
      }
    }
    return this.request('/v1/streaming.task', {
      text: requestData.text,
      session_id: this.sessionId,
      task_mode: requestData.taskMode,
      task_type: requestData.taskType,
    });
  }

  public async startListening(): Promise<any> {
    return this.request('/v1/streaming.start_listening', {
      session_id: this.sessionId,
    });
  }
  public async stopListening(): Promise<any> {
    return this.request('/v1/streaming.stop_listening', {
      session_id: this.sessionId,
    });
  }
  public async interrupt(): Promise<any> {
    return this.request('/v1/streaming.interrupt', {
      session_id: this.sessionId,
    });
  }

  public async stopAvatar(): Promise<any> {
    // clear some resources
    this.closeVoiceChat();
    this.connectionQualityIndicator.stop();
    this.voiceChat = null;
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }
    return this.request('/v1/streaming.stop', {
      session_id: this.sessionId,
    });
  }

  public on(eventType: string, listener: EventHandler): this {
    this.eventTarget.addEventListener(eventType, listener);
    return this;
  }

  public off(eventType: string, listener: EventHandler): this {
    this.eventTarget.removeEventListener(eventType, listener);
    return this;
  }

  private async sendLivekitMessage(message: string) {
    if (!this.room) {
      return;
    }
    const data = new TextEncoder().encode(JSON.stringify(message));
    this.room.localParticipant.publishData(data, { reliable: true });
  }

  private async sendWebsocketMessage(message: string) {
    if (!this.webSocket || !this.audioRawFrame) {
      return;
    }
    const frame = this.audioRawFrame?.create({
      text: {
        text: message,
      },
    });
    const encodedFrame = new Uint8Array(this.audioRawFrame?.encode(frame).finish());
    this.webSocket.send(encodedFrame);
  }

  private initVoiceChat(transport: VoiceChatTransport) {
    if (transport === VoiceChatTransport.WEBSOCKET) {
      this.loadAudioRawFrame();

      if (!this.audioRawFrame || !this.webSocket) {
        return;
      }

      this.voiceChat = VoiceChatFactory.createWebSocketVoiceChat({
        webSocket: this.webSocket,
        audioRawFrame: this.audioRawFrame,
      });
    } else {
      if (!this.room) {
        return;
      }

      this.voiceChat = VoiceChatFactory.createLiveKitVoiceChat({
        room: this.room,
      });
    }
  }

  private async request(path: string, params: CommonRequest, config?: any): Promise<any> {
    try {
      const response = await fetch(this.getRequestUrl(path), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new APIError(
          `API request failed with status ${response.status}`,
          response.status,
          errorText
        );
      }

      const jsonData = await response.json();
      return jsonData.data;
    } catch (error) {
      throw error;
    }
  }

  private emit(eventType: string, detail?: any) {
    const event = new CustomEvent(eventType, { detail });
    this.eventTarget.dispatchEvent(event);
  }
  private getRequestUrl(endpoint: string): string {
    return `${this.basePath}${endpoint}`;
  }
  private async connectWebSocket(requestData: { useSilencePrompt: boolean }) {
    let websocketUrl = `wss://${new URL(this.basePath).hostname}/v1/ws/streaming.chat?session_id=${this.sessionId}&session_token=${this.token}${this.isLiveKitTransport ? '&arch_version=v2' : ''}&silence_response=${requestData.useSilencePrompt}`;
    this.webSocket = new WebSocket(websocketUrl);
    this.webSocket.addEventListener('message', (event) => {
      let eventData: StreamingWebSocketEventTypes | null = null;
      try {
        eventData = JSON.parse(event.data);
      } catch (e) {
        console.error(e);
        return;
      }
      if (eventData) {
        this.emit(eventData.event_type, eventData);
      }
    });
    this.webSocket.addEventListener('close', (event) => {
      this.webSocket = null;
    });
    return new Promise((resolve, reject) => {
      this.webSocket?.addEventListener('error', (event) => {
        this.webSocket = null;
        reject(event);
      });
      this.webSocket?.addEventListener('open', () => {
        resolve(true);
      });
    });
  }

  private async loadAudioRawFrame() {
    if (!this.audioRawFrame) {
      const root = protobuf.Root.fromJSON(jsonDescriptor);
      this.audioRawFrame = root?.lookupType('pipecat.Frame');
    }
  }
}

export default StreamingAvatar;
