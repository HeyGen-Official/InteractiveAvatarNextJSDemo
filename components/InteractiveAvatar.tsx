import {
  AvatarQuality,
  StreamingEvents,
  VoiceChatTransport,
  VoiceEmotion,
  StartAvatarRequest,
  STTProvider,
  ElevenLabsModel,
  ConnectionQuality,
} from "@heygen/streaming-avatar";
import { useEffect, useRef, useState } from "react";
import { useMemoizedFn, useUnmount } from "ahooks";
import { streamService } from "@/app/lib/services/streamService";

import { Button } from "./Button";
import { AvatarConfig } from "./AvatarConfig";
import { AvatarVideo } from "./AvatarSession/AvatarVideo";
import { useStreamingAvatarSession } from "./logic/useStreamingAvatarSession";
import { AvatarControls } from "./AvatarSession/AvatarControls";
import { useVoiceChat } from "./logic/useVoiceChat";
import { StreamingAvatarProvider, StreamingAvatarSessionState } from "./logic";
import { LoadingIcon } from "./Icons";
import { MessageHistory } from "./AvatarSession/MessageHistory";

import { AVATARS } from "@/app/lib/constants";

const DEFAULT_CONFIG: StartAvatarRequest = {
  quality: AvatarQuality.Low,
  avatarName: AVATARS[0].avatar_id,
  knowledgeId: undefined,
  voice: {
    rate: 1.5,
    emotion: VoiceEmotion.EXCITED,
    model: ElevenLabsModel.eleven_flash_v2_5,
  },
  language: "en",
  disableIdleTimeout: true,
  voiceChatTransport: VoiceChatTransport.LIVEKIT,
  sttSettings: {
    provider: STTProvider.DEEPGRAM,
  },
};

