import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export function TranscriptionHistory() {
  const transcriptions = useQuery(api.voice_mutations.getRecentTranscriptions);

  if (transcriptions === undefined) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (transcriptions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <p>No transcriptions yet. Start recording to see your grammar analysis history!</p>
      </div>
    );
  }

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
    <div className="space-y-4">
      {transcriptions.map((transcription) => (
        <div key={transcription._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <span className="text-sm text-gray-500">
              {new Date(transcription._creationTime).toLocaleString()}
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                {(transcription.processingTime / 1000).toFixed(1)}s
              </span>
              <div className={`px-2 py-1 rounded text-xs font-medium border ${getScoreColor(transcription.grammarScore)}`}>
                {transcription.grammarScore}/10 • {getScoreLabel(transcription.grammarScore)}
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-1">Transcription:</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                {transcription.originalText}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-1">Feedback:</h4>
              <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded border border-blue-200">
                {transcription.feedback}
              </p>
            </div>

            {transcription.issues.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-600 mb-1">Issues Found:</h4>
                <ul className="text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200 space-y-1">
                  {transcription.issues.map((issue, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-500 mr-1">•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
