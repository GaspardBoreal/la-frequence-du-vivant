import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, upgrade',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const upgrade = req.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let accumulatedAudio: Uint8Array[] = [];
  let pendingChunks: Uint8Array[] = [];
  let isProcessing = false;
  let processingTimer: number | null = null;

  socket.onopen = () => {
    console.log("WebSocket connection established for real-time transcription");
    socket.send(JSON.stringify({
      type: 'connection',
      status: 'connected'
    }));
  };

  socket.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      
      if (message.type === 'audio_chunk_webm') {
        // Process WebM chunk immediately
        console.log('Received WebM chunk:', message.chunkNumber, 'size:', message.audioData?.length);
        await processWebMChunk(socket, message.audioData, false);
      } else if (message.type === 'finalize') {
        // Final transcription with any remaining audio
        console.log('Finalizing transcription');
        await processWebMChunk(socket, null, true);
      } else if (message.type === 'ping') {
        // Respond to ping to keep connection alive
        socket.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
      // Send error but don't close socket
      socket.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  };

  const processWebMChunk = async (socket: WebSocket, audioData: string | null, isFinal = false) => {
    if (audioData) {
      // Convert base64 WebM chunk to bytes and add to queue
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      pendingChunks.push(bytes);
      accumulatedAudio.push(bytes);
      console.log('Added chunk to queue, pending:', pendingChunks.length, 'accumulated:', accumulatedAudio.length);
    }

    if (isFinal) {
      console.log('Final processing requested, draining queue...');
      // Clear any pending timer
      if (processingTimer) {
        clearTimeout(processingTimer);
        processingTimer = null;
      }
      // Process everything accumulated for final result
      await processQueuedChunks(socket, true);
      return;
    }

    // Start batch processing if not already running
    if (!isProcessing && pendingChunks.length > 0) {
      startBatchProcessing(socket);
    }
  };

  const startBatchProcessing = (socket: WebSocket) => {
    if (processingTimer) {
      clearTimeout(processingTimer);
    }
    
    // Wait 2 seconds to accumulate chunks, then process
    processingTimer = setTimeout(() => {
      processQueuedChunks(socket, false);
    }, 2000);
  };

  const processQueuedChunks = async (socket: WebSocket, isFinal: boolean) => {
    if (isProcessing && !isFinal) return;
    
    isProcessing = true;
    processingTimer = null;

    try {
      let chunksToProcess: Uint8Array[] = [];
      
      if (isFinal) {
        // Process all accumulated audio for final result
        chunksToProcess = [...accumulatedAudio];
        console.log('Final processing: using all', chunksToProcess.length, 'accumulated chunks');
      } else {
        // Process pending chunks for incremental results
        chunksToProcess = [...pendingChunks];
        pendingChunks = []; // Clear the queue
        console.log('Batch processing:', chunksToProcess.length, 'chunks');
      }

      if (chunksToProcess.length === 0) {
        console.log('No chunks to process');
        isProcessing = false;
        return;
      }

      // Combine chunks into a single blob
      const totalLength = chunksToProcess.reduce((sum, chunk) => sum + chunk.length, 0);
      const combinedAudio = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunksToProcess) {
        combinedAudio.set(chunk, offset);
        offset += chunk.length;
      }

      const audioBlob = new Blob([combinedAudio], { type: 'audio/webm' });
      console.log('Processing audio blob, size:', audioBlob.size, 'chunks:', chunksToProcess.length, 'isFinal:', isFinal);

      // Transcribe with OpenAI
      const openAIKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIKey) {
        throw new Error('OpenAI API key not configured');
      }

      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'fr');
      formData.append('response_format', 'verbose_json');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIKey}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Transcription result:', result.text, 'isFinal:', isFinal);
        
        if (result.text && result.text.trim()) {
          socket.send(JSON.stringify({
            type: 'transcription_result',
            text: result.text,
            segments: result.segments,
            isFinal,
            confidence: 0.9
          }));
        } else {
          console.log('Empty transcription result, skipping');
        }

        // Clean up if final
        if (isFinal) {
          accumulatedAudio = [];
          pendingChunks = [];
        }
      } else {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        throw new Error(`OpenAI API error: ${errorText}`);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      // Send error but don't close socket
      socket.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    } finally {
      isProcessing = false;
      
      // Continue processing if there are more chunks and not final
      if (!isFinal && pendingChunks.length > 0) {
        startBatchProcessing(socket);
      }
    }
  };

  socket.onclose = () => {
    console.log("WebSocket connection closed");
    accumulatedAudio = [];
    pendingChunks = [];
    if (processingTimer) {
      clearTimeout(processingTimer);
      processingTimer = null;
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  return response;
});