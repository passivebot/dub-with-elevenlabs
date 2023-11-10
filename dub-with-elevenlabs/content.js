function injectDubButton() {
  const player = document.querySelector('.html5-video-player');
  if (!player) {
    console.error('No video player found');
    return;
  }

  const button = document.createElement('button');
  button.innerText = 'Dub';
  button.style.position = 'absolute';
  button.style.top = '0';
  button.style.right = '0';
  button.style.zIndex = '1000';
  button.style.padding = '10px';
  button.style.fontSize = '1rem';
  button.style.color = '#fff';
  button.style.background = '#1a73e8';
  button.style.border = 'none';
  button.style.borderRadius = '2px';
  button.style.cursor = 'pointer';
  button.onclick = function() {
    chrome.runtime.sendMessage({
      action: "openDubbingPage",
      url: window.location.href,
      videoName: document.querySelector('.title.style-scope.ytd-video-primary-info-renderer').innerText
    });
  };

  player.appendChild(button);
}

function updateDubButton() {
  // Function to check for the visibility of the time span element
  function waitForTimeSpanVisibility() {
    const timeSpan = document.querySelector(".block.font-serif.text-xs.font-normal.text-gray-700");

    if (timeSpan) {
      // Extract the text content and parse the remaining time
      const timeText = timeSpan.textContent;
      const remainingTime = parseInt(timeText, 10); // Assuming the time is in minutes (e.g., 1m26s)

      if (!isNaN(remainingTime)) {
        // Update the "Dub" button with the remaining time
        const dubButton = document.querySelector(".btn.btn-primary.btn-md.btn-normal");
        if (dubButton) {
          dubButton.textContent = `Dub (${remainingTime} minutes remaining)`;
        } else {
          console.error('Dub button not found.');
        }
      } else {
        console.error('Failed to parse remaining time.');
      }
    } else {
      // If the time span is not found, wait and check again after a delay
      setTimeout(waitForTimeSpanVisibility, 1000); // Check every 1 second (adjust as needed)
    }
  }

  // Start checking for the visibility of the time span element
  waitForTimeSpanVisibility();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectDubButton();
    updateDubButton();
  });
} else {
  injectDubButton();
  updateDubButton();
}
