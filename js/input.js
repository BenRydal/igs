// organize example data load and input data load functions

let updateData = false;

function readMovementFiles(input) {
  for (let i = 0; i < input.files.length; i++) {
    let file = input.files[i];
    Papa.parse(file, {
      complete: processMovementFile,
      header: true,
    });
  }
  if (updateData) processData();
}

function processMovementFile(results, file) {
  console.log("Parsing complete:", results, file);
  //if (testMovementHeaders(results.data, results.meta.fields)) {

  if (!updateData) {
    clearData();
    updateData = true;
  }
  movementDataTables.push(table);
  print(movementDataTables.length);
  // push to cleared movementFileFirstLetters.chatAt(0);
  //}
}

function readInputConversationFile(input) {
  let file = input.files[0];
  Papa.parse(file, {
    complete: processConversation,
    header: true,
  });
  // if (updateData) processData();
}

function readLocalConversationFile(input) { 
  Papa.parse(input, {
      complete: processConversation,
      header: true,
    });
  }

function processConversation(results, file) {
  console.log("Parsing complete:", results, file);
  if (testConversationHeaders(results.data, results.meta.fields)) {
    // if no errors
    //clear exisiting
    conversationTable = results.data; // set to new array of keyed values
    // updateData = true;
  }
}

// if image: replace floor plan and rerun movement?????
function readImageFile(input) {
  let file = input.files[0];
  let fileLocation = URL.createObjectURL(file);
  processFloorPlan(loadImage(fileLocation));
  // img.onload = function() {
  //   URL.revokeObjectURL(this.src);
  // }
  processData();
}

// Video File Button Reader (could have YouTube/others)
function readVideoFile(input) {
  let file = input.files[0];
  let fileLocation = URL.createObjectURL(file);
  movie.remove();
  movie = createVideo(fileLocation);
  movie.id('moviePlayer');
  movie.style('display', 'none');
  setupMovie('moviePlayer', 'File', {
    fileName: fileLocation
  });
  let video = select('#moviePlayer').position(timelineStart, 0); // position video in upper left corner on timeline
  processData();
}

function testMovementHeaders(data, meta) {
  return data > 0 && meta.includes(movementHeaders[0]) && meta.includes(movementHeaders[1]) && meta.includes(movementHeaders[2]);
}

function testConversationHeaders(data, meta) {
  return data > 0 && meta.includes(conversationHeaders[0]) && meta.includes(conversationHeaders[1]) && meta.includes(conversationHeaders[2]);
}

function clearData() {
  paths = [];
  speakerList = [];
  movementDataTables = [];
  rowCounts = [];
}

// // YOUTUBE BUTTON VIDEO READER??
// function readVideoFile(input) {
//   let file = input.files[0];
//   let fileLocation = URL.createObjectURL(file);
//   movie.remove();

//   let videoPlatform = 'File';
//   let videoParams = {
//     fileName: fileLocation
//   };

//   if (videoPlatform === 'File') movie = createVideo(fileLocation);
//   else movie = createDiv(); // create the div that will hold the video
//   movie.id('moviePlayer');
//   movie.style('display', 'none');
//   setupMovie('moviePlayer', videoPlatform, videoParams); // set up the video player
//   let video = select('#moviePlayer').position(timelineStart, 0); // position video in upper left corner on timeline
//   // RERUN DATA
// }










// if conversation, clear conversationTable? clear speakerList, clear paths then call -->
// process data (loads convo table and movement)
function handleInputConversation(file) {
  if (file.name.endsWith(".csv")) {
    let splitLines = split(file.data, "\n"); // split text file at first line break
    let splitHeaders = split(splitLines[0], ","); // split 1st line by comma to get headers

    let inputTable = new p5.Table(); // create table with headers

    for (let header = 0; header < splitHeaders.length; header++) inputTable.addColumn(splitHeaders[header]);
    // loop through csv file, split each line by comma and add row to table
    for (let i = 1; i < splitLines.length; i++) {
      let splitByComma = split(splitLines[i], ","); // split line by commas
      let newRow = inputTable.addRow();
      for (let j = 0; j < splitHeaders.length; j++) newRow.set(splitHeaders[j], splitByComma[j]);
    }
    // PROBLEM!!!! BELOW!!!!
    print(conversationTable.getString(0, conversationHeaders[2]));
    print(conversationTable.getColumnCount(), conversationTable.getRowCount());

    // try this, any errors don't clear table??
    conversationTable.clearRows();
    let rows = inputTable.getRows();
    for (let i = 0; i < rows.length; i++) {
      let updateRow = conversationTable.addRow();
      // updateRow.set(0, rows[i].get(0));
      // updateRow.set(1, rows[i].get(1));
      // updateRow.set(2, rows[i].get(2));
      updateRow.set(conversationHeaders[0], rows[i].get(splitHeaders[0]));
      updateRow.set(conversationHeaders[1], rows[i].get(splitHeaders[1]));
      updateRow.set(conversationHeaders[2], rows[i].get(splitHeaders[2]));
      // updateRow.set(conversationHeaders[0], rows[i].get(conversationHeaders[0]));
      // updateRow.set(conversationHeaders[1], rows[i].get(conversationHeaders[1]));
      // updateRow.set(conversationHeaders[2], rows[i].get(conversationHeaders[2]));
    }
    print(conversationTable.getString(0, conversationHeaders[2]));
    print(conversationTable.getColumnCount(), conversationTable.getRowCount());

    clearConversationArrays(); // clear
    //conversationTable = inputTable; // reassign
    //print(inputTable.getString(0, conversationHeaders[2]));
    processData();
  } else print("ERROR LOADING FILE");
}

// if movement: clear paths, clear dataTables then call -->
// for (let i = 0; i < dataTables.length; i++) loadMovementDataTable(dataTables[i], movementFiles[i].charAt(0), conversationTable);

function handleInputMovement(file) {
  if (file.name.endsWith(".csv")) { // if (file.type == "text")
    // split text file at first line break
    let splitLines = split(file.data, "\n");
    // split 1st line by comma to get headers
    let splitHeaders = split(splitLines[0], ",");
    // create table with headers
    let inputTable = new p5.Table();
    for (let i = 0; i < splitHeaders.length; i++) inputTable.addColumn(splitHeaders[i]);
    // loop through text file and split each line by comma and add row to table
    for (let i = 1; i < splitLines.length; i++) {
      let splitByComma = split(splitLines[i], ","); // split line by commas
      let newRow = inputTable.addRow();
      for (let j = 0; j < splitHeaders.length; j++) newRow.setNum(splitHeaders[j], splitByComma[j]);
    }
    // clear arrays
    print(dataTables.length);
    dataTables.push(inputTable);
    print(dataTables.length);
    // reSetData
  } else print("ERROR LOADING FILE");
}


// function readConversationFile(input) {
//   let file = input.files[0];
//   let fileLocation = URL.createObjectURL(file.data); 
//   let table = loadTable(fileLocation, "header");
//   print(table.getRowCount());
//   clearConversationArrays(); // clear
//   processData();
// }

  // let table = new p5.Table(); // create P5 table
  // for (let i = 0; i < movementHeaders.length; i++) table.addColumn(movementHeaders[i]);
  // // loop through data and add row for header columns
  // for (let i = 0; i < results.data.length; i++) {
  //   let newRow = table.addRow();
  //   for (let j = 0; j < movementHeaders.length; j++) newRow.set(movementHeaders[j], results.data[i][movementHeaders[j]]);
  // }
  // if no errors