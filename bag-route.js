(() => {
  'use strict';

  const barrens = 'the Burned-Out Remains by the ruined tower south of Camp Taurajo (46.4, 73.9)';
  const westfall = 'the Burned-Out Remains beside the wrecked cart at Alexston Farmstead (37.4, 50.6)';

  function stops(alliance) {
    const first = alliance ? westfall : barrens;
    const second = alliance ? barrens : westfall;
    return [
      {id:'start', place:alliance?'Westfall':'The Barrens',
        when:alliance?'On your Deadmines trip':'Before you leave for Deadmines',
        actions:['From level 14, click '+first+' to start …and that note you found.'+
          (alliance?'':' Your Wailing Caverns visit is a good time to pick this up.')]},
      {id:'plank', place:alliance?'The Barrens':'Westfall',
        when:alliance?'On your Wailing Caverns trip':'On your Deadmines trip',
        actions:['Hand in the note at '+second+'. Take Stepping Stones from the nearby Nailed Plank.']},
      {id:'stonetalon', place:'Stonetalon Mountains', when:'Before Gnomeregan',
        actions:['Take the uphill path at 50.9, 52.3. At the abandoned camp (40.6, 52.4), click Pocket Litter to finish Stepping Stones and accept Scramble.',
          'Go north to the Mound of Dirt (39.6, 49.8). Turn in Scramble and take Wet Job for the dam.']},
      {id:'dam', place:'Loch Modan', when:'After Gnomeregan',
        actions:['Leave Gnomeregan into Dun Morogh and continue east to Loch Modan before you hearth. At Stonewrought Dam (49.4, 12.9), click the Eagle Figurine on the Wetlands-facing ledge. Turn in Wet Job and take Eagle’s Fist.']},
      {id:'wall', place:'Hillsbrad Foothills', when:'On your way to Arathi',
        actions:['Climb the cart on the Hillsbrad side of Thoradin’s Wall (87.3, 49.6). Turn in Eagle’s Fist at the Messenger Bag and accept This Must Be The Place. Click the Hastily Rolled-Up Satchel just below to collect your sleeping bag.']}
    ];
  }

  function node(tag, className, text) {
    const n=document.createElement(tag);
    if(className)n.className=className;
    if(text)n.textContent=text;
    return n;
  }

  function marked(key) {
    try {
      const ids=JSON.parse(localStorage.getItem(key)||'[]');
      return new Set(Array.isArray(ids)?ids:[]);
    } catch { return new Set(); }
  }

  function panel(character) {
    const faction=window.GuideFaction;
    const route=stops(faction.alliance);
    // Reuse the current checklist namespace so Setup's Clear and Undo include
    // the side route alongside the character's other checks.
    const key=faction.storageKey('rosethorn.prequests.v1.'+character);
    const aside=node('aside','bag-route');
    aside.setAttribute('aria-label','Cozy Sleeping Bag route');
    const box=node('details','bag-panel');
    box.open=true;
    const top=node('summary','bag-summary');
    const title=node('h2','','Cozy Sleeping Bag');
    const status=node('span','bag-status');
    top.append(title,status);
    const body=node('div','bag-body');
    body.append(node('p','bag-intro','An optional outdoor quest chain for up to 3% bonus XP. Pick up each stage on a journey you’re already making.'));
    const list=node('ol','bag-stops');
    const inputs=[], directionsByStop=[];
    const initial=marked(key);
    function refresh() {
      const count=inputs.reduce((n,check)=>n+Number(check.checked),0);
      const pending=inputs.findIndex(check=>!check.checked);
      status.textContent=pending<0?'5/5 stops · Route complete':count+'/5 stops · '+route[pending].when;
    }
    for(const stop of route) {
      const item=node('li','bag-stop');
      const line=node('div','bag-step-line');
      const check=node('input','bag-check');
      const id='sleeping-bag/'+stop.id;
      check.type='checkbox';
      check.checked=initial.has(id);
      check.setAttribute('aria-label','Complete sleeping bag stop in '+stop.place+(character?' for '+character:''));
      const directions=node('details','bag-directions');
      const heading=node('summary','bag-step-title');
      heading.append(node('strong','',stop.place),node('span','bag-when',stop.when));
      directions.append(heading);
      for(const action of stop.actions)directions.append(node('p','bag-instruction',action));
      check.addEventListener('change',()=>{
        const saved=marked(key);
        if(check.checked)saved.add(id);else saved.delete(id);
        try{localStorage.setItem(key,JSON.stringify([...saved]));}catch{}
        if(check.checked && directions.open) {
          directions.open=false;
          const pending=inputs.findIndex(input=>!input.checked);
          if(pending>=0)directionsByStop[pending].open=true;
        }
        refresh();
      });
      inputs.push(check);
      directionsByStop.push(directions);
      line.append(check,directions);
      item.append(line);
      list.append(item);
    }
    // Reveal directions for the next unfinished stop; other timings stay visible.
    const next=inputs.findIndex(check=>!check.checked);
    if(next>=0)directionsByStop[next].open=true;
    refresh();
    body.append(list);
    box.append(top,body);
    aside.append(box);
    return aside;
  }

  window.SleepingBagRoute={panel};
})();
