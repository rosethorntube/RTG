(() => {
  'use strict';
  const guide=window.ROSE_GUIDE;
  const page=document.getElementById('page');
  const nav=document.getElementById('nav');
  const section=id=>guide.sections.find(s=>s.id===id);
  const firstTable=id=>section(id).blocks.find(b=>b.type==='table');
  const tabs=[
    ['setup','Setup'],['milestones','Milestones'],['dungeons','Dungeons'],['professions','Professions'],
    ['fishing','Fishing & Cooking'],['guide','Guide library'],['advisor','Addon']
  ];
  const art={
    setup:"M3 7h18M3 17h18 M8 4v6m8 4v6",
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
  let character=window.PlannerUI.plan.order.includes(selected)?selected:'';
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
  function currentTab() {
    const raw=location.hash.slice(1);
    if(raw==='addon')return 'advisor';
    return tabs.some(([id])=>id===raw)?raw:window.PlannerUI.defaultTab();
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
    function row(name,detail) {
      const button=el('button','rbutton'+(character===name?' selected':''));button.type='button';
      button.setAttribute('aria-pressed',String(character===name));
      if(name)button.append(portrait(name));else{const badge=el('span','all-icon');badge.append(icon('roster'));button.append(badge);}
      button.append(el('span','',name||'All characters'),el('span','toon'+(name?'':' total'),detail));
      button.addEventListener('click',()=>changeCharacter(name));list.append(button);
    }
    const names=window.PlannerUI.plan.order;row('',String(names.length));for(const name of names)row(name,'');
    aside.append(heading,list);return aside;
  }
  function rosterSelect() {
    const label=el('label','rlabel-mobile');label.append(el('span','','Character'));
    const select=el('select','pselect');
    select.append(option('','All characters'));
    for(const c of window.PlannerUI.plan.order)select.append(option(c,c));
    select.value=character;select.addEventListener('change',()=>changeCharacter(select.value));label.append(select);return label;
  }
  function advisorView(host) {
    host.className='advisor';
    const intro=el('div','advintro'), left=el('div');
    left.append(el('p','eyeline','WoW Forever · Horde'),el('h2','title','Rosethorn Advisor'),
      el('p','lead','Dungeon pickups, profession milestones and fishing advice for the character you’re playing and the alts you’re levelling. Works on its own.'));
    const download=anchor('RosethornAdvisor.zip?v=0.3.3','','cta');
    download.setAttribute('download','RosethornAdvisor.zip');
    download.append(icon('download'),el('span','','Download addon'));
    intro.append(left,download);
    host.append(intro);

    const cards=el('div','advgrid');
    const dungeon=el('section','advcard');
    dungeon.style.gridColumn='1 / -1';
    dungeon.append(el('h3','','Never miss another dungeon prequest'),
      el('p','','The icon lights up anywhere in your zone when a tracked dungeon pickup becomes available. Hit level 30 in Undercity’s Trade Quarter? You’ll see Going, Going, Guano! from Faranell in the Apothecarium.'));
    cards.append(dungeon);
    const features=[
      ['Find the quest giver','Tick Mark on map for as many givers as you like. Choose Navigate for an arrow to one. Quests from the same NPC share a pin until you’ve picked them all up.'],
      ['Spot your next crafting Legacy Point','See which alt is close to 150, 225 or 300 in a craft. Open Professions for the next recipe and an estimate of the materials you’ll need.'],
      ['Know which alt needs your materials','Before you visit the mailbox, see who can use your ore, leather or cloth. Check each alt’s last recorded profession ranks, bags and bank.'],
      ['Make a stop while you’re passing','Fish while you wait for the boat at Ratchet or Booty Bay. Leaving the Barrens at Mining 115–124? Get a reminder to mine on the way to 125. Compatible RestedXP routes can trigger these tips.'],
      ['Find the recipe for the fish you just caught','Catch a Raw Rockscale Cod in Booty Bay? The recipe card sends you to Kelsey Yance in the Old Port Authority, bottom deck, on the left as you enter.'],
      ['Decide whether to cook or sell your catch','Compare your fishing spots by auction value per cast or per hour. See when selling fish and buying cheaper Cooking ingredients could give you more skill-ups.']
    ];
    for(const [title,copy] of features){
      const card=el('section','advcard');
      card.append(el('h3','',title),el('p','',copy));
      cards.append(card);
    }
    host.append(cards);

    function details(title, ...children) {
      const box=el('details','advdet');
      box.append(el('summary','',title),...children);
      host.append(box);
    }
    const steps=el('ol');
    for(const line of ['Download and unzip RosethornAdvisor.zip.',
      'Copy the RosethornAdvisor folder into your WoW Forever Interface/AddOns folder.',
      'Enable Rosethorn Advisor at character selection. Left-click its icon for suggestions or type /rtg for settings.']){
      steps.append(el('li','',line));
    }
    details('Install the addon',steps);
    details('Alerts and account-wide settings',
      el('p','','All current suggestions share one scrollable list. The border glows while alerts are unread. Dismiss a pickup for this visit, snooze alerts for ten minutes, or mute a tip across your characters. You can restore muted tips.'),
      el('p','','Choose which categories can open the window or pause them in combat. Pick colours and transparency for the text, background, window border and icon glow. Your layout, alerts, snooze, tabs and auction market carry across alts on this installation.'));
    details('Dungeon coverage and profession tracking',
      el('p','','The catalogue covers 502 Horde and shared quests and prerequisites. Each pickup shows the required level and colour-coded quest level. Accepting a quest clears the pickup, and completing a prerequisite can reveal the next one. There are verified map locations for 402 quests. In a Spelunker dungeon, the addon reminds you to check final-boss credit.'),
      el('p','','Browse all 12 professions, plan a profession for an alt and check training caps. The six primary crafts have recipe routes and shopping estimates. Log into each alt and open its bank to update its stock. Open Cooking to record learned recipes. Check the in-game Legacy panel for points earned elsewhere.'));
    details('Fishing, routes and auction prices',
      el('p','','While you cast at supported spots, see the Fishing skill needed to avoid escapes, including pole and lure bonuses. Get reminders for training books and nearby recipe vendors. Use your location, choose a destination manually or follow a compatible RestedXP arrow.'),
      el('p','','Search for an item at the auction house, enter a price yourself or use optional Auctionator quotes. The session estimates gross auction value per hour after five minutes and flags unpriced catches. Raw-versus-cooked comparisons account for ingredients and the auction cut when known.'),
      el('p','','Spot rankings compare waters you’ve personally fished. Each needs 15 minutes, 10 landed items and complete recent prices for the same market. Value per cast also needs 20 observed casts, including empty ones.'));
  }
  function render() {
    const id=currentTab();navSelect.value=id;
    for(const [key,link] of navLinks){
      link.classList.toggle('active',id===key);
      if(id===key)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
    }
    page.replaceChildren();
    if(!window.PlannerUI.plan.order.includes(character))character='';
    if(id==='setup'||id==='milestones'){window.PlannerUI.draw(page,id);return;}
    page.className='';
    const layout=el('div',id==='advisor'?'':'dash');
    const pane=el('div','app-pane');
    if(id!=='advisor'){layout.append(rosterPanel());pane.append(rosterSelect());}
    layout.append(pane);page.append(layout);
    const content=el('div');pane.append(content);
    if(id==='advisor')advisorView(content);
    else window.FieldReference.render(content,id,guide,character);
  }
  window.addEventListener('hashchange',render);
  window.addEventListener('storage',event=>{
    if(event.key===window.RTGPlan.key || event.key===null){window.PlannerUI.reload();render();}
  });
  const sourceDate=new Date(guide.retrieved+'T12:00:00Z');
  if(!Number.isNaN(sourceDate.getTime())){
    const text=sourceDate.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
    document.querySelector('.foot').append(el('span','source-date','Guide snapshot · '+text));
  }
  render();
})();
