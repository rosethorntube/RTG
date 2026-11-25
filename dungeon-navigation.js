(() => {
  'use strict';
  const point = (zone, x, y, label = 'Entrance') => ({zone, x, y, label});
  const entry = (zone, x, y, hint, label, landmarks = []) => ({
    primary: point(zone, x, y, label), hint, landmarks
  });

  // Player-facing directions cite landmarks with independently reported zone coordinates.
  // Reference checks: WoW Handbook (RFK); Wowhead Forever (Alcaz); Warcraft Tavern
  // (Hall of Thanes, Blackmaw); WoWBocho (Ruins, Dalaran, Krol’dok, Alcaz);
  // MMonster world map and Undying (legacy entrances); Guided (Shaper’s Terrace).
  // Some coordinates describe the outdoor approach or meeting point. Their label
  // deliberately distinguishes them from the portal further along that approach.
  const monastery = 'Tirisfal Glades';
  const monasteryWing = (door, key = false) => entry(monastery, 85.1, 31.4,
    'Climb the steps into Scarlet Monastery in northeast Tirisfal. Facing the wing doors, '+door+
      (key?' Arrange for someone to open the locked door. The Scarlet Key comes from the Library.':''),
    'Monastery approach');
  const maraudon = (hint) => entry('Desolace', 29.2, 62.5,
    'Enter the caves in the Valley of Spears and work down to the branching tunnels. '+hint, 'Cave approach');
  const brd = entry('Searing Gorge', 34.8, 85.7,
    'Enter Blackrock Mountain from Searing Gorge or Burning Steppes. Work down towards the quarry and follow the mine tunnels to the Blackrock Depths portal.', 'Mountain approach');
  const spire = entry('Burning Steppes', 33.0, 25.2,
    'Follow the chain up from the central chamber of Blackrock Mountain and enter the Spire portal. Lower and Upper share the outside portal.', 'Spire portal');
  const gnomeregan = entry('Dun Morogh', 24.0, 40.0,
    'Head west through Dun Morogh to Gnomeregan. Take the elevator into the complex and follow the main tunnels to the portal.', 'Complex entrance');
  const gnomereganHorde = entry('Stranglethorn Vale', 27.6, 77.4,
    'For the Horde shortcut, start Chief Engineer Scooty with Sovik in Orgrimmar. Continue with Scooty on the lower docks at Booty Bay to obtain the Goblin Transponder and use the teleporter.', 'Horde teleporter',
    [gnomeregan.primary]);
  const entrances = {
    rfc: entry('Orgrimmar', 53.0, 48.9, 'Enter the Cleft of Shadow and descend through the caves to the portal.'),
    hall_of_thanes: entry('Ironforge', 27.8, 47.9,
      'From the Great Forge, enter the High Seat. Take the cobwebbed passage on the left and descend into Old Ironforge. Continue across the bridge to the portal.',
      'Portal below Ironforge', [point('Ironforge', 43.5, 52.0, 'Passage from the High Seat')]),
    rol: entry('Tirisfal Glades', 63.1, 67.5,
      'Go into the ruined city above Undercity and stay on the surface. In the courtyard, look to the left for the barred passage up to the portal.'),
    wc: entry('The Barrens', 46.0, 36.3, 'Find the cave in the Lushwater Oasis southwest of the Crossroads. Follow the caverns to the instance portal.', 'Cave approach'),
    deadmines: entry('Westfall', 38.2, 77.5,
      'Enter the mine through the building in Moonbrook and follow the tunnels down to the portal. Use the Moonbrook approach if you are starting outside.',
      'Portal below Moonbrook', [point('Westfall', 42.5, 71.7, 'Moonbrook mine approach')]),
    sfk: entry('Silverpine Forest', 44.7, 67.8, 'Take the road to Pyrewood Village in southern Silverpine. Climb the path towards the castle above the village.'),
    bfd: entry('Ashenvale', 14.5, 14.6,
      'Head to the Zoram Strand on the northwest coast. Enter the ruined temple, go through the submerged passage, then follow the caves to the instance.', 'Ruins approach'),
    stockades: entry('Stormwind City', 50.4, 66.2, 'At the canals between the Trade District and Mage Quarter, look for the stone prison and descend its stairs.'),
    wetlands: entry('Wetlands', 47.8, 56.3,
      'At Thelgen Rock, take the uphill road by the meeting stone. Follow it to the hilltop portal.',
      'Hilltop portal', [point('Wetlands', 53.4, 65.3, 'Thelgen Rock approach')]),
    rfk: entry('The Barrens', 42.3, 89.9,
      'From Camp Taurajo, ride south toward the Great Lift. Head west into the huge thorn brambles near the southern end of the Barrens and follow the paths to the portal.',
      'Entrance', [point('The Barrens', 44.5, 59.1, 'Camp Taurajo flight path')]),
    dalaran: entry('Alterac Mountains', 8.8, 59.6,
      'Approach the sewers from Lordamere Lake on the Silverpine side. Complete the City of Dalaran access chain from your faction’s quest giver before you set out.',
      'Sewer entrance'),
    gnomeregan,
    'sm-graveyard': monasteryWing('take the far-left entrance.'),
    'sm-library': monasteryWing('take the far-right entrance.'),
    'sm-armoury': monasteryWing('take the inner right door.', true),
    'sm-cathedral': monasteryWing('take the inner left door.', true),
    drowned_city: entry('Stranglethorn Vale', 21.4, 27.9,
      'Swim out from the west coast near Grom’gol Base Camp. Dive west of the Vile Reef and look for the large carved tablet beside the cave.'),
    rfd: entry('The Barrens', 50.9, 92.9, 'Ride south towards the Great Lift and take the eastern side of the road into the thorn enclosures.'),
    kroldok: entry('Riverglades', 37.5, 37.9,
      'Look for the cave west of the fortress gates on the hill north of Sunnyglade. The meeting stone is just east of the cave.',
      'Cave portal', [point('Riverglades', 39.1, 38.8, 'Meeting stone')]),
    uldaman: entry('Badlands', 44.2, 12.2, 'Head north to the excavation and go through the dig site’s tunnels to the main instance portal.', 'Main entrance'),
    zf: entry('Tanaris', 38.7, 19.9, 'From Gadgetzan, cross northwest to the walled troll city and head through its gates.'),
    'maraudon-crystals': maraudon('Use the orange-crystal passage for Foulspore Cavern or the purple-crystal passage for Wicked Grotto. Agree which wing you are starting with before entering.'),
    'maraudon-princess': maraudon('For a full clear, start through the main wing portals. If someone has the Scepter of Celebras, the portal room provides a shortcut into the inner section.'),
    'alcaz-prison': entry('Dustwallow Marsh', 74.6, 14.6,
      'Head to the north end of Alcaz Island off the northeast coast. From the meeting stone, enter the prison building and descend to the portal in the basement.', 'Meeting stone'),
    'brd-early': brd,
    st: entry('Swamp of Sorrows', 70.0, 52.9, 'Swim to the Temple of Atal’Hakkar in the Pool of Tears. Enter the temple complex and follow its passage to the instance portal.', 'Temple approach'),
    'brd-emperor': brd,
    'dire-maul-east': entry('Feralas', 64.9, 29.4, 'Head to Eldre’Thalas, north of the main road. From the central area around the arena, head towards the eastern wing.'),
    'lower-blackrock-spire': spire,
    'blackmaw-hold': entry('Azshara', 38.7, 33.4,
      'Ride northeast from Valormok to the furbolg tunnel in northern Azshara. Go through the tunnel to the portal on the Winterspring side.',
      'Tunnel mouth', [point('Winterspring', 66.6, 84.4, 'Portal at the end of the tunnel')]),
    'dire-maul-west': entry('Feralas', 60.3, 31.8, 'Use the western wing of Eldre’Thalas. Arrange for someone to open the gate if it is locked.'),
    'dire-maul-north': entry('Feralas', 62.9, 24.9, 'Go north from the Dire Maul arena area to the northern wing. Arrange access to the locked wing with your group.'),
    scholomance: entry('Western Plaguelands', 69.0, 72.7, 'Cross the bridge to Caer Darrow. Head into the keep through the school’s entrance and follow the stairs below.', 'Caer Darrow entrance'),
    'stratholme-live': entry('Eastern Plaguelands', 26.5, 10.4, 'Head to the north of the Eastern Plaguelands and use the main front gate for the Live side.', 'Main gate'),
    'stratholme-undead': entry('Eastern Plaguelands', 41.9, 15.8, 'Approach the eastern gate for the Undead side. Arrange an opener with the Key to the City if the service gate is locked.', 'Service gate'),
    'shapers-terrace': entry("Un'Goro Crater", 48.1, 6.1,
      'From Marshal’s Refuge, find the broad stone staircase and climb to the titan doorway on the northern rim.',
      'Upper doorway', [point("Un'Goro Crater", 48.4, 8.6, 'Stone staircase')]),
    'upper-blackrock-spire': spire
  };
  const factionEntrances = {
    Horde: {gnomeregan:gnomereganHorde},
    Alliance: {
      rfk: {...entrances.rfk, landmarks:[],
        hint:'From Ratchet, ride towards the Great Lift at the southern end of the Barrens. Turn west into the huge thorn brambles and follow the paths to the portal.'},
      drowned_city: {...entrances.drowned_city,
        hint:'From Booty Bay, head north along the west coast and stay offshore when you pass Grom’gol. Dive west of the Vile Reef and look for the large carved tablet beside the cave.'},
      'blackmaw-hold': {...entrances['blackmaw-hold'],
        hint:'Ride northeast from Talrendis Point to the furbolg tunnel in northern Azshara. Go through the tunnel to the portal on the Winterspring side.'}
    }
  };

  const maps = Object.freeze({
    'Alterac Mountains': 1416, 'Arathi Highlands': 1417, Azshara: 1447, Badlands: 1418,
    'Burning Steppes': 1428, 'Darnassus': 1457, Desolace: 1443, 'Dun Morogh': 1426,
    'Duskwood': 1431, 'Dustwallow Marsh': 1445, 'Eastern Plaguelands': 1423,
    'Feralas': 1444, Felwood: 1448, 'Hillsbrad Foothills': 1424, 'Ironforge': 1455,
    'Loch Modan': 1432, Mulgore: 1412, Orgrimmar: 1454, 'Redridge Mountains': 1433, Riverglades:2548,
    'Searing Gorge': 1427, 'Silverpine Forest': 1421, 'Stormwind City': 1453, Stormwind: 1453,
    'Stranglethorn Vale': 1434, 'Swamp of Sorrows': 1435, Tanaris: 1446, 'The Barrens': 1413,
    'Thousand Needles': 1441, 'Thunder Bluff': 1456, 'Tirisfal Glades': 1420, Undercity: 1458,
    "Un'Goro Crater": 1449, 'Western Plaguelands': 1422, Westfall: 1436, Wetlands: 1437, Winterspring: 1452,
    Ashenvale: 1440, Darkshore: 1439, Durotar: 1411, 'The Hinterlands': 1425
  });
  const coordinate = n => typeof n === 'number' && Number.isFinite(n) && n>=0 && n<=100;
  const textCoords = p => coordinate(p.x) && coordinate(p.y) ? p.x.toFixed(1)+', '+p.y.toFixed(1) : '';
  const zoneKey = zone => zone === 'Stormwind' ? 'Stormwind City' : zone;
  const asArray = value => Array.isArray(value) ? value : value==null ? [] : [value];
  const make = (tag, cls, text) => {
    const element = document.createElement(tag);
    if(cls)element.className = cls;
    if(text!==undefined)element.textContent = text;
    return element;
  };

  function startInside(q, quests, inside, seen = new Set()) {
    if (!q || seen.has(String(q.id))) return false;
    seen.add(String(q.id));
    const needs = [...asArray(q.requires),...asArray(q.active)];
    return needs.some(id=>inside.has(String(id)) || startInside(quests[id], quests, inside, seen));
  }

  // Use the run's visible outside pickups. Optional city introductions and
  // records from in-dungeon follow-up branches stay in the quest checklist.
  function visibleStops(quests, objectives) {
    const inside = new Set(objectives.filter(o => o.phase==='inside').map(o => String(o.id)));
    const stops = new Map();
    for(const objective of objectives){
      const q = quests[objective.id];
      if(objective.phase!=='before' || !q || !q.zone || !coordinate(q.x) || !coordinate(q.y) || startInside(q, quests, inside))continue;
      const zone = zoneKey(q.zone);
      const label = [q.npc,q.area].filter(Boolean).join(' · ') || q.name;
      const key = [zone,q.x,q.y,label].join('|');
      if(!stops.has(key))stops.set(key,{...point(zone,q.x,q.y,label),quests:[]});
      const stop=stops.get(key);
      if(q.name && !stop.quests.includes(q.name))stop.quests.push(q.name);
    }
    return [...stops.values()];
  }

  function addWaypoint(body, spots, runName) {
    const locations=spots.filter(location=>maps[location.zone]);
    if(!locations.length)return;
    const line = make('div','dn-way');
    const copy = make('button','dn-copy','Copy /way');
    copy.type='button';
    const manual = make('input','dn-command');
    manual.readOnly=true;manual.hidden=true;
    manual.setAttribute('aria-label','Waypoint command');
    const status = make('span','dn-copy-status');
    status.setAttribute('role','status');
    let selected=locations[0];
    const select=make('select','ref-select');
    if(locations.length>1){
      const field=make('label','dn-zone-field','Waypoint');
      locations.forEach((location,i)=>{
        const option=make('option','',location.label);
        option.value=String(i);select.append(option);
      });
      field.append(select);
      select.addEventListener('change',()=>{
        selected=locations[Number(select.value)];
        manual.hidden=true;
        status.textContent='';
      });
      line.append(field);
    }
    const fallback=()=>{manual.hidden=false;manual.focus();manual.select();status.textContent='Select and copy the command.';};
    copy.addEventListener('click',async()=>{
      const label = selected.label === 'Entrance' ? runName+' entrance' : selected.label;
      const command = '/way #'+maps[selected.zone]+' '+selected.x.toFixed(1)+' '+selected.y.toFixed(1)+' '+label;
      manual.value=command;
      try{
        if(!navigator.clipboard)return fallback();
        await navigator.clipboard.writeText(command);
        status.textContent='Waypoint copied.';
      }catch{fallback();}
    });
    line.append(copy, make('small','dn-way-help','For TomTom or a compatible waypoint addon.'),manual,status);
    body.append(line);
  }

  function drawZone(name, spots, fullRunName) {
    const panel=make('div','dn-zone');
    const chart=make('div','dn-chart');
    chart.setAttribute('aria-hidden','true');
    chart.append(make('span','dn-north','N ↑'), make('span','dn-grid-note','Zone coordinates'));
    const list=make('ol','dn-stops');
    let index=0;
    for(const location of spots){
      index++;
      const pin=make('span','dn-pin'+(location.quests?'':' dn-pin-landmark'),String(index));
      pin.style.left=location.x+'%';
      pin.style.top=location.y+'%';
      chart.append(pin);
      const row=make('li','dn-stop');
      const number=make('span','dn-number'+(location.quests?'':' dn-number-landmark'),String(index));
      number.setAttribute('aria-hidden','true');
      const copy=make('div','dn-stop-content');
      copy.append(make('strong','',location.label),make('span','dn-coordinates',textCoords(location)));
      if(location.quests?.length)copy.append(make('p','dn-quests',location.quests.join(' · ')));
      row.append(number,copy);
      list.append(row);
    }
    const grid=make('div','dn-grid');
    const image=make('figure','dn-figure');
    image.append(chart,make('figcaption','dn-caption','Coordinate grid for '+name+'. Use the in-game map for terrain.'));
    grid.append(image,list);
    panel.append(grid);
    addWaypoint(panel,spots,fullRunName);
    return panel;
  }

  function render(run, quests, {faction, objectives} = {}) {
    const setting = factionEntrances[faction]?.[run.id] || entrances[run.id];
    if(!setting)return null;
    const {primary,hint,landmarks}=setting;
    const visible = visibleStops(quests,objectives || run[faction] || []);
    const grouped=new Map();
    for(const location of [primary,...landmarks,...visible]){
      if(!grouped.has(location.zone))grouped.set(location.zone,[]);
      grouped.get(location.zone).push(location);
    }
    const details=make('details','dn-card');
    details.id='dq-directions';
    const summary=make('summary','dn-summary');
    const head=make('span','dn-heading','Entrance and pickup locations');
    const where=make('span','dn-where',primary.zone+' '+textCoords(primary));
    summary.append(head,where);
    const body=make('div','dn-body');
    body.append(make('p','dn-directions',hint));
    const grid=make('div','dn-zone-content');
    function selectZone(zone){
      grid.replaceChildren(drawZone(zone,grouped.get(zone),run.name));
    }
    if(grouped.size>1){
      const field=make('label','dn-zone-field','Show zone');
      const select=make('select','ref-select');
      for(const name of grouped.keys()){
        const option=make('option','',name);
        option.value=name;select.append(option);
      }
      field.append(select);
      body.append(field);
      select.addEventListener('change',()=>selectZone(select.value));
    }
    body.append(grid);
    details.append(summary,body);
    selectZone(primary.zone);
    return details;
  }

  window.WYHDungeonNavigation={render};
})();
