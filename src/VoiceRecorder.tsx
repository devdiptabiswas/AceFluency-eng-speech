import { useState, useRef } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

interface TranscriptionResult {
  id: string;
  originalText: string;
  grammarScore: number;
  feedback: string;
  issues: string[];
  processingTime: number;
}

export function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const generateUploadUrl = useMutation(api.voice_mutations.generateUploadUrl);
  const transcribeAndRate = useAction(api.voice.transcribeAndRate);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = handleRecordingStop;
      
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);
      setResult(null);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.success("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording. Please check microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleRecordingStop = async () => {
    if (chunksRef.current.length === 0) {
      toast.error("No audio data recorded");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create blob from recorded chunks
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      
      if (audioBlob.size < 1000) {
        toast.error("Recording too short. Please record for at least 1 second.");
        setIsProcessing(false);
        return;
      }
      
      // Get upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Upload audio file
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "audio/webm" },
        body: audioBlob,
      });
      
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload audio");
      }
      
      const { storageId } = await uploadResponse.json();
      
      // Process audio
      const transcriptionResult = await transcribeAndRate({ audioFileId: storageId });
      
      setResult(transcriptionResult);
      toast.success("Audio analyzed successfully!");
      
    } catch (error) {
      console.error("Error processing audio:", error);
      toast.error("Failed to process audio: " + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 6) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 9) return "Excellent";
    if (score >= 8) return "Very Good";
    if (score >= 7) return "Good";
    if (score >= 6) return "Fair";
    if (score >= 4) return "Needs Improvement";
    return "Poor";
  };

  return (
    <div className="space-y-6">
      {/* Recording Controls */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            ) : isRecording ? (
              <div className="w-6 h-6 bg-white rounded-sm"></div>
            ) : (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          {isRecording && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-ping"></div>
          )}
        </div>
        
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">
            {isProcessing ? 'Analyzing...' : isRecording ? 'Recording...' : 'Click to Record'}
          </p>
          {isRecording && (
            <p className="text-sm text-gray-600 mt-1">
              {formatTime(recordingTime)}
            </p>
          )}
          {!isRecording && !isProcessing && (
            <p className="text-sm text-gray-500 mt-1">
              Speak clearly for best grammar analysis
            </p>
          )}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Transcription:</h3>
            <p className="text-gray-700">{result.originalText}</p>
          </div>
          
          <div className={`rounded-lg p-4 border ${getScoreColor(result.grammarScore)}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Grammar Score</h3>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold">{result.grammarScore}/10</span>
                <span className="text-sm font-medium">{getScoreLabel(result.grammarScore)}</span>
              </div>
            </div>
            
            <div className="mb-3">
              <h4 className="font-medium mb-1">Feedback:</h4>
              <p className="text-sm">{result.feedback}</p>
            </div>
            
            {result.issues.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Issues Found:</h4>
                <ul className="text-sm space-y-1">
                  {result.issues.map((issue, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="text-center text-sm text-gray-500">
            Analyzed in {(result.processingTime / 1000).toFixed(1)} seconds
          </div>
        </div>
      )}
    </div>
  );
}
