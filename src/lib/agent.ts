import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat";
import {
  renderVisualDescription,
  renderVisualOutput,
  systemPrompt,
} from "./instructions";
import { useChatStore, useModelStore } from "./store";

const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "render_visual",
      description: renderVisualDescription,
      parameters: {
        type: "object",
        properties: { code: { type: "string", description: "HTML code" } },
        required: ["code"],
      },
    },
  },
];

export async function query(query: string, currentMsgId: string) {
  const chatStore = useChatStore.getState();
  const modelStore = useModelStore.getState();

  const ai = new OpenAI({
    baseURL: modelStore.config.baseURL,
    apiKey: modelStore.config.apiKey,
    dangerouslyAllowBrowser: true,
  });

  if (chatStore.context.length === 0) {
    chatStore.pushContext({ role: "system", content: systemPrompt });
  }

  chatStore.pushContext({ role: "user", content: query });

  try {
    while (true) {
      const context = useChatStore.getState().context;
      const res = await ai.chat.completions.create({
        model: modelStore.config.modelId,
        messages: context,
        tools,
        stream: true,
      });

      type ToolCall = { id: string; name: string; arguments: string };
      const toolCalls: Record<number, ToolCall> = {};
      let textContent = "";

      for await (const chunk of res) {
        const delta = chunk.choices[0].delta;
        if (delta.content) {
          textContent += delta.content;
          chatStore.appendTextDelta(currentMsgId, delta.content);
        } else if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index;
            if (!toolCalls[idx]) {
              toolCalls[idx] = { id: "", name: "", arguments: "" };
            }
            if (tc.id) toolCalls[idx].id = tc.id;
            if (tc.function?.name) {
              toolCalls[idx].name = tc.function.name;
              if (tc.function.name === "render_visual") {
                chatStore.appendWidgetBlock(currentMsgId, tc.id || "");
              }
            }
            if (tc.function?.arguments)
              toolCalls[idx].arguments += tc.function.arguments;
          }
        }
      }

      const toolCallList = Object.values(toolCalls);

      if (toolCallList.length === 0) {
        chatStore.pushContext({ role: "assistant", content: textContent });
        chatStore.setMessageLoading(currentMsgId, false);
        break;
      }

      chatStore.pushContext({
        role: "assistant",
        content: textContent,
        tool_calls: toolCallList.map((tc) => ({
          id: tc.id,
          type: "function",
          function: { name: tc.name, arguments: tc.arguments },
        })),
      });

      const toolResults: ChatCompletionMessageParam[] = [];
      for (const tc of toolCallList) {
        if (tc.name === "render_visual") {
          const parsed = JSON.parse(tc.arguments);
          const code = parsed.code as string;
          chatStore.updateWidgetBlock(currentMsgId, tc.id, code);
          toolResults.push({
            role: "tool",
            tool_call_id: tc.id,
            content: renderVisualOutput,
          });
        } else {
          toolResults.push({
            role: "tool",
            tool_call_id: tc.id,
            content: "Invalid tool call.",
          });
        }
      }
      chatStore.pushContext(...toolResults);
    }
  } catch (error) {
    console.error(error);
  }
}
