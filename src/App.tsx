import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { query } from "@/lib/agent";
import { useChatStore } from "@/lib/store";
import { ArrowUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { ModelConfig } from "./components/model-config";
import { ShimmerText } from "./components/shimmer-text";
import { VisualWidget } from "./components/visual-widget";

const staterPrompts = [
  "How compound interest works?",
  "Visualize how binary search works on a sorted list, step by step",
];

export default function App() {
  const { messages, addChatMessage, updateChatMessage } = useChatStore();
  const [input, setInput] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentEndRef = useRef<HTMLDivElement>(null);
  const lastUserMsgRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef<Set<string>>(new Set());
  const isAutoScrollingRef = useRef(false);
  const latestAssistantIdRef = useRef<string | null>(null);
  const [spacerHeight, setSpacerHeight] = useState(0);

  // Scroll just enough to keep the content end visible at the bottom
  const scrollContentIntoView = useCallback(() => {
    const container = scrollContainerRef.current;
    const contentEnd = contentEndRef.current;
    if (!container || !contentEnd) return;

    const containerRect = container.getBoundingClientRect();
    const contentEndRect = contentEnd.getBoundingClientRect();

    const visibleBottom = containerRect.bottom - 146;
    // Only scroll if content bottom has gone past the visible area
    if (contentEndRect.bottom > visibleBottom) {
      isAutoScrollingRef.current = true;
      const scrollBy = contentEndRect.bottom - visibleBottom;
      container.scrollTo({ top: container.scrollTop + scrollBy });
      requestAnimationFrame(() => {
        isAutoScrollingRef.current = false;
      });
    }
  }, []);

  // Track user scroll to disable auto-scroll per message
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isAutoScrollingRef.current) return;
      const currentId = latestAssistantIdRef.current;
      if (!currentId) return;

      const contentEnd = contentEndRef.current;
      if (contentEnd) {
        const containerRect = container.getBoundingClientRect();
        const contentEndRect = contentEnd.getBoundingClientRect();
        const visibleBottom = containerRect.bottom - 146;
        const isContentVisible = contentEndRect.bottom <= visibleBottom + 40;
        if (!isContentVisible) {
          userScrolledRef.current.add(currentId);
        } else {
          userScrolledRef.current.delete(currentId);
        }
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll when messages update (during streaming)
  const messageValues = Object.values(messages);
  const assistants = messageValues.filter((m) => m.role === "assistant");
  const latestAssistant = assistants[assistants.length - 1];

  useEffect(() => {
    if (!latestAssistant) return;
    latestAssistantIdRef.current = latestAssistant.id;
    if (!userScrolledRef.current.has(latestAssistant.id)) {
      scrollContentIntoView();
    }
    if (!latestAssistant.isLoading && spacerHeight > 0) {
      // Measure content height from user message to content end
      const userMsg = lastUserMsgRef.current;
      const contentEnd = contentEndRef.current;
      if (userMsg && contentEnd) {
        const contentHeight =
          contentEnd.getBoundingClientRect().bottom -
          userMsg.getBoundingClientRect().top;
        const viewportHeight = window.innerHeight;
        // 56px nav + 146px input = 202px reserved
        const availableHeight = viewportHeight - 202;
        const needed = Math.max(0, availableHeight - contentHeight);
        setSpacerHeight(needed);
      } else {
        setSpacerHeight(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestAssistant?.isLoading, messageValues, scrollContentIntoView]);

  async function sendMessage(customInput?: string) {
    let userMsg = input;
    if (customInput) userMsg = customInput;

    const isFirstMessage = Object.keys(messages).length === 0;
    const msgId = addChatMessage(userMsg);
    setInput("");
    userScrolledRef.current.delete(msgId);
    if (!isFirstMessage) {
      setSpacerHeight(window.innerHeight - 202);
      // Scroll user message to top after React renders it
      requestAnimationFrame(() => {
        if (lastUserMsgRef.current) {
          isAutoScrollingRef.current = true;
          lastUserMsgRef.current.scrollIntoView({ block: "start" });
          requestAnimationFrame(() => {
            isAutoScrollingRef.current = false;
          });
        }
      });
    }

    try {
      await query(userMsg, msgId);
    } catch (e) {
      updateChatMessage(msgId, {
        isLoading: false,
        content: [
          {
            type: "text",
            refId: null,
            content: "Something went wrong! Please try again.",
            isLoading: false,
          },
        ],
      });
      toast("Error occurred, please try again!", {
        description: (
          <pre className="mt-2 w-[320px] overflow-x-auto rounded-md bg-code p-4 text-code-foreground">
            <code>{JSON.stringify(e, null, 2)}</code>
          </pre>
        ),
        classNames: { content: "flex flex-col gap-2" },
        position: "bottom-right",
      });
    }
  }

  return (
    <main
      ref={scrollContainerRef}
      className="h-screen overflow-y-auto bg-card scrollbar-hide"
    >
      <nav className="h-14 w-full fixed top-0 left-0 bg-card border-b z-50">
        <div className="flex items-center justify-between px-4 h-full max-w-3xl mx-auto">
          <div className="flex items-center gap-1.5">
            <img src="/logo.svg" className="size-8 hover:animate-spin" />
            <div className="-space-y-0.5">
              <h1 className="font-mono">map_out</h1>
              <p className="text-xs text-muted-foreground">
                by{" "}
                <a href="https://www.madhi.ai" className="underline">
                  Madhi AI
                </a>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant={"outline"}>New Chat</Button>
          </div>
        </div>
      </nav>
      <div className="max-w-3xl w-full mx-auto fixed bottom-0 bg-card left-1/2 transform translate-x-[-50%] z-50 pb-3.5">
        <div className="p-2 border rounded-xl bg-muted">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (e.shiftKey) return;
                e.preventDefault();
                sendMessage();
              }
            }}
            autoFocus
            className="border-0 bg-transparent dark:bg-transparent shadow-none focus-visible:ring-0 resize-none"
            placeholder="How can I help you?"
          />
          <div className="flex items-center justify-between">
            <ModelConfig />
            <Button
              size={"icon"}
              disabled={input.length === 0}
              onClick={() => sendMessage()}
            >
              <ArrowUp />
            </Button>
          </div>
        </div>
      </div>
      <div
        className={`pt-20 pb-44 max-w-3xl mx-auto px-4 space-y-8 ${
          messageValues.length === 0 ? "flex flex-col min-h-screen" : ""
        }`}
      >
        {messageValues.length === 0 && (
          <div className="space-y-6 h-full flex-1 flex flex-col justify-center">
            <h1 className="text-[28px] text-center font-mono tracking-tighter mt-8">
              How can I help you?
            </h1>
            <div className="flex items-center justify-center flex-wrap gap-3">
              {staterPrompts.map((prompt, index) => (
                <Button
                  variant={"secondary"}
                  key={index}
                  onClick={() => sendMessage(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}
        {messageValues.map((message) => (
          <>
            {message.role === "user" && (
              <div
                ref={lastUserMsgRef}
                key={message.id}
                className="flex items-center justify-end w-full scroll-mt-20"
              >
                {message.content.map((content, index) => (
                  <div
                    className="max-w-xl bg-muted px-4 py-2 rounded-xl"
                    key={index}
                  >
                    {content.content}
                  </div>
                ))}
              </div>
            )}
            {message.role === "assistant" && (
              <div className="max-w-3xl w-full space-y-4">
                {message.isLoading && (
                  <div className="flex items-center gap-1.5">
                    <ShimmerText text={message.annotation || "Initializing"} />
                  </div>
                )}
                {message.content.map((block, index) => (
                  <>
                    {block.type === "text" && (
                      <div
                        className="preview h-full w-full overflow-auto"
                        key={index}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkBreaks]}
                        >
                          {block.content}
                        </ReactMarkdown>
                      </div>
                    )}
                    {block.type === "widget" && (
                      <VisualWidget
                        html={block.content}
                        streaming={block.isLoading}
                      />
                    )}
                  </>
                ))}
              </div>
            )}
          </>
        ))}
        <div ref={contentEndRef} />
        {spacerHeight > 0 && <div style={{ minHeight: spacerHeight }} />}
      </div>
      <Toaster position="top-center" />
    </main>
  );
}
