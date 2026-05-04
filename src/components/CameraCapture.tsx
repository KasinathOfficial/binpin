import { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw, X, Check, AlertCircle, Image as ImageIcon } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);

  const startCamera = useCallback(async () => {
    setIsStarting(true);
    setError(null);
    
    // Stop any existing stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
        audio: false
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please enable it in browser settings.');
      } else {
        setError('Could not access camera. Make sure no other app is using it.');
      }
    } finally {
      setIsStarting(false);
    }
  }, [facingMode, stream]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(dataUrl);
      
      // Also stop the stream to save battery
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const confirmPhoto = () => {
    if (!capturedImage) return;

    // Convert data URL to File object
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `bin-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
      });
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
        <button onClick={onCancel} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white">
          <X className="w-6 h-6" />
        </button>
        <span className="text-white font-bold text-sm tracking-widest uppercase">Instant Camera</span>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Main View */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {capturedImage ? (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
        ) : error ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red/10 text-red rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <p className="text-white font-medium">{error}</p>
            <button 
              onClick={startCamera}
              className="px-6 py-2 bg-white text-black rounded-full font-bold text-sm active:scale-95 transition-all"
            >
              Try Again
            </button>
            <div className="pt-4">
              <label className="text-primary font-bold text-sm underline cursor-pointer">
                Or upload from gallery
                <input type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} />
              </label>
            </div>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            {isStarting && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <RefreshCw className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="p-8 pb-12 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent">
        {!capturedImage ? (
          <>
            <label className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white active:scale-90 transition-all cursor-pointer">
              <ImageIcon className="w-6 h-6" />
              <input type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} />
            </label>

            <button 
              onClick={capturePhoto}
              disabled={isStarting || !!error}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center active:scale-90 transition-all disabled:opacity-50"
            >
              <div className="w-16 h-16 border-2 border-black rounded-full" />
            </button>

            <button 
              onClick={toggleCamera}
              className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white active:scale-90 transition-all"
            >
              <RefreshCw className="w-6 h-6" />
            </button>
          </>
        ) : (
          <div className="w-full flex gap-4">
            <button 
              onClick={retakePhoto}
              className="flex-1 py-4 bg-white/10 backdrop-blur-md text-white rounded-2xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" /> Retake
            </button>
            <button 
              onClick={confirmPhoto}
              className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2 shadow-strong"
            >
              <Check className="w-5 h-5" /> Use Photo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
