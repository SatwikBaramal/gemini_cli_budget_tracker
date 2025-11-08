'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, RotateCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CoinLoadingAnimation } from './CoinLoadingAnimation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const initialMessage: Message = {
  role: 'assistant',
  content: "Hello! I'm FinBot. Ask me anything about your budget, or for a summary of your spending.",
};

export function Summary() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [bufferedContent, setBufferedContent] = useState('');
  const [displayedContent, setDisplayedContent] = useState('');
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [lastResetTime, setLastResetTime] = useState(Date.now());
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [shouldShowLoading, setShouldShowLoading] = useState(false);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Typewriter effect: display buffered content character by character
  useEffect(() => {
    if (bufferedContent.length > displayedContent.length) {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }

      typingIntervalRef.current = setInterval(() => {
        setDisplayedContent(prev => {
          if (prev.length < bufferedContent.length) {
            // Display 2-3 characters at a time for smoother effect
            const charsToAdd = Math.min(3, bufferedContent.length - prev.length);
            return bufferedContent.slice(0, prev.length + charsToAdd);
          } else {
            if (typingIntervalRef.current) {
              clearInterval(typingIntervalRef.current);
              typingIntervalRef.current = null;
            }
            return prev;
          }
        });
      }, 30); // Adjust this value: lower = faster, higher = slower (30ms is good balance)

      return () => {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
        }
      };
    }
  }, [bufferedContent, displayedContent.length]);

  // Update the actual message when displayedContent changes
  useEffect(() => {
    if (displayedContent && messages.length > 0) {
      setMessages(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (updated[lastIndex]?.role === 'assistant') {
          updated[lastIndex] = {
            role: 'assistant',
            content: displayedContent
          };
        }
        return updated;
      });
    }
  }, [displayedContent, messages.length]);

  // Handle minimum display time for loading animation
  useEffect(() => {
    if (!isLoading && loadingStartTime && bufferedContent) {
      const elapsed = Date.now() - loadingStartTime;
      if (elapsed < 1000) {
        setTimeout(() => {
          setShouldShowLoading(false);
          setLoadingStartTime(null);
        }, 1000 - elapsed);
      } else {
        setShouldShowLoading(false);
        setLoadingStartTime(null);
      }
    }
  }, [isLoading, bufferedContent, loadingStartTime]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Input validation and sanitization
    const sanitizedInput = inputValue.trim();

    // Rate limiting check
    const now = Date.now();
    const timeWindow = 60000; // 1 minute

    // Reset counter every minute
    if (now - lastResetTime > timeWindow) {
      setMessageCount(0);
      setLastResetTime(now);
    }

    // Limit to 15 messages per minute
    if (messageCount >= 15) {
      const warningMessage: Message = {
        role: 'assistant',
        content: "You're sending messages too quickly. Please wait a moment before asking another question."
      };
      setMessages([...messages, warningMessage]);
      setInputValue('');
      return;
    }

    // Check for suspicious patterns (basic prompt injection detection)
    const suspiciousPatterns = [
      /ignore.*previous.*instructions?/i,
      /you are now/i,
      /act as/i,
      /pretend.*you.*are/i,
      /forget.*above/i,
      /new instructions?:/i,
      /system:?\s*$/i,
      /\[system\]/i,
      /reveal.*prompt/i,
      /show.*instructions/i,
    ];

    const containsSuspiciousPattern = suspiciousPatterns.some(pattern =>
      pattern.test(sanitizedInput)
    );

    if (containsSuspiciousPattern) {
      // Add warning message instead of sending
      const warningMessage: Message = {
        role: 'assistant',
        content: "I'm FinBot, your budget assistant. I can only help with questions about your finances and budgeting. Please ask me something about managing your money!"
      };
      setMessages([...messages,
        { role: 'user', content: sanitizedInput },
        warningMessage
      ]);
      setInputValue('');
      return;
    }

    // Length limit (prevent excessively long inputs)
    if (sanitizedInput.length > 500) {
      const warningMessage: Message = {
        role: 'assistant',
        content: "Please keep your questions under 500 characters for better responses. Try breaking it into smaller questions!"
      };
      setMessages([...messages,
        { role: 'user', content: sanitizedInput.substring(0, 500) + '...' },
        warningMessage
      ]);
      setInputValue('');
      return;
    }

    // Increment message count
    setMessageCount(prev => prev + 1);

    // Cancel any ongoing typewriter effect immediately
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    // If there's buffered content that hasn't finished displaying,
    // finalize it in the previous message before starting new one
    if (bufferedContent && displayedContent !== bufferedContent) {
      setMessages(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (updated[lastIndex]?.role === 'assistant') {
          updated[lastIndex] = {
            role: 'assistant',
            content: bufferedContent
          };
        }
        return updated;
      });
    }

    const userMessage: Message = { role: 'user', content: sanitizedInput };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);
    setLoadingStartTime(Date.now());
    setShouldShowLoading(true);

    // Reset buffered and displayed content for new message
    setBufferedContent('');
    setDisplayedContent('');

    // Add empty assistant message that we'll populate with streaming content
    setMessages([...newMessages, { role: 'assistant', content: '' }]);

    // Cancel previous API request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/expenses/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMessages }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulatedContent += parsed.content;
                  
                  // Update buffered content (typewriter effect will handle display)
                  setBufferedContent(accumulatedContent);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }

    } catch (error) {
      // Don't show error if request was aborted (user sent new message)
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      const errorMsg = `Sorry, something went wrong: ${errorMessage}`;
      setBufferedContent(errorMsg);
      setDisplayedContent(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([initialMessage]);
    setBufferedContent('');
    setDisplayedContent('');
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  return (
    <Card className="flex flex-col h-111">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>FinBot</CardTitle>
        <Button variant="ghost" size="icon" onClick={handleClearChat} aria-label="Clear chat">
          <RotateCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'}`}>
              <div className="text-sm prose">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {shouldShowLoading && displayedContent.length === 0 && (
          <div className="flex items-end gap-2 justify-start">
            <div className="max-w-xs p-3 rounded-lg bg-gray-200 text-gray-900">
              <CoinLoadingAnimation />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-2 border-t">
        <div className="flex w-full items-center space-x-2">
          <Input
            type="text"
            placeholder="Ask about your finances..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isLoading}
          />
          <Button onClick={handleSendMessage} disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
