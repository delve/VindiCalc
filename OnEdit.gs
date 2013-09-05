var DEBUG = false;
var VERSION = "1.3";

var EVENT_COL_START=1;
var EVENT_COL_END=4;
var EVENT_ROW_START=2;
var EVENT_ROW_END=2;

var ITEMNAMECELL="A2";
var XMLMODECELL="B2";
var SETNAMECELL="C2";
var SETMODECELL="D2";
var ERRMSGCELL="A3";

var RECIPE_START_ROW = 5;
var LASTROW = 50;


function debugFunc(){
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  //clear the recipe list
  blankRecipe("no message",sheet);

  //set all the important UI features
  resetSpreadsheet(sheet);
  
  //setup headers, total formula
  setupRecipeChart(sheet, 2);

  //edit event handler, requires event
  //thisEditScript();
  
  //output recipe
  //processSimpleXML(getXML("temptress gloves", "1"),sheet);
  
  //unimplemented
  //processCompleteXML(getXML("Jagursh's Bloodletters", 2), sheet);
    
  //request and process XML
  getXML("BROKEN", 1);
}

function mylog(msg){
  if (DEBUG){
    Logger.log(msg)
  }
}

function thisEditScript(event) {
  //mylog(event)
  mylog("colStart: " + event.range.columnStart + " |colEnd: " + event.range.columnEnd);
  mylog("rowStart: " + event.range.rowStart + " |rowEnd: " + event.range.rowEnd );

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var xmlMode = sheet.getRange(XMLMODECELL).getValue();

  //confirm range of edit event, check column
  if(event.range.columnStart >= EVENT_COL_START && event.range.columnEnd <= EVENT_COL_END)
  {
    //confirm range of edit event, check row
    if(event.range.rowStart >= EVENT_ROW_START && event.range.rowEnd <= EVENT_ROW_END)
    {
      //correct range identified, so do stuff
      mylog("Got Range");
      //clear the providers
      providers = "";
      //Validate XML mode requested
      if(xmlMode != "1" && xmlMode != "2")
      {
        blankRecipe("Invalid mode, valid values are 1 and 2. Halting.", sheet);
        return;
      }
      var XMLrecipe = getXML(sheet.getRange(ITEMNAMECELL).getValue(), xmlMode);
      if(XMLrecipe != -1)
      {
        //write out the recipe
        if(xmlMode == 1)
          processSimpleXML(XMLrecipe, sheet);
        else
          processCompleteXML(XMLrecipe, sheet);    
      }
    }
  }
  
  //clean up the spreadsheet
  resetSpreadsheet(sheet);
  setupRecipeChart(sheet,xmlMode);

  mylog("thisEditScript() Complete");
}

function getXML(itemName, xmlMode){
  mylog("Generating URI for " + itemName + " in mode " + xmlMode);
  //log the providers
  //providers["Item Data"] = "=hyperlink(\"www.vindictusdb.com\",\"Vindictus DB\")"
  //generate the request URI
  var requestURL = "http://vindictusdb.com/recipe?i=" + encodeURIComponent(itemName) + "&xml=" + encodeURIComponent(xmlMode);
  mylog("Fetching " + requestURL);
  //get the text of the XML from the URI
  var fetchedXML = UrlFetchApp.fetch(requestURL);
  mylog(fetchedXML);
  fetchedXML = fetchedXML.getContentText();

  //test for recipe (verifies user input item name) zoink
  if(fetchedXML == "")
  { //fetched URL was empty not a valid recipe XML
    blankRecipe("Item name not valid. Please note that the calculator currently does not handle item sets or expertise recipes. Those are in developement.", SpreadsheetApp.getActiveSpreadsheet().getActiveSheet());
    return -1;
  }

  //uncomment and create a DEBUG sheet to capture raw XML
  //if (DEBUG) SpreadsheetApp.getActive().getSheetByName("DEBUG").getRange("A1").setValue(fetchedXML);
  var xmldoc = Xml.parse(fetchedXML, true);

  mylog(xmldoc);
  mylog("getXML() Complete");
  return xmldoc;
}

