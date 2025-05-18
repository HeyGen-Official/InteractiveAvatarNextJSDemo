"use client";

import React, { forwardRef, useEffect, useRef, useState } from "react";
import { ConnectionQuality } from "@heygen/streaming-avatar";

import { useConnectionQuality } from "../logic/useConnectionQuality";
import { useStreamingAvatarSession } from "../logic/useStreamingAvatarSession";
import { StreamingAvatarSessionState } from "../logic";
import { CloseIcon } from "../Icons";
import { Button } from "../Button";
import { VideoLayout } from "../layout/VideoLayout";
import { setupChromaKey } from "../chromaKey";

interface AvatarVideoProps {}

export const AvatarVideo = forwardRef<HTMLVideoElement, AvatarVideoProps>((props, ref) => {
  const { sessionState, stopAvatar, stream } = useStreamingAvatarSession();
  const { connectionQuality } = useConnectionQuality();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isChromaKeyEnabled, setIsChromaKeyEnabled] = useState(false);
  const stopChromaKeyRef = useRef<(() => void) | null>(null);
  const loopVideoRef = useRef<HTMLVideoElement>(null);
  const [hasStartedTalking, setHasStartedTalking] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });

  const isLoaded = sessionState === StreamingAvatarSessionState.CONNECTED;

  useEffect(() => {
    const handleAvatarStartTalking = () => {
      setHasStartedTalking(true);
    };

    window.addEventListener('AVATAR_START_TALKING', handleAvatarStartTalking);

    return () => {
      window.removeEventListener('AVATAR_START_TALKING', handleAvatarStartTalking);
    };
  }, []);

  useEffect(() => {
    if (sessionState === StreamingAvatarSessionState.INACTIVE) {
      setHasStartedTalking(false);
    }
  }, [sessionState]);

  // Update video dimensions when video is loaded
  useEffect(() => {
    const videoElement = hasStartedTalking && ref && 'current' in ref ? ref.current : loopVideoRef.current;
    if (videoElement) {
      const updateDimensions = () => {
        setVideoDimensions({
          width: videoElement.videoWidth,
          height: videoElement.videoHeight
        });
      };

      videoElement.addEventListener('loadedmetadata', updateDimensions);
      return () => {
        videoElement.removeEventListener('loadedmetadata', updateDimensions);
      };
    }
  }, [hasStartedTalking, ref]);

  // Handle chroma key for both stream and loop videos
  useEffect(() => {
    if (!canvasRef.current) return;

    // Cleanup previous chroma key processing
    if (stopChromaKeyRef.current) {
      stopChromaKeyRef.current();
      stopChromaKeyRef.current = null;
    }

    if (isChromaKeyEnabled) {
      const canvas = canvasRef.current;
      const activeVideo = hasStartedTalking && ref && 'current' in ref ? ref.current : loopVideoRef.current;
      
      if (!activeVideo) return;

      // Set canvas dimensions to match video's original dimensions
      canvas.width = videoDimensions.width || activeVideo.videoWidth;
      canvas.height = videoDimensions.height || activeVideo.videoHeight;

      // Start chroma key processing
      stopChromaKeyRef.current = setupChromaKey(activeVideo, canvas, {
        minHue: 60,
        maxHue: 180,
        minSaturation: 0.1,
        threshold: 1.0,
      });

      // Add event listener for video switching
      const handleVideoSwitch = () => {
        if (stopChromaKeyRef.current) {
          stopChromaKeyRef.current();
          stopChromaKeyRef.current = null;
        }

        const newActiveVideo = hasStartedTalking && ref && 'current' in ref ? ref.current : loopVideoRef.current;
        if (newActiveVideo) {
          stopChromaKeyRef.current = setupChromaKey(newActiveVideo, canvas, {
            minHue: 60,
            maxHue: 180,
            minSaturation: 0.1,
            threshold: 1.0,
          });
        }
      };

      // Listen for video switching events
      window.addEventListener('AVATAR_START_TALKING', handleVideoSwitch);
      window.addEventListener('AVATAR_STOP_TALKING', handleVideoSwitch);

      return () => {
        window.removeEventListener('AVATAR_START_TALKING', handleVideoSwitch);
        window.removeEventListener('AVATAR_STOP_TALKING', handleVideoSwitch);
        if (stopChromaKeyRef.current) {
          stopChromaKeyRef.current();
          stopChromaKeyRef.current = null;
        }
      };
    }
  }, [isChromaKeyEnabled, hasStartedTalking, ref, videoDimensions]);

  const toggleChromaKey = () => {
    setIsChromaKeyEnabled(!isChromaKeyEnabled);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <VideoLayout
        stream={stream}
        sessionState={sessionState}
        onVideoRef={(videoRef) => {
          if (ref && typeof ref === 'object' && 'current' in ref) {
            (ref as React.MutableRefObject<HTMLVideoElement | null>).current = videoRef;
          }
        }}
        onLoopVideoRef={(loopRef) => {
          if (loopVideoRef && typeof loopVideoRef === 'object' && 'current' in loopVideoRef) {
            (loopVideoRef as React.MutableRefObject<HTMLVideoElement | null>).current = loopRef;
          }
        }}
        onCanvasRef={(canvas) => {
          if (canvasRef && typeof canvasRef === 'object' && 'current' in canvasRef) {
            (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = canvas;
          }
        }}
        isChromaKeyEnabled={isChromaKeyEnabled}
      />
      <div className="absolute bottom-4 left-4">
        <Button
          onClick={toggleChromaKey}
          className={`!bg-zinc-700 !text-white ${isChromaKeyEnabled ? "!bg-green-600" : ""}`}
        >
          {isChromaKeyEnabled ? "Disable Chroma Key" : "Enable Chroma Key"}
        </Button>
      </div>
      {isLoaded && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connectionQuality === ConnectionQuality.GOOD
                ? "bg-green-500"
                : connectionQuality === ConnectionQuality.BAD
                ? "bg-red-500"
                : "bg-yellow-500"
            }`}
          />
          <span className="text-sm text-white">
            {connectionQuality === ConnectionQuality.GOOD
              ? "Good"
              : connectionQuality === ConnectionQuality.BAD
              ? "Poor"
              : "Fair"}
          </span>
        </div>
      )}
    </div>
  );
});
AvatarVideo.displayName = "AvatarVideo";
