VindiCalc
=========

Script suitable for a Google spreadsheet to calculate the cost of crafting an item based on market values

###Usage

####Setting Up

1. Create a Google spreadsheet.
2. Go to Tools> Script Editor> Create script for blank project
3. Delete all the auto-generated gumph
4. Paste in the code from here

#####Registering the Event Handler
1. Still in the script editor open Reasouces> All your triggers
2. Click to add a trigger
3. Pull the dropdown for 'Run' and select 'thisEditScript'
4. For the 'Events' dropdowns select 'From spreadsheet' and 'On edit'
5. Save the trigger
6. You can close the script editor now
7. Back in the spreadsheet input "1" into cell B2 and the name of an item in cell A2 in order to initialize the UI cells for the first time.
8. Additional end user instructions can be found at the excellent [VindictusDB](http://vindictusdb.com/craft-calc) website


###To Contributors
I know the code is a bit ugly. All the functions are in one file, it's full of commented code kept for later memory, and it's probably quite inefficient. Feel free to fix it up. However unless there's an easy way to import a GIT repo to a Google doc that I'm unaware of (which is quite likely tbh) I'd actually prefer to leave the code in a single file. Makes it easier for people to import into a new sheet.
