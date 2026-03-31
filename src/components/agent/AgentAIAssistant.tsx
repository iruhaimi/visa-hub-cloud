import { useState, useCallback } from 'react';
import { Bot, Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { streamChat, type ChatMessage } from '@/lib/aiChat';
import { useToast } from '@/hooks/use-toast';

interface AgentAIAssistantProps {
  /** Notes or conversation to summarize */
  context?: string;
  /** Last customer message to suggest reply for */
  customerMessage?: string;
  /** Application details for context */
  applicationInfo?: string;
}

export default function AgentAIAssistant({
  context,
  customerMessage,
  applicationInfo,
}: AgentAIAssistantProps) {
  const [summaryResult, setSummaryResult] = useState('');
  const [replyResult, setReplyResult] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [copied, setCopied] = useState<'summary' | 'reply' | null>(null);
  const { toast } = useToast();

  const handleSummarize = useCallback(async () => {
    if (!context || isSummarizing) return;
    setIsSummarizing(true);
    setSummaryResult('');

    let result = '';
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: applicationInfo
          ? `معلومات الطلب:\n${applicationInfo}\n\nالملاحظات والمحادثات:\n${context}`
          : context,
      },
    ];

    await streamChat({
      messages,
      mode: 'agent-summarize',
      onDelta: (chunk) => {
        result += chunk;
        setSummaryResult(result);
      },
      onDone: () => setIsSummarizing(false),
      onError: (err) => {
        setIsSummarizing(false);
        toast({ title: 'خطأ', description: err, variant: 'destructive' });
      },
    });
  }, [context, applicationInfo, isSummarizing, toast]);

  const handleSuggestReply = useCallback(async () => {
    if (!customerMessage || isSuggesting) return;
    setIsSuggesting(true);
    setReplyResult('');

    let result = '';
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: applicationInfo
          ? `معلومات الطلب:\n${applicationInfo}\n\nرسالة العميل:\n${customerMessage}`
          : `رسالة العميل:\n${customerMessage}`,
      },
    ];

    await streamChat({
      messages,
      mode: 'agent-suggest-reply',
      onDelta: (chunk) => {
        result += chunk;
        setReplyResult(result);
      },
      onDone: () => setIsSuggesting(false),
      onError: (err) => {
        setIsSuggesting(false);
        toast({ title: 'خطأ', description: err, variant: 'destructive' });
      },
    });
  }, [customerMessage, applicationInfo, isSuggesting, toast]);

  const copyToClipboard = (text: string, type: 'summary' | 'reply') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="border rounded-xl p-4 bg-accent/30 space-y-4" dir="rtl">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Bot className="h-4 w-4 text-primary" />
        <span>المساعد الذكي</span>
        <Sparkles className="h-3 w-3 text-warning" />
      </div>

      <div className="flex flex-wrap gap-2">
        {context && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSummarize}
            disabled={isSummarizing}
            className="gap-1.5 text-xs"
          >
            {isSummarizing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bot className="h-3 w-3" />}
            تلخيص الملاحظات
          </Button>
        )}

        {customerMessage && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSuggestReply}
            disabled={isSuggesting}
            className="gap-1.5 text-xs"
          >
            {isSuggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            اقتراح رد
          </Button>
        )}
      </div>

      {/* Summary Result */}
      {summaryResult && (
        <div className="bg-card rounded-lg p-3 border relative">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">ملخص الملاحظات:</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => copyToClipboard(summaryResult, 'summary')}
            >
              {copied === 'summary' ? (
                <Check className="h-3 w-3 text-success" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
          <div className="prose prose-sm max-w-none text-sm">
            <ReactMarkdown>{summaryResult}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Reply Suggestion Result */}
      {replyResult && (
        <div className="bg-card rounded-lg p-3 border relative">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">الرد المقترح:</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => copyToClipboard(replyResult, 'reply')}
            >
              {copied === 'reply' ? (
                <Check className="h-3 w-3 text-success" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
          <div className="prose prose-sm max-w-none text-sm">
            <ReactMarkdown>{replyResult}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
