// Content script for removing images and videos
let settings = {
  blockImages: true,
  blockVideos: true
};
let isBlocking = false;
let isProcessing = false;

// Initialize settings and start blocking
async function init() {
  try {
    settings = await chrome.storage.sync.get({
      blockImages: true,
      blockVideos: true
    });

    // Initial block pass
    blockContent();

    // Watch for dynamically added content
    startObserver();

    // Listen for settings changes
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync') {
        let needsReprocess = false;

        if (changes.blockImages) {
          settings.blockImages = changes.blockImages.newValue;
          needsReprocess = true;
        }
        if (changes.blockVideos) {
          settings.blockVideos = changes.blockVideos.newValue;
          needsReprocess = true;
        }

        if (needsReprocess) {
          // Reset blocking state and reprocess page
          isBlocking = false;
          blockContent();
        }
      }
    });
  } catch (error) {
    console.error('Remove Webpage Media error:', error);
  }
}

// Block images and videos on the page
function blockContent() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    // Block images
    if (settings.blockImages) {
      blockImages();
    }

    // Block videos
    if (settings.blockVideos) {
      blockVideos();
    }
  } catch (error) {
    console.error('Error blocking content:', error);
  } finally {
    isProcessing = false;
  }
}

// Block image elements
function blockImages() {
  // Block <img> elements
  const images = document.querySelectorAll('img:not([data-media-removed])');
  images.forEach(img => {
    img.style.display = 'none';
    img.setAttribute('data-media-removed', 'true');
    isBlocking = true;
  });

  // Block <picture> elements
  const pictures = document.querySelectorAll('picture:not([data-media-removed])');
  pictures.forEach(picture => {
    picture.style.display = 'none';
    picture.setAttribute('data-media-removed', 'true');
    isBlocking = true;
  });

  // Block CSS background images
  const elementsWithBg = document.querySelectorAll('[style*="background-image"]:not([data-media-removed])');
  elementsWithBg.forEach(el => {
    el.style.backgroundImage = 'none';
    el.setAttribute('data-media-removed', 'true');
    isBlocking = true;
  });

  // Block elements with background-image in computed styles (more aggressive)
  const allElements = document.querySelectorAll('*:not([data-media-removed])');
  allElements.forEach(el => {
    const computedStyle = window.getComputedStyle(el);
    const bgImage = computedStyle.backgroundImage;

    if (bgImage && bgImage !== 'none') {
      el.style.backgroundImage = 'none';
      el.setAttribute('data-media-removed', 'true');
      isBlocking = true;
    }
  });
}

// Block video elements
function blockVideos() {
  const videos = document.querySelectorAll('video:not([data-media-removed])');
  videos.forEach(video => {
    video.style.display = 'none';
    video.setAttribute('data-media-removed', 'true');
    isBlocking = true;
  });

  // Block embedded videos (iframe, object, embed)
  const embeds = document.querySelectorAll('iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="video"], object, embed');
  embeds.forEach(embed => {
    if (!embed.hasAttribute('data-media-removed')) {
      embed.style.display = 'none';
      embed.setAttribute('data-media-removed', 'true');
      isBlocking = true;
    }
  });
}

// Observer for dynamically added content
function startObserver() {
  const observer = new MutationObserver((mutations) => {
    let needsProcessing = false;

    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if it's an image or video element
            if ((settings.blockImages && (node.tagName === 'IMG' || node.tagName === 'PICTURE')) ||
                (settings.blockVideos && (node.tagName === 'VIDEO' || node.tagName === 'IFRAME'))) {
              needsProcessing = true;
              break;
            }
            // Check if it contains images or videos
            if (settings.blockImages && (node.querySelector('img, picture'))) {
              needsProcessing = true;
              break;
            }
            if (settings.blockVideos && (node.querySelector('video, iframe'))) {
              needsProcessing = true;
              break;
            }
          }
        }
      }
      if (needsProcessing) break;
    }

    if (needsProcessing) {
      // Debounce the blocking to avoid excessive processing
      clearTimeout(window.blockContentTimeout);
      window.blockContentTimeout = setTimeout(() => {
        blockContent();
      }, 100);
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
