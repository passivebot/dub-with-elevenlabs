let videoDetails = {}; // Initialize videoDetails to an empty object.
let dubbingTabId = null; // Declare dubbingTabId outside to keep track of the tab.

chrome.runtime.onInstalled.addListener(() => {
    console.log('Dub with ElevenLabs extension installed.');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
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
        } else if (message.action === "foundSignUpText") {
            chrome.tabs.create({
                url: 'https://try.elevenlabs.io/c3516gvcplb3'
            });
        }
    } catch (error) {
        console.error('Error in message listener:', error);
    }
    return true; // Keep the message channel open for asynchronous response.
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    try {
        if (dubbingTabId && tabId === dubbingTabId && changeInfo.status === 'complete' && tab.url.includes('https://elevenlabs.io/dubbing')) {
            console.log('Dubbing page loaded. Checking for sign up text.');
            chrome.scripting.executeScript({
                target: {
                    tabId: tabId
                },
                func: checkForSignUpText
            });
            dubbingTabId = null;
        } else if (tab.url.includes('https://elevenlabs.io/dubbing') && changeInfo.status === 'complete') {
            console.log('Dubbing page loaded. Injecting data into the page.');
            chrome.scripting.executeScript({
                target: {
                    tabId: tabId
                },
                func: injectDataIntoPage,
                args: [videoDetails]
            });
        }
    } catch (error) {
        console.error('Error in tabs onUpdated listener:', error);
    }
});

function checkForSignUpText() {
    try {
        const bodyText = document.body.textContent || document.body.innerText;
        const hasSignUpText = bodyText.includes("Sign up");

        if (hasSignUpText) {
            chrome.runtime.sendMessage({
                action: "foundSignUpText"
            });
        }
    } catch (error) {
        console.error('Error in checkForSignUpText:', error);
    }
}


function injectDataIntoPage(videoDetails) {
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
        }, 100); // check every 100ms
    }

    // Use the same XPath to locate the 'Create New Dub' button
    waitForElement('/html/body/div[1]/div[4]/div/div/div[2]/button', true, (createNewDub) => {
        createNewDub.click();

        // After clicking 'Create New Dub', wait for the YouTube option to be available
        // Assume 'Youtube' is a unique text within a clickable element like a button or a list item
        waitForElement("//*[contains(text(),'Youtube')]", true, (youtubeOption) => {
            youtubeOption.click();

            // Select the parent div element by its class name "mb-4 w-full"
            const parentDiv = document.querySelector('.mb-4.w-full');
            if (parentDiv) {
                const inputElement = parentDiv.querySelector('input');
                if (inputElement) {
                    inputElement.value = videoDetails.name;
                    inputElement.style.border = '2px solid red';
                    inputElement.dispatchEvent(new Event('input', {
                        bubbles: true
                    }));
                }
            }

            const videoNameInput = document.querySelector("input[placeholder='Untitled']");
            if (videoNameInput) {
                videoNameInput.value = videoDetails.name;
                videoNameInput.style.border = '2px solid red';
                videoNameInput.dispatchEvent(new Event('input', {
                    bubbles: true
                }));
            }

            const videoUrlInput = document.querySelector("input[placeholder='https://www.youtube.com/watch?v=XYLgwxbwEb8']");
            if (videoUrlInput) {
                videoUrlInput.value = videoDetails.url;
                videoUrlInput.style.border = '2px solid red';
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

            highestButtonElement = selectButtonWithHighestIdentifier();
            if (highestButtonElement) {
                highestButtonElement.style.border = '2px solid red';
                highestButtonElement.click();

                setTimeout(() => {
                    const spanElements = document.querySelectorAll("span");
                    spanElements.forEach((span) => {
                        if (span.textContent.includes('Hindi')) {
                            span.click();
                        }
                    }, 2000); // 2000 milliseconds = 2 seconds
                });

                setTimeout(() => {
                    // Wait for 10 seconds before clicking the 'Create Dub' button so that tokens are calculated
                    const createDubButton = document.querySelector(".btn.btn-primary.btn-md.btn-normal");

                    if (createDubButton) {
                        // Click on the 'Create Dub' button
                        createDubButton.click();
                        console.log('Dub created successfully.');
                    } else {
                        console.error('Create Dub button not found.');
                    }
                }, 10000);


            }
        });
    });
}