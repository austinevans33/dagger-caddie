/* Visual-only Ghost ball tracer. Geometry is illustrative, not GPS coordinates.
   A rendering helper; no live score, Firebase, or betting writes. */
export function drawGhostTracer(svg,shots,{animateLast=true,start={x:0.5,y:0.91}}={}){
  const target=svg.querySelector('#traces');
  if(!target)return;
  target.replaceChildren();
  const ns='http://www.w3.org/2000/svg';
  const element=(name,attrs={})=>{const node=document.createElementNS(ns,name);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));return node};
  const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let previous=start;
  shots.forEach((shot,index)=>{
    const sx=previous.x*320,sy=previous.y*430,ex=shot.x*320,ey=shot.y*430;
    const midX=(sx+ex)/2,midY=(sy+ey)/2;
    const arc=Math.min(60,Math.abs(ey-sy)*.20+14);
    const controlX=midX+(index%2===0?12:-12);
    const controlY=midY-arc;
    const putt=shot.club==='Putter';
    const d=putt?`M ${sx.toFixed(1)} ${sy.toFixed(1)} L ${ex.toFixed(1)} ${ey.toFixed(1)}`:`M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${controlX.toFixed(1)} ${controlY.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
    const glow=element('path',{d,fill:'none',stroke:'#264c36','stroke-width':9,'stroke-linecap':'round',opacity:.33});
    const tracer=element('path',{d,fill:'none',stroke:putt?'#fff6d8':'#f6df8b','stroke-width':putt?2:4,'stroke-linecap':'round','pathLength':100,class:'dcc-ghost-tracer'});
    target.append(glow,tracer);
    if(animateLast&&index===shots.length-1&&!reducedMotion){
      tracer.setAttribute('stroke-dasharray','100');
      tracer.setAttribute('stroke-dashoffset','100');
      tracer.style.animation='dcc-trace-draw 1.1s cubic-bezier(.12,.7,.24,1) forwards';
      const ball=element('circle',{r:7,fill:'#fffef4',stroke:'#d1a958','stroke-width':2,class:'dcc-ghost-flight-ball'});
      const motion=element('animateMotion',{path:d,dur:'1.1s',fill:'freeze',calcMode:'paced'});
      ball.append(motion);target.append(ball);
      motion.beginElement?.();
    }
    previous=shot;
  });
}
