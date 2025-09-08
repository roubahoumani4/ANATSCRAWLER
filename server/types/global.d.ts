declare global {
  var osintProcesses: Map<string, {
    pid: number;
    scanId: string;
    startTime: number;
    process: any;
  }>;
}

export {};
