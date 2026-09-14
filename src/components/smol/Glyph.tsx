export function Glyph({ className = "glyph", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M52 6C68 3 90 16 93 38C96 58 86 78 66 89C47 99 20 96 9 78C-2 60 2 34 18 18C27 9 40 8 52 6Z"
        fill="#161B53"
      />
      <circle cx="62" cy="42" r="7" fill="#fff" />
    </svg>
  );
}
