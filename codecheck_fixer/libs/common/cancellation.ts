/** Контроллер для прерывания блокирующих основной поток операций */
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
          process.stderr.write('\nПолучен сигнал Ctrl+C. Прерываем работу.\n');
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

