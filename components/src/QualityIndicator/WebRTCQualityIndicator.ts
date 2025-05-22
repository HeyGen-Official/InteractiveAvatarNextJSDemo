import WebRTCIssueDetector, { NetworkScores } from 'webrtc-issue-detector';
import { AbstractConnectionQualityIndicator, ConnectionQuality } from './base';

export class WebRTCConnectionQualityIndicator extends AbstractConnectionQualityIndicator<globalThis.RTCPeerConnection> {
  private issueDetector: WebRTCIssueDetector | null = null;
  private mosScores: NetworkScores | null = null;

  protected _start(peerConnection: globalThis.RTCPeerConnection): void {
    this.issueDetector = new WebRTCIssueDetector({
      autoAddPeerConnections: false,
      getStatsInterval: 3000,
      onNetworkScoresUpdated: (scores) => {
        this.mosScores = scores;
        this.handleStatsChanged();
      },
    });
    this.issueDetector.handleNewPeerConnection(peerConnection);
  }

  protected _stop(): void {
    if (this.issueDetector) {
      this.issueDetector.stopWatchingNewPeerConnections();
      this.issueDetector = null;
    }
    this.mosScores = null;
  }

  protected calculateConnectionQuality(): ConnectionQuality {
    if (!this.mosScores || (this.mosScores.inbound && this.mosScores.outbound)) {
      return ConnectionQuality.UNKNOWN;
    }

    if (
      (this.mosScores.inbound && this.mosScores.inbound < 3) ||
      (this.mosScores.outbound && this.mosScores.outbound < 3)
    ) {
      return ConnectionQuality.BAD;
    }

    return ConnectionQuality.GOOD;
  }
}
