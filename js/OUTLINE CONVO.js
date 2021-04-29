/**
 * Tests and samples array of movement data to add to Path Object
 * Also tests conversation data to closest time value in movement data to add to Path object
 * @param  {Results [] from PapaParse} results
 * @param  {File} file
 */
function processMovementFile(results, pathName) {
    let movement = []; // Array to hold Point_Movement objects
    let conversation = []; // Array to hold Point_Conversation
    let conversationCounter = 0;
    for (let i = 0; i < results.data.length; i++) {
        // Sample movement row and test if row is good data
        if (testSampleMovementData(results.data, i) && testMovementDataRowForType(results.data, i)) {
            movement.push(createMovementPoint(results.data, i)); // always add to movement []
            
            if (testConversationDataLengthAndRowForType(conversationCounter) && m.time >= conversationFileResults[conversationCounter][conversationHeaders[0]]) {
                conversation.push(processConversation(conversationCounter, m.xPos, m.yPos));
                conversationCounter++;
                // 3 Cases in while loop
                while (conversationCounter < conversationFileResults.length) {
                    const curConversationTime = conversationFileResults[conversationCounter][conversationHeaders[0]];
                    const priorConversationTime = conversationFileResults[conversationCounter - 1][conversationHeaders[0]]
                    if (curConversationTime === priorConversationTime) {
                        conversation.push(createConversationPoint(conversationCounter, m.xPos, m.yPos));
                        conversationCounter++;
                    } else if (i + 1 < results.data.length && curConversationTime < results.data[i + 1][movementHeaders[0]]) {
                        conversation.push(processConversation(conversationCounter, m.xPos, m.yPos));
                        conversationCounter++;
                    } else break;
                }
            } else if (!testConversationDataLengthAndRowForType(conversationCounter)) conversationCounter++;
        }
    }
    updatePaths(pathName, movement, conversation);
}

function createMovementPoint(data, curRow) {
    let m = new Point_Movement();
    m.time = data[curRow][movementHeaders[0]];
    m.xPos = data[curRow][movementHeaders[1]];
    m.yPos = data[curRow][movementHeaders[2]];
    return m;
}