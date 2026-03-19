# Weave

A browser-based chat playground for testing the visualization capabilities of different LLMs. Think Claude's visual feature, but with any model and provider you choose.

## Overview

Weave lets you chat with any LLM that exposes an OpenAI-compatible Chat Completions API, and see rich inline visuals — interactive diagrams, charts, animations, and more — rendered directly in the conversation. It's a playground to explore how well different models handle visual reasoning and code generation.

**Note**: Your API key is stored in browser local storage and requests go directly from your browser to the provider.

## Supported Models & Providers

Weave works with any provider that implements the OpenAI Chat Completions API, standard adopted by most LLM providers. Some well-known ones include Baseten, Groq, Together AI, and inference servers like Ollama, LM Studio, vLLM etc.

**A note on CORS**: Since requests are sent directly from your browser, the provider's API must have CORS enabled. Many providers restrict this for security reasons, which will result in a blocked request. If you run into this, [OpenRouter](https://openrouter.ai) is a good workaround. Any other OpenAI-compatible proxy with CORS support will work the same way.

## Getting Started

1. Visit [**weave.madhi.ai**](https://weave.madhi.ai)
2. Click the model button (bottom-left of the chat input) to open the configuration dialog
3. Set your **Base URL** (e.g., `https://openrouter.ai/api/v1`)
4. Enter your **API Key**
5. Specify the **Model ID** (e.g., `anthropic/claude-sonnet-4.6`, `moonshotai/kimi-k2.5`, etc.)
6. Start chatting!

## How It Works

The app sends a system prompt that instructs the model to embed HTML visuals using special delimiters (`|||HTML_START|||` / `|||HTML_END|||`). When the streaming response contains these markers, the content between them is extracted and rendered in an iframe — inline with the markdown text response.

Models are encouraged to proactively use visuals when they would enhance understanding, producing diagrams, charts, and interactive widgets as part of their natural response flow.

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v22+)
- [pnpm](https://pnpm.io/)

### Setup

```bash
git clone https://github.com/LugmanS/Weave.git
```

```bash
cd Weave
```

```bash
pnpm install
```

```bash
pnpm dev
```
