import { nanoid } from "nanoid";
import type { ChatCompletionMessageParam } from "openai/resources/chat";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: {
    refId: string | null;
    type: "text" | "widget";
    content: string;
    isLoading: boolean;
  }[];
  annotation: string | null;
  isLoading: boolean;
};

type ChatStore = {
  messages: Record<string, Message>;
  context: ChatCompletionMessageParam[];
  addChatMessage: (query: string) => string;
  appendTextDelta: (id: string, content: string) => void;
  appendWidgetBlock: (messageId: string, refId: string) => void;
  streamWidgetDelta: (messageId: string, delta: string) => void;
  finalizeWidgetBlock: (messageId: string) => void;
  updateChatMessage: (id: string, partial: Partial<Message>) => void;
  pushContext: (...messages: ChatCompletionMessageParam[]) => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  messages: {},
  context: [],
  addChatMessage: (query: string) => {
    const userMsgId = nanoid();
    const asstMsgId = nanoid();
    set((state) => ({
      messages: {
        ...state.messages,
        [userMsgId]: {
          id: userMsgId,
          role: "user",
          content: [
            { refId: null, type: "text", content: query, isLoading: false },
          ],
          annotation: null,
          isLoading: false,
        },
        [asstMsgId]: {
          id: asstMsgId,
          role: "assistant",
          content: [],
          annotation: null,
          isLoading: true,
        },
      },
    }));
    return asstMsgId;
  },
  appendTextDelta: (id: string, delta: string) => {
    set((state) => {
      const msg = state.messages[id];
      if (!msg) return state;

      const cleanedContent = delta.replace(/\\n/g, "\n");
      const content = [...msg.content];

      if (content.length === 0 || content[content.length - 1].type !== "text") {
        content.push({
          refId: null,
          type: "text",
          content: cleanedContent,
          isLoading: false,
        });
      } else {
        content[content.length - 1] = {
          ...content[content.length - 1],
          content: content[content.length - 1].content + cleanedContent,
        };
      }

      return {
        messages: {
          ...state.messages,
          [id]: {
            ...msg,
            content,
          },
        },
      };
    });
  },
  appendWidgetBlock: (messageId: string, refId: string) => {
    set((state) => {
      const msg = state.messages[messageId];
      if (!msg) return state;

      return {
        messages: {
          ...state.messages,
          [messageId]: {
            ...msg,
            content: [
              ...msg.content,
              {
                refId,
                type: "widget",
                content: "",
                isLoading: true,
              },
            ],
          },
        },
      };
    });
  },
  updateChatMessage: (id: string, partial: Partial<Message>) => {
    set((state) => {
      const existing = state.messages[id];
      if (!existing) return state;

      return {
        messages: {
          ...state.messages,
          [id]: {
            ...existing,
            ...partial,
          },
        },
      };
    });
  },
  streamWidgetDelta: (messageId, delta) => {
    set((state) => {
      const msg = state.messages[messageId];
      if (!msg) return state;

      const content = [...msg.content];
      const lastWidget = content.findLastIndex(
        (item) => item.type === "widget" && item.isLoading,
      );
      if (lastWidget === -1) return state;

      content[lastWidget] = {
        ...content[lastWidget],
        content: content[lastWidget].content + delta,
      };

      return {
        messages: {
          ...state.messages,
          [messageId]: { ...msg, content },
        },
      };
    });
  },
  finalizeWidgetBlock: (messageId) => {
    set((state) => {
      const msg = state.messages[messageId];
      if (!msg) return state;

      const content = msg.content.map((item) =>
        item.type === "widget" && item.isLoading
          ? { ...item, isLoading: false }
          : item,
      );

      return {
        messages: {
          ...state.messages,
          [messageId]: { ...msg, content },
        },
      };
    });
  },
  pushContext: (...messages) => {
    set((state) => ({
      context: [...state.context, ...messages],
    }));
  },
}));

type ModelConfig = {
  baseURL: string;
  apiKey: string;
  modelId: string;
};

type ModelStore = {
  config: ModelConfig;
  setConfig: (config: ModelConfig) => void;
};

export const useModelStore = create<ModelStore>()(
  persist(
    (set) => ({
      config: {
        baseURL: "https://api.openai.com/v1",
        apiKey: "",
        modelId: "gpt-5.2",
      },
      setConfig: (config) => {
        set({ config });
      },
    }),
    {
      name: "model-config-storage",
      partialize: (state) => ({
        config: state.config,
      }),
    },
  ),
);
