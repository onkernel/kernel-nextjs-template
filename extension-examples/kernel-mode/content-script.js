// Content script for Kernel Mode - replaces all images and videos with Kernel logos
let settings = {
  blockImages: true,
  blockVideos: true,
  kernelMode: true
};
let isBlocking = false;
let isProcessing = false;

// Get the Kernel logo URL
const kernelLogoURL = chrome.runtime.getURL('kernel-logo.png');

// Initialize settings and start blocking
async function init() {
  try {
    settings = await chrome.storage.sync.get({
      blockImages: true,
      blockVideos: true,
      kernelMode: true
    });

    // Initial block pass
    blockContent();

    // Watch for dynamically added content
    startObserver();
  } catch (error) {
    console.error('Kernel Mode error:', error);
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

// Replace image elements with Kernel logos
function blockImages() {
  // Replace <img> elements
  const images = document.querySelectorAll('img:not([data-kernel-mode-processed])');
  images.forEach(img => {
    img.src = kernelLogoURL;
    img.srcset = '';
    img.setAttribute('data-kernel-mode-processed', 'true');
    isBlocking = true;
  });

  // Replace <picture> elements
  const pictures = document.querySelectorAll('picture:not([data-kernel-mode-processed])');
  pictures.forEach(picture => {
    // Replace with kernel logo img
    const img = picture.querySelector('img') || document.createElement('img');
    img.src = kernelLogoURL;
    img.srcset = '';
    if (!picture.querySelector('img')) {
      picture.appendChild(img);
    }
    // Clear all source elements
    picture.querySelectorAll('source').forEach(source => source.remove());
    picture.setAttribute('data-kernel-mode-processed', 'true');
    isBlocking = true;
  });

  // Replace CSS background images
  const elementsWithBg = document.querySelectorAll('[style*="background-image"]:not([data-kernel-mode-processed])');
  elementsWithBg.forEach(el => {
    el.style.backgroundImage = `url(${kernelLogoURL})`;
    el.style.backgroundSize = 'contain';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundPosition = 'center';
    el.setAttribute('data-kernel-mode-processed', 'true');
    isBlocking = true;
  });

  // Replace elements with background-image in computed styles (more aggressive)
  const allElements = document.querySelectorAll('*:not([data-kernel-mode-processed])');
  allElements.forEach(el => {
    const computedStyle = window.getComputedStyle(el);
    const bgImage = computedStyle.backgroundImage;

    if (bgImage && bgImage !== 'none' && !bgImage.includes(kernelLogoURL)) {
      el.style.backgroundImage = `url(${kernelLogoURL})`;
      el.style.backgroundSize = 'contain';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = 'center';
      el.setAttribute('data-kernel-mode-processed', 'true');
      isBlocking = true;
    }
  });
}

// Replace video elements with Kernel logos
function blockVideos() {
  const videos = document.querySelectorAll('video:not([data-kernel-mode-processed])');
  videos.forEach(video => {
    // Replace video with kernel logo
    video.poster = kernelLogoURL;
    video.src = '';
    video.querySelectorAll('source').forEach(source => source.remove());
    video.load();
    video.setAttribute('data-kernel-mode-processed', 'true');
    isBlocking = true;
  });

  // Replace embedded videos (iframe, object, embed) with Kernel logo
  const embeds = document.querySelectorAll('iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="video"], object, embed');
  embeds.forEach(embed => {
    if (!embed.hasAttribute('data-kernel-mode-processed')) {
      // Create a placeholder with Kernel logo
      const placeholder = document.createElement('img');
      placeholder.src = kernelLogoURL;
      placeholder.style.width = embed.offsetWidth + 'px' || '100%';
      placeholder.style.height = embed.offsetHeight + 'px' || 'auto';
      placeholder.setAttribute('data-kernel-mode-processed', 'true');
      embed.parentNode?.replaceChild(placeholder, embed);
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
