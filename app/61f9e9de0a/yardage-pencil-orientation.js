// Lightweight pencil orientation, not a map. Draws a tee-to-green concept for
// every hole, without claiming unknown bearings, bends, hazards or carries.
export function pencilOrientation({holeNumber=1,par=null,yards=null}={}){
 const safeHole=Number.isInteger(holeNumber)&&holeNumber>=1&&holeNumber<=18?holeNumber:1;
 const safePar=Number.isInteger(par)&&par>=3&&par<=6?par:null;
 const safeYards=Number.isInteger(yards)&&yards>=50&&yards<=900?yards:null;
 const short=safePar===3;
 const start=short?134:194,top=short?72:40;
 const corridor=short?'M150 158 C146 126 148 104 150 82':'M150 201 C146 159 154 116 150 60';
 return Object.freeze({
  hole:safeHole,par:safePar,yards:safeYards,
  caption:'Pencil orientation only · hole direction and hazards unverified',
  svg:`<svg viewBox="0 0 300 240" role="img" aria-label="Generic pencil tee-to-green orientation; actual hole direction, shape, and hazards are unknown" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="#64705b" stroke-linecap="round">
   <path d="${corridor}" stroke-width="3.2" stroke-dasharray="6 6"/>
   <path d="M108 ${start} Q92 126 112 ${top+8} M192 ${start} Q208 126 188 ${top+8}" stroke-width="1.2" stroke-dasharray="3 7" opacity=".5"/>
   <path d="M128 201 L172 201 M139 207 L161 207" stroke-width="2"/>
   <ellipse cx="150" cy="${top+10}" rx="20" ry="13" stroke-width="2.8"/>
   <path d="M150 ${top+9} V${top-17} l14 5 -14 5" stroke-width="2"/>
  </g>
  <g fill="#52624d" font-family="Georgia,serif" font-style="italic" text-anchor="middle">
   <text x="150" y="226" font-size="13">tee</text>
   <text x="150" y="20" font-size="13">green ?</text>
   <text x="68" y="120" font-size="13">?</text>
   <text x="232" y="120" font-size="13">?</text>
  </g>
 </svg>`
 });
}
