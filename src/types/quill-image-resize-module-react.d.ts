declare module 'quill-image-resize-module-react' {
  import Quill from 'quill';
  
  interface ImageResizeOptions {
    modules?: string[];
    handlerOptions?: Record<string, any>;
    displaySize?: boolean;
    [key: string]: any;
  }
  
  class ImageResize {
    constructor(quill: Quill, options: ImageResizeOptions);
  }
  
  export default ImageResize;
} 