import OpenAI from "openai";
import { systemPrompt } from "./instructions";
import { useChatStore, useModelStore } from "./store";

const HTML_START = "|||HTML_START|||";
const HTML_END = "|||HTML_END|||";

export async function query(query: string, currentMsgId: string) {
  const chatStore = useChatStore.getState();
  const modelStore = useModelStore.getState();

  const ai = new OpenAI({
    baseURL: modelStore.config.baseURL,
    apiKey: modelStore.config.apiKey,
    dangerouslyAllowBrowser: true,
  });

  if (chatStore.context.length === 0)
    chatStore.pushContext({ role: "system", content: systemPrompt });

  chatStore.pushContext({ role: "user", content: query });
  chatStore.updateChatMessage(currentMsgId, {
    annotation: "Processing your query",
  });

  const context = useChatStore.getState().context;
  const res = await ai.chat.completions.create({
    model: modelStore.config.modelId,
    messages: context,
    stream: true,
  });

  let fullContent = "";
  let buffer = "";
  let insideHtml = false;
  let isAnnotated = false;

  for await (const chunk of res) {
    const delta = chunk.choices[0].delta;
    if (!delta.content) continue;

    if (!isAnnotated) {
      chatStore.updateChatMessage(currentMsgId, {
        annotation: "Working through the details",
      });
      isAnnotated = true;
    }

    fullContent += delta.content;
    buffer += delta.content;

    while (buffer.length > 0) {
      if (!insideHtml) {
        const startIdx = buffer.indexOf(HTML_START);
        if (startIdx === -1) {
          const safeFlush =
            buffer.length > HTML_START.length
              ? buffer.slice(0, buffer.length - HTML_START.length)
              : "";
          if (safeFlush) {
            chatStore.appendTextDelta(currentMsgId, safeFlush);
            buffer = buffer.slice(safeFlush.length);
          }
          break;
        } else {
          if (startIdx > 0) {
            chatStore.appendTextDelta(currentMsgId, buffer.slice(0, startIdx));
          }
          buffer = buffer.slice(startIdx + HTML_START.length);
          insideHtml = true;
          chatStore.appendWidgetBlock(currentMsgId, "");
          chatStore.updateChatMessage(currentMsgId, {
            annotation: "Crafting a visual walkthrough",
          });
        }
      }

      if (insideHtml) {
        const endIdx = buffer.indexOf(HTML_END);
        if (endIdx === -1) {
          const safeFlush =
            buffer.length > HTML_END.length
              ? buffer.slice(0, buffer.length - HTML_END.length)
              : "";
          if (safeFlush) {
            chatStore.streamWidgetDelta(currentMsgId, safeFlush);
            buffer = buffer.slice(safeFlush.length);
          }
          break;
        } else {
          if (endIdx > 0) {
            chatStore.streamWidgetDelta(currentMsgId, buffer.slice(0, endIdx));
          }
          chatStore.finalizeWidgetBlock(currentMsgId);
          buffer = buffer.slice(endIdx + HTML_END.length);
          insideHtml = false;
          chatStore.updateChatMessage(currentMsgId, {
            annotation: "Putting things together",
          });
        }
      }
    }
  }

  if (buffer.length > 0) {
    if (insideHtml) {
      chatStore.streamWidgetDelta(currentMsgId, buffer);
      chatStore.finalizeWidgetBlock(currentMsgId);
    } else {
      chatStore.appendTextDelta(currentMsgId, buffer);
    }
  }

  chatStore.pushContext({ role: "assistant", content: fullContent });
  chatStore.updateChatMessage(currentMsgId, { isLoading: false });
}
