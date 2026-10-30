import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CardArt } from "@/components/smol/CardArt";
import { UploadButtonGroup } from "@/components/smol/UploadButtonGroup";
import { adminClub, adminSaveCard, adminUploadCardAsset } from "@/lib/club-admin.functions";
import { useAdminToken } from "@/lib/admin-session";
import { designs, motions, parseLayers, type CardDraft, type CardLayer } from "@/lib/club";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/admin/card-library")({ head: () => pageHead("Card Library", "SMOL CLUB permanent collectible artwork and layered card editor."), component: Library });
const fresh = (): CardDraft => ({ id: "", title: "", description: "", design: "smile", rarity: "common", set_id: null, background_url: null, sound_url: null, layers: [], motion_enabled: true, shadow_enabled: false, border_enabled: true, is_active: true, is_secret: false, is_archived: false, counts_for_completion: true, sort_order: 0 });
function Library() {
 const token=useAdminToken(), qc=useQueryClient(), save=useServerFn(adminSaveCard), upload=useServerFn(adminUploadCardAsset);
 const {data,error}=useQuery({queryKey:["admin-club",token],queryFn:()=>adminClub({data:{token}})});
 const [draft,setDraft]=useState<CardDraft>(fresh), [busy,setBusy]=useState(false), [uploading,setUploading]=useState(false), [newLayerKind,setNewLayerKind]=useState<CardLayer["kind"]>("star"), [canvasMode,setCanvasMode]=useState(false), [selectedLayerId,setSelectedLayerId]=useState<string|null>(null);
 const patch=(v:Partial<CardDraft>)=>setDraft(d=>({...d,...v}));
 const layer=(id:string,v:Partial<CardLayer>)=>patch({layers:draft.layers.map(l=>l.id===id?{...l,...v}:l)});
 const uploadFiles=async(files:File[],kind:"svg")=>{
  const remaining=30-draft.layers.length;
  if(files.length>remaining){toast.error(`This card can have at most 30 layers. Select ${remaining} or fewer SVG files.`);return;}
  setUploading(true);
  let added=0;
  try{
   for(const file of files){
    if(file.size>512*1024){toast.error(`${file.name} is too large (SVG limit: 512 KB); skipped.`);continue;}
    const bytes=new Uint8Array(await file.arrayBuffer());let binary="";
    for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    const result=await upload({data:{token,cardId:draft.id,kind,mime:"image/svg+xml",bytes:btoa(binary)}});
    setDraft(d=>({...d,layers:[...d.layers,{id:crypto.randomUUID(),kind:"svg",asset_url:result.url,text:"",x:150+(added%4)*8,y:120+(added%4)*8,size:100,rotation:0,scale:1,opacity:1,tone:"ink",motion:"none",speed:1,intensity:1,visible:true}]}));
    added++;
   }
   if(added)toast.success(`Added ${added} SVG layer${added===1?"":"s"} — save card to keep changes`);
  }catch(e){toast.error(e instanceof Error?e.message:"One or more SVG uploads failed");}
  finally{setUploading(false);}
 };
 const uploadFile=async(file:File|undefined,kind:"background"|"sound"|"svg")=>{
  if(!file)return;
  if(!/^[a-z0-9-]{2,80}$/.test(draft.id)){toast.error("Enter a card ID before uploading");return;}
  if(file.size>(kind==="svg"?512*1024:5*1024*1024)){toast.error("File too large (SVG: 512 KB; images/audio: 5 MB)");return;}
  setUploading(true);
  try{const bytes=new Uint8Array(await file.arrayBuffer());let binary="";for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
   const mime=(kind==="svg"?"image/svg+xml":file.type==="audio/x-wav"?"audio/wav":file.type) as "image/png"|"image/jpeg"|"image/webp"|"image/svg+xml"|"audio/mpeg"|"audio/wav"|"audio/ogg";
   const result=await upload({data:{token,cardId:draft.id,kind,mime,bytes:btoa(binary)}});
   setDraft(d=>kind==="svg"?{...d,layers:[...d.layers,{id:crypto.randomUUID(),kind:"svg",asset_url:result.url,text:"",x:150,y:120,size:100,rotation:0,scale:1,opacity:1,tone:"ink",motion:"none",speed:1,intensity:1,visible:true}]}:{...d,[kind==="background"?"background_url":"sound_url"]:result.url});
   toast.success("Uploaded — save card to keep this change");
  }catch(e){toast.error(e instanceof Error?e.message:"Upload failed");}finally{setUploading(false);}
 };
 return <div className="club-admin"><h1 className="admin-h1">Card Library</h1>{error && <p role="alert">{error.message}</p>}
 <div className="club-design-tray">{designs.map(design=><Button key={design} variant={draft.design===design?"default":"outline"} onClick={()=>patch({design})}>{design}</Button>)}</div>
 <div className="club-editor"><form className="admin-form" onSubmit={async e=>{e.preventDefault();setBusy(true);try {await save({data:{token,card:draft}});await qc.invalidateQueries({queryKey:["admin-club"]});toast.success("Card saved");}catch(e){toast.error(e instanceof Error?e.message:"Save failed");}finally{setBusy(false);}}}>
 <label>Card ID<input className="admin-input" required value={draft.id} onChange={e=>patch({id:e.target.value})}/></label><label>Title<input className="admin-input" required value={draft.title} onChange={e=>patch({title:e.target.value})}/></label><label>Description<textarea className="admin-input" value={draft.description} onChange={e=>patch({description:e.target.value})}/></label>
 <label>Set<select className="admin-input" value={draft.set_id||""} onChange={e=>patch({set_id:e.target.value||null})}><option value="">Independent card</option>{data?.sets.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
 <label>Rarity<select className="admin-input" value={draft.rarity} onChange={e=>patch({rarity:e.target.value as CardDraft["rarity"]})}>{["common","uncommon","rare","epic","legendary"].map(v=><option key={v}>{v}</option>)}</select></label>
 <label>Sort order<input className="admin-input" type="number" value={draft.sort_order} onChange={e=>patch({sort_order:Number(e.target.value)})}/></label>
 {(["motion_enabled","shadow_enabled","border_enabled","is_secret","is_active","is_archived","counts_for_completion"] as const).map(k=><label className="club-check" key={k}><input type="checkbox" checked={draft[k]} onChange={e=>patch({[k]:e.target.checked})}/>{k.replaceAll("_"," ")}</label>)}
 <h2>Card media</h2>{(["background","sound","svg"] as const).map(kind=><div className="club-media-upload" key={kind}><label>{kind==="svg"?"SVG layer":kind==="sound"?"Card sound (MP3, WAV, OGG · 5 MB)":"Card background (PNG, JPG, WebP · 5 MB)"}</label><UploadButtonGroup actionLabel={uploading?"Uploading…":kind==="svg"?"Upload SVG layer":kind==="sound"?(draft.sound_url?"Replace sound":"Upload sound"):(draft.background_url?"Replace background":"Upload background")} countLabel={uploading?"Uploading file…":kind==="svg"?`${draft.layers.filter(layer=>layer.kind==="svg").length} SVG layers`:draft[kind==="background"?"background_url":"sound_url"]?"1 file attached":"Choose file"} accept={kind==="svg"?".svg":kind==="sound"?".mp3,.wav,.ogg":".png,.jpg,.jpeg,.webp"} disabled={uploading||busy||(kind==="svg"&&draft.layers.length>=30)} multiple={kind==="svg"} onFile={file=>uploadFile(file,kind)} onFiles={kind==="svg"?files=>uploadFiles(files,"svg"):undefined}/>{kind!=="svg"&&draft[kind==="background"?"background_url":"sound_url"]&&<Button type="button" variant="outline" onClick={()=>patch({[kind==="background"?"background_url":"sound_url"]:null})}>Remove {kind}</Button>}</div>)}<h2>SVG layers</h2>{draft.layers.map(l=><fieldset key={l.id} className="club-layer-fields"><legend>{l.kind} layer</legend><label>Kind<select value={l.kind} onChange={e=>layer(l.id,{kind:e.target.value as CardLayer["kind"]})}>{["text","star","circle","bolt","heart","diamond","burst","flower","smile","squiggle","ghost","ticket","svg"].map(v=><option key={v}>{v}</option>)}</select></label><label>Text<input value={l.text} onChange={e=>layer(l.id,{text:e.target.value})}/></label>{(["x","y","size","rotation","scale","opacity"] as const).map(k=><label key={k}>{k}{k==="scale"||k==="opacity"?<input type="number" min={k==="scale"?0.1:0.05} max={k==="scale"?4:1} step={k==="scale"?0.1:0.05} value={l[k]??1} onChange={e=>layer(l.id,{[k]:Number(e.target.value)})}/>:<input type="number" min={k==="x"?0:k==="y"?0:k==="size"?4:-180} max={k==="x"?300:k==="y"?380:k==="size"?140:180} value={l[k]} onChange={e=>layer(l.id,{[k]:Number(e.target.value)})}/>}</label>)}<label>Tone<select value={l.tone} onChange={e=>layer(l.id,{tone:e.target.value as CardLayer["tone"]})}>{["ink","paper","red","yellow","mint"].map(v=><option key={v}>{v}</option>)}</select></label><label>Animation<select value={l.motion} onChange={e=>layer(l.id,{motion:e.target.value as CardLayer["motion"]})}>{motions.map(v=><option key={v} value={v}>{v.charAt(0).toUpperCase()+v.slice(1)}</option>)}</select></label>{(["speed","intensity"] as const).map(k=><label key={k}>{k}<input type="range" min={k==="speed"?0.25:0} max={k==="speed"?4:2} step="0.05" value={l[k]} onChange={e=>layer(l.id,{[k]:Number(e.target.value)})}/><output>{l[k].toFixed(2)}</output></label>)}<label className="club-check"><input type="checkbox" checked={l.visible} onChange={e=>layer(l.id,{visible:e.target.checked})}/>Visible</label><Button type="button" variant="outline" onClick={()=>patch({layers:draft.layers.filter(v=>v.id!==l.id)})}>Remove layer</Button></fieldset>)}
 <div className="club-layer-add"><label>Add illustration<select value={newLayerKind} onChange={e=>setNewLayerKind(e.target.value as CardLayer["kind"])}>{["star","text","circle","bolt","heart","diamond","burst","flower","smile","squiggle","ghost","ticket"].map(v=><option key={v}>{v}</option>)}</select></label><Button type="button" variant="outline" onClick={()=>patch({layers:[...draft.layers,{id:crypto.randomUUID(),kind:newLayerKind,text:newLayerKind==="text"?"NEW TEXT":"",x:150,y:120,size:36,rotation:0,scale:1,opacity:1,tone:"yellow",motion:"pulse",speed:1,intensity:1,visible:true}]})}>+ Add layer</Button><Button type="button" variant="outline" disabled={draft.layers.length===0} onClick={()=>{const last=draft.layers.at(-1);if(last)patch({layers:[...draft.layers,{...last,id:crypto.randomUUID(),x:Math.min(280,last.x+14),y:Math.min(360,last.y+14)}]});}}>Duplicate last layer</Button></div><Button type="submit" disabled={busy||uploading}>{busy?"Saving…":"Save card"}</Button><Button type="button" variant="outline" onClick={()=>setDraft(fresh())}>New card</Button></form><aside className={`club-live-preview ${canvasMode?"club-live-preview-canvas":""}`}><div className="club-canvas-toolbar"><strong>{canvasMode?"CARD CANVAS":"LIVE PREVIEW"}</strong><Button type="button" variant={canvasMode?"default":"outline"} onClick={()=>setCanvasMode(v=>!v)}>{canvasMode?"Finish canvas edit":"Edit in canvas"}</Button></div><p className="club-canvas-hint">{canvasMode?"Drag an SVG or illustration layer to reposition it. Select a layer, then use its controls in the editor to change size, rotation, color, and animation.":"Preview your card artwork as it will appear in the collection."}</p><CardArt card={draft} canvasEditing={canvasMode} selectedLayerId={selectedLayerId} onLayerSelect={setSelectedLayerId} onLayerMove={(id,x,y)=>layer(id,{x:Math.round(x),y:Math.round(y)})}/><span>PREVIEW / {draft.design}</span></aside></div>
 <section className="club-collection-bento"><div className="club-collection-heading"><div><span className="club-bento-kicker">THE ARCHIVE</span><h2>Card collection</h2><p>Every saved collectible, ready to reopen and refine.</p></div><span className="club-collection-count">{data?.cards.length ?? 0} CARDS</span></div><div className="club-grid">{data?.cards.map(c=><article key={c.id}><CardArt card={{...c,design:c.design as CardDraft["design"],rarity:c.rarity as CardDraft["rarity"]}}/><Button variant="outline" onClick={()=>setDraft({...c,design:c.design as CardDraft["design"],rarity:c.rarity as CardDraft["rarity"],layers:parseLayers(c.layers)})}>Edit {c.title}</Button></article>)}</div></section></div>;
}
