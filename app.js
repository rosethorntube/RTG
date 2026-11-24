(() => {
  'use strict';
  const guide=window.ROSE_GUIDE;
  const page=document.getElementById('page');
  const addonPage=document.getElementById('wyh-addon');
  const guideTitle=document.title;
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
  function render() {
    const id=currentTab();navSelect.value=id;
    for(const [key,link] of navLinks){
      link.classList.toggle('active',id===key);
      if(id===key)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
    }
    document.body.classList.toggle('wyh-active',id==='advisor');
    document.title=id==='advisor'?"While You’re Here by Rosethorn | WoW Forever addon":guideTitle;
    page.replaceChildren();
    if(id==='advisor'){
      page.className='';page.append(addonPage);return;
    }
    if(!window.PlannerUI.plan.order.includes(character))character='';
    if(id==='setup'||id==='milestones'){window.PlannerUI.draw(page,id);return;}
    page.className='';
    const layout=el('div','dash');
    const pane=el('div','app-pane');
    layout.append(rosterPanel());pane.append(rosterSelect());
    layout.append(pane);page.append(layout);
    const content=el('div');pane.append(content);
    window.FieldReference.render(content,id,guide,character);
  }
  window.addEventListener('hashchange',render);
  window.addEventListener('storage',event=>{
    if(event.key===null || event.key===window.WYHPlan.key || window.WYHPlan.relatedKeys.includes(event.key)){window.PlannerUI.reload();render();}
  });
  const sourceDate=new Date(guide.retrieved+'T12:00:00Z');
  if(!Number.isNaN(sourceDate.getTime())){
    const text=sourceDate.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
    document.querySelector('.foot').append(el('span','source-date','Guide snapshot · '+text));
  }
  render();
})();
