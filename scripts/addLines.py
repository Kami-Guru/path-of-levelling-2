clientTxtFile = open('/home/punchingbag/.steam/root/steamapps/common/Path of Exile 2/logs/Client.txt', "a")


#Insert a line to the client file - simulate changing zone.
zoneCode = input("Enter zone code:")
print("zoneCode selected", zoneCode)

monsterLevel = int(input("Enter monster level:"))
print("monsterLevel selected", monsterLevel)

lineToWrite = f'Generating level {monsterLevel} area "{zoneCode}" with seed'
print("writing line:", lineToWrite)
clientTxtFile.write(lineToWrite + "\n")

clientTxtFile.close()



"""
#simulate player level up
playerLevel = input("Enter player level:")
print("playerLevel selected", playerLevel)

lineToWrite = f'is now level {playerLevel}'
print("writing line:", lineToWrite)
clientTxtFile.write(lineToWrite + "\n")

clientTxtFile.close()
"""