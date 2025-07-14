"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const transcribeAndRate = action({
  args: {
    audioFileId: v.id("_storage"),
  },
  handler: async (ctx, args): Promise<{
    id: string;
    originalText: string;
    grammarScore: number;
    feedback: string;
    issues: string[];
    processingTime: number;
  }> => {
    const startTime = Date.now();
    
    // Get the audio file from storage
    const audioBlob = await ctx.storage.get(args.audioFileId);
    if (!audioBlob) {
      throw new Error("Audio file not found");
    }

    try {
      // Get audio buffer
      const audioBuffer = await audioBlob.arrayBuffer();
      
      // Create FormData for transcription
      const formData = new FormData();
      formData.append('file', new Blob([audioBuffer], { type: 'audio/webm' }), 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      
      // Transcribe using fetch
      const apiKey = process.env.OPENAI_API_KEY || process.env.CONVEX_OPENAI_API_KEY;
      const baseURL = process.env.OPENAI_API_KEY ? 'https://api.openai.com/v1' : process.env.CONVEX_OPENAI_BASE_URL;
      
      const transcriptionResponse = await fetch(`${baseURL}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });
      
      if (!transcriptionResponse.ok) {
        const errorText = await transcriptionResponse.text();
        throw new Error(`Transcription failed: ${transcriptionResponse.status} ${errorText}`);
      }
      
      const transcriptionResult = await transcriptionResponse.json();
      const originalText = transcriptionResult.text;

      // Rate grammatical correctness using GPT
      const chatResponse = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a grammar assessment assistant. Analyze the given text for grammatical correctness and provide a rating from 1-10 (where 10 is perfect grammar) along with specific feedback. Format your response as JSON with 'score' (number), 'feedback' (string), and 'issues' (array of strings). Be constructive and educational in your feedback."
            },
            {
              role: "user",
              content: `Please rate the grammatical correctness of this text: "${originalText}"`
            }
          ],
          temperature: 0.1,
        }),
      });
      
      if (!chatResponse.ok) {
        const errorText = await chatResponse.text();
        throw new Error(`Chat completion failed: ${chatResponse.status} ${errorText}`);
      }
      
      const chatResult = await chatResponse.json();
      const ratingResponse = chatResult.choices[0].message.content || '{"score": 5, "feedback": "Unable to analyze", "issues": []}';
      
      let grammarRating;
      try {
        grammarRating = JSON.parse(ratingResponse);
      } catch (e) {
        // Fallback if JSON parsing fails
        grammarRating = {
          score: 5,
          feedback: "Analysis completed but formatting error occurred",
          issues: []
        };
      }

      const processingTime = Date.now() - startTime;

      // Save to database
      const transcriptionId: string = await ctx.runMutation(api.voice_mutations.saveTranscription, {
        originalText,
        grammarScore: grammarRating.score,
        feedback: grammarRating.feedback,
        issues: grammarRating.issues,
        audioFileId: args.audioFileId,
        processingTime,
      });

      return {
        id: transcriptionId,
        originalText,
        grammarScore: grammarRating.score,
        feedback: grammarRating.feedback,
        issues: grammarRating.issues,
        processingTime,
      };
    } catch (error) {
      console.error("Error processing audio:", error);
      throw new Error("Failed to process audio: " + (error as Error).message);
    }
  },
});
