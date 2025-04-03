import os 

# This is just copied from zoneReference.json
test = {
	"acts": [
		{
			"name": "Act 1",
			"zones": [
				{
					"code": "G1_1",
					"name": "The Riverbank"
				},
				{
					"code": "G1_2",
					"name": "Clearfell"
				},
				{
					"code": "G1_3",
					"name": "Mud Burrow"
				},
				{
					"code": "G1_4",
					"name": "The Grelwood"
				},
				{
					"code": "G1_5",
					"name": "The Red Vale"
				},
				{
					"code": "G1_6",
					"name": "The Grim Tangle"
				},
				{
					"code": "G1_7",
					"name": "Cemetary Of The Eternals"
				},
				{
					"code": "G1_8",
					"name": "Mausoleum Of The Praetor"
				},
				{
					"code": "G1_9",
					"name": "Tomb Of The Consort"
				},
				{
					"code": "G1_11",
					"name": "Hunting Grounds"
				},
				{
					"code": "G1_12",
					"name": "Freythorn"
				},
				{
					"code": "G1_13_1",
					"name": "Ogham Farmlands"
				},
				{
					"code": "G1_13_2",
					"name": "Ogham Village"
				},
				{
					"code": "G1_14",
					"name": "The Manor Ramparts"
				},
				{
					"code": "G1_15",
					"name": "Ogham Manor"
				}
			]
		},
		{
			"name": "Act 2",
			"zones": [
				{
					"code": "G2_1",
					"name": "Vastiri Outskirts"
				},
				{
					"code": "G2_2",
					"name": "Traitor's Passage"
				},
				{
					"code": "G2_3",
					"name": "The Halani Gates"
				},
				{
					"code": "G2_4_1",
					"name": "Keth"
				},
				{
					"code": "G2_4_2",
					"name": "The Lost City"
				},
				{
					"code": "G2_4_3",
					"name": "Buried Shrines"
				},
				{
					"code": "G2_5_1",
					"name": "Mastodon Badlands"
				},
				{
					"code": "G2_5_2",
					"name": "The Bone Pits"
				},
				{
					"code": "G2_6",
					"name": "Valley Of The Titans"
				},
				{
					"code": "G2_7",
					"name": "The Titan Grotto"
				},
				{
					"code": "G2_8",
					"name": "Deshar"
				},
				{
					"code": "G2_9_1",
					"name": "Path Of Mourning"
				},
				{
					"code": "G2_9_2",
					"name": "The Spires Of Deshar"
				},
				{
					"code": "G2_10_1",
					"name": "Mawdun Quarry"
				},
				{
					"code": "G2_10_2",
					"name": "Mawdun Mine"
				},
				{
					"code": "G2_12_1",
					"name": "The Dreadnought"
				},
				{
					"code": "G2_12_2",
					"name": "Drednought Vanguard"
				}
			]
		},
		{
			"name": "Act 3",
			"zones": [
				{
					"code": "G3_1",
					"name": "Sandswept Marsh"
				},
				{
					"code": "G3_2_1",
					"name": "Infested Barrens"
				},
				{
					"code": "G3_2_2",
					"name": "The Matlan Waterways"
				},
				{
					"code": "G3_3",
					"name": "Jungle Ruins"
				},
				{
					"code": "G3_4",
					"name": "The Venom Crypts"
				},
				{
					"code": "G3_5",
					"name": "Chimeral Wetlands"
				},
				{
					"code": "G3_6_1",
					"name": "Jiquani's Machinarium"
				},
				{
					"code": "G3_6_2",
					"name": "Jiquani's Sanctum"
				},
				{
					"code": "G3_7",
					"name": "The Azak Bog"
				},
				{
					"code": "G3_8",
					"name": "The Drowned City"
				},
				{
					"code": "G3_9",
					"name": "The Molten Vault"
				},
				{
					"code": "G3_11",
					"name": "Apex Of Filth"
				},
				{
					"code": "G3_12",
					"name": "Temple of Kopec"
				},
				{
					"code": "G3_14",
					"name": "Utzaal"
				},
				{
					"code": "G3_16_",
					"name": "Aggorat"
				},
				{
					"code": "G3_17",
					"name": "The Black Chambers"
				}
			]
		},
		{
			"name": "Act 4",
			"zones": [
				{
					"code": "C_G1_1",
					"name": "The Riverbank"
				},
				{
					"code": "C_G1_2",
					"name": "Clearfell"
				},
				{
					"code": "C_G1_3",
					"name": "Mud Burrow"
				},
				{
					"code": "C_G1_4",
					"name": "The Grelwood"
				},
				{
					"code": "C_G1_5",
					"name": "The Red Vale"
				},
				{
					"code": "C_G1_6",
					"name": "The Grim Tangle"
				},
				{
					"code": "C_G1_7",
					"name": "Cemetary Of The Eternals"
				},
				{
					"code": "C_G1_8",
					"name": "Mausoleum Of The Praetor"
				},
				{
					"code": "C_G1_9",
					"name": "Tomb Of The Consort"
				},
				{
					"code": "C_G1_11",
					"name": "Hunting Grounds"
				},
				{
					"code": "C_G1_12",
					"name": "Freythorn"
				},
				{
					"code": "C_G1_13_1",
					"name": "Ogham Farmlands"
				},
				{
					"code": "C_G1_13_2",
					"name": "Ogham Village"
				},
				{
					"code": "C_G1_14",
					"name": "The Manor Ramparts"
				},
				{
					"code": "C_G1_15",
					"name": "Ogham Manor"
				}
			]
		},
		{
			"name": "Act 5",
			"zones": [
				{
					"code": "C_G2_1",
					"name": "Vastiri Outskirts"
				},
				{
					"code": "C_G2_2",
					"name": "Traitor's Passage"
				},
				{
					"code": "C_G2_3",
					"name": "The Halani Gates"
				},
				{
					"code": "C_G2_4_1",
					"name": "Keth"
				},
				{
					"code": "C_G2_4_2",
					"name": "The Lost City"
				},
				{
					"code": "C_G2_4_3",
					"name": "Buried Shrines"
				},
				{
					"code": "C_G2_5_1",
					"name": "Mastodon Badlands"
				},
				{
					"code": "C_G2_5_2",
					"name": "The Bone Pits"
				},
				{
					"code": "C_G2_6",
					"name": "Valley Of The Titans"
				},
				{
					"code": "C_G2_7",
					"name": "The Titan Grotto"
				},
				{
					"code": "C_G2_8",
					"name": "Deshar"
				},
				{
					"code": "C_G2_9_1",
					"name": "Path Of Mourning"
				},
				{
					"code": "C_G2_9_2",
					"name": "The Spires Of Deshar"
				},
				{
					"code": "C_G2_10_1",
					"name": "Mawdun Quarry"
				},
				{
					"code": "C_G2_10_2",
					"name": "Mawdun Mine"
				},
				{
					"code": "C_G2_12_1",
					"name": "The Dreadnought"
				},
				{
					"code": "C_G2_12_2",
					"name": "Drednought Vanguard"
				}
			]
		},
		{
			"name": "Act 6",
			"zones": [
				{
					"code": "C_G3_1",
					"name": "Sandswept Marsh"
				},
				{
					"code": "C_G3_2_1",
					"name": "Infested Barrens"
				},
				{
					"code": "C_G3_2_2",
					"name": "The Matlan Waterways"
				},
				{
					"code": "C_G3_3",
					"name": "Jungle Ruins"
				},
				{
					"code": "C_G3_4",
					"name": "The Venom Crypts"
				},
				{
					"code": "C_G3_5",
					"name": "Chimeral Wetlands"
				},
				{
					"code": "C_G3_6_1",
					"name": "Jiquani's Machinarium"
				},
				{
					"code": "C_G3_6_2",
					"name": "Jiquani's Sanctum"
				},
				{
					"code": "C_G3_7",
					"name": "The Azak Bog"
				},
				{
					"code": "C_G3_8",
					"name": "The Drowned City"
				},
				{
					"code": "C_G3_9",
					"name": "The Molten Vault"
				},
				{
					"code": "C_G3_11",
					"name": "Apex Of Filth"
				},
				{
					"code": "C_G3_12",
					"name": "Temple of Kopec"
				},
				{
					"code": "C_G3_14",
					"name": "Utzaal"
				},
				{
					"code": "C_G3_16_",
					"name": "Aggorat"
				},
				{
					"code": "C_G3_17",
					"name": "The Black Chambers"
				}
			]
		}
	]
}

print(test)

for act in test['acts']:
    for zone in act['zones']:
        try:
            os.mkdir('C:\git\PathOfLevellingaaahhh\\assets\Layout Images\\' + zone['code'] + " " + zone['name'])
        
        except:
            print('Could not create', zone['code'], zone['name'])
        
        
        


