/**
 * Selects load data or example data option
 * NOTE: called from user selection in drop down menu
 * NOTE: Calls input bar and clears all data for load data 
 */
function selectDataLoadOption() {
  if (videoIsShowing) overVideoButton(); // Turn off video that if showing
  if (showIntroMsg) showIntroMsg = false; // Hide intro msg if showing
  let option = document.getElementById("examples").value;
  switch (option) {
    case "Load Data":
      clearAllData();
      showInputBar();
      break;
    case "Example 1":
      loadExample(example_1);
      break;
    case "Example 2":
      loadExample(example_2);
      allConversation = false; // not necessary, but fits example nicely
      break;
    case "Example 3":
      loadExample(example_3);
      allConversation = false; // not necessary, but fits example nicely
      break;
    case "Example 4":
      loadExample(example_4);
      allConversation = false; // not necessary, but fits example nicely
      break;
  }
}

function showInputBar() {
  let element = document.querySelector('.inputBar');
  element.style.display = 'block';
}

function hideInputBar() {
  let element = document.querySelector('.inputBar');
  element.style.display = 'none';
}
/**
 * Handles asynchronous loading of example data from a selected example array of data
 * @param  {[String directory, String floorPlan image file, String conversation File, String movement File[], String video platform, video params (see Video Player Interface)]} params
 */
async function loadExample(params) {
  hideInputBar();
  processVideo(params[4], params[5]);
  processFloorPlan(params[0] + params[1]);
  // Process conversation then movement files
  await getExampleConversationFile(params[0], params[2]).then(parseConversationFile);
  getExampleMovementFiles(params[0], params[3]).then(parseMovementFiles);
}

/**
 * Handles async loading of conversation file
 * NOTE: folder and filename are separated for convenience later in program
 * @param  {String} folder
 * @param  {String} fileName
 */
async function getExampleConversationFile(folder, fileName) {
  let response = await fetch(new Request(folder + fileName));
  let buffer = await response.arrayBuffer();
  return new File([buffer], fileName, {
    type: "text/csv",
  });
}
/**
 * Handles async loading of movement file
 * NOTE: folder and filename are separated for convenience later in program
 * @param  {String} folder
 * @param  {String} fileNames
 */
async function getExampleMovementFiles(folder, fileNames) {
  let fileList = [];
  for (let i = 0; i < fileNames.length; i++) {
    let response = await fetch(new Request(folder + fileNames[i]));
    let buffer = await response.arrayBuffer();
    fileList.push(new File([buffer], fileNames[i], {
      type: "text/csv",
    }));
  }
  return fileList;
}