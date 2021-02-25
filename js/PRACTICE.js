let loadData = true;

function keyPressed() {
    if (loadData) {
        loadExample(example_2);
        loadData = false;
    }
}

function loadExample(params) {
    updateData = true; // trigger update data
    processVideo(params[4], params[5]);

    fetch(new Request(params[0] + params[1])).then(function (response) {
        return loadImage(params[0] + params[1], img => {
            processFloorPlan(img);
        })
    }).then(fetch(new Request(params[0] + params[2])).then(function (response) {
        return response.arrayBuffer();
    })).then(function (buffer) {
        conversationFileResults = new File([buffer], params[2], {
            type: "text/csv",
        });
        parseExampleConversationFile(conversationFileResults);
    }).then(function () {
        for (let i = 0, p = Promise.resolve(); i < params[3].length; i++) {
            p = p.then(_ => new Promise(resolve =>
                setTimeout(function () {
                    let myRequest = new Request(params[0] + params[3][i]);
                    fetch(myRequest).then(function (response) {
                        return response.arrayBuffer();
                    }).then(function (buffer) {
                        return new File([buffer], params[3][i], {
                            type: "text/csv",
                        })
                    }).then(function (file) {
                        parseExampleMovementFile(file);
                    }).catch(function (error) {
                        print("Error loading example movement file");
                    });
                    resolve();
                })));
        }
    }).catch(function (error) {
        print("Error loading example conversation file");
    });
}