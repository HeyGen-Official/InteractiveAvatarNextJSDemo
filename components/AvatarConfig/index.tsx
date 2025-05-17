import React, { useMemo, useState, useEffect } from "react";
import {
  AvatarQuality,
  ElevenLabsModel,
  STTProvider,
  VoiceEmotion,
  StartAvatarRequest,
  VoiceChatTransport,
} from "@heygen/streaming-avatar";

import { Input } from "../Input";
import { Select } from "../Select";

import { Field } from "./Field";

import { AVATARS, STT_LANGUAGE_LIST } from "@/app/lib/constants";

interface AvatarConfigProps {
  onConfigChange: (config: StartAvatarRequest) => void;
  config: StartAvatarRequest;
}

export const AvatarConfig: React.FC<AvatarConfigProps> = ({
  onConfigChange,
  config,
}) => {
  const onChange = <T extends keyof StartAvatarRequest>(
    key: T,
    value: StartAvatarRequest[T],
  ) => {
    onConfigChange({ ...config, [key]: value });
  };

  // Initialize config with environment variables
  useEffect(() => {
    const initialConfig: StartAvatarRequest = {
      knowledgeId: process.env.NEXT_PUBLIC_KNOWLEDGE_BASE_ID || "",
      avatarName: process.env.NEXT_PUBLIC_AVATAR_ID || "",
      language: process.env.NEXT_PUBLIC_LANGUAGE || "English",
      quality: (process.env.NEXT_PUBLIC_AVATAR_QUALITY as AvatarQuality) || AvatarQuality.Low,
      voiceChatTransport: (process.env.NEXT_PUBLIC_VOICE_CHAT_TRANSPORT as VoiceChatTransport) || VoiceChatTransport.LIVEKIT,
      voice: {
        voiceId: process.env.NEXT_PUBLIC_CUSTOM_VOICE_ID || "",
        emotion: (process.env.NEXT_PUBLIC_VOICE_EMOTION as VoiceEmotion) || VoiceEmotion.FRIENDLY,
        model: (process.env.NEXT_PUBLIC_ELEVENLABS_MODEL as ElevenLabsModel) || ElevenLabsModel.eleven_flash_v2_5,
      },
      sttSettings: {
        provider: (process.env.NEXT_PUBLIC_STT_PROVIDER as STTProvider) || STTProvider.DEEPGRAM,
      },
    };
    onConfigChange(initialConfig);
  }, []);

  const [showMore, setShowMore] = useState<boolean>(false);

  const selectedAvatar = useMemo(() => {
    const avatar = AVATARS.find(
      (avatar) => avatar.avatar_id === config.avatarName,
    );

    if (!avatar) {
      return {
        isCustom: true,
        name: "Custom Avatar ID",
        avatarId: null,
      };
    } else {
      return {
        isCustom: false,
        name: avatar.name,
        avatarId: avatar.avatar_id,
      };
    }
  }, [config.avatarName]);

  return (
    <div className="flex flex-col gap-4 w-full py-8 max-h-[600px] overflow-y-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Custom Knowledge Base ID">
          <Input
            placeholder="Enter custom knowledge base ID"
            value={config.knowledgeId}
            onChange={(value) => onChange("knowledgeId", value)}
          />
        </Field>
        <Field label="Avatar ID">
          <Select
            isSelected={(option) =>
              typeof option === "string"
                ? !!selectedAvatar?.isCustom
                : option.avatar_id === selectedAvatar?.avatarId
            }
            options={[...AVATARS, "CUSTOM"]}
            placeholder="Select Avatar"
            renderOption={(option) => {
              return typeof option === "string"
                ? "Custom Avatar ID"
                : option.name;
            }}
            value={
              selectedAvatar?.isCustom ? "Custom Avatar ID" : selectedAvatar?.name
            }
            onSelect={(option) => {
              if (typeof option === "string") {
                onChange("avatarName", "");
              } else {
                onChange("avatarName", option.avatar_id);
              }
            }}
          />
        </Field>
      </div>

      {selectedAvatar?.isCustom && (
        <Field label="Custom Avatar ID">
          <Input
            placeholder="Enter custom avatar ID"
            value={config.avatarName}
            onChange={(value) => onChange("avatarName", value)}
          />
        </Field>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Language">
          <Select
            isSelected={(option) => option.value === config.language}
            options={STT_LANGUAGE_LIST}
            renderOption={(option) => option.label}
            value={config.language}
            onSelect={(option) => onChange("language", option.value)}
          />
        </Field>
        <Field label="Avatar Quality">
          <Select
            isSelected={(option) => option === config.quality}
            options={Object.values(AvatarQuality)}
            renderOption={(option) => option}
            value={config.quality}
            onSelect={(option) => onChange("quality", option)}
          />
        </Field>
      </div>

      <Field label="Voice Chat Transport">
        <Select
          isSelected={(option) => option === config.voiceChatTransport}
          options={Object.values(VoiceChatTransport)}
          renderOption={(option) => option}
          value={config.voiceChatTransport}
          onSelect={(option) => onChange("voiceChatTransport", option)}
        />
      </Field>

      {showMore && (
        <>
          <div className="border-t border-zinc-700 my-4 pt-4">
            <h2 className="text-zinc-100 text-lg font-semibold mb-4">Voice Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Custom Voice ID">
                <Input
                  placeholder="Enter custom voice ID"
                  value={config.voice?.voiceId}
                  onChange={(value) =>
                    onChange("voice", { ...config.voice, voiceId: value })
                  }
                />
              </Field>
              <Field label="Emotion">
                <Select
                  isSelected={(option) => option === config.voice?.emotion}
                  options={Object.values(VoiceEmotion)}
                  renderOption={(option) => option}
                  value={config.voice?.emotion}
                  onSelect={(option) =>
                    onChange("voice", { ...config.voice, emotion: option })
                  }
                />
              </Field>
            </div>
            <Field label="ElevenLabs Model">
              <Select
                isSelected={(option) => option === config.voice?.model}
                options={Object.values(ElevenLabsModel)}
                renderOption={(option) => option}
                value={config.voice?.model}
                onSelect={(option) =>
                  onChange("voice", { ...config.voice, model: option })
                }
              />
            </Field>
          </div>

          <div className="border-t border-zinc-700 my-4 pt-4">
            <h2 className="text-zinc-100 text-lg font-semibold mb-4">STT Settings</h2>
            <Field label="Provider">
              <Select
                isSelected={(option) => option === config.sttSettings?.provider}
                options={Object.values(STTProvider)}
                renderOption={(option) => option}
                value={config.sttSettings?.provider}
                onSelect={(option) =>
                  onChange("sttSettings", {
                    ...config.sttSettings,
                    provider: option,
                  })
                }
              />
            </Field>
          </div>
        </>
      )}
      <button
        className="text-zinc-400 text-sm cursor-pointer w-full text-center bg-transparent hover:text-zinc-300 transition-colors"
        onClick={() => setShowMore(!showMore)}
      >
        {showMore ? "Show less" : "Show more..."}
      </button>
    </div>
  );
};
