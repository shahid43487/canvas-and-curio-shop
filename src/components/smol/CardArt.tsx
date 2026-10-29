import { useId, useRef, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { parseLayers, type CardDraft, type CardLayer } from "@/lib/club";

type Props = { card: Pick<CardDraft, "title" | "description" | "design" | "rarity" | "motion_enabled" | "shadow_enabled" | "border_enabled"> & { layers: unknown; background_url?: string | null; sound_url?: string | null }; serial?: string; locked?: boolean };

function Illustration({ design }: { design: CardDraft["design"] }) {
  if (design === "smile") return <g className="card-illustration card-illustration-bob">
    <circle cx="150" cy="145" r="69" fill="var(--card-pop)" stroke="var(--card-ink)" strokeWidth="7"/>
    <path d="M105 132v-7m0 0v7m90-7v7" stroke="var(--card-ink)" strokeWidth="12" strokeLinecap="round"/>
    <path d="M111 158q39 49 78 0" fill="none" stroke="var(--card-ink)" strokeWidth="8" strokeLinecap="round"/>
    <path d="M83 76l-10-15m166 15 10-15M74 178l-18 4m188-4 18 4" stroke="var(--card-accent)" strokeWidth="8" strokeLinecap="round"/>
  </g>;
  if (design === "ticket") return <g className="card-illustration card-illustration-bob">
    <path d="M82 91h136a15 15 0 0 1 15 15v23a18 18 0 0 0 0 36v23a15 15 0 0 1-15 15H82a15 15 0 0 1-15-15v-23a18 18 0 0 0 0-36v-23a15 15 0 0 1 15-15z" fill="var(--card-pop)" stroke="var(--card-ink)" strokeWidth="7"/>
    <path d="M111 104v88m78-88v88" stroke="var(--card-ink)" strokeWidth="4" strokeDasharray="5 8"/>
    <path d="M139 124l-16 28h19l-7 25 25-34h-18l7-19z" fill="var(--card-accent)" stroke="var(--card-ink)" strokeWidth="4" strokeLinejoin="round"/>
  </g>;
  if (design === "ghost") return <g className="card-illustration card-illustration-bob">
    <path d="M87 204V135a63 63 0 0 1 126 0v69l-19-13-19 13-19-13-19 13-19-13-19 13z" fill="var(--card-pop)" stroke="var(--card-ink)" strokeWidth="7" strokeLinejoin="round"/>
    <ellipse cx="126" cy="137" rx="8" ry="13" fill="var(--card-ink)"/><ellipse cx="174" cy="137" rx="8" ry="13" fill="var(--card-ink)"/>
    <ellipse cx="150" cy="161" rx="10" ry="13" fill="var(--card-accent)"/>
    <path d="M76 102l-13-12m174 12 13-12" stroke="var(--card-ink)" strokeWidth="6" strokeLinecap="round"/>
  </g>;
  if (design === "ship") return <g className="card-illustration card-illustration-bob">
    <path d="M77 167h146l-24 38H105z" fill="var(--card-accent)" stroke="var(--card-ink)" strokeWidth="7" strokeLinejoin="round"/>
    <path d="M147 79v86H91z" fill="var(--card-pop)" stroke="var(--card-ink)" strokeWidth="6" strokeLinejoin="round"/>
    <path d="M158 99l50 66h-50z" fill="var(--card-paper)" stroke="var(--card-ink)" strokeWidth="6" strokeLinejoin="round"/>
    <path d="M72 224q18-13 36 0t36 0t36 0t36 0" fill="none" stroke="var(--card-ink)" strokeWidth="6" strokeLinecap="round"/>
    <circle cx="220" cy="88" r="13" fill="var(--card-pop)" stroke="var(--card-ink)" strokeWidth="4"/>
  </g>;
  if (design === "dark") return <g className="card-illustration card-illustration-spin">
    <circle cx="150" cy="145" r="72" fill="var(--card-accent)" stroke="var(--card-ink)" strokeWidth="7"/>
    <path d="M150 83l17 42 45 2-35 28 12 44-39-25-39 25 12-44-35-28 45-2z" fill="var(--card-pop)" stroke="var(--card-ink)" strokeWidth="5" strokeLinejoin="round"/>
    <circle cx="150" cy="145" r="10" fill="var(--card-ink)"/>
  </g>;
  return <g className="card-illustration card-illustration-bob">
    <path d="M166 65l-68 91h47l-12 78 72-106h-47z" fill="var(--card-pop)" stroke="var(--card-ink)" strokeWidth="7" strokeLinejoin="round"/>
    <path d="M72 100l7 17 18 7-18 7-7 18-7-18-18-7 18-7zM224 172l6 13 14 6-14 6-6 13-6-13-14-6 14-6z" fill="var(--card-paper)" stroke="var(--card-ink)" strokeWidth="4" strokeLinejoin="round"/>
  </g>;
}

function LayerShape({ layer }: { layer: CardLayer }) {
  const toneId = useId();
  const common = { fill: "currentColor" };
  switch (layer.kind) {
    case "svg": return layer.asset_url ? <g><defs><filter id={toneId}><feFlood floodColor="currentColor"/><feComposite in2="SourceAlpha" operator="in"/></filter></defs><image href={layer.asset_url} x={-layer.size/2} y={-layer.size/2} width={layer.size} height={layer.size} preserveAspectRatio="xMidYMid meet" filter={`url(#${toneId})`}/></g> : null;
    case "text": return <text x="0" y="0" fontSize={layer.size} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--smol-display)" fontWeight="900" paintOrder="stroke" stroke="var(--card-paper)" strokeWidth="1.2">{layer.text}</text>;
    case "circle": return <circle r={layer.size / 2} {...common}/>;
    case "star": return <path d={Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,r=i%2===0?layer.size/2:layer.size/4.4;return `${i===0?"M":"L"} ${Math.cos(a)*r} ${Math.sin(a)*r}`;}).join(" ")+" Z"} {...common}/>;
    case "bolt": return <path d={`M ${-layer.size*.08} ${-layer.size*.5} L ${-layer.size*.48} ${layer.size*.08} L ${-layer.size*.08} ${layer.size*.08} L ${-layer.size*.18} ${layer.size*.5} L ${layer.size*.48} ${-layer.size*.12} L ${layer.size*.1} ${-layer.size*.12} Z`} {...common}/>;
    case "heart": return <path d={`M 0 ${layer.size*.42} C ${-layer.size*.12} ${layer.size*.27}, ${-layer.size*.55} ${layer.size*.02}, ${-layer.size*.4} ${-layer.size*.24} C ${-layer.size*.27} ${-layer.size*.47}, ${-layer.size*.05} ${-layer.size*.35}, 0 ${-layer.size*.18} C ${layer.size*.1} ${-layer.size*.38}, ${layer.size*.35} ${-layer.size*.46}, ${layer.size*.45} ${-layer.size*.2} C ${layer.size*.56} ${layer.size*.03}, ${layer.size*.12} ${layer.size*.3}, 0 ${layer.size*.42} Z`} {...common}/>;
    case "diamond": return <path d={`M 0 ${-layer.size*.5} L ${layer.size*.38} 0 L 0 ${layer.size*.5} L ${-layer.size*.38} 0 Z`} {...common}/>;
    case "burst": return <path d={Array.from({length:16},(_,i)=>{const a=-Math.PI/2+i*Math.PI/8,r=i%2===0?layer.size/2:layer.size/5;return `${i===0?"M":"L"} ${Math.cos(a)*r} ${Math.sin(a)*r}`;}).join(" ")+" Z"} {...common}/>;
    case "flower": return <g {...common}>{Array.from({length:6},(_,i)=><ellipse key={i} cx="0" cy={-layer.size*.25} rx={layer.size*.15} ry={layer.size*.27} transform={`rotate(${i*60})`}/>)}<circle r={layer.size*.14}/></g>;
    case "smile": return <g><circle r={layer.size*.45} {...common}/><circle cx={-layer.size*.14} cy={-layer.size*.08} r={layer.size*.045} fill="var(--card-paper)"/><circle cx={layer.size*.14} cy={-layer.size*.08} r={layer.size*.045} fill="var(--card-paper)"/><path d={`M ${-layer.size*.2} ${layer.size*.1} Q 0 ${layer.size*.32} ${layer.size*.2} ${layer.size*.1}`} fill="none" stroke="var(--card-paper)" strokeWidth={Math.max(1,layer.size*.04)} strokeLinecap="round"/></g>;
    case "squiggle": return <path d={`M ${-layer.size*.5} 0 C ${-layer.size*.3} ${-layer.size*.5}, ${-layer.size*.15} ${layer.size*.5}, 0 0 S ${layer.size*.3} ${-layer.size*.5}, ${layer.size*.5} 0`} fill="none" stroke="currentColor" strokeWidth={Math.max(2,layer.size*.09)} strokeLinecap="round"/>;
    case "ghost": return <path d={`M ${-layer.size*.36} ${layer.size*.4} V ${-layer.size*.05} A ${layer.size*.36} ${layer.size*.36} 0 0 1 ${layer.size*.36} ${-layer.size*.05} V ${layer.size*.4} l ${-layer.size*.12} ${-layer.size*.09} l ${-layer.size*.12} ${layer.size*.09} l ${-layer.size*.12} ${-layer.size*.09} z`} {...common}/>;
    case "ticket": return <path d={`M ${-layer.size*.45} ${-layer.size*.3} H ${layer.size*.45} V ${-layer.size*.1} A ${layer.size*.12} ${layer.size*.12} 0 0 0 ${layer.size*.45} ${layer.size*.14} V ${layer.size*.32} H ${-layer.size*.45} V ${layer.size*.14} A ${layer.size*.12} ${layer.size*.12} 0 0 0 ${-layer.size*.45} ${-layer.size*.1} Z`} {...common}/>;
  }
}

