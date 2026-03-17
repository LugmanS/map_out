import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat";
import { useChatStore } from "./store";

//dev-time creds
const config = { baseURL: "", apiKey: "", dangerouslyAllowBrowser: true };

const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "show_visual_widget",
      description: "",
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
  const ai = new OpenAI(config);

  const context: ChatCompletionMessageParam[] = [
    { role: "user", content: query },
  ];

  try {
    while (true) {
      const res = await ai.chat.completions.create({
        model: "",
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
              if (tc.function.name === "show_visual_widget") {
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
        context.push({ role: "assistant", content: textContent });
        chatStore.setMessageLoading(currentMsgId, false);
        break;
      }

      context.push({
        role: "assistant",
        content: textContent,
        tool_calls: toolCallList.map((tc) => ({
          id: tc.id,
          type: "function",
          function: { name: tc.name, arguments: tc.arguments },
        })),
      });

      for (const tc of toolCallList) {
        if (tc.name === "show_visual_widget") {
          const parsed = JSON.parse(tc.arguments);
          const code = parsed.code as string;
          chatStore.updateWidgetBlock(currentMsgId, tc.id, code);
          context.push({
            role: "tool",
            tool_call_id: tc.id,
            content: "",
          });
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}
