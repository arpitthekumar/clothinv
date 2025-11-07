declare module "bwip-js" {
  interface BWRParams {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    includetext?: boolean;
    backgroundcolor?: string;
    encoding?: "png" | "svg";
  }

  const bwipjs: {
    toBuffer(params: BWRParams): Promise<Buffer>;
  };

  export = bwipjs;
}
