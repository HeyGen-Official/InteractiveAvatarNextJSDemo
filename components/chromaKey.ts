/**
 * Apply chroma key effect to a video frame on canvas
 * @param sourceVideo - Source video element
 * @param targetCanvas - Target canvas element
 * @param options - Chroma key options
 */
export function applyChromaKey(
  sourceVideo: HTMLVideoElement,
  targetCanvas: HTMLCanvasElement,
  options: {
    minHue: number; // 60 - minimum hue value (0-360)
    maxHue: number; // 180 - maximum hue value (0-360)
    minSaturation: number; // 0.10 - minimum saturation (0-1)
    threshold: number; // 1.00 - threshold for green detection
    scaleFactor?: number; // Optional scale factor for performance (0-1)
    skipPixels?: number; // Pixel sampling rate (process every N pixels)
  }
): void {
  // Get canvas context
  const ctx = targetCanvas.getContext("2d", {
    willReadFrequently: true,
    alpha: true,
  });

  if (!ctx || sourceVideo.readyState < 2) return;

  // Check if video has valid dimensions
  if (sourceVideo.videoWidth === 0 || sourceVideo.videoHeight === 0) return;

  const scaleFactor = options.scaleFactor || 0.5; // Default to 50% resolution
  const skipPixels = options.skipPixels || 1; // Default to process every pixel
  
  const scaledWidth = Math.floor(sourceVideo.videoWidth * scaleFactor);
  const scaledHeight = Math.floor(sourceVideo.videoHeight * scaleFactor);

  // Set canvas dimensions to match video
  targetCanvas.width = sourceVideo.videoWidth;
  targetCanvas.height = sourceVideo.videoHeight;

  // Performance optimization - if canvas is not visible, skip heavy processing
  if (targetCanvas.offsetParent === null) {
    ctx.drawImage(sourceVideo, 0, 0, targetCanvas.width, targetCanvas.height);
    return;
  }

  // Use an offscreen canvas for processing at lower resolution
  let offscreenCanvas: HTMLCanvasElement;
  let offscreenCtx: CanvasRenderingContext2D | null;
  
  // Try to reuse existing canvas if possible
  if (!(globalThis as any).__chromaKeyOffscreenCanvas) {
    offscreenCanvas = document.createElement('canvas');
    (globalThis as any).__chromaKeyOffscreenCanvas = offscreenCanvas;
  } else {
    offscreenCanvas = (globalThis as any).__chromaKeyOffscreenCanvas;
  }
  
  offscreenCanvas.width = scaledWidth;
  offscreenCanvas.height = scaledHeight;
  offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
  
  if (!offscreenCtx) return;
  
  // Draw video frame to offscreen canvas at scaled size
  offscreenCtx.drawImage(sourceVideo, 0, 0, scaledWidth, scaledHeight);

  // Get image data for processing
  const imageData = offscreenCtx.getImageData(0, 0, scaledWidth, scaledHeight);
  const data = imageData.data;
  const length = data.length;

  // Process pixels with stride to reduce calculations
  for (let i = 0; i < length; i += 4 * skipPixels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Faster green screen detection
    if (g > r * options.threshold && g > b * options.threshold && g > 50) {
      // Simple but fast transparency calculation
      data[i + 3] = 0; // Make green pixels fully transparent
    }
    
    // If using pixel skipping, apply the same alpha to nearby pixels
    if (skipPixels > 1) {
      const alpha = data[i + 3];
      for (let j = 4; j < 4 * skipPixels && i + j < length; j += 4) {
        data[i + j + 3] = alpha;
      }
    }
  }

  // Put processed image data back to offscreen canvas
  offscreenCtx.putImageData(imageData, 0, 0);
  
  // Draw the processed image to the main canvas with upscaling
  ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  ctx.drawImage(offscreenCanvas, 0, 0, targetCanvas.width, targetCanvas.height);
}

/**
 * Setup continuous chroma keying
 * @param sourceVideo - Source video element
 * @param targetCanvas - Target canvas element
 * @param options - Chroma key options
 * @returns - Function to stop the processing
 */
export function setupChromaKey(
  sourceVideo: HTMLVideoElement,
  targetCanvas: HTMLCanvasElement,
  options: {
    minHue: number; // Minimum hue value (0-360)
    maxHue: number; // Maximum hue value (0-360)
    minSaturation: number; // Minimum saturation (0-1)
    threshold: number; // Threshold for green detection
    scaleFactor?: number; // Optional scale factor for performance (0-1)
    skipPixels?: number; // Pixel sampling rate
  }
): () => void {
  let animationFrameId: number | null = null;
  let isProcessing = true;
  let lastFrameTime = 0;
  let skipCounter = 0;
  const targetFrameTime = 1000 / 20; // Target 20 FPS for better performance
  const maxFrameProcessingTime = 40; // Max time in ms to process a frame

  // Performance monitoring
  let lastPerformanceWarning = 0;
  let processingTimes: number[] = [];

  // Processing function
  const render = (timestamp: number) => {
    if (!isProcessing) return;

    // Measure frame time
    const frameTimeDelta = timestamp - lastFrameTime;
    
    try {
      // Adaptive frame skipping:
      // 1. Basic time-based skipping
      // 2. Skip more frames if we detect slow performance
      const averageProcessingTime = processingTimes.length > 0 
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
        : 0;
      
      const shouldSkip = frameTimeDelta < targetFrameTime || 
                        (averageProcessingTime > maxFrameProcessingTime && skipCounter < 2);
      
      if (!shouldSkip) {
        const startTime = performance.now();
        
        // Process frame
        applyChromaKey(sourceVideo, targetCanvas, options);
        
        // Measure and store processing time
        const processingTime = performance.now() - startTime;
        processingTimes.push(processingTime);
        if (processingTimes.length > 10) processingTimes.shift();
        
        // Log warning and adjust parameters if processing is consistently slow
        if (processingTime > maxFrameProcessingTime && 
            timestamp - lastPerformanceWarning > 5000) {
          console.warn(`Chroma key processing is slow (${Math.round(processingTime)}ms). Consider adjusting parameters.`);
          lastPerformanceWarning = timestamp;
        }
        
        lastFrameTime = timestamp;
        skipCounter = 0;
      } else {
        skipCounter++;
      }
    } catch (error) {
      console.warn('Chroma key processing error:', error);
    }

    animationFrameId = requestAnimationFrame(render);
  };

  // Start rendering
  animationFrameId = requestAnimationFrame(render);

  // Return cleanup function
  return () => {
    isProcessing = false;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
  };
} 