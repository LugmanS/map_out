export function ShimmerText({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center">
      <h1 className="text-base shimmer-text text-muted-foreground">{text}</h1>
      <style>{`
                .shimmer-text {
                    --shimmer-color-start: #737373;
                    --shimmer-color-mid: ##fafafa;
                    background: linear-gradient(
                        90deg,
                        #737373 0%,
                        #737373 40%,
                        #fafafa 50%,
                        #737373 60%,
                        #737373 100%
                    );
                    background-size: 200% 100%;
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    animation: shimmer 2s infinite linear;
                }
  
                @media (prefers-color-scheme: dark) {
                    .shimmer-text {
                        --shimmer-color-start: #737373;
                        --shimmer-color-mid: ##fafafa;
                    }
                }
  
                @keyframes shimmer {
                    0% { background-position: 100% 0; }
                    100% { background-position: -100% 0; }
                }
            `}</style>
    </div>
  );
}
