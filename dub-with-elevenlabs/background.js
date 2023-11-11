let dubbingTabId = null;
let videoDetails = {};
let intervalID = null;

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === dubbingTabId && changeInfo.status === 'complete' && tab.url.includes('https://elevenlabs.io/dubbing')) {
        chrome.scripting.executeScript({
            target: {
                tabId: tabId
            },
            function: injectDataIntoPage,
            args: [videoDetails]
        });

        // Add an interval to periodically check for updates. This will depends on your implementation of `checkStatus`
        intervalID = setInterval(() => {
            chrome.scripting.executeScript({
                target: {
                    tabId: tabId
                },
                function: checkStatus,
            });
        }, 5000); // check every 5 seconds

        dubbingTabId = null;
    } else if (tabId === dubbingTabId && changeInfo.status == 'loading') {
        // Clear the interval when the tab begins to load a new page
        clearInterval(intervalID);
    }
});

function checkStatus() {
    // Depends on how you can obtain the status from the page
    const statusElement = document.querySelector(".status-selector");
    const status = statusElement ? statusElement.textContent : "status not found";

    // Send the status back to the content script so it can be displayed on the button
    chrome.runtime.sendMessage({
        action: "updateDubStatus",
        status: status
    });
}

chrome.runtime.onInstalled.addListener(() => {
    console.log('Dub with ElevenLabs extension installed.');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "openDubbingPage") {
        videoDetails = {
            name: message.videoName,
            url: message.url
        };
        chrome.tabs.create({
            url: 'https://elevenlabs.io/dubbing'
        }, (tab) => {
            dubbingTabId = tab.id;
        });
        sendResponse({
            status: 'success'
        });
    }
    return true;
});

function injectDataIntoPage(videoDetails, callback) {
    function waitForElement(querySelectorOrXPath, isXPath, callback) {
        const checkExist = setInterval(() => {
            let element;
            if (isXPath) {
                element = document.evaluate(querySelectorOrXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            } else {
                element = document.querySelector(querySelectorOrXPath);
            }

            if (element) {
                clearInterval(checkExist);
                callback(element);
            }
        }, 2000);
    }

    waitForElement('/html/body/div[1]/div[4]/div/div/div[2]/button', true, (createNewDub) => {
        createNewDub.click();
        console.log('Create New Dub button clicked.');

        waitForElement("//*[contains(text(),'Youtube')]", true, (youtubeOption) => {
            youtubeOption.click();
            console.log('Youtube option clicked.');

            const parentDiv = document.querySelector('.mb-4.w-full');
            if (parentDiv) {
                const inputElement = parentDiv.querySelector('input');
                if (inputElement) {
                    inputElement.value = videoDetails.name;
                    console.log(`Selected video name: ${videoDetails.name}`);
                    inputElement.style.border = '2px solid red';
                    inputElement.dispatchEvent(new Event('input', {
                        bubbles: true
                    }));
                }
            }

            const videoNameInput = document.querySelector("input[placeholder='Untitled']");
            if (videoNameInput) {
                videoNameInput.value = videoDetails.name;
                console.log(`Selected video name: ${videoDetails.name}`);
                videoNameInput.style.border = '2px solid red';
                videoNameInput.dispatchEvent(new Event('input', {
                    bubbles: true
                }));
            }

            const videoUrlInput = document.querySelector("input[placeholder='https://www.youtube.com/watch?v=XYLgwxbwEb8']");
            if (videoUrlInput) {
                videoUrlInput.value = videoDetails.url;
                videoUrlInput.style.border = '2px solid red';
                console.log(`Selected video url: ${videoDetails.url}`);
                videoUrlInput.dispatchEvent(new Event('input', {
                    bubbles: true
                }));
            }

            function selectButtonWithHighestIdentifier() {
                const buttons = document.querySelectorAll('button[id^="popover-trigger-"]');
                let highestIdentifier = '';
                let highestButtonElement = null;

                buttons.forEach(button => {
                    const idParts = button.id.split(':');
                    const identifier = idParts[idParts.length - 2];
                    if (identifier > highestIdentifier) {
                        highestIdentifier = identifier;
                        highestButtonElement = button;
                    }
                });

                return highestButtonElement;
            }

            let highestButtonElement = selectButtonWithHighestIdentifier();
            if (highestButtonElement) {
                highestButtonElement.style.border = '2px solid red';
                highestButtonElement.click();
                console.log('Target Language button clicked.');

                setTimeout(() => {
                    const spanElements = document.querySelectorAll("span");
                    spanElements.forEach((span) => {
                        if (span.textContent.includes('Hindi')) {
                            console.log('Hindi language selected.');
                            span.click();
                        }
                    });
                }, 2000);

                setTimeout(() => {
                    const createDubButton = document.querySelector(".btn.btn-primary.btn-md.btn-normal");

                    if (createDubButton) {
                        createDubButton.click();
                        console.log('Create Dub button clicked.');
                    } else {
                        console.error('Create Dub button not found.');
                    }
                }, 10000);

                setTimeout(() => {
                    const firstRow = document.querySelector('tbody tr:first-child');
                    // Code to get the first row of a table, you need to define or select 'firstRow' before this block
                    const firstRowData = {
                        name: firstRow.querySelector('td:nth-child(1)').textContent.trim(),
                        language: firstRow.querySelector('td:nth-child(2)').textContent.trim(),
                        status: firstRow.querySelector('td:nth-child(3)').textContent.trim(),
                        created: firstRow.querySelector('td:nth-child(4)').textContent.trim()
                    };

                    console.log(firstRowData);

                    // Send the entire row data back to the content script and display it on the button
                    chrome.runtime.sendMessage({
                        action: "updateDubStatus",
                        status: firstRowData.status
                    });
                }, 20000);
            }
        });
    });
}