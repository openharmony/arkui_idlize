declare class XComponentController {
  constructor();
  getXComponentContext(): Object;
  setXComponentSurfaceSize(value: {
    surfaceWidth: number;
    surfaceHeight: number;
  }): void;
  onSurfaceCreated(surfaceId: string): void;
  onSurfaceDestroyed(surfaceId: string): void;
  stopImageAnalyzer(): void;
}