import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Bot, User, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { streamChat, type ChatMessage } from '@/lib/aiChat';
import { getWhatsAppUrl } from './FloatingWhatsApp';
import { useSiteSection } from '@/hooks/useSiteContent';

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch AI assistant settings
  const { data: aiSettings } = useSiteSection('ai_assistant', 'settings');
  const settings = (aiSettings || {}) as Record<string, any>;

  const isEnabled = settings.is_enabled !== false;
  const welcomeMessage = settings.welcome_message_ar || 'أهلاً بك! 👋';
  const welcomeSubtitle = settings.welcome_subtitle_ar || 'أنا مساعدك الذكي، اسألني عن التأشيرات والأسعار والمتطلبات';
  const quickQuestions = (settings.quick_questions || ['كم سعر تأشيرة تركيا؟', 'وش الدول المتاحة؟', 'في عروض حالياً؟']).filter((q: string) => q?.trim());
  const whatsappNumber = settings.whatsapp_number || '966920034158';

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text || isLoading) return;

    setInput('');
    setHasError(false);
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantContent = '';
    const controller = new AbortController();
    abortRef.current = controller;

    const upsert = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
        }
        return [...prev, { role: 'assistant', content: assistantContent }];
      });
    };

    await streamChat({
      messages: [...messages, userMsg],
      mode: 'customer',
      onDelta: upsert,
      onDone: () => setIsLoading(false),
      onError: (err) => {
        setIsLoading(false);
        setHasError(true);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `⚠️ ${err}\n\nتقدر تتواصل مع فريقنا مباشرة عبر واتساب` },
        ]);
      },
      signal: controller.signal,
    });
  }, [input, isLoading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const whatsappUrl = getWhatsAppUrl('مرحباً، أرغب في التحدث مع أحد الوكلاء');

  // Don't render if disabled
  if (!isEnabled) return null;

  return (
    <>
      {/* Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileTap={{ scale: 0.9 }}
            aria-label="فتح المساعد الذكي"
          >
            <Bot className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-4 right-4 z-[80] w-[92vw] sm:w-[380px] h-[70vh] max-h-[550px] bg-card rounded-2xl shadow-2xl border flex flex-col overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            dir="rtl"
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <div>
                  <p className="font-semibold text-sm">المساعد الذكي</p>
                  <p className="text-[10px] opacity-80">متصل الآن • يرد فوراً</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:opacity-80 transition-opacity">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {/* Welcome message */}
              {messages.length === 0 && (
                <div className="text-center py-6">
                  <div className="w-14 h-14 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
                    <Bot className="h-7 w-7 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground mb-1">{welcomeMessage}</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {welcomeSubtitle}
                  </p>
                  {/* Quick suggestions */}
                  {quickQuestions.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {quickQuestions.map((q: string) => (
                        <button
                          key={q}
                          onClick={() => sendMessage(q)}
                          className="text-xs bg-accent text-accent-foreground px-3 py-1.5 rounded-full hover:bg-accent/80 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user' ? 'bg-primary/10' : 'bg-accent'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Bot className="h-3.5 w-3.5 text-accent-foreground" />
                    )}
                  </div>
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm prose-slate max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <Bot className="h-3.5 w-3.5 text-accent-foreground" />
                  </div>
                  <div className="bg-muted rounded-xl px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* WhatsApp fallback */}
            {hasError && (
              <div className="px-3 pb-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white text-xs py-2 rounded-lg hover:bg-[#20BD5A] transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  تواصل مع فريقنا عبر واتساب
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t bg-card shrink-0">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="اكتب سؤالك هنا..."
                  className="flex-1 resize-none bg-muted rounded-xl px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px] max-h-[80px]"
                  rows={1}
                  disabled={isLoading}
                />
                <Button
                  size="icon"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="rounded-xl h-10 w-10 shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
