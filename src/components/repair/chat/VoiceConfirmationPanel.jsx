// components/chat/VoiceConfirmationPanel.jsx
import { Play, Pause, RotateCcw, Send, X } from "lucide-react";
import { Button } from "@/components/repair/ui/button";
import { useState, useRef, useEffect } from "react";
import { Progress } from "@/components/repair/ui/progress";

export function VoiceConfirmationPanel({
  transcribedText,
  audioUrl,
  onConfirm,
  onCancel,
  onRetry,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.warn("Audio playback failed:", err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-md rounded-xl border border-[hsl(220_15%_20%)] bg-[hsl(220_18%_12%)] p-4 shadow-lg">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-[hsl(45_10%_95%)]">
          Confirm Voice Message
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Audio Player */}
      <div className="mb-4 rounded-lg bg-[hsl(220_15%_18%)]/50 p-3">
        <div className="flex items-center gap-3">
          <Button
            variant="default"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full"
            onClick={togglePlayback}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>

          <div className="flex-1">
            <Progress value={progress} className="h-2" />
            <div className="mt-1 flex justify-between text-xs text-[hsl(220_10%_55%)]">
              <span>{formatTime((progress / 100) * duration)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transcribed Text */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-[hsl(220_10%_55%)]">
          Transcribed Text
        </label>
        <div className="rounded-lg border border-[hsl(220_15%_20%)] bg-[hsl(220_20%_8%)] p-3">
          <p className="text-sm text-[hsl(45_10%_95%)]">{transcribedText}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 gap-2" onClick={onRetry}>
          <RotateCcw className="h-4 w-4" />
          Re-record
        </Button>
        <Button variant="default" className="flex-1 gap-2" onClick={onConfirm}>
          <Send className="h-4 w-4" />
          Send
        </Button>
      </div>
    </div>
  );
}
