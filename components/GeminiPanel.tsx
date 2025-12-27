import React, { useState, useRef, useEffect } from 'react';
import { createChat, sendMessage, askWithSearch, analyzeImage, generateImage, askWithThinking, generateSpeech, connectLive, editImage, analyzeVideo } from '../services/geminiService';
import { ChatMessage } from '../types';

interface GeminiPanelProps {
  onCaptureRequest: () => Promise<string>; // Function to get screenshot from canvas
  currentBiome: string;
}

const GeminiPanel: React.FC<GeminiPanelProps> = ({ onCaptureRequest, currentBiome }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'vision' | 'generate' | 'voice'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  // Chat state
  const chatRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice state
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    chatRef.current = createChat(`You are an assistant for a Spider Walker app. The current biome is ${currentBiome}.`);
  }, [currentBiome]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      let responseText = '';
      const lowerInput = input.toLowerCase();
      const isUrl = /https?:\/\/[^\s]+/.test(input);

      // Smart routing: URL or explicit search command -> Google Search Grounding
      if (isUrl || lowerInput.includes('search') || lowerInput.includes('google')) {
        const res = await askWithSearch(input);
        responseText = `${res.text}\n\nSources:\n${res.sources.map((s:any) => `- ${s.web?.title || 'Web Result'}: ${s.web?.uri}`).join('\n')}`;
      } else if (lowerInput.includes('think') || lowerInput.includes('complex')) {
        responseText = await askWithThinking(input);
      } else {
         if (!chatRef.current) chatRef.current = createChat();
         responseText = await sendMessage(chatRef.current, input);
      }

      const modelMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
      setMessages(prev => [...prev, modelMsg]);

      // TTS auto-play if brief
      if (responseText.length < 100) {
          const audioBuffer = await generateSpeech(responseText);
          if (audioBuffer) playAudioBuffer(audioBuffer);
      }

    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Error processing request.", timestamp: Date.now(), isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVision = async (mode: 'analyze' | 'edit') => {
    setIsLoading(true);
    try {
      const base64 = await onCaptureRequest();
      // Remove header for API
      const cleanBase64 = base64.split(',')[1];
      
      let result = '';
      if (mode === 'analyze') {
          result = await analyzeImage(cleanBase64, input || "Describe this scene and the spider's position.");
          setMessages(prev => [...prev, { role: 'user', text: "[Snapshot Analysis Request]", timestamp: Date.now(), image: base64 }]);
          setMessages(prev => [...prev, { role: 'model', text: result, timestamp: Date.now() }]);
      } else {
          const edited = await editImage(cleanBase64, input || "Make it look vintage");
          if (edited) {
              setGeneratedImage(edited);
              setMessages(prev => [...prev, { role: 'model', text: "Here is your edited image:", timestamp: Date.now() }]);
          }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64Raw = reader.result as string;
        const cleanBase64 = base64Raw.split(',')[1];
        
        try {
            const result = await analyzeImage(cleanBase64, input || "Describe this uploaded image.");
            setMessages(prev => [...prev, { role: 'user', text: "[Image Upload Analysis]", timestamp: Date.now(), image: base64Raw }]);
            setMessages(prev => [...prev, { role: 'model', text: result, timestamp: Date.now() }]);
        } catch (error) {
            console.error("Upload analysis failed", error);
            setMessages(prev => [...prev, { role: 'model', text: "Failed to analyze uploaded image.", timestamp: Date.now(), isError: true }]);
        } finally {
            setIsLoading(false);
        }
    }
    reader.readAsDataURL(file);
  };
  
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsLoading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          try {
            const res = await analyzeVideo(base64, input || "What is happening in this video?");
            setMessages(prev => [...prev, {role: 'model', text: `Video Analysis: ${res}`, timestamp: Date.now()}]);
          } catch(e) {
             setMessages(prev => [...prev, {role: 'model', text: "Video analysis failed.", timestamp: Date.now(), isError: true}]);
          } finally {
            setIsLoading(false);
          }
      }
      reader.readAsDataURL(file);
  }

  const handleGenerate = async () => {
    if (!input) return;
    setIsLoading(true);
    try {
      const img = await generateImage(input, "1:1", "1K");
      if (img) setGeneratedImage(img);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Voice / Live API ---
  const playAudioBuffer = async (buffer: ArrayBuffer) => {
     if (!audioContextRef.current) {
         audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
     }
     const ctx = audioContextRef.current;
     const audioData = await ctx.decodeAudioData(buffer);
     const source = ctx.createBufferSource();
     source.buffer = audioData;
     source.connect(ctx.destination);
     source.start();
  }

  const toggleVoice = async () => {
    if (isLiveConnected) {
        window.location.reload(); 
        return;
    }

    try {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        const decodeAudioData = async (base64: string, ctx: AudioContext) => {
            const binaryString = atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            const int16 = new Int16Array(bytes.buffer);
            
            const float32 = new Float32Array(int16.length);
            for(let i=0; i<int16.length; i++) {
                float32[i] = int16[i] / 32768.0;
            }

            const buffer = ctx.createBuffer(1, float32.length, 24000);
            buffer.getChannelData(0).set(float32);
            return buffer;
        };

        const sessionPromise = connectLive(
            () => {
                setIsLiveConnected(true);
                navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
                    const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    const source = inputCtx.createMediaStreamSource(stream);
                    const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                    
                    processor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const pcmData = new Int16Array(inputData.length);
                        for (let i = 0; i < inputData.length; i++) {
                            pcmData[i] = inputData[i] * 32768;
                        }
                        let binary = '';
                        const bytes = new Uint8Array(pcmData.buffer);
                        for (let i = 0; i < bytes.byteLength; i++) {
                            binary += String.fromCharCode(bytes[i]);
                        }
                        const b64 = btoa(binary);

                        sessionPromise.then(session => {
                            session.sendRealtimeInput({
                                media: { mimeType: 'audio/pcm;rate=16000', data: b64 }
                            });
                        });
                    };
                    source.connect(processor);
                    processor.connect(inputCtx.destination);
                });
            },
            async (base64) => {
                const ctx = audioContextRef.current!;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const buffer = await decodeAudioData(base64, ctx);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
            },
            () => setIsLiveConnected(false),
            (e) => console.error(e)
        );
        sessionRef.current = sessionPromise;

    } catch (e) {
        console.error("Live connection failed", e);
    }
  };


  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg hover:scale-105 transition-transform text-white font-bold flex items-center gap-2"
      >
        <span className="text-xl">✨</span>
        <span className="hidden md:inline">Gemini Lab</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-black/90 backdrop-blur-md border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-sm">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
        <h2 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Gemini Intelligence</h2>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">✕</button>
      </div>

      <div className="flex border-b border-gray-800">
        {(['chat', 'vision', 'generate', 'voice'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 p-3 text-center capitalize ${activeTab === tab ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
             <div className="flex-1 space-y-3 mb-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-xl ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-200'}`}>
                      {m.image && <img src={m.image} alt="upload" className="w-full rounded mb-2" />}
                      <div className="whitespace-pre-wrap">{m.text}</div>
                    </div>
                  </div>
                ))}
                {isLoading && <div className="text-gray-500 text-xs animate-pulse">Thinking...</div>}
                <div ref={messagesEndRef} />
             </div>
             <div className="flex gap-2">
               <input 
                 className="flex-1 bg-gray-800 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500"
                 placeholder="Type /think or paste a URL..."
                 value={input}
                 onChange={e => setInput(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handleSend()}
               />
               <button onClick={handleSend} className="bg-blue-600 px-4 rounded-lg hover:bg-blue-500">Send</button>
             </div>
          </div>
        )}

        {activeTab === 'vision' && (
          <div className="space-y-4">
            <p className="text-gray-400">Capture the current scene or upload media to analyze with Gemini Pro Vision.</p>
            <textarea 
                className="w-full bg-gray-800 rounded p-2 text-white" 
                placeholder="Ask something about the image..."
                value={input}
                onChange={e => setInput(e.target.value)}
            />
            
            <div className="flex gap-2">
                <button 
                  onClick={() => handleVision('analyze')}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 py-2 rounded-lg hover:bg-green-500 disabled:opacity-50 text-xs font-bold"
                >
                  {isLoading ? 'Analyzing...' : '📸 Snap & Analyze'}
                </button>
                <button 
                  onClick={() => handleVision('edit')}
                  disabled={isLoading}
                  className="flex-1 bg-purple-600 py-2 rounded-lg hover:bg-purple-500 disabled:opacity-50 text-xs font-bold"
                >
                  {isLoading ? 'Editing...' : '✨ Snap & Edit'}
                </button>
            </div>

            <div className="border-t border-gray-700 pt-4 space-y-4">
                 <div>
                    <p className="mb-2 text-xs uppercase text-gray-500 font-bold">Image Upload</p>
                    <label className="flex items-center justify-center w-full px-4 py-2 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 border border-gray-700 transition-colors">
                        <span className="text-xs text-blue-400">Select Image to Analyze</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                 </div>
                 
                 <div>
                    <p className="mb-2 text-xs uppercase text-gray-500 font-bold">Video Analysis</p>
                    <label className="flex items-center justify-center w-full px-4 py-2 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 border border-gray-700 transition-colors">
                         <span className="text-xs text-blue-400">Select Video to Analyze</span>
                         <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                    </label>
                 </div>
            </div>

            {generatedImage && (
                 <div className="mt-4">
                     <p className="text-xs text-gray-400 mb-2">Result:</p>
                     <img src={generatedImage} alt="Result" className="w-full rounded-lg border border-gray-700" />
                 </div>
            )}
          </div>
        )}

        {activeTab === 'generate' && (
          <div className="space-y-4">
             <p className="text-gray-400">Generate high-fidelity assets using Gemini 3 Pro Image Preview.</p>
             <textarea 
                 className="w-full bg-gray-800 rounded p-2 text-white h-24" 
                 placeholder="Describe a spider biome texture or concept art..."
                 value={input}
                 onChange={e => setInput(e.target.value)}
             />
             <button 
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-pink-600 to-orange-600 py-2 rounded-lg font-bold hover:opacity-90 disabled:opacity-50"
             >
                {isLoading ? 'Generating...' : 'Generate 1K Image'}
             </button>
             {generatedImage && (
                 <div className="mt-4">
                     <img src={generatedImage} alt="Generated" className="w-full rounded-lg border border-gray-700" />
                     <a href={generatedImage} download="gemini-gen.png" className="block text-center text-xs text-blue-400 mt-2 hover:underline">Download</a>
                 </div>
             )}
          </div>
        )}

        {activeTab === 'voice' && (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${isLiveConnected ? 'bg-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.5)]' : 'bg-gray-800'}`}>
                    <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center transition-transform ${isLiveConnected ? 'scale-110 animate-pulse' : 'scale-100'}`}>
                         <span className="text-4xl">🎙️</span>
                    </div>
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-bold text-white">{isLiveConnected ? 'Live Session Active' : 'Ready to Connect'}</h3>
                    <p className="text-gray-400 text-xs max-w-[200px] mx-auto mt-2">
                        {isLiveConnected ? 'Speak naturally. Gemini is listening.' : 'Start a real-time voice session with the spider AI.'}
                    </p>
                </div>
                <button 
                    onClick={toggleVoice}
                    className={`px-8 py-3 rounded-full font-bold transition-all ${isLiveConnected ? 'bg-red-600 hover:bg-red-700' : 'bg-white text-black hover:bg-gray-200'}`}
                >
                    {isLiveConnected ? 'End Session' : 'Start Live Voice'}
                </button>
            </div>
        )}

      </div>
    </div>
  );
};

export default GeminiPanel;