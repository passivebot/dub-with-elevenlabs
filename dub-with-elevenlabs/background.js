let dubbingTabId = null;
let videoDetails = {};

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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === dubbingTabId && changeInfo.status === 'complete' && tab.url.includes('https://elevenlabs.io/dubbing')) {
        chrome.scripting.executeScript({
            target: {
                tabId: tabId
            },
            function: injectDataIntoPage,
            args: [videoDetails]
        });
        dubbingTabId = null;
    }
});

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

            // Print the video name and URL to the console
            console.log(`Video name: ${videoDetails.name}`);
            console.log(`Video URL: ${videoDetails.url}`);

            // Add a delay (e.g., 2 seconds) before continuing
            setTimeout(() => {
                // Select the parent div element by its class name "mb-4 w-full"
                const parentDiv = document.querySelector('.mb-4.w-full');

                if (parentDiv) {
                    // Find the input element inside the parent div
                    const inputElement = parentDiv.querySelector('input');

                    if (inputElement) {
                        // You can access its value property
                        const inputValue = inputElement.value;

                        // Modify the input element's value
                        const text = `${videoDetails.name}`;
                        const event = new Event('input', {
                            bubbles: true
                        });
                        event.simulated = true;
                        inputElement.value = text;

                        // Dispatch the 'input' event to trigger any associated event listeners
                        inputElement.dispatchEvent(event);

                        // Highlight the input field
                        inputElement.style.border = '2px solid red';
                    } else {
                        console.error('Input element not found inside the parent div.');
                    }
                } else {
                    console.error('Parent div element not found.');
                }

                // Locate by placeholder text
                const videoNameInput = document.querySelector("text-input[placeholder='Untitled']");

                if (videoNameInput) {
                    // Highlight the input field
                    videoNameInput.style.border = '2px solid red';
                    const text = `${videoDetails.name}`;
                    const event = new Event('input', {
                        bubbles: true
                    });
                    event.simulated = true;
                    videoNameInput.value = text;
                    videoNameInput.dispatchEvent(event);
                }

                // Locate by placeholder text
                const videoUrlInput = document.querySelector("input[placeholder='https://www.youtube.com/watch?v=XYLgwxbwEb8']");

                if (videoUrlInput) {
                    // Highlight the input field
                    videoUrlInput.style.border = '2px solid red';
                    const text = `${videoDetails.url}`;
                    const event = new Event('input', {
                        bubbles: true
                    });
                    event.simulated = true;
                    videoUrlInput.value = text;
                    videoUrlInput.dispatchEvent(event);
                } else {
                    console.error('Video URL input element not found.');
                }


                // Locate the desired button element with the specified ID attribute
                // const buttonElement = document.querySelector("#popover-trigger-\\3Arr\\3A");

                // Select the button element with the specific ID
                const buttonElement = document.querySelector("#popover-trigger-\\:ru\\:");

                if (buttonElement) {
                    // Highlight the input field
                    buttonElement.style.border = '2px solid red';
                    buttonElement.click();
                    // Add a delay (e.g., 2 seconds) before continuing
                    setTimeout(() => {
                        // Locate and click the "Hindi" element based on its text content
                        const spanElements = document.querySelectorAll("span");
                        spanElements.forEach((span) => {
                            if (span.textContent.includes('Hindi')) {
                                span.click();
                            }
                        });
                    }, 2000); // 2-second delay before clicking Hindi
                } else {
                    console.error('Button element not found.');
                }
            }, 2000); // 2-second delay before continuing
        });
    });
    // Add a delay (e.g., 2 seconds) before continuing
    setTimeout(() => {
        // Wait for 10 seconds before clicking the 'Create Dub' button so that tokens are calculated
        const createDubButton = document.querySelector(".btn.btn-primary.btn-md.btn-normal");

        if (createDubButton) {
            // Click on the 'Create Dub' button
            createDubButton.click();
        } else {
            console.error('Create Dub button not found.');
        }
    }, 2000); // 2 second delay before clicking 'Create Dub'
}