"use client";

import React, { useRef, useEffect, useState } from "react";
import { StreamingAvatarSessionState } from "../logic";

interface VideoLayoutProps {
  stream: MediaStream | null;
  sessionState: StreamingAvatarSessionState;
  onVideoRef?: (ref: HTMLVideoElement | null) => void;
  onLoopVideoRef?: (ref: HTMLVideoElement | null) => void;
  onCanvasRef?: (ref: HTMLCanvasElement | null) => void;
  isChromaKeyEnabled?: boolean;
}

export const VideoLayout: React.FC<VideoLayoutProps> = ({
  stream,
  sessionState,
  onVideoRef,
  onLoopVideoRef,
  onCanvasRef,
  isChromaKeyEnabled = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const loopVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasStartedTalking, setHasStartedTalking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (videoRef.current && onVideoRef) {
      onVideoRef(videoRef.current);
    }
  }, [onVideoRef]);

  useEffect(() => {
    if (loopVideoRef.current && onLoopVideoRef) {
      onLoopVideoRef(loopVideoRef.current);
    }
  }, [onLoopVideoRef]);

  useEffect(() => {
    if (canvasRef.current && onCanvasRef) {
      onCanvasRef(canvasRef.current);
    }
  }, [onCanvasRef]);

  useEffect(() => {
    if (loopVideoRef.current) {
      loopVideoRef.current.play();
    }
  }, []);

  useEffect(() => {
    const handleAvatarStartTalking = () => {
      setHasStartedTalking(true);
    };

    window.addEventListener('AVATAR_START_TALKING', handleAvatarStartTalking);

    return () => {
      window.removeEventListener('AVATAR_START_TALKING', handleAvatarStartTalking);
    };
  }, []);

  // Reset hasStartedTalking when session becomes inactive
  useEffect(() => {
    if (sessionState === StreamingAvatarSessionState.INACTIVE) {
      setHasStartedTalking(false);
      // Ensure loop video is playing
      if (loopVideoRef.current) {
        loopVideoRef.current.play();
      }
      // Clear stream video
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [sessionState]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const shouldShowStream = hasStartedTalking && sessionState === StreamingAvatarSessionState.CONNECTED;

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-black overflow-hidden rounded-xl flex items-center justify-center"
    >
      {/* Loop video background */}
      <video
        ref={loopVideoRef}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-auto h-auto max-w-full max-h-full object-contain transition-opacity duration-300"
        style={{
          opacity: shouldShowStream ? 0 : 1,
          visibility: shouldShowStream ? 'hidden' : 'visible',
          display: isChromaKeyEnabled ? 'none' : 'block'
        }}
        loop
        muted
        playsInline
        src="/loop3.webm"
      />

      {/* Stream video */}
      <video
        ref={videoRef}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-auto h-auto max-w-full max-h-full object-contain transition-opacity duration-300"
        style={{
          opacity: shouldShowStream ? 1 : 0,
          visibility: shouldShowStream ? 'visible' : 'hidden',
          display: isChromaKeyEnabled ? 'none' : 'block'
        }}
        autoPlay
        playsInline
      >
        <track kind="captions" />
      </video>

      {/* Chroma key canvas */}
      <canvas
        ref={canvasRef}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-auto h-auto max-w-full max-h-full object-contain"
        style={{
          display: isChromaKeyEnabled ? 'block' : 'none'
        }}
      />

      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors duration-200 z-10"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
        )}
      </button>
    </div>
  );
}; 