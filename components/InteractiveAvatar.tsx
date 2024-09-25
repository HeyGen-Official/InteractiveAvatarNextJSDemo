import type { StartAvatarResponse } from "@heygen/streaming-avatar";
import StreamingAvatar, { AvatarQuality, StreamingEvents } from "@heygen/streaming-avatar";
import { Button, Card, CardBody, CardFooter, Divider, Input, Select, SelectItem, Spinner, Chip, Tabs, Tab } from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import { useMemoizedFn, usePrevious } from "ahooks";
import InteractiveAvatarTextInput from "./InteractiveAvatarTextInput";
import { AVATARS } from "@/app/lib/constants";

export default function InteractiveAvatar() {
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingRepeat, setIsLoadingRepeat] = useState(false);
  const [stream, setStream] = useState<MediaStream>();
  const [debug, setDebug] = useState<string>();
  const [knowledgeId, setKnowledgeId] = useState<string>("");
  const [avatarId, setAvatarId] = useState<string>("");
  const [data, setData] = useState<StartAvatarResponse>();
  const [text, setText] = useState<string>("");
  const mediaStream = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const avatar = useRef<StreamingAvatar | null>(null);
  const [chatMode, setChatMode] = useState("text_mode");
  const [isUserTalking, setIsUserTalking] = useState(false);

  async function fetchAccessToken() {
    try {
      const response = await fetch("/api/get-access-token", { method: "POST" });
      const token = await response.text();
      console.log("Access Token:", token);
      return token;
    } catch (error) {
      console.error("Error fetching access token:", error);
    }
    return "";
  }

  async function startSession() {
    setIsLoadingSession(true);
    const newToken = await fetchAccessToken();

    avatar.current = new StreamingAvatar({
      token: newToken,
      bufferSize: 2048,
      latencyMode: 'low',
    });
    avatar.current.on(StreamingEvents.AVATAR_START_TALKING, (e: unknown) => {
      console.log("Avatar started talking", e);
    });
    avatar.current.on(StreamingEvents.AVATAR_STOP_TALKING, (e: unknown) => {
      console.log("Avatar stopped talking", e);
    });
    avatar.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
      console.log("Stream disconnected");
      endSession();
    });
    avatar.current?.on(StreamingEvents.STREAM_READY, (event: { detail: MediaStream }) => {
      console.log(">>>>> Stream ready:", event.detail);
      setStream(event.detail);
    });
    avatar.current?.on(StreamingEvents.USER_START, (event: unknown) => {
      console.log(">>>>> User started talking:", event);
      setIsUserTalking(true);
    });
    avatar.current?.on(StreamingEvents.USER_STOP, (event: unknown) => {
      console.log(">>>>> User stopped talking:", event);
      setIsUserTalking(false);
    });
    try {
      const res = await avatar.current.createStartAvatar({
        quality: AvatarQuality.Low,
        avatarName: avatarId,
        knowledgeId: knowledgeId,
      });
      setData(res);
      await avatar.current?.startVoiceChat();
      setChatMode("voice_mode");
    } catch (error) {
      console.error("Error starting avatar session:", error);
    } finally {
      setIsLoadingSession(false);
    }
  }

  async function handleSpeak() {
    setIsLoadingRepeat(true);
    if (!avatar.current) {
      setDebug("Avatar API not initialized");
      return;
    }
    await avatar.current.speak({ text: text }).catch((e: Error) => {
      setDebug(e.message);
    });
    setIsLoadingRepeat(false);
  }

  async function handleInterrupt() {
    if (!avatar.current) {
      setDebug("Avatar API not initialized");
      return;
    }
    await avatar.current.interrupt().catch((e: Error) => {
      setDebug(e.message);
    });
  }

  async function endSession() {
    if (!avatar.current) {
      setDebug("Avatar API not initialized");
      return;
    }
    await avatar.current.stopAvatar();
    setStream(undefined);
  }

  const handleChangeChatMode = useMemoizedFn(async (v: string) => {
    if (v === chatMode) {
      return;
    }
    if (v === "text_mode") {
      avatar.current?.closeVoiceChat();
    } else {
      await avatar.current?.startVoiceChat();
    }
    setChatMode(v);
  });

  const previousText = usePrevious(text);
  useEffect(() => {
    if (!previousText && text) {
      avatar.current?.startListening();
    } else if (previousText && !text) {
      avatar?.current?.stopListening();
    }
  }, [text, previousText]);

  useEffect(() => {
    return () => {
      endSession();
    };
  }, []);

  useEffect(() => {
    if (stream && mediaStream.current && canvasRef.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current!.play().then(() => {
          setDebug("Playing");

          // Set canvas size to match video
          canvasRef.current!.width = mediaStream.current!.videoWidth;
          canvasRef.current!.height = mediaStream.current!.videoHeight;

          startBackgroundReplacement();
        }).catch(error => {
          console.error("Error playing video:", error);
          setDebug("Error playing video");
        });
      };
    }
  }, [stream]);

  const startBackgroundReplacement = () => {
    if (!canvasRef.current || !mediaStream.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawFrame = () => {
      if (mediaStream.current && mediaStream.current.readyState === mediaStream.current.HAVE_ENOUGH_DATA) {
        // Draw the video frame to the canvas
        ctx.drawImage(mediaStream.current, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const red = data[i];
          const green = data[i + 1];
          const blue = data[i + 2];

          if (isCloseToGreen([red, green, blue])) {
            data[i + 3] = 0; // Set alpha to 0 (fully transparent)
          }
        }

        ctx.putImageData(imageData, 0, 0);
      }

      requestAnimationFrame(drawFrame);
    };

    drawFrame();
  };

  const isCloseToGreen = (color: number[]) => {
    const [red, green, blue] = color;
    const th = 100; // Adjust this threshold as needed
    return green > th && red < th && blue < th;
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <Card>
        <CardBody className="h-[500px] flex flex-col justify-center items-center p-0">
          {stream ? (
            <div 
              className="h-[500px] w-[900px] justify-center items-center flex rounded-lg overflow-hidden relative"
              style={{
                backgroundImage: "url('/GXzMouWWIAA1-6F.jpeg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <canvas
                ref={canvasRef}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
              <video
                ref={mediaStream}
                autoPlay
                playsInline
                style={{ display: 'none' }}
              >
                <track kind="captions" />
              </video>
            </div>
          ) : !isLoadingSession ? (
            <div className="h-full justify-center items-center flex flex-col gap-8 w-[500px] self-center">
              <div className="flex flex-col gap-2 w-full">
                <p className="text-sm font-medium leading-none">
                  Custom Knowledge ID (optional)
                </p>
                <Input
                  placeholder="Enter a custom knowledge ID"
                  value={knowledgeId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKnowledgeId(e.target.value)}
                />
                <p className="text-sm font-medium leading-none">
                  Custom Avatar ID (optional)
                </p>
                <Input
                  placeholder="Enter a custom avatar ID"
                  value={avatarId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAvatarId(e.target.value)}
                />
                <Select
                  placeholder="Or select one from these example avatars"
                  size="md"
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setAvatarId(e.target.value);
                  }}
                >
                  {AVATARS.map((avatar) => (
                    <SelectItem
                      key={avatar.avatar_id}
                      textValue={avatar.avatar_id}
                    >
                      {avatar.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <Button
                className="bg-gradient-to-tr from-indigo-500 to-indigo-300 w-full text-white"
                size="md"
                variant="shadow"
                onClick={startSession}
              >
                Start session
              </Button>
            </div>
          ) : (
            <Spinner color="default" size="lg" />
          )}
        </CardBody>
        <Divider />
        <CardFooter className="flex justify-between items-center relative">
          <Tabs
            aria-label="Options"
            selectedKey={chatMode}
            onSelectionChange={(v: React.Key) => {
              handleChangeChatMode(v as string);
            }}
          >
            <Tab key="text_mode" title="Text mode" />
            <Tab key="voice_mode" title="Voice mode" />
          </Tabs>
          <Button
            className="bg-gradient-to-tr from-indigo-500 to-indigo-300 text-white rounded-lg"
            size="sm"
            variant="shadow"
            onClick={endSession}
          >
            End session
          </Button>
        </CardFooter>
        {chatMode === "text_mode" ? (
          <div className="w-full flex relative mt-3 mb-4"> {/* Added mb-4 for bottom margin */}
            <InteractiveAvatarTextInput
              disabled={!stream}
              input={text}
              label="Chat"
              loading={isLoadingRepeat}
              placeholder="Type something for the avatar to respond"
              setInput={setText}
              onSubmit={handleSpeak}
            />
            {text && (
              <Chip className="absolute right-16 top-3">Listening</Chip>
            )}
          </div>
        ) : (
          <div className="w-full text-center mt-3 mb-4"> {/* Added mb-4 for bottom margin */}
            <Button
              isDisabled={!isUserTalking}
              className="bg-gradient-to-tr from-indigo-500 to-indigo-300 text-white"
              size="md"
              variant="shadow"
            >
              {isUserTalking ? "Listening" : "Voice chat"}
            </Button>
          </div>
        )}
      </Card>
      <p className="font-mono text-right">
        <span className="font-bold">Console:</span>
        <br />
        {debug}
      </p>
    </div>
  );
}
