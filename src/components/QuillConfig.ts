import Quill from 'quill';
import 'quill/dist/quill.snow.css';

// Custom Blot for Media with Captions
const BlockEmbed = Quill.import('blots/block/embed');

// Create Image Blot with caption
class ImageBlot extends BlockEmbed {
  static create(value: { url: string; caption?: string; size: string; alignment: string }) {
    const node = super.create();
    node.setAttribute('contenteditable', false);
    node.setAttribute('data-type', 'image-container');
    
    // Container div with alignment
    node.classList.add('media-container');
    node.classList.add(`align-${value.alignment}`);
    
    // Image element
    const img = document.createElement('img');
    img.setAttribute('src', value.url);
    img.classList.add('quill-image');
    img.classList.add(`size-${value.size}`);
    
    // Add the image to the container
    node.appendChild(img);
    
    // Caption element (if provided)
    if (value.caption) {
      const caption = document.createElement('figcaption');
      caption.textContent = value.caption;
      caption.classList.add('media-caption');
      node.appendChild(caption);
    }
    
    return node;
  }
  
  static value(node: HTMLElement) {
    const img = node.querySelector('img');
    const caption = node.querySelector('figcaption');
    
    // Get alignment from container
    const alignment = node.className.match(/align-(left|center|right)/)?.[1] || 'center';
    
    // Get size from image
    const size = img?.className.match(/size-(small|medium|large|full)/)?.[1] || 'medium';
    
    return {
      url: img?.getAttribute('src') || '',
      caption: caption?.textContent || '',
      size,
      alignment
    };
  }
}

ImageBlot.blotName = 'captioned-image';
ImageBlot.tagName = 'figure';

// Create Video Blot with caption
class VideoBlot extends BlockEmbed {
  static create(value: { url: string; caption?: string; size: string; alignment: string }) {
    const node = super.create();
    node.setAttribute('contenteditable', false);
    node.setAttribute('data-type', 'video-container');
    
    // Container div with alignment
    node.classList.add('media-container');
    node.classList.add(`align-${value.alignment}`);
    
    // Video element
    const video = document.createElement('video');
    video.setAttribute('controls', 'true');
    video.classList.add('quill-video');
    video.classList.add(`size-${value.size}`);
    
    // Source element
    const source = document.createElement('source');
    source.setAttribute('src', value.url);
    video.appendChild(source);
    
    // Add the video to the container
    node.appendChild(video);
    
    // Caption element (if provided)
    if (value.caption) {
      const caption = document.createElement('figcaption');
      caption.textContent = value.caption;
      caption.classList.add('media-caption');
      node.appendChild(caption);
    }
    
    return node;
  }
  
  static value(node: HTMLElement) {
    const video = node.querySelector('video');
    const source = video?.querySelector('source');
    const caption = node.querySelector('figcaption');
    
    // Get alignment from container
    const alignment = node.className.match(/align-(left|center|right)/)?.[1] || 'center';
    
    // Get size from video
    const size = video?.className.match(/size-(small|medium|large|full)/)?.[1] || 'medium';
    
    return {
      url: source?.getAttribute('src') || '',
      caption: caption?.textContent || '',
      size,
      alignment
    };
  }
}

VideoBlot.blotName = 'captioned-video';
VideoBlot.tagName = 'figure';

// Register the custom blots
function registerCustomBlots() {
  Quill.register(ImageBlot);
  Quill.register(VideoBlot);
}

// Toolbar options - updated to use the proper format for Quill
const toolbarOptions = {
  container: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'font': [] }],
    [{ 'align': [] }],
    ['clean']
  ]
};

// Custom handler functions for media insertion
const insertImage = (quill: Quill, url: string, caption: string, size: string, alignment: string) => {
  const range = quill.getSelection(true);
  quill.insertEmbed(range.index, 'captioned-image', { url, caption, size, alignment }, Quill.sources.USER);
  quill.setSelection(range.index + 1, Quill.sources.SILENT);
};

const insertVideo = (quill: Quill, url: string, caption: string, size: string, alignment: string) => {
  const range = quill.getSelection(true);
  quill.insertEmbed(range.index, 'captioned-video', { url, caption, size, alignment }, Quill.sources.USER);
  quill.setSelection(range.index + 1, Quill.sources.SILENT);
};

// Custom CSS for media elements
const editorStyles = `
.ql-editor .media-container {
  margin: 1em 0;
  max-width: 100%;
}

.ql-editor .media-container.align-left {
  text-align: left;
}

.ql-editor .media-container.align-center {
  text-align: center;
}

.ql-editor .media-container.align-right {
  text-align: right;
}

.ql-editor .quill-image,
.ql-editor .quill-video {
  max-width: 100%;
  height: auto;
  border-radius: 0.375rem;
}

.ql-editor .quill-image.size-small,
.ql-editor .quill-video.size-small {
  max-width: 25%;
}

.ql-editor .quill-image.size-medium,
.ql-editor .quill-video.size-medium {
  max-width: 50%;
}

.ql-editor .quill-image.size-large,
.ql-editor .quill-video.size-large {
  max-width: 75%;
}

.ql-editor .quill-image.size-full,
.ql-editor .quill-video.size-full {
  width: 100%;
}

.ql-editor .media-caption {
  font-style: italic;
  color: #6b7280;
  margin-top: 0.5rem;
  font-size: 0.875rem;
}
`;

// Initialize stylesheet
const initializeStyles = () => {
  if (!document.getElementById('quill-custom-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'quill-custom-styles';
    styleSheet.textContent = editorStyles;
    document.head.appendChild(styleSheet);
  }
};

export { 
  registerCustomBlots, 
  toolbarOptions, 
  insertImage, 
  insertVideo,
  initializeStyles
}; 