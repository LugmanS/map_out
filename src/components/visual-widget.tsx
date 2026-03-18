import { useEffect, useId, useRef } from "react";

const baseStyles = `<style>:root {
  --color-bg: oklch(0.274 0.006 286.033);
  --color-bg-info: oklch(0.274 0.006 286.033);
  --color-bg-danger: oklch(39.6% 0.141 25.723);
  --color-bg-success: oklch(26.2% 0.051 172.552);
  --color-bg-warning: oklch(28.6% 0.066 53.813);
  
  --color-text-primary: oklch(0.985 0 0);
  --color-text-secondary: oklch(0.705 0.015 286.067);
  --color-text-danger: oklch(0.704 0.191 22.216);
  --color-text-success: oklch(69.6% 0.17 162.48);
  --color-text-warning: oklch(47.6% 0.114 61.907);

  --color-border: oklch(1 0 0 / 10%);
  --color-ring: oklch(0.552 0.016 285.938);

  --color-1: oklch(0.81 0.17 75.35);
  --color-2: oklch(0.58 0.21 260.84);
  --color-3: oklch(0.56 0 0);
  --color-4: oklch(0.44 0 0);

  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  --text-xs: 12px;
  --text-sm: 14px;
  --text-md: 16px;
  --text-lg: 20px;
  --text-xl: 24px;
  --text-2xl: 28px;
  --text-3xl: 36px;

  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 10px;
  --radius-xl: 12px;
  --radius-full: 9999px;
}

html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
* {
  box-sizing: border-box;
}
body{
  color: var(--color-text-primary);
  font-family: "system-ui", sans-serif;
}
</style>`;

function heightScript(id: string) {
  return `<script>
  function sendHeight() {
    const height = document.documentElement.scrollHeight;
    parent.postMessage({ type: "iframe-height", id: "${id}", height }, "*");
  }
  new ResizeObserver(sendHeight).observe(document.body);
  window.onload = sendHeight;
</script>`;
}

export function VisualWidget({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const id = useId();

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "iframe-height" && event.data.id === id) {
        if (iframeRef.current) {
          iframeRef.current.style.height = `${event.data.height}px`;
        }
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [id]);

  const cleanedHtml = html
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");

  const srcDoc = `${baseStyles}\n${cleanedHtml}\n${heightScript(id)}`;

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-same-origin"
      style={{
        width: "100%",
        border: "none",
        height: "0px",
        display: "block",
      }}
    />
  );
}
