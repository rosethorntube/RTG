// Route reagents are derived from the addon's CraftNextData.lua and NextFirstAid.lua.
// Vendor and trainer locations were checked against Forever recipe and NPC data.
window.WYHProfessionRecipes = {
  "alchemy": {
    "trainers": {
      "Horde": [
        "Doctor Herbert Halsey, Apothecarium, Undercity (47.8, 73.3)",
        "Doctor Herbert Halsey, Apothecarium, Undercity (47.8, 73.3)",
        "Rogvar, Stonard, Swamp of Sorrows (48.5, 55.9)"
      ],
      "Alliance": [
        "Ainethil, Craftsmen's Terrace, Darnassus (54.9, 24.0)",
        "Ainethil, Craftsmen's Terrace, Darnassus (54.9, 24.0)",
        "Kylanna Windwhisper, Feathermoon Stronghold, Feralas (32.6, 43.8)"
      ]
    },
    "recipes": {
      "minorforce": [
        "Elixir of Minor Force",
        "1 Silverleaf, 1 Empty Vial",
        {
          "kind": "starter"
        }
      ],
      "minordefense": [
        "Elixir of Minor Defense",
        "1 Silverleaf, 1 Peacebloom, 1 Empty Vial",
        {
          "kind": "starter"
        }
      ],
      "minormana": [
        "Minor Mana Potion",
        "1 Mageroyal, 1 Peacebloom, 1 Empty Vial",
        {
          "kind": "trainer"
        }
      ],
      "minorfortitude": [
        "Elixir of Minor Fortitude",
        "2 Earthroot, 1 Peacebloom, 1 Empty Vial",
        {
          "kind": "trainer"
        }
      ],
      "wisdom": [
        "Elixir of Wisdom",
        "1 Mageroyal, 2 Briarthorn, 1 Empty Vial",
        {
          "kind": "trainer"
        }
      ],
      "lessermana": [
        "Lesser Mana Potion",
        "1 Mageroyal, 1 Stranglekelp, 1 Empty Vial",
        {
          "kind": "trainer"
        }
      ],
      "mana": [
        "Mana Potion",
        "1 Stranglekelp, 1 Kingsblood, 1 Leaded Vial",
        {
          "kind": "trainer"
        }
      ],
      "agility": [
        "Elixir of Agility",
        "1 Stranglekelp, 1 Goldthorn, 1 Leaded Vial",
        {
          "kind": "trainer"
        }
      ],
      "greatermana": [
        "Greater Mana Potion",
        "1 Khadgar's Whisker, 1 Goldthorn, 1 Leaded Vial",
        {
          "kind": "trainer"
        }
      ],
      "draughtofdetectundead": [
        "Draught of Detect Undead",
        "1 Arthas' Tears, 1 Crystal Vial",
        {
          "kind": "trainer"
        }
      ],
      "superiormana": [
        "Superior Mana Potion",
        "2 Sungrass, 2 Blindweed, 1 Crystal Vial",
        {
          "kind": "Vendor",
          "skill": 260,
          "where": "Algernon, Apothecarium, Undercity (51.7, 74.7). The recipe can also be bought at the Auction House.",
          "alliance": "Ulthir, Craftsmen's Terrace, Darnassus (55.8, 24.5). The recipe can also be bought at the Auction House."
        }
      ],
      "majordiscoloredhealingpotion": [
        "Major Discolored Healing Potion",
        "1 Crystal Vial, 1 Plaguebloom, 1 Murloc Eye",
        {
          "kind": "Quest unlock",
          "skill": 250,
          "where": "Start Wild Hearts with Rane Yorick at the Ivar Patch, Silverpine Forest (53.5, 13.4). Finish Return to Quinn and Wild Eyes, then learn the potion from Apothecary Renferrel at the Sepulcher (42.8, 40.9). Set aside 3 Discolored Worg Hearts and 3 Murloc Eyes for the chain.",
          "alliance": "Find Odd Child inside the barn near the Deadmines entrance in southern Westfall. Complete My First Alchemy Set and My First Real Potion to unlock these recipes."
        }
      ],
      "minorarcaneelixir": [
        "Minor Arcane Elixir",
        "1 Peacebloom, 1 Empty Vial",
        {
          "kind": "starter"
        }
      ],
      "elixirofminorstrength": [
        "Elixir of Minor Strength",
        "1 Earthroot, 1 Silverleaf, 1 Empty Vial",
        {
          "kind": "trainer"
        }
      ]
    }
  },
  "blacksmithing": {
    "trainers": {
      "Horde": [
        "Saru Steelfury, Valley of Honor, Orgrimmar (82.3, 23.0)",
        "Saru Steelfury, Valley of Honor, Orgrimmar (82.3, 23.0)",
        "Brikk Keencraft, Booty Bay, Stranglethorn Vale (29.0, 75.6)"
      ],
      "Alliance": [
        "Bengus Deepforge, Great Forge, Ironforge (52.6, 41.5)",
        "Bengus Deepforge, Great Forge, Ironforge (52.6, 41.5)",
        "Brikk Keencraft, Booty Bay, Stranglethorn Vale (29.0, 75.6)"
      ]
    },
    "recipes": {
      "roughsharpening": [
        "Rough Sharpening Stone",
        "1 Rough Stone",
        {
          "kind": "starter"
        }
      ],
      "roughgrinding": [
        "Rough Grinding Stone",
        "2 Rough Stone",
        {
          "kind": "trainer"
        }
      ],
      "copperchainbelt": [
        "Copper Chain Belt",
        "6 Copper Bar",
        {
          "kind": "trainer"
        }
      ],
      "coarsegrinding": [
        "Coarse Grinding Stone",
        "2 Coarse Stone",
        {
          "kind": "trainer"
        }
      ],
      "runedcopperbelt": [
        "Runed Copper Belt",
        "10 Copper Bar",
        {
          "kind": "trainer"
        }
      ],
      "heavysharpening": [
        "Heavy Sharpening Stone",
        "1 Heavy Stone",
        {
          "kind": "trainer"
        }
      ],
      "roughbronzeleggings": [
        "Rough Bronze Leggings",
        "6 Bronze Bar",
        {
          "kind": "trainer"
        }
      ],
      "ironbuckle": [
        "Iron Buckle",
        "1 Iron Bar",
        {
          "kind": "trainer"
        }
      ],
      "bronzewarhammer": [
        "Bronze Warhammer",
        "8 Bronze Bar, 1 Strong Flux, 1 Medium Leather",
        {
          "kind": "trainer"
        }
      ],
      "patternedbronzebracers": [
        "Patterned Bronze Bracers",
        "5 Bronze Bar, 2 Coarse Grinding Stone",
        {
          "kind": "trainer"
        }
      ],
      "greenironbracers": [
        "Green Iron Bracers",
        "6 Iron Bar, 1 Green Dye",
        {
          "kind": "trainer"
        }
      ],
      "greenironleggings": [
        "Green Iron Leggings",
        "8 Iron Bar, 1 Heavy Grinding Stone, 1 Green Dye",
        {
          "kind": "trainer"
        }
      ],
      "heavymithrilgauntlet": [
        "Heavy Mithril Gauntlet",
        "6 Mithril Bar, 4 Mageweave Cloth",
        {
          "kind": "trainer"
        }
      ],
      "goldenscalebracers": [
        "Golden Scale Bracers",
        "5 Steel Bar, 2 Heavy Grinding Stone",
        {
          "kind": "trainer"
        }
      ],
      "mithrilplatepants": [
        "Mithril Plate Pants",
        "12 Mithril Bar",
        {
          "kind": "trainer"
        }
      ],
      "heavymithrilbreastplate": [
        "Heavy Mithril Breastplate",
        "16 Mithril Bar",
        {
          "kind": "trainer"
        }
      ],
      "denseweightstone": [
        "Dense Weightstone",
        "1 Dense Stone",
        {
          "kind": "trainer"
        }
      ],
      "mithrilcoif": [
        "Mithril Coif",
        "10 Mithril Bar, 6 Mageweave Cloth",
        {
          "kind": "trainer"
        }
      ],
      "heavymithrilboots": [
        "Heavy Mithril Boots",
        "14 Mithril Bar, 4 Thick Leather",
        {
          "kind": "trainer"
        }
      ],
      "bigblackmace": [
        "Big Black Mace",
        "16 Mithril Bar, 1 Black Pearl, 4 Shadowgem, 1 Solid Grinding Stone, 2 Thick Leather",
        {
          "kind": "trainer"
        }
      ],
      "arcaniteskeletonkey": [
        "Arcanite Skeleton Key",
        "1 Arcanite Bar, 1 Dense Grinding Stone",
        {
          "kind": "trainer"
        }
      ],
      "ebonshiv": [
        "Ebon Shiv",
        "12 Mithril Bar, 6 Truesilver Bar, 2 Star Ruby, 1 Solid Grinding Stone, 2 Thick Leather",
        {
          "kind": "Vendor",
          "skill": 230,
          "where": "Magnus Frostwake, Caer Darrow, Western Plaguelands (68.0, 77.0). Equip Spectral Essence from the Scholomance quest chain so he is visible."
        }
      ],
      "bolddirk": [
        "Bold Dirk",
        "30 Thorium Bar, 4 Essence of Air, 10 Azerothium Bar, 4 Rugged Leather",
        {
          "kind": "Vendor",
          "skill": 270,
          "where": "Pexmit, a rare merchant in Mount Hyjal. The guide lists 10g. Buy on the character learning the bind-on-pickup plan."
        }
      ],
      "ornatethoriumhandaxe": [
        "Ornate Thorium Handaxe",
        "20 Thorium Bar, 2 Large Opal, 2 Dense Grinding Stone, 4 Rugged Leather",
        {
          "kind": "Vendor",
          "skill": 250,
          "where": "Magnus Frostwake, Caer Darrow, Western Plaguelands (68.0, 77.0). Equip Spectral Essence from the Scholomance quest chain so he is visible."
        }
      ]
    }
  },
  "enchanting": {
    "trainers": {
      "Horde": [
        "Godan, the Drag, Orgrimmar",
        "Hgarth, Sun Rock Retreat, Stonetalon Mountains (49.2, 57.2)",
        "Annora, inside Uldaman"
      ],
      "Alliance": [
        "Lucan Cordell, the Mage Quarter, Stormwind",
        "Kitta Firewind, Tower of Azora, Elwynn Forest",
        "Annora, inside Uldaman"
      ]
    },
    "recipes": {
      "runedcopperrod": [
        "Runed Copper Rod",
        "1 Copper Rod, 1 Mote of Magic",
        {
          "kind": "starter"
        }
      ],
      "disenchantgreens": [
        "Disenchant",
        "",
        {
          "kind": "ability"
        }
      ],
      "lessermagicwand": [
        "Lesser Magic Wand",
        "1 Simple Wood, 1 Lesser Magic Essence",
        {
          "kind": "trainer"
        }
      ],
      "chestminorabsorption": [
        "Enchant Chest - Minor Absorption",
        "1 Lesser Magic Essence",
        {
          "kind": "trainer"
        }
      ],
      "bracerminorstamina": [
        "Enchant Bracer - Minor Stamina",
        "2 Strange Dust",
        {
          "kind": "trainer"
        }
      ],
      "runedsilverrod": [
        "Runed Silver Rod",
        "1 Silver Rod, 3 Strange Dust, 4 Lesser Magic Essence, 1 Shadowgem",
        {
          "kind": "trainer"
        }
      ],
      "greatermagicwand": [
        "Greater Magic Wand",
        "1 Simple Wood, 2 Lesser Magic Essence",
        {
          "kind": "trainer"
        }
      ],
      "cloakminoragility": [
        "Enchant Cloak - Minor Agility",
        "1 Lesser Astral Essence",
        {
          "kind": "Vendor",
          "skill": 110,
          "where": "Kulwia, Sun Rock Retreat, Stonetalon Mountains (45.4, 59.3). Buy on the enchanter.",
          "alliance": "Dalria, Astranaar, Ashenvale (35.1, 52.1). Buy on the enchanter."
        }
      ],
      "bracerlesserstamina": [
        "Enchant Bracer - Lesser Stamina",
        "1 Soul Dust",
        {
          "kind": "trainer"
        }
      ],
      "runedgoldenrod": [
        "Runed Golden Rod",
        "1 Golden Rod, 1 Iridescent Pearl, 1 Greater Astral Essence, 1 Soul Dust",
        {
          "kind": "trainer"
        }
      ],
      "bracerlesserstrength": [
        "Enchant Bracer - Lesser Strength",
        "1 Soul Dust",
        {
          "kind": "Vendor",
          "skill": 140,
          "where": "Kulwia, Sun Rock Retreat, Stonetalon Mountains (45.4, 59.3). Check limited stock or the Auction House.",
          "alliance": "Dalria, Astranaar, Ashenvale (35.1, 52.1). Check limited stock or the Auction House."
        }
      ],
      "bracerstrength": [
        "Enchant Bracer - Strength",
        "1 Vision Dust",
        {
          "kind": "trainer"
        }
      ],
      "runedtruesilverrod": [
        "Runed Truesilver Rod",
        "1 Truesilver Rod, 1 Black Pearl, 1 Greater Mystic Essence, 1 Vision Dust",
        {
          "kind": "trainer"
        }
      ],
      "cloakgreaterdefense": [
        "Enchant Cloak - Greater Defense",
        "1 Vision Dust",
        {
          "kind": "trainer"
        }
      ],
      "glovesagility": [
        "Enchant Gloves - Agility",
        "1 Vision Dust",
        {
          "kind": "trainer"
        }
      ],
      "bootsstamina": [
        "Enchant Boots - Stamina",
        "2 Vision Dust",
        {
          "kind": "trainer"
        }
      ],
      "chestsuperiorstamina": [
        "Enchant Chest - Superior Stamina",
        "3 Vision Dust",
        {
          "kind": "trainer"
        }
      ],
      "lessermanaoil": [
        "Lesser Mana Oil",
        "1 Dream Dust, 1 Purple Lotus, 1 Crystal Vial",
        {
          "kind": "Vendor",
          "skill": 250,
          "where": "Kania, Cenarion Hold, Silithus (52.0, 39.7), or Lokhtos Darkbargainer in the Grim Guzzler inside Blackrock Depths. The formula is tradeable."
        }
      ],
      "shieldgreaterstamina": [
        "Enchant Shield - Greater Stamina",
        "6 Dream Dust",
        {
          "kind": "Vendor",
          "skill": 265,
          "where": "Daniel Bartlett, Trade Quarter, Undercity (64.1, 37.4). Buy on the enchanter.",
          "alliance": "Mythrin'dir, Craftsmen's Terrace, Darnassus (61.0, 17.7). Buy on the enchanter."
        }
      ],
      "runedarcaniterod": [
        "Runed Arcanite Rod",
        "1 Arcanite Rod, 1 Golden Pearl, 10 Illusion Dust, 4 Greater Eternal Essence, 4 Small Brilliant Shard, 2 Large Brilliant Shard",
        {
          "kind": "Vendor",
          "skill": 290,
          "where": "Lorelae Wintersong, Nighthaven, Moonglade (48.2, 40.1). Buy on the enchanter."
        }
      ],
      "cloaksuperiordefense": [
        "Enchant Cloak - Superior Defense",
        "8 Illusion Dust",
        {
          "kind": "Vendor",
          "skill": 285,
          "where": "Lorelae Wintersong, Nighthaven, Moonglade (48.2, 40.1). The formula is tradeable."
        }
      ]
    }
  },
  "engineering": {
    "trainers": {
      "Horde": [
        "Roxxik, Valley of Honor, Orgrimmar (76.2, 25.2)",
        "Roxxik, Valley of Honor, Orgrimmar (76.2, 25.2)",
        "Buzzek Bracketswing, Gadgetzan, Tanaris (52.3, 27.7)"
      ],
      "Alliance": [
        "Springspindle Fizzlegear, Tinker Town, Ironforge",
        "Springspindle Fizzlegear, Tinker Town, Ironforge",
        "Buzzek Bracketswing, Gadgetzan, Tanaris (52.3, 27.7)"
      ]
    },
    "recipes": {
      "roughblastingpowder": [
        "Rough Blasting Powder",
        "1 Rough Stone",
        {
          "kind": "starter"
        }
      ],
      "copperbolts": [
        "Handful of Copper Bolts",
        "1 Copper Bar",
        {
          "kind": "trainer"
        }
      ],
      "arclightspanner": [
        "Arclight Spanner",
        "6 Copper Bar",
        {
          "kind": "trainer"
        }
      ],
      "roughcopperbomb": [
        "Rough Copper Bomb",
        "1 Copper Bar, 1 Handful of Copper Bolts, 2 Rough Blasting Powder, 1 Linen Cloth",
        {
          "kind": "trainer"
        }
      ],
      "coarseblastingpowder": [
        "Coarse Blasting Powder",
        "1 Coarse Stone",
        {
          "kind": "trainer"
        }
      ],
      "coarsedynamite": [
        "Coarse Dynamite",
        "3 Coarse Blasting Powder, 1 Linen Cloth",
        {
          "kind": "trainer"
        }
      ],
      "silvercontact": [
        "Silver Contact",
        "1 Silver Bar",
        {
          "kind": "trainer"
        }
      ],
      "bronzetube": [
        "Bronze Tube",
        "2 Bronze Bar, 1 Weak Flux",
        {
          "kind": "trainer"
        }
      ],
      "standardscope": [
        "Standard Scope",
        "1 Bronze Tube, 1 Moss Agate",
        {
          "kind": "trainer"
        }
      ],
      "whirringbronzegizmo": [
        "Whirring Bronze Gizmo",
        "2 Bronze Bar, 1 Wool Cloth",
        {
          "kind": "trainer"
        }
      ],
      "bronzeframework": [
        "Bronze Framework",
        "2 Bronze Bar, 1 Medium Leather, 1 Wool Cloth",
        {
          "kind": "trainer"
        }
      ],
      "explosivesheep": [
        "Explosive Sheep",
        "1 Bronze Framework, 1 Whirring Bronze Gizmo, 2 Heavy Blasting Powder, 2 Wool Cloth",
        {
          "kind": "trainer"
        }
      ],
      "solidblastingpowder": [
        "Solid Blasting Powder",
        "2 Solid Stone",
        {
          "kind": "trainer"
        }
      ],
      "gyromaticmicroadjustor": [
        "Gyromatic Micro-Adjustor",
        "4 Steel Bar",
        {
          "kind": "trainer"
        }
      ],
      "mithriltube": [
        "Mithril Tube",
        "3 Mithril Bar",
        {
          "kind": "trainer"
        }
      ],
      "unstabletrigger": [
        "Unstable Trigger",
        "1 Mithril Bar, 1 Mageweave Cloth, 1 Solid Blasting Powder",
        {
          "kind": "trainer"
        }
      ],
      "mithrilcasing": [
        "Mithril Casing",
        "3 Mithril Bar",
        {
          "kind": "trainer"
        }
      ],
      "hiexplosivebomb": [
        "Hi-Explosive Bomb",
        "2 Mithril Casing, 1 Unstable Trigger, 2 Solid Blasting Powder",
        {
          "kind": "trainer"
        }
      ],
      "denseblastingpowder": [
        "Dense Blasting Powder",
        "2 Dense Stone",
        {
          "kind": "trainer"
        }
      ],
      "thoriumwidget": [
        "Thorium Widget",
        "3 Thorium Bar, 1 Runecloth",
        {
          "kind": "Vendor",
          "skill": 260,
          "where": "Sovik, Valley of Honor, Orgrimmar (75.7, 25.3). The schematic is tradeable.",
          "alliance": "Gearcutter Cogspinner, Tinker Town, Ironforge. The schematic is tradeable."
        }
      ],
      "thoriumtube": [
        "Thorium Tube",
        "6 Thorium Bar",
        {
          "kind": "Vendor",
          "skill": 275,
          "where": "Xizzer Fizzbolt, Everlook, Winterspring (61.0, 38.6). Buy on the engineer."
        }
      ]
    }
  },
  "leatherworking": {
    "trainers": {
      "Horde": [
        "Una, the Middle Rise, Thunder Bluff",
        "Una, the Middle Rise, Thunder Bluff",
        "Hahrana Ironhide, Camp Mojache, Feralas (74.4, 43.1)"
      ],
      "Alliance": [
        "Telonis, Craftsmen's Terrace, Darnassus",
        "Telonis, Craftsmen's Terrace, Darnassus",
        "Drakk Stonehand, Aerie Peak, the Hinterlands (13.4, 43.5)"
      ]
    },
    "recipes": {
      "lightleather": [
        "Light Leather",
        "3 Ruined Leather Scraps",
        {
          "kind": "starter"
        }
      ],
      "curedlighthide": [
        "Cured Light Hide",
        "1 Light Hide, 1 Salt",
        {
          "kind": "trainer"
        }
      ],
      "embossedleathergloves": [
        "Embossed Leather Gloves",
        "3 Light Leather, 2 Coarse Thread",
        {
          "kind": "trainer"
        }
      ],
      "mediumleather": [
        "Medium Leather",
        "4 Light Leather",
        {
          "kind": "trainer"
        }
      ],
      "curedmediumhide": [
        "Cured Medium Hide",
        "1 Medium Hide, 1 Salt",
        {
          "kind": "trainer"
        }
      ],
      "fineleatherbelt": [
        "Fine Leather Belt",
        "6 Light Leather, 2 Coarse Thread",
        {
          "kind": "trainer"
        }
      ],
      "lightleatherpants": [
        "Light Leather Pants",
        "10 Light Leather, 1 Cured Light Hide, 1 Fine Thread",
        {
          "kind": "trainer"
        }
      ],
      "darkleatherbelt": [
        "Dark Leather Belt",
        "1 Fine Leather Belt, 1 Cured Medium Hide, 2 Fine Thread, 1 Gray Dye",
        {
          "kind": "trainer"
        }
      ],
      "heavyleather": [
        "Heavy Leather",
        "5 Medium Leather",
        {
          "kind": "trainer"
        }
      ],
      "curedheavyhide": [
        "Cured Heavy Hide",
        "1 Heavy Hide, 3 Salt",
        {
          "kind": "trainer"
        }
      ],
      "hillmansleathergloves": [
        "Hillman's Leather Gloves",
        "14 Medium Leather, 4 Fine Thread",
        {
          "kind": "trainer"
        }
      ],
      "barbaricshoulders": [
        "Barbaric Shoulders",
        "8 Heavy Leather, 1 Cured Heavy Hide, 2 Fine Thread",
        {
          "kind": "trainer"
        }
      ],
      "guardiangloves": [
        "Guardian Gloves",
        "4 Heavy Leather, 1 Cured Heavy Hide, 1 Silken Thread",
        {
          "kind": "trainer"
        }
      ],
      "barbaricharness": [
        "Barbaric Harness",
        "14 Heavy Leather, 2 Fine Thread, 1 Iron Buckle",
        {
          "kind": "trainer"
        }
      ],
      "nightscapeheadband": [
        "Nightscape Headband",
        "5 Thick Leather, 2 Silken Thread",
        {
          "kind": "trainer"
        }
      ],
      "nightscapepants": [
        "Nightscape Pants",
        "14 Thick Leather, 4 Silken Thread",
        {
          "kind": "trainer"
        }
      ],
      "wickedleathergauntlets": [
        "Wicked Leather Gauntlets",
        "8 Rugged Leather, 1 Black Dye, 1 Rune Thread",
        {
          "kind": "Vendor",
          "skill": 235,
          "where": "Werg Thickblade, the Bulwark, Tirisfal Glades (83.3, 69.7). Buy on the leatherworker.",
          "alliance": "Leonard Porter, Chillwind Camp, Western Plaguelands. Buy on the leatherworker."
        }
      ],
      "runicleatherheadband": [
        "Runic Leather Headband",
        "14 Rugged Leather, 10 Runecloth, 1 Rune Thread",
        {
          "kind": "Vendor",
          "skill": 265,
          "where": "Jase Farlane, Light's Hope Chapel, Eastern Plaguelands (70.9, 48.1). Buy on the leatherworker."
        }
      ]
    }
  },
  "tailoring": {
    "trainers": {
      "Horde": [
        "Josef Gregorian, Magic Quarter, Undercity (70.8, 30.7)",
        "Josef Gregorian, Magic Quarter, Undercity (70.8, 30.7)",
        "Daryl Stack, Tarren Mill, Hillsbrad Foothills (63.8, 20.8)"
      ],
      "Alliance": [
        "Georgio Bolero, Mage Quarter, Stormwind (53.2, 81.2)",
        "Georgio Bolero, Mage Quarter, Stormwind (53.2, 81.2)",
        "Timothy Worthington, Theramore, Dustwallow Marsh (66.2, 51.8)"
      ]
    },
    "recipes": {
      "linenbolts": [
        "Bolt of Linen Cloth",
        "2 Linen Cloth",
        {
          "kind": "starter"
        }
      ],
      "linenbelt": [
        "Linen Belt",
        "1 Bolt of Linen Cloth, 1 Coarse Thread",
        {
          "kind": "trainer"
        }
      ],
      "woolbolts": [
        "Bolt of Woolen Cloth",
        "3 Wool Cloth",
        {
          "kind": "trainer"
        }
      ],
      "woolencape": [
        "Woolen Cape",
        "1 Bolt of Woolen Cloth, 1 Fine Thread",
        {
          "kind": "trainer"
        }
      ],
      "doublestitchedwoolenshoulders": [
        "Double-stitched Woolen Shoulders",
        "3 Bolt of Woolen Cloth, 2 Fine Thread",
        {
          "kind": "trainer"
        }
      ],
      "silkbolts": [
        "Bolt of Silk Cloth",
        "4 Silk Cloth",
        {
          "kind": "trainer"
        }
      ],
      "glovesofmeditation": [
        "Gloves of Meditation",
        "4 Bolt of Woolen Cloth, 3 Fine Thread, 1 Elixir of Wisdom",
        {
          "kind": "trainer"
        }
      ],
      "mageweavebolts": [
        "Bolt of Mageweave",
        "5 Mageweave Cloth",
        {
          "kind": "trainer"
        }
      ],
      "crimsonsilkvest": [
        "Crimson Silk Vest",
        "4 Bolt of Silk Cloth, 2 Red Dye, 2 Fine Thread",
        {
          "kind": "trainer"
        }
      ],
      "crimsonsilkpantaloons": [
        "Crimson Silk Pantaloons",
        "4 Bolt of Silk Cloth, 2 Red Dye, 2 Silken Thread",
        {
          "kind": "trainer"
        }
      ],
      "blackmageweaveleggings": [
        "Black Mageweave Leggings",
        "2 Bolt of Mageweave, 3 Silken Thread",
        {
          "kind": "trainer"
        }
      ],
      "blackmageweaveshoulders": [
        "Black Mageweave Shoulders",
        "3 Bolt of Mageweave, 2 Heavy Silken Thread",
        {
          "kind": "trainer"
        }
      ],
      "runeclothbolts": [
        "Bolt of Runecloth",
        "5 Runecloth",
        {
          "kind": "trainer"
        }
      ],
      "runeclothbelt": [
        "Runecloth Belt",
        "3 Bolt of Runecloth, 1 Rune Thread",
        {
          "kind": "trainer"
        }
      ],
      "runeclothgloves": [
        "Runecloth Gloves",
        "4 Bolt of Runecloth, 4 Rugged Leather, 1 Rune Thread",
        {
          "kind": "Vendor",
          "skill": 230,
          "where": "Qia, Everlook, Winterspring (61.2, 37.2). Buy on the tailor."
        }
      ],
      "runeclothcuffs": [
        "Runecloth Cuffs",
        "5 Bolt of Runecloth, 1 Ironweb Spider Silk, 1 Rune Thread",
        {
          "kind": "Quest or vendor",
          "skill": 250,
          "where": "At level 54+, finish Blight No More, then bring 6 Bolts of Runecloth to Mez'dan in Elderwild, Mount Hyjal, for Threading a Solution. Pexmit is the listed 10g vendor alternative."
        }
      ],
      "runeclothshoulders": [
        "Runecloth Shoulders",
        "7 Bolt of Runecloth, 2 Ironweb Spider Silk, 4 Rugged Leather, 1 Rune Thread",
        {
          "kind": "Drop",
          "skill": 260,
          "where": "Pattern: Runecloth Shoulders is a tradeable world drop. Check the Auction House and have the pattern ready before banking the late-band materials."
        }
      ]
    }
  },
  "first-aid": {
    "trainers": {
      "Horde": [
        "Arnok, Valley of Spirits, Orgrimmar",
        "Balai Lok'Wein, Brackenwall Village, Dustwallow Marsh (36.4, 30.4)",
        "Doctor Gregory Victor, Hammerfall, Arathi Highlands (73.4, 36.8)"
      ],
      "Alliance": [
        "Shaina Fuller, Cathedral Square, Stormwind (42.8, 26.6)",
        "Deneb Walker, Stromgarde Keep, Arathi Highlands (27.0, 58.8)",
        "Doctor Gustaf VanHowzen, Theramore, Dustwallow Marsh (67.6, 48.8)"
      ]
    },
    "recipes": {
      "linenbandage": [
        "Linen Bandage",
        "1 Linen Cloth",
        {
          "kind": "starter"
        }
      ],
      "heavylinenbandage": [
        "Heavy Linen Bandage",
        "2 Linen Cloth",
        {
          "kind": "trainer"
        }
      ],
      "woolbandage": [
        "Wool Bandage",
        "1 Wool Cloth",
        {
          "kind": "trainer"
        }
      ],
      "heavywoolbandage": [
        "Heavy Wool Bandage",
        "2 Wool Cloth",
        {
          "kind": "trainer"
        }
      ],
      "silkbandage": [
        "Silk Bandage",
        "1 Silk Cloth",
        {
          "kind": "trainer"
        }
      ],
      "heavysilkbandage": [
        "Heavy Silk Bandage",
        "2 Silk Cloth",
        {
          "kind": "Vendor",
          "skill": 180,
          "where": "Balai Lok'Wein, Brackenwall Village, Dustwallow Marsh (36.4, 30.4)",
          "alliance": "Deneb Walker, Stromgarde Keep, Arathi Highlands (27.0, 58.8)"
        }
      ],
      "mageweavebandage": [
        "Mageweave Bandage",
        "1 Mageweave Cloth",
        {
          "kind": "Vendor",
          "skill": 210,
          "where": "Balai Lok'Wein, Brackenwall Village, Dustwallow Marsh (36.4, 30.4)",
          "alliance": "Deneb Walker, Stromgarde Keep, Arathi Highlands (27.0, 58.8)"
        }
      ],
      "heavymageweavebandage": [
        "Heavy Mageweave Bandage",
        "2 Mageweave Cloth",
        {
          "kind": "Triage trainer",
          "skill": 240,
          "where": "Doctor Gregory Victor, Hammerfall, Arathi Highlands (73.4, 36.8)",
          "alliance": "Doctor Gustaf VanHowzen, Theramore, Dustwallow Marsh (67.6, 48.8)"
        }
      ],
      "runeclothbandage": [
        "Runecloth Bandage",
        "1 Runecloth",
        {
          "kind": "Triage trainer",
          "skill": 260,
          "where": "Doctor Gregory Victor, Hammerfall, Arathi Highlands (73.4, 36.8)",
          "alliance": "Doctor Gustaf VanHowzen, Theramore, Dustwallow Marsh (67.6, 48.8)"
        }
      ],
      "heavyruneclothbandage": [
        "Heavy Runecloth Bandage",
        "2 Runecloth",
        {
          "kind": "Triage trainer",
          "skill": 290,
          "where": "Doctor Gregory Victor, Hammerfall, Arathi Highlands (73.4, 36.8)",
          "alliance": "Doctor Gustaf VanHowzen, Theramore, Dustwallow Marsh (67.6, 48.8)"
        }
      ]
    }
  }
};
