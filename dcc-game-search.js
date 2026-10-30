/* R118: filter actual playable game buttons without cloning, rebuilding or removing listeners. */
(function(){'use strict';
  function install(){
    const input=document.getElementById('dccGameSearch');
    const grid=document.getElementById('dccGameChoices');
    const clear=document.getElementById('dccGameSearchClear');
    const summary=document.getElementById('dccGameSearchSummary');
    const empty=document.getElementById('dccGameSearchEmpty');
    if(!input||!grid||!clear||!summary||!empty)return;
    const cards=Array.from(grid.querySelectorAll('button.game-pick'));
    if(!cards.length)return;
    function update(){
      const query=input.value.trim().toLocaleLowerCase();let visible=0;
      cards.forEach(card=>{const matches=card.textContent.toLocaleLowerCase().includes(query)||String(card.dataset.game||'').toLocaleLowerCase().includes(query);card.hidden=!matches;if(matches)visible++;});
      clear.hidden=!query;empty.hidden=visible!==0;
      summary.textContent=visible+' of '+cards.length+' available games shown';
    }
    input.addEventListener('input',update);
    clear.addEventListener('click',()=>{input.value='';update();input.focus();});
    update();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

// Independent House Ghost recovery hook: runs even if the AI Caddy module fails.
(function(){
 function installGhostRecovery(){
  import('./ghost-partial-archive.js').then(({installPartialGhostArchive})=>{
   installPartialGhostArchive();
  }).catch(error=>{
   console.warn('House Ghost recovery unavailable:',error);
   const message=document.getElementById('dccGhostMessage');
   if(message)message.textContent='House Ghost recovery could not load. Your scores are unchanged.';
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installGhostRecovery,{once:true});
 else installGhostRecovery();
})();