export function CardArt({ card, serial, locked }: Props) {
  const audio = useRef<HTMLAudioElement>(null);
  const [audioError,setAudioError] = useState(false);
  const [playing,setPlaying] = useState(false);
  const layers = parseLayers(card.layers).filter(layer => layer.visible);
  return <div className={`club-card-art ca-${card.design} ${card.motion_enabled && !locked ? "club-motion" : ""} ${card.shadow_enabled ? "club-shadow" : ""} ${card.border_enabled ? "club-border" : ""} ${locked ? "club-locked" : ""}`} role="group" aria-label={locked ? "Locked collectible card" : card.title}>
    {card.background_url && <img className="club-card-background" src={card.background_url} alt=""/>}
    <svg className="club-card-illustration" viewBox="0 0 300 380" aria-hidden="true" preserveAspectRatio="none">
      <path d="M-25 75L80 -20H180L-25 185Z" fill="var(--card-paper)" opacity=".45"/>
      <circle cx="245" cy="95" r="72" fill="none" stroke="var(--card-ink)" strokeWidth="2" opacity=".14"/>
      <circle cx="245" cy="95" r="56" fill="none" stroke="var(--card-ink)" strokeWidth="1.5" strokeDasharray="4 7" opacity=".22"/>
      <path d="M20 260l28-9 8-28 9 28 28 9-28 9-9 28-8-28z" fill="var(--card-accent)" opacity=".85"/>
      <path d="M258 242l13 4 4 13 4-13 13-4-13-4-4-13-4 13z" fill="var(--card-pop)"/>
      <Illustration design={card.design}/>
      {layers.map(layer=><g key={layer.id} transform={`translate(${layer.x} ${layer.y}) rotate(${layer.rotation}) scale(${layer.scale ?? 1})`} opacity={layer.opacity ?? 1} className={`club-tone-${layer.tone}`}><g className={card.motion_enabled && !locked ? `club-motion-layer club-motion-${layer.motion}` : ""} style={{"--layer-duration":`${4/layer.speed}s`,"--layer-distance":`${6*layer.intensity}px`,"--layer-angle":`${8*layer.intensity}deg`,"--layer-growth":1+0.12*layer.intensity} as CSSProperties}><LayerShape layer={layer}/></g></g>)}
    </svg>
    <div className="club-card-face">
      <span className="club-card-brand">SMOL CLUB <i>✳</i> {card.rarity.toUpperCase()}</span>
      <span className="club-card-edition">{card.design.toUpperCase()} / COLLECTOR SERIES</span>
      <h3>{locked ? "LOCKED" : card.title || "UNTITLED LEGEND"}</h3>
      <p>{locked ? "A little legend awaits." : card.description || "A tiny object. A big personality."}</p>
      <small>{serial || "PERMANENT COLLECTIBLE"}</small>
      {card.sound_url && !locked && <><audio key={card.sound_url} ref={audio} src={card.sound_url} preload="none" onError={()=>{setAudioError(true);setPlaying(false);}} onEnded={()=>setPlaying(false)}/><Button type="button" variant="outline" size="sm" onClick={async e=>{e.stopPropagation();const player=audio.current;if(!player)return;if(!player.paused){player.pause();setPlaying(false);return;}setAudioError(false);try{await player.play();setPlaying(true);}catch{setAudioError(true);setPlaying(false);}}}>{playing?"Pause sound":"Play sound"}</Button>{audioError&&<span role="status">Sound unavailable or unsupported.</span>}</>}
    </div>
  </div>;
}
