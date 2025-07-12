import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { VoiceRecorder } from "./VoiceRecorder";
import { TranscriptionHistory } from "./TranscriptionHistory";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-indigo-600">AceFluency</h2>
        <Authenticated>
          <SignOutButton />
        </Authenticated>
      </header>
      <main className="flex-1 p-8">
        <Content />
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Voice to Text with
          <span className="text-indigo-600"> Grammar Rating</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Speak naturally and get your grammar rated instantly. 
          Our AI-powered system transcribes your voice and provides detailed feedback on grammatical correctness.
        </p>
      </div>

      <Authenticated>
        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              Start Recording
            </h2>
            <VoiceRecorder />
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Grammar Analysis History
            </h2>
            <TranscriptionHistory />
          </div>
        </div>
      </Authenticated>

      <Unauthenticated>
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Get Started
            </h2>
            <p className="text-gray-600">
              Sign in to start using voice transcription with grammar analysis
            </p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}
