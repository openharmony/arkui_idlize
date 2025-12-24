/** Controller for cancelling main thread blocking operations */
class CancellationTokenController {
  private cancelled = false;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    process.once('SIGINT', () => {
      if (!this.cancelled) {
        this.cancelled = true;
        try {
          process.stderr.write('\nReceived Ctrl+C signal. Aborting.\n');
        } catch {}
      }
      process.exit(130);
    });
  }

  public isCancelled(): boolean {
    return this.cancelled;
  }
}

export const cancellationToken = new CancellationTokenController();

