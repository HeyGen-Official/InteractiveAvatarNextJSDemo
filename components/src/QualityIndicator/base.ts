export enum ConnectionQuality {
  UNKNOWN = 'UNKNOWN',
  GOOD = 'GOOD',
  BAD = 'BAD',
}

type ChildTrackerConfig<T, U> = {
  TrackerClass: new (
    onConnectionQualityChanged: (quality: ConnectionQuality) => void
  ) => AbstractConnectionQualityIndicator<U>;
  getParams: (params: T) => U;
};

export abstract class AbstractConnectionQualityIndicator<T> {
  private _connectionQuality: ConnectionQuality = ConnectionQuality.UNKNOWN;
  protected readonly onConnectionQualityChanged: (quality: ConnectionQuality) => void;

  constructor(onConnectionQualityChanged: (quality: ConnectionQuality) => void) {
    this.onConnectionQualityChanged = onConnectionQualityChanged;
  }

  get connectionQuality(): ConnectionQuality {
    return this._connectionQuality;
  }

  protected handleStatsChanged() {
    const newConnectionQuality = this.calculateConnectionQuality();
    if (newConnectionQuality !== this._connectionQuality) {
      this._connectionQuality = newConnectionQuality;
      this.onConnectionQualityChanged(newConnectionQuality);
    }
  }

  protected abstract calculateConnectionQuality(): ConnectionQuality;
  protected abstract _start(params: T): void;
  protected abstract _stop(): void;

  public start(params: T) {
    this.stop(true);
    this._start(params);
  }

  public stop(muted: boolean = false) {
    this._stop();
    this._connectionQuality = ConnectionQuality.UNKNOWN;
    if (!muted) {
      this.onConnectionQualityChanged(ConnectionQuality.UNKNOWN);
    }
  }
}

export function QualityIndicatorMixer<T>(...configs: ChildTrackerConfig<T, any>[]): {
  new (
    onConnectionQualityChanged: (quality: ConnectionQuality) => void
  ): AbstractConnectionQualityIndicator<T>;
} {
  class CombinedQualityIndicator extends AbstractConnectionQualityIndicator<T> {
    private childTrackers: {
      tracker: AbstractConnectionQualityIndicator<any>;
      getParams: (params: T) => any;
    }[];

    constructor(onConnectionQualityChanged: (quality: ConnectionQuality) => void) {
      super(onConnectionQualityChanged);
      this.childTrackers = configs.map(({ getParams, TrackerClass }) => ({
        tracker: new TrackerClass(() => this.handleStatsChanged()),
        getParams,
      }));
    }

    protected calculateConnectionQuality(): ConnectionQuality {
      const connectionQualities = this.childTrackers.map(
        ({ tracker }) => tracker.connectionQuality
      );
      if (connectionQualities.some((quality) => quality === ConnectionQuality.BAD)) {
        return ConnectionQuality.BAD;
      }
      if (connectionQualities.every((quality) => quality === ConnectionQuality.UNKNOWN)) {
        return ConnectionQuality.UNKNOWN;
      }
      return ConnectionQuality.GOOD;
    }

    protected _start(params: T): void {
      this.childTrackers.forEach(({ tracker, getParams }) =>
        tracker.start(getParams(params))
      );
    }

    protected _stop(): void {
      this.childTrackers.forEach(({ tracker }) => tracker.stop(true));
    }
  }

  return CombinedQualityIndicator;
}
