declare module "dom-to-image-more" {
    const domtoimage: {
      toPng: (node: HTMLElement, options?: any) => Promise<string>;
      toJpeg: (node: HTMLElement, options?: any) => Promise<string>;
      toSvg: (node: HTMLElement, options?: any) => Promise<string>;
      toBlob: (node: HTMLElement, options?: any) => Promise<Blob>;
    };
    export default domtoimage;
  }
  