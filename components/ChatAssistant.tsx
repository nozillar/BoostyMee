import React, { useState, useEffect, useRef } from 'react';
import { createChatSession } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Button } from './Button';
import { Send, Bot, User, Trash2 } from 'lucide-react';
import { GenerateContentResponse } from "@google/genai";
import { Mascot, MascotMood } from './Mascot';

export const ChatAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Mascot State
  const [mascotMood, setMascotMood] = useState<MascotMood>('neutral');
  const [mascotText, setMascotText] = useState('วันนี้มีเรื่องอะไรไม่สบายใจ หรืออยากให้ช่วยเติมไฟเรื่องไหน บอกเราได้เลยนะ 😊');

  const chatSession = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session on mount
    chatSession.current = createChatSession();
    // Add initial greeting
    setMessages([{
      id: 'init',
      role: 'model',
      text: "สวัสดี! เราคือ BoostMe เพื่อนคู่คิดของคุณ",
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const quickMoodFromText = (text: string) => {
    const t = (text || '').toLowerCase();
    if (t.includes('เครียด') || t.includes('กังวล') || t.includes('กลัว')) {
      setMascotMood('worried');
      setMascotText('โอเค เราได้ยินที่คุณรู้สึกนะ มาลองคุยกันดู 🫶');
    } else if (t.includes('ดีใจ') || t.includes('ภูมิใจ')) {
      setMascotMood('happy');
      setMascotText('เย้ ดีใจกับคุณด้วยจริง ๆ เลย! 🎉');
    } else {
      setMascotMood('neutral');
      setMascotText('เล่าให้เราฟังได้นะ เราพร้อมฟังอยู่เสมอ 🌿');
    }
  };

  const sendMessage = async (text: string) => {
    // Business logic for sending message
    if (isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      let fullResponse = "";
      const resultStream = await chatSession.current.sendMessageStream({ message: userMsg.text });
      
      const responseId = (Date.now() + 1).toString();
      
      setMessages(prev => [...prev, {
        id: responseId,
        role: 'model',
        text: '',
        timestamp: new Date()
      }]);

      for await (const chunk of resultStream) {
        const c = chunk as GenerateContentResponse;
        const chunkText = c.text || "";
        fullResponse += chunkText;
        
        setMessages(prev => prev.map(msg => 
          msg.id === responseId 
            ? { ...msg, text: fullResponse } 
            : msg
        ));
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "ขออภัย ตอนนี้มีปัญหาในการเชื่อมต่อ ลองใหม่อีกครั้งนะ",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const message = input.trim();
    if (!message) return;

    // Update mascot mood based on user input immediately
    quickMoodFromText(message);

    // Clear input immediately (UI logic)
    setInput('');
    
    // Send message (Business logic)
    sendMessage(message);
  };

  const clearChat = () => {
    chatSession.current = createChatSession();
    setMessages([{
      id: Date.now().toString(),
      role: 'model',
      text: "ล้างประวัติคุยแล้ว เริ่มต้นใหม่กัน! วันนี้อยากคุยเรื่องอะไร?",
      timestamp: new Date()
    }]);
    setMascotMood('neutral');
    setMascotText('เริ่มต้นใหม่แล้ว! วันนี้มีอะไรให้เราช่วยไหม?');
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden relative">
      {/* Header / Mascot Area */}
      <div className="bg-slate-50 p-2 border-b border-gray-100 relative">
        <Mascot text={mascotText} mood={mascotMood} />
        <button 
          onClick={clearChat}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 p-2 bg-white rounded-lg shadow-sm hover:bg-red-50 transition-colors z-10"
          title="ล้างแชท"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 mb-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && (
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-tr from-primary-500 to-accent-500 flex items-center justify-center text-white shadow-sm mb-2">
                <Bot size={14} />
              </div>
            )}
            
            <div className={`chat-bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>
              {msg.text}
            </div>
            
            {msg.role === 'user' && (
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 shadow-sm mb-2">
                <User size={14} />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-end gap-2 mb-2 justify-start">
             <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-tr from-primary-500 to-accent-500 flex items-center justify-center text-white shadow-sm mb-2">
                <Bot size={14} />
              </div>
            <div className="chat-bubble ai flex items-center h-[40px]">
              <div className="flex space-x-1">
                <div className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                <div className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preset Buttons */}
      {messages.length < 3 && !isTyping && (
        <div className="px-4 py-2 bg-slate-50/50 flex gap-2 overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => {
              quickMoodFromText("เครียดเรื่องเรียน/งาน");
              sendMessage("เครียดเรื่องเรียน/งาน");
            }}
            className="flex-shrink-0 bg-white border border-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-full hover:bg-primary-50 hover:border-primary-200 hover:text-primary-600 transition-colors"
          >
            😰 เครียดเรื่องงาน/เรียน
          </button>
          <button 
             onClick={() => {
               quickMoodFromText("ไม่มั่นใจตัวเอง");
               sendMessage("ไม่มั่นใจตัวเอง");
             }}
            className="flex-shrink-0 bg-white border border-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-full hover:bg-primary-50 hover:border-primary-200 hover:text-primary-600 transition-colors"
          >
            😔 ไม่มั่นใจตัวเอง
          </button>
          <button 
             onClick={() => {
                quickMoodFromText("อยากได้เป้าหมายใหม่");
                sendMessage("อยากได้เป้าหมายใหม่");
             }}
            className="flex-shrink-0 bg-white border border-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-full hover:bg-primary-50 hover:border-primary-200 hover:text-primary-600 transition-colors"
          >
            🎯 อยากได้เป้าหมายใหม่
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="พิมพ์ข้อความ..."
            autoFocus
            className="flex-1 bg-gray-100 border-0 text-gray-900 text-sm rounded-full focus:ring-2 focus:ring-primary-100 focus:bg-white block w-full px-5 py-3 outline-none transition-all"
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isTyping}
            className="!p-3 !rounded-full !h-11 !w-11 !flex !items-center !justify-center"
          >
            <Send size={18} className={input.trim() ? "ml-0.5" : ""} />
          </Button>
        </div>
      </form>
    </div>
  );
};