function processSimpleXML(xmldoc, outputSheet){
  blankRecipe("", outputSheet);
  //Output the crafting gold required
  var gold = xmldoc.recipe.ingredients.ingredient.cost.getText();
  mylog("Gold: " + gold);
  outputSheet.getRange("A" + RECIPE_START_ROW).setValue("Gold (money)");
  outputSheet.getRange("B" + RECIPE_START_ROW).setValue(gold);
  
  //Output the reagents required
  var reagents = xmldoc.recipe.ingredients.ingredient.getElements("reagent");
  mylog(reagents);
  if (!reagents || reagents.length == 0)
  {     
    reagentOutputRange.setValue("bad or no reagents found");
  } 
  
  var reagentOutputRange = outputSheet.getRange("A" + (RECIPE_START_ROW + 1));
  var reagent;
  for (var reagentIndex = 0; reagentIndex < reagents.length; ++reagentIndex) 
  {
    mylog(reagentIndex);
    reagent = reagents[reagentIndex];
    mylog(reagent);
    name = reagent.getElement("name").getText();
    count = reagent.getElement("count").getText()
    mylog("reagent: " + name + "|Count: " + count);
    reagentOutputRange.offset(reagentIndex, 0).setValue(name);
    reagentOutputRange.offset(reagentIndex, 1).setValue(count);
    //reset market price
    reagentOutputRange.offset(reagentIndex, 2).setValue(0);
    //reset inventory count
    reagentOutputRange.offset(reagentIndex, 3).setValue(0);
    //subtotal formula
    reagentOutputRange.offset(reagentIndex, 4).setFormulaR1C1("=if(isnumber(R[0]C[-3]),if((R[0]C[-3]-R[0]C[-1])>0,(R[0]C[-3]-R[0]C[-1])*R[0]C[-2],0),\"\")");
  }
  mylog("processSimpleXML() Complete");
}

//------------------------------------------------------------
//    Ingredient Class
function Ingredient(myXML){
  this.name = myXML.getElement("name").getText();
  this.craftCost = myXML.getElement("cost").getText();
  this.recipe = getXML(this.name, 1).recipe.ingredients.ingredient.getElements("reagent");
  this.count = 0;
}
//    End Ingredient Class
//------------------------------------------------------------

function processCompleteXML(xmldoc, outputSheet){
  blankRecipe("Complete Recipe mode is currently not working well and is still in developement.", outputSheet);
  var ingredients = xmldoc.recipe.ingredients.getElements("ingredient");
  mylog(ingredients);

  //Output the crafting gold required
  //var gold = ingredients[0].cost.getText();
  //mylog("Gold: " + gold);
  //outputSheet.getRange("A6").setValue("Gold (money)");
  //outputSheet.getRange("B6").setValue(gold);
  
  //Output the reagents required
  var reagentOutputRange = outputSheet.getRange("A" + (RECIPE_START_ROW +1));

  if (!ingredients || ingredients.length == 0)
  {     
    reagentOutputRange.setValue("bad or no reagents found");
  } 

  //array of ingredient objects
  var objIngredients = "";
  var rowoffset = 0;
  var ingredient;
  var reagents;
  var reagent;
  for (var ingredIndex = 0; ingredIndex < ingredients.length; ++ingredIndex)
  {
    ingredient = ingredients[ingredIndex];
    reagents = ingredient.getElements("reagent");
    //mylog(reagents);

    name = ingredient.getElement("name").getText();
    cost = ingredient.getElement("cost").getText();
    
    reagentOutputRange.offset(rowoffset, 0).setValue(name);
    reagentOutputRange.offset(rowoffset, 1).setValue(cost);
    
    objIngredients[ingredIndex] = new Ingredient(ingredient);
    mylog(objIngredients);
    
    //++rowoffset;
    
    for (var reagentIndex = 0; reagentIndex < reagents.length; ++reagentIndex) 
    {
      //mylog("reagentIndex: " + reagentIndex);
      reagent = reagents[reagentIndex];
      //mylog(reagent);
      name = reagent.getElement("name").getText();
      count = reagent.getElement("count").getText()
      mylog("reagent: " + name + "|Count: " + count);
      reagentOutputRange.offset(rowoffset, 2).setValue(name);
      reagentOutputRange.offset(rowoffset, 3).setValue(count);
      //reset market price
      reagentOutputRange.offset(rowoffset, 4).setValue(0);
      //reset inventory count
      reagentOutputRange.offset(rowoffset, 5).setValue(0);
      //subtotal formula
      reagentOutputRange.offset(rowoffset, 6).setFormulaR1C1("=if(isnumber(R[0]C[-3]),if((R[0]C[-3]-R[0]C[-1])>0,(R[0]C[-3]-R[0]C[-1])*R[0]C[-2],0),\"\")");
      ++rowoffset;
    }
  }
  mylog("processCompleteXML() Complete");
}

