import { describe, it, expect } from "vitest";
import { sanitizeCardSvg, uploadLimits } from "./card-upload";
import { motions, parseLayers } from "./club";
describe("card asset safety and motion",()=>{
 it("strips executable elements, handlers and external references",()=>{
  const result=sanitizeCardSvg('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script><foreignObject/><image href="https://evil.test/a"/><path d="M0 0L10 10" onclick="alert(1)" fill="url(https://evil.test)"/></svg>');
  expect(result).not.toMatch(/script|foreignObject|onload|onclick|evil\.test|<image/);
  expect(result).toContain('d="M0 0L10 10"');
 });
 it("offers exactly the requested twelve choices",()=>expect(motions).toEqual(["none","float","drift","pulse","wiggle","swing","flip","orbit","shake","pop","wave","glitch"]));
 it("keeps legacy motion compatible and retains saved controls",()=>{
  const layers=parseLayers([{id:"one",kind:"svg",asset_url:"https://example.test/layer.svg",text:"",x:10,y:20,size:40,rotation:12,scale:2,opacity:0.5,tone:"red",motion:"bob",speed:2,intensity:0.5,visible:true}]);
  expect(layers[0]).toMatchObject({motion:"float",speed:2,intensity:0.5,rotation:12,asset_url:"https://example.test/layer.svg"});
 });
 it("enforces upload limits",()=>expect(uploadLimits).toEqual({background:5242880,sound:5242880,svg:524288}));
});