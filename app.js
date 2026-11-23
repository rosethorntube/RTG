(() => {
  'use strict';
  const guide=window.ROSE_GUIDE;
  const page=document.getElementById('page');
  const nav=document.getElementById('nav');
  const section=id=>guide.sections.find(s=>s.id===id);
  const firstTable=id=>section(id).blocks.find(b=>b.type==='table');
  const roster=firstTable('roster').rows.slice(1).map(([,name,toon,professions,notes])=>({name,toon,professions,notes}));
  const milestoneData=firstTable('milestones');
  const milestones=milestoneData.rows.slice(1).map(([checkpoint,note],index)=>{
    const i=index+1, character=roster.find(r=>checkpoint.startsWith(r.name+' '));
    const level=character?Number(checkpoint.split(' ')[1]):null;
    const label=character?character.name+' · Level '+level:note;
    const id=(character?character.name+'-'+level:note).toLowerCase().replace(/\s+/g,'-');
    const lp=(milestoneData.legacy?.[i+',0']||[]).length+(milestoneData.legacy?.[i+',1']||[]).length;
    return {label,character:character?.name,level,id,lp,note,links:milestoneData.cellLinks?.[i+',1']||[]};
  });
  const tabs=[
    ['milestones','Milestones'],['dungeons','Dungeons'],['professions','Professions'],
    ['fishing','Fishing & Cooking'],['guide','Guide library'],['advisor','Addon']
  ];
  const art={
    milestones:'M4 20V4m0 1c5-3 8 3 15 0v9c-7 3-10-3-15 0',
    dungeons:'M3 21V9l9-6 9 6v12h-6v-6a3 3 0 0 0-6 0v6z',
    professions:'M14 5l3-3a6 6 0 0 0-7 8L3 17a2 2 0 0 0 4 4l7-8a6 6 0 0 0 7-8l-3 3z',
    fishing:'M3 12c4-5 8-7 14-3l4-3v12l-4-3c-6 4-10 2-14-3z M8 11h.1',
    guide:'M12 6v15M12 6C8 3 5 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-6-1-10 2z',
    advisor:'M12 2l8 4v7c0 4-4 7-8 9-4-2-8-5-8-9V6z M8 12l3 3 5-6',
    roster:'M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2 M9 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7 M16 4a3 3 0 0 1 0 6m1 3a5 5 0 0 1 4 5v2',
    download:'M12 3v12m-5-5 5 5 5-5 M4 16v4h16v-4'
  };
  const storage='rosethorn.fieldguide.v1.';
  function read(key,fallback) {
    try {return JSON.parse(localStorage.getItem(storage+key)??'null')??fallback;}catch{return fallback;}
  }
  function save(key,value) {try{localStorage.setItem(storage+key,JSON.stringify(value));}catch{}}
  const selected=read('character','');
  let character=roster.some(r=>r.name===selected)?selected:'';
  let stepFilter=read('filter','all');
  if(!['all','remaining','complete'].includes(stepFilter))stepFilter='all';
  const recorded=read('complete',[]);
  let complete=new Set(Array.isArray(recorded)?recorded:[]);
  const el=(tag,css,text)=>{
    const n=document.createElement(tag);
    if(css)n.className=css;
    if(text!==undefined)n.textContent=text;
    return n;
  };
  function icon(name) {
    const wrap=el('span','app-icon');
    wrap.setAttribute('aria-hidden','true');
    wrap.innerHTML='<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="'+art[name]+'"></path></svg>';
    return wrap;
  }
  function portrait(name) {
    const img=el('img');img.setAttribute('src','class-'+name.toLowerCase()+'.webp');img.setAttribute('alt','');return img;
  }
  function option(value,label) {
    const opt=el('option','',label);opt.value=value;return opt;
  }
  function anchor(url,label,css,external=false){
    const a=el('a',css,label);a.href=url;
    if(external){a.target='_blank';a.rel='noopener noreferrer';}
    return a;
  }
  function linkedText(n,text,links) {
    let cursor=0;
    for(const link of links) {
      const place=text.indexOf(link.text,cursor);
      if(place<0||!/^https?:\/\//i.test(link.url))continue;
      n.append(text.slice(cursor,place),anchor(link.url,link.text,'',true));
      cursor=place+link.text.length;
    }
    n.append(text.slice(cursor));
  }
  function currentTab() {
    const raw=location.hash.slice(1);
    return tabs.some(([id])=>id===raw)?raw:'milestones';
  }
  function switchTo(id) {if(currentTab()!==id)location.hash=id;}
  const extra=el('link');extra.setAttribute('rel','stylesheet');extra.setAttribute('href','app-extra.css');document.head.append(extra);
  for(const id of ['original','foot-source'])document.getElementById(id).href=guide.sourceUrl;
  document.getElementById('dcount').textContent=String(firstTable('dungeons').rows.length-1);
  const navLinks=new Map();
  for(const [id,label] of tabs){
    const link=anchor('#'+id,'','tab');link.append(icon(id),el('span','',label));
    nav.append(link);navLinks.set(id,link);
  }
  const navSmall=el('label','app-mobile-nav');
  const navSelect=el('select','pselect');
  navSmall.append(el('span','','Guide section'),navSelect);
  for(const [id,label] of tabs) navSelect.append(option(id,label));
  navSelect.addEventListener('change',()=>switchTo(navSelect.value));nav.append(navSmall);
  function changeCharacter(name){
    character=name;save('character',name);render();
  }
  function rosterPanel() {
    const aside=el('aside','roster');aside.setAttribute('aria-label','Character roster');
    const heading=el('div','roster-head');heading.append(icon('roster'),el('h2','','Your roster'));
    const list=el('div','rlist');
    function row(name,toon) {
      const button=el('button','rbutton'+(character===name?' selected':''));button.type='button';
      button.setAttribute('aria-pressed',String(character===name));
      if(name)button.append(portrait(name));else{const badge=el('span','all-icon');badge.append(icon('roster'));button.append(badge);}
      button.append(el('span','',name||'All characters'),el('span','toon'+(name?'':' total'),toon));
      button.addEventListener('click',()=>changeCharacter(name));list.append(button);
    }
    row('','9');for(const r of roster)row(r.name,r.toon);
    aside.append(heading,list);return aside;
  }
  function rosterSelect() {
    const label=el('label','rlabel-mobile');label.append(el('span','','Character'));
    const select=el('select','pselect');
    select.append(option('','All characters'));
    for(const r of roster)select.append(option(r.name,r.name+' · '+r.toon));
    select.value=character;select.addEventListener('change',()=>changeCharacter(select.value));label.append(select);return label;
  }
  function stepNote(step) {
    if(!step.character)return 'Account-wide dungeon milestone.';
    if(step.id==='priest-60')return 'Reach level 45 on the way to 60.';
    if(step.id==='priest-10')return 'Skinning + Mining. Send ore to Warrior, leather to Druid and BoE gear to Mage.';
    if(step.id==='mage-5')return 'Train Enchanting and Tailoring, then head to town to disenchant gear and make bags.';
    if(step.id==='warrior-10')return 'Use Mining and Blacksmithing for starter gear. Save spare ore for Engineering.';
    if(step.id==='warrior-25')return 'Keep Mining and switch to Engineering. Reach 150 Engineering.';
    if(step.level===60 && /^\d/.test(step.note)) {
      const bits=step.note.split(',').map(t=>t.trim().replace(/\.$/,''));
      const levels=bits.filter(t=>/^\d+$/.test(t));
      const crafts=bits.filter(t=>!/^\d+$/.test(t));
      return 'Pass level'+(levels.length>1?'s ':' ')+levels.join(' and ')+'.'+(crafts.length?' Reach '+crafts.join(' and ')+'.':'');
    }
    return step.note;
  }
  function milestonesView(host) {
    const tools=el('div','mainhead'), titlebox=el('div');
    const r=roster.find(n=>n.name===character);
    titlebox.append(el('p','eyeline',r?'Rosethorn '+r.toon:'Account progression'),el('h2','title',r?r.name+' milestones':'Milestone tracker'));
    tools.append(titlebox);
    const filter=el('select','pselect');filter.setAttribute('aria-label','Milestone status');
    for(const [id,name] of [['all','All steps'],['remaining','Remaining'],['complete','Completed']])filter.append(option(id,name));
    filter.value=stepFilter;tools.append(filter);
    const intro=el('p','lead');
    if(r){
      intro.append(r.professions+' · ',anchor(guide.armory[r.toon.toLowerCase()],'View armoury ↗','arm',true));
    }else intro.textContent='Follow the checkpoints in order. Tick each one as you go.';
    const tally=el('div','progressbox'), list=el('ol','steps');
    const progress=el('progress');progress.setAttribute('aria-label','Milestones completed');
    const count=el('b'),pct=el('span');tally.append(count,progress,pct);
    host.append(tools,intro,tally,list);
    const relevant=milestones.filter(step=>!character||step.character===character);
    function draw() {
      list.replaceChildren();
      const done=relevant.filter(step=>complete.has(step.id)).length;
      progress.max=relevant.length;progress.value=done;count.textContent=done+' of '+relevant.length+' complete';
      pct.textContent=Math.round(done/relevant.length*100)+'%';
      const next=relevant.find(step=>!complete.has(step.id));
      let shown=0;
      for(const step of relevant){
        const checked=complete.has(step.id);
        if((stepFilter==='remaining'&&checked)||(stepFilter==='complete'&&!checked))continue;
        const row=el('li','step'+(checked?' done':'')+(step===next?' next':''));
        const toggle=el('label','tick'), check=el('input');check.type='checkbox';check.checked=checked;
        check.id='ms-'+step.id;check.setAttribute('aria-label','Mark '+step.label+' complete');
        const visual=el('i','','✓');visual.setAttribute('aria-hidden','true');
        toggle.append(check,visual);row.append(toggle);
        if(step.character)row.append(portrait(step.character));else{const badge=el('span','sicon');badge.append(icon('dungeons'));row.append(badge);}
        const body=el('div','steptxt');body.append(el('h3','',step.label));
        const note=el('p');linkedText(note,stepNote(step),step.links);body.append(note);row.append(body);
        if(step.lp){const badge=el('span','lp','+'+step.lp+' LP');badge.title=step.lp+' Legacy Point'+(step.lp>1?'s':'')+' marked in the published guide';row.append(badge);}
        list.append(row);shown++;
        check.addEventListener('change',()=>{
          if(check.checked)complete.add(step.id);else complete.delete(step.id);
          save('complete',[...complete]);draw();
          const target=document.getElementById('ms-'+step.id)||list.querySelector('input')||filter;target.focus({preventScroll:true});
        });
      }
      if(!shown)list.append(el('li','empty',stepFilter==='complete'?'No completed milestones yet.':'All milestones in this view are complete.'));
    }
    filter.addEventListener('change',()=>{stepFilter=filter.value;save('filter',stepFilter);draw();});
    draw();
  }
  function advisorView(host) {
    host.className='advisor';
    const intro=el('div','advintro'), left=el('div');
    left.append(el('p','eyeline','WoW Forever addon'),el('h2','title','Rosethorn Advisor'),
      el('p','lead','Your profession advisor for the whole roster. See which character should train next, who can use the materials in your bags, and which crafting milestone is within reach.'));
    const download=anchor('RosethornAdvisor.zip','','cta');download.setAttribute('download','RosethornAdvisor.zip');
    download.append(icon('download'),el('span','','Download addon'));intro.append(left,download);host.append(intro);
    const cards=el('div','advgrid');
    for(const [name,copy] of [
      ['What should I do next?','Now looks across your characters for a nearby crafting milestone, a training cap or materials another character can use.'],
      ['Your twelve professions','Browse skills by profession or character. See a suggested recipe and shopping estimate for each crafting band. Mark a profession you intend to learn and get a reminder on this roster.'],
      ['Fish while you wait','When you cast, see the local Fishing target. Compare the value of your catch per cast and per hour, or find a spot that supplies recipes your cook can still learn from.']
    ]){
      const card=el('section','advcard');card.append(el('h3','',name),el('p','',copy));cards.append(card);
    }
    host.append(cards);
    const d=el('details','advdet');d.open=true;d.append(el('summary','','Install the addon'));
    const ol=el('ol');
    for(const text of ['Download and unzip RosethornAdvisor.zip.','Copy the RosethornAdvisor folder into your WoW Forever installation’s Interface/AddOns folder. The .toc file should sit directly inside RosethornAdvisor.','Restart WoW or reload the interface, enable Rosethorn Advisor in AddOns, then type /rta.'])ol.append(el('li','',text));
    d.append(ol);host.append(d);
    const use=el('details','advdet');
    use.append(el('summary','','Using the advisor in game'),
      el('p','','Open /rta for the highest-priority actions or /rta professions to filter all twelve professions. Alts shows per-character ranks and when materials were last seen in bags or the bank. Log into each alt once and open its bank to include those holdings.'),
      el('p','','Use Route to choose Camp Mojache, Boat crossing or Leaving the Barrens. Read the coordinates or use Pin on supported maps. Both work with the base game. Automatic can also follow a compatible active RestedXP waypoint.'));
    host.append(use);
    const fishing=el('details','advdet');
    fishing.append(el('summary','','Fishing sessions and auction estimates'),
      el('p','','Search at an auction house to record listings, enter your own unit prices, or use cached Auctionator quotes. Each quote shows its market and time. Away from the AH, the faction market is the default. Use /rtaprice market neutral to switch.'),
      el('p','','After five minutes, the session shows gross auction value per hour for priced raw catches. It flags missing prices and unusually valuable catches. For known recipes, compare raw and cooked proceeds after extra ingredients and the auction cut where known (5% faction, 15% neutral). Estimates assume a sale and exclude relisting and lure costs.'),
      el('p','','To rank fishing spots, record at least 15 minutes and 10 items at each. All catches need quotes from the same market no more than seven days old. Value per cast also needs 20 observed casts, including empty casts. A venue-unverified Auctionator quote can give a rough session estimate. Cooking comparisons use recipes available at your current skill and show the cost of buying ingredients instead.'),
      el('p','','Type /rtafish to see the session. Use /rtafish off or /rtafish on for the pop-up, and /rtafish reset to start fresh.'));
    const thresholds=el('p');thresholds.append('For zero escapes in open water, aim for 75 Fishing at Ratchet, 225 at Booty Bay and 300 at Camp Mojache. Pole and lure bonuses count. ',anchor('https://www.wowhead.com/forever/guide/professions/fishing/overview-leveling','Fishing requirements by zone ↗','arm',true));
    fishing.append(thresholds);host.append(fishing);
    const levelling=el('details','advdet');levelling.append(el('summary','','When to level professions'));
    const advice=el('ul');
    const lines=[
      ['Priest → Warrior','Send the Priest’s ore to the Warrior at level 10 for starter Blacksmithing gear. By Warrior 25, switch to Engineering and aim for 150.'],
      ['Druid','Bank the Priest’s skins for Leatherworking 150 at Druid 10 and 225 at 25. The advisor compares the 150, 225 and 300 thresholds across your observed roster.'],
      ['Mage','Send cloth and spare BoE greens to the level 5 bank Mage for bags and disenchanting. Aim for Tailoring and Enchanting 150 at 10, then 225 at 25.'],
      ['Warlock','Bank herbs for Alchemy 150 at Warlock 10. Keep later herbs for the return journey to 60.'],
      ['Leaving the Barrens','If your miner is at 115–124, use the route reminder to mine Tin or Silver on the way out. Iron Deposits open at Mining 125.']
    ];
    for(const [name,copy] of lines){const li=el('li');li.append(el('strong','',name+'. '),copy);advice.append(li);}
    levelling.append(el('p','','Examples from the published roster plan. The in-game recommendations use the skills and stock you actually have.'),advice);
    host.append(levelling);
  }
  function render() {
    const id=currentTab();navSelect.value=id;
    for(const [key,link] of navLinks){
      link.classList.toggle('active',id===key);
      if(id===key)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
    }
    page.replaceChildren();
    const layout=el('div',id==='advisor'?'':'dash');
    const pane=el('div','app-pane');
    if(id!=='advisor'){layout.append(rosterPanel());pane.append(rosterSelect());}
    layout.append(pane);page.append(layout);
    const content=el('div');pane.append(content);
    if(id==='milestones')milestonesView(content);
    else if(id==='advisor')advisorView(content);
    else window.FieldReference.render(content,id,guide,character);
  }
  window.addEventListener('hashchange',render);
  window.addEventListener('storage',event=>{
    if(event.key===storage+'complete'){
      const flags=read('complete',[]);complete=new Set(Array.isArray(flags)?flags:[]);render();
    }
  });
  const sourceDate=new Date(guide.retrieved+'T12:00:00Z');
  if(!Number.isNaN(sourceDate.getTime())){
    const text=sourceDate.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
    document.querySelector('.foot').append(el('span','source-date','Guide snapshot · '+text));
  }
  render();
})();