function resetSpreadsheet(sheet){
  //random temporary throwaway variable
  var tmp;
  //Reset background colors
  mylog("Resetting background color");
  sheet.getRange("A1:K" + LASTROW).setBackground("#FFFFFF");
  sheet.getRange("A2:D2").setBackground("yellow");
  
  mylog("Resetting user prompts");
  sheet.getRange("A1").setValue("Enter exact item name, case insensitive");
  sheet.getRange("B1").setValue("Type: 1 for simple 2 for complete");
  //TODO:
  sheet.getRange("C1").setValue("Enter Set Name to calc the entire set (UNIMPLEMENTED)");
  sheet.getRange("D1").setValue("Enter complete or summary for set crafting (UNIMPLEMENTED)");
  sheet.getRange("E1").setFormula("=hyperlink(\"vindictusdb.com\",\"Information supplied by Vindictus DB\")");
  sheet.getRange("F1").setValue("Version: " + VERSION);
  sheet.getRange("G1").setValue("If someone else is currently using this tab you can use or create a different tab by clicking the tab at the bottom and selecting 'duplicate'");
  mylog("resetSpreadsheet() Complete");
}

function setupRecipeChart(outputSheet, xmlMode){
  mylog("Setting up recipe chart for selected mode");
  //clear RECIPE_START_ROW - 1 so it's blank prior to writing
  if(xmlMode == 1){
    var headerRange="A" + (RECIPE_START_ROW - 1);
    mylog("headerRange= " + headerRange);
    var tmprange = outputSheet.getRange(headerRange);
    tmprange.setValue("Mats Required");
    tmprange.offset(0, 1).setValue("Count");
    tmprange.offset(0, 2).setValue("Market Price");
    tmprange.offset(0, 3).setValue("In Your Inventory");
    tmprange.offset(0, 4).setValue("Subtotal");
    tmprange.offset(0, 5).setValue("Total");
    //blank these to clean up from mode 2
    tmprange.offset(0, 6).setValue("");
    tmprange.offset(0, 7).setValue("");
    tmprange.offset(0, 8).setValue("");

    //gold entry
    outputSheet.getRange("E" + RECIPE_START_ROW).setFormula("=B" + RECIPE_START_ROW);
    //total value
    outputSheet.getRange("G" + (RECIPE_START_ROW - 1)).setFormula("=SUM(E" + RECIPE_START_ROW + ":E" + LASTROW + ")");
  }

  if(xmlMode == 2){
    var headerRange="A" + (RECIPE_START_ROW - 1);
    mylog("headerRange= " + headerRange);
    var tmprange = outputSheet.getRange(headerRange);
    tmprange.setValue("Ingredients Required");
    tmprange.offset(0, 1).setValue("Ingredient Crafting Cost");
    tmprange.offset(0, 2).setValue("Sub-reagent");
    tmprange.offset(0, 3).setValue("Count");
    tmprange.offset(0, 4).setValue("Market");
    tmprange.offset(0, 5).setValue("Inventory");
    tmprange.offset(0, 6).setValue("SubTotal");
    tmprange.offset(0, 7).setValue("TOTAL");
    //total value
    tmprange.offset(0, 8).setFormula("=SUM(E" + RECIPE_START_ROW + ":E50)");
  }

  mylog("setupRecipeChart() Complete");
}

function blankRecipe(msg, sheet){
  mylog(msg);
  sheet.getRange(ERRMSGCELL).setValue(msg);
  //TODO: adjust this to a for loop with LASTROW-RECIPE_START_ROW iterations
  var values = [[" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "],
                [" "," "," "," "," "," "," "]];
  sheet.getRange("A" + RECIPE_START_ROW + ":G" + LASTROW).setValues(values);
  mylog("blankRecipe() Complete");
}
