import { nanoid } from "nanoid";
import { create } from "zustand";

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
  addChatMessage: (query: string) => string;
  appendTextDelta: (id: string, content: string) => void;
  appendWidgetBlock: (messageId: string, refId: string) => void;
  updateWidgetBlock: (
    messageId: string,
    refId: string,
    content: string,
  ) => void;
  setMessageLoading: (messageId: string, isLoading: boolean) => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  messages: {},
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
          isLoading: false,
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
  updateWidgetBlock: (messageId, refId, content) => {
    set((state) => {
      const msg = state.messages[messageId];
      if (!msg) return state;

      return {
        messages: {
          ...state.messages,
          [messageId]: {
            ...msg,
            content: msg.content.map((item) =>
              item.type === "widget" && item.refId === refId
                ? {
                    ...item,
                    content,
                    isLoading: false,
                  }
                : item,
            ),
          },
        },
      };
    });
  },
  setMessageLoading: (messageId, isLoading) => {
    set((state) => {
      const msg = state.messages[messageId];
      if (!msg) return state;

      return {
        messages: {
          ...state.messages,
          [messageId]: {
            ...msg,
            isLoading,
          },
        },
      };
    });
  },
}));