function InteractiveAvatar() {
  const { initAvatar, startAvatar, stopAvatar, sessionState, stream } =
    useStreamingAvatarSession();
  const { startVoiceChat, muteInputAudio } = useVoiceChat();

  const [config, setConfig] = useState<StartAvatarRequest>(DEFAULT_CONFIG);

  const mediaStream = useRef<HTMLVideoElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingEnabled, setRecordingEnabled] = useState(false);

  const [hasStartedTalking, setHasStartedTalking] = useState(false);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [shiftKeyPressed, setShiftKeyPressed] = useState(false);

  async function fetchAccessToken() {
    try {
      const response = await fetch("/api/get-access-token", {
        method: "POST",
      });
      const token = await response.text();

      console.log("Access Token:", token); // Log the token to verify

      return token;
    } catch (error) {
      console.error("Error fetching access token:", error);
      throw error;
    }
  }

  const startSessionV2 = useMemoizedFn(async (isVoiceChat: boolean) => {
    try {
      const newToken = await fetchAccessToken();
      const avatar = initAvatar(newToken);

      avatar.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
        console.log("Avatar started talking", e);
        window.dispatchEvent(new Event('AVATAR_START_TALKING'));
      });
      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
        console.log("Avatar stopped talking", e);
        window.dispatchEvent(new Event('AVATAR_STOP_TALKING'));
      });
      avatar.on(StreamingEvents.STREAM_DISCONNECTED, async () => {
        console.log("Stream disconnected");
        try {
          await streamService.updateStreamStatus(stream?.id || 'unknown', false);
          console.log("Stream status updated to offline");
        } catch (error) {
          console.error("Failed to update stream status to offline:", error);
        }
      });
      avatar.on(StreamingEvents.STREAM_READY, async (event) => {
        console.log(">>>>> Stream ready:", event.detail);
        try {
          await streamService.updateStreamStatus(event.detail.streamId, true);
          console.log("Stream status updated to online");
        } catch (error) {
          console.error("Failed to update stream status to online:", error);
        }
      });
      avatar.on(StreamingEvents.USER_START, (event) => {
        console.log(">>>>> User started talking:", event);
      });
      avatar.on(StreamingEvents.USER_STOP, (event) => {
        console.log(">>>>> User stopped talking:", event);
      });
      avatar.on(StreamingEvents.USER_END_MESSAGE, (event) => {
        console.log(">>>>> User end message:", event);
      });
      avatar.on(StreamingEvents.USER_TALKING_MESSAGE, (event) => {
        console.log(">>>>> User talking message:", event);
      });
      avatar.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (event) => {
        console.log(">>>>> Avatar talking message:", event);
      });
      avatar.on(StreamingEvents.AVATAR_END_MESSAGE, (event) => {
        console.log(">>>>> Avatar end message:", event);
      });

      await startAvatar(config);

      if (isVoiceChat) {
        await startVoiceChat();
      }
    } catch (error) {
      console.error("Error starting avatar session:", error);
    }
  });

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current!.play();
      };

      // Only start recording if recording is enabled
      if (stream instanceof MediaStream && recordingEnabled) {
        const recorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9,opus'
        });

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunks.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunks.current, {
            type: 'video/webm'
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `session-${new Date().toISOString()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
          recordedChunks.current = [];
        };

        mediaRecorder.current = recorder;
        recorder.start();
        setIsRecording(true);
      }
    }
  }, [mediaStream, stream, recordingEnabled]);

  useUnmount(() => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
    stopAvatar();
  });

  const handleDownloadSession = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    } else if (!recordingEnabled) {
      setRecordingEnabled(true);
    }
  };

  const toggleRecording = () => {
    if (recordingEnabled) {
      setRecordingEnabled(false);
      if (mediaRecorder.current && isRecording) {
        mediaRecorder.current.stop();
        setIsRecording(false);
      }
    } else {
      setRecordingEnabled(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftKeyPressed(true);
        if (!hasStartedTalking) {
          setMicrophoneEnabled(true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftKeyPressed(false);
        setMicrophoneEnabled(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [hasStartedTalking]);

  useEffect(() => {
    const handleAvatarStartTalking = () => {
      setHasStartedTalking(true);
      setMicrophoneEnabled(false);
      muteInputAudio(); // Force mute when avatar starts talking
    };

    const handleAvatarStopTalking = () => {
      setHasStartedTalking(false);
      if (shiftKeyPressed) {
        setMicrophoneEnabled(true);
      }
    };

    window.addEventListener('AVATAR_START_TALKING', handleAvatarStartTalking);
    window.addEventListener('AVATAR_STOP_TALKING', handleAvatarStopTalking);

    return () => {
      window.removeEventListener('AVATAR_START_TALKING', handleAvatarStartTalking);
      window.removeEventListener('AVATAR_STOP_TALKING', handleAvatarStopTalking);
    };
  }, [shiftKeyPressed, muteInputAudio]);

  useEffect(() => {
    if (hasStartedTalking) {
      setMicrophoneEnabled(false);
      muteInputAudio(); // Force mute when hasStartedTalking changes to true
    } else if (shiftKeyPressed) {
      setMicrophoneEnabled(true);
    }
  }, [hasStartedTalking, shiftKeyPressed, muteInputAudio]);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col rounded-xl bg-zinc-900 overflow-hidden">
        <div className="relative w-full aspect-video overflow-hidden">
            <AvatarVideo ref={mediaStream} />
        </div>
        <div className="flex flex-col gap-3 items-center justify-center p-4 border-t border-zinc-700 w-full">
          {sessionState === StreamingAvatarSessionState.CONNECTED ? (
            <div className="flex flex-col gap-3 w-full items-center">
              <AvatarControls microphoneEnabled={microphoneEnabled} />
              <Button 
                onClick={toggleRecording}
                className={`${recordingEnabled ? '!bg-green-600 hover:!bg-green-700' : '!bg-gray-600 hover:!bg-gray-700'}`}
              >
                {recordingEnabled ? 'Stop Recording' : 'Start Recording'}
              </Button>
              <Button 
                onClick={handleDownloadSession}
                disabled={!isRecording}
                className="!bg-blue-600 hover:!bg-blue-700"
              >
                Download Session
              </Button>
            </div>
          ) : sessionState === StreamingAvatarSessionState.INACTIVE ? (
            <div className="flex flex-row gap-4">
              <Button onClick={() => startSessionV2(true)}>
                Start Voice Chat
              </Button>
              <Button onClick={() => startSessionV2(false)}>
                Start Text Chat
              </Button>
            </div>
          ) : (
            <LoadingIcon />
          )}
        </div>
      </div>
      {sessionState === StreamingAvatarSessionState.INACTIVE && (
        <div className="rounded-xl bg-zinc-900 overflow-hidden">
          <AvatarConfig config={config} onConfigChange={setConfig} />
        </div>
      )}
      {sessionState === StreamingAvatarSessionState.CONNECTED && (
        <MessageHistory />
      )}
    </div>
  );
}

export default function InteractiveAvatarWrapper() {
  return (
    <StreamingAvatarProvider basePath={process.env.NEXT_PUBLIC_BASE_API_URL}>
      <InteractiveAvatar />
    </StreamingAvatarProvider>
  );
}
