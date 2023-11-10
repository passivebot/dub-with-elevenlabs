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
        chrome.scripting.executeScript({
            target: {
                tabId: tabId
            },
            function: checkIfUserIsLoggedIn,
        });
        dubbingTabId = null;
    }
});

function checkIfUserIsLoggedIn() {
    const signUpLinks = Array.from(document.querySelectorAll('a')).filter(a => a.textContent.includes('Sign Up'));
    // If the user has the option to sign up, they are not logged in
    if (signUpLinks.length > 0) {
        chrome.runtime.sendMessage({
            action: "openAffiliateLink"
        });
    }
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "openAffiliateLink") {
        chrome.tabs.create({ url: 'https://try.elevenlabs.io/c3516gvcplb3' });
        chrome.notifications.create({
            type: 'basic',
            title: 'Login Required',
            message: 'You are not logged in. You will now be redirected to the login page.'
        });
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

            // Locate the div element with the specified ID attribute
            const element = document.querySelector("#popover-trigger-\\3Arl\\3A > .block");
            element.click();

            if (element) {
                // Highlight the input field
                element.style.border = '2px solid red';
            }

            function waitForElementToDisplay(selector, time) {
                if (document.querySelector(selector) != null) {
                    // Once the element is available, you can trigger the click event
                    document.querySelector(selector).click();
                } else {
                    setTimeout(function () {
                        waitForElementToDisplay(selector, time);
                    }, time);
                }
            }

            // Use the function to wait for the Hindi option to display
            // Replace 'selector' with the actual selector of the Hindi option
            waitForElementToDisplay("div[aria-label='Hindi']", 200);

            // EOS
        });
    });
}