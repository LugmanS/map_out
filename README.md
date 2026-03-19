# map_out

A browser-based chat playground for testing the visualization capabilities of different LLMs. Think Claude's artifact/visual feature — but with any model and provider you choose.

## What is this?

map_out lets you chat with any LLM that exposes an OpenAI-compatible Chat Completions API, and see rich inline visuals — interactive diagrams, charts, animations, and more — rendered directly in the conversation. It's a playground to explore how well different models handle visual reasoning and code generation.

**Note**: Your API key is stored in browser local storage and requests go directly from your browser to the provider.

## Getting Started

1. Visit [**mapout.vercel.app**](https://mapout.vercel.app)
2. Click the model button (bottom-left of the chat input) to open the configuration dialog
3. Set your **Base URL** (e.g., `https://api.openai.com/v1`)
4. Enter your **API Key**
5. Specify the **Model ID** (e.g., `gpt-4o`, `claude-sonnet-4-20250514`, etc.)
6. Start chatting!

## How It Works

The app sends a system prompt that instructs the model to embed HTML visuals using special delimiters (`|||HTML_START|||` / `|||HTML_END|||`). When the streaming response contains these markers, the content between them is extracted and rendered in a sandboxed iframe — inline with the markdown text response.

Models are encouraged to proactively use visuals when they would enhance understanding, producing diagrams, charts, and interactive widgets as part of their natural response flow.

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)

### Setup

```bash
git clone https://github.com/LugmanS/map_out.git
```

```bash
cd map_out
```

```bash
pnpm install
```

```bash
pnpm dev
```
