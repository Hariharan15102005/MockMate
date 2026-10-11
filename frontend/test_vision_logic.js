// Node test script for VisualSessionAggregator and Vision Measurement Logic
import assert from 'assert';

// Import VisualSessionAggregator logic
class VisualSessionAggregator {
  constructor() {
    this.reset();
  }

  reset() {
    this.totalSamples = 0;
    this.faceDetectedSamples = 0;
    this.singleFaceSamples = 0;
    this.multipleFaceSamples = 0;
    this.facingCameraSamples = 0;
    this.turnedHeadSamples = 0;
    this.upperBodyVisibleSamples = 0;
    this.adequateLightingSamples = 0;
    this.lowLightingSamples = 0;
    this.suitableFramingSamples = 0;
    this.framingIssueSamples = 0;
    this.consecutiveMissingSamples = 0;
    this.sustainedAbsenceIntervals = 0;
    this.firstSampleTimestamp = null;
    this.lastSampleTimestamp = null;
    this.lastResult = null;
  }

  recordSample(frameResult) {
    if (!frameResult) return;
    this.lastResult = frameResult;
    this.totalSamples++;

    if (!this.firstSampleTimestamp) {
      this.firstSampleTimestamp = frameResult.timestamp;
    }
    this.lastSampleTimestamp = frameResult.timestamp;

    if (frameResult.faceDetected) {
      this.faceDetectedSamples++;
      this.consecutiveMissingSamples = 0;
      if (frameResult.faceCount === 1) {
        this.singleFaceSamples++;
      } else if (frameResult.faceCount > 1) {
        this.multipleFaceSamples++;
      }

      if (frameResult.headOrientation === 'FACING_CAMERA') {
        this.facingCameraSamples++;
      } else if (frameResult.headOrientation && frameResult.headOrientation.startsWith('TURNED_')) {
        this.turnedHeadSamples++;
      }

      if (frameResult.upperBodyVisible) {
        this.upperBodyVisibleSamples++;
      }

      if (frameResult.framingStatus === 'SUITABLE') {
        this.suitableFramingSamples++;
      } else if (frameResult.framingStatus !== 'UNABLE_TO_ASSESS') {
        this.framingIssueSamples++;
      }
    } else {
      this.consecutiveMissingSamples++;
      if (this.consecutiveMissingSamples === 4) {
        this.sustainedAbsenceIntervals++;
      }
    }

    if (frameResult.lightingStatus === 'ADEQUATE') {
      this.adequateLightingSamples++;
    } else if (frameResult.lightingStatus === 'LOW_LIGHT') {
      this.lowLightingSamples++;
    }
  }

  generateSummary() {
    if (this.totalSamples === 0) {
      return {
        hasVisualData: false,
        analysisStatus: 'UNAVAILABLE',
        summaryFeedback: ['Visual analysis was not active or no frames were captured during the session.']
      };
    }

    const faceVisibilityPercent = Math.round((this.faceDetectedSamples / this.totalSamples) * 1000) / 10;
    const lightingAdequacyPercent = Math.round((this.adequateLightingSamples / this.totalSamples) * 1000) / 10;
    const validFaceSamples = Math.max(1, this.faceDetectedSamples);
    const upperBodyVisibilityPercent = Math.round((this.upperBodyVisibleSamples / validFaceSamples) * 1000) / 10;
    const framingSuitablePercent = Math.round((this.suitableFramingSamples / validFaceSamples) * 1000) / 10;

    const feedbackList = [];

    if (faceVisibilityPercent >= 90) {
      feedbackList.push(`Face was consistently detected in ${faceVisibilityPercent}% of sampled frames.`);
    } else if (faceVisibilityPercent >= 70) {
      feedbackList.push(`Face was detected in ${faceVisibilityPercent}% of sampled frames with occasional interruptions.`);
    } else {
      feedbackList.push(`Face visibility was limited (${faceVisibilityPercent}%). Consider adjusting camera placement.`);
    }

    if (this.sustainedAbsenceIntervals > 0) {
      feedbackList.push(`Camera experienced ${this.sustainedAbsenceIntervals} temporary interval(s) where face was out of frame for over 3 seconds.`);
    }

    if (lightingAdequacyPercent >= 80) {
      feedbackList.push('Camera lighting remained adequate throughout the interview session.');
    } else if (this.lowLightingSamples > this.adequateLightingSamples) {
      feedbackList.push('Lighting was frequently low during landmark sampling. Placing a gentle frontal light source can improve clarity.');
    }

    if (framingSuitablePercent >= 75) {
      feedbackList.push('Camera framing and eye-level distance were well proportioned.');
    } else {
      feedbackList.push('Camera framing could be improved by positioning the camera at eye level with some headroom above.');
    }

    if (upperBodyVisibilityPercent >= 70) {
      feedbackList.push(`Upper-body posture geometry was sufficiently visible for ${upperBodyVisibilityPercent}% of face-detected frames.`);
    } else {
      feedbackList.push('Upper-body landmarks were only partially visible. Sitting slightly further back allows full upper-body framing.');
    }

    return {
      hasVisualData: true,
      analysisStatus: 'COMPLETED',
      totalSamplesAnalyzed: this.totalSamples,
      faceVisibilityPercent: faceVisibilityPercent,
      upperBodyVisibilityPercent: upperBodyVisibilityPercent,
      framingSuitablePercent: framingSuitablePercent,
      lightingAdequacyPercent: lightingAdequacyPercent,
      sustainedAbsenceIntervals: this.sustainedAbsenceIntervals,
      multipleFaceDetections: this.multipleFaceSamples,
      summaryFeedback: feedbackList,
      recordedAt: new Date().toISOString()
    };
  }
}

// 1. Test empty session
const aggEmpty = new VisualSessionAggregator();
const emptySummary = aggEmpty.generateSummary();
assert.strictEqual(emptySummary.hasVisualData, false);
assert.strictEqual(emptySummary.analysisStatus, 'UNAVAILABLE');
console.log('✓ Test 1 Passed: Empty session handled gracefully.');

// 2. Test high consistency session
const aggConsistent = new VisualSessionAggregator();
for (let i = 0; i < 50; i++) {
  aggConsistent.recordSample({
    timestamp: 1000 + i * 800,
    faceDetected: true,
    faceCount: 1,
    headOrientation: 'FACING_CAMERA',
    upperBodyVisible: true,
    framingStatus: 'SUITABLE',
    lightingStatus: 'ADEQUATE'
  });
}
const consistentSummary = aggConsistent.generateSummary();
assert.strictEqual(consistentSummary.hasVisualData, true);
assert.strictEqual(consistentSummary.totalSamplesAnalyzed, 50);
assert.strictEqual(consistentSummary.faceVisibilityPercent, 100);
assert.strictEqual(consistentSummary.framingSuitablePercent, 100);
assert.strictEqual(consistentSummary.lightingAdequacyPercent, 100);
assert.strictEqual(consistentSummary.sustainedAbsenceIntervals, 0);
assert.strictEqual(consistentSummary.multipleFaceDetections, 0);
assert.ok(consistentSummary.summaryFeedback.some(f => f.includes('consistently detected in 100%')));
console.log('✓ Test 2 Passed: 100% face consistency session aggregated correctly.');

// 3. Test sustained absence intervals
const aggAbsence = new VisualSessionAggregator();
// 10 samples present
for (let i = 0; i < 10; i++) {
  aggAbsence.recordSample({
    timestamp: 1000 + i * 800,
    faceDetected: true,
    faceCount: 1,
    headOrientation: 'FACING_CAMERA',
    upperBodyVisible: true,
    framingStatus: 'SUITABLE',
    lightingStatus: 'ADEQUATE'
  });
}
// 5 samples absent (sustained absence triggers on 4 consecutive)
for (let i = 10; i < 15; i++) {
  aggAbsence.recordSample({
    timestamp: 1000 + i * 800,
    faceDetected: false,
    faceCount: 0,
    headOrientation: 'UNAVAILABLE',
    upperBodyVisible: false,
    framingStatus: 'UNABLE_TO_ASSESS',
    lightingStatus: 'ADEQUATE'
  });
}
// 5 samples back
for (let i = 15; i < 20; i++) {
  aggAbsence.recordSample({
    timestamp: 1000 + i * 800,
    faceDetected: true,
    faceCount: 1,
    headOrientation: 'FACING_CAMERA',
    upperBodyVisible: true,
    framingStatus: 'SUITABLE',
    lightingStatus: 'ADEQUATE'
  });
}
const absenceSummary = aggAbsence.generateSummary();
assert.strictEqual(absenceSummary.sustainedAbsenceIntervals, 1);
assert.strictEqual(absenceSummary.faceVisibilityPercent, 75.0);
assert.ok(absenceSummary.summaryFeedback.some(f => f.includes('1 temporary interval(s) where face was out of frame')));
console.log('✓ Test 3 Passed: Sustained absence accurately counted and described without punitive tone.');

// 4. Test low light and framing adjustments
const aggLowLight = new VisualSessionAggregator();
for (let i = 0; i < 20; i++) {
  aggLowLight.recordSample({
    timestamp: 1000 + i * 800,
    faceDetected: true,
    faceCount: 1,
    headOrientation: 'TURNED_LEFT',
    upperBodyVisible: false,
    framingStatus: 'CROPPED_TOP',
    lightingStatus: 'LOW_LIGHT'
  });
}
const lowLightSummary = aggLowLight.generateSummary();
assert.strictEqual(lowLightSummary.lightingAdequacyPercent, 0.0);
assert.strictEqual(lowLightSummary.upperBodyVisibilityPercent, 0.0);
assert.strictEqual(lowLightSummary.framingSuitablePercent, 0.0);
assert.ok(lowLightSummary.summaryFeedback.some(f => f.includes('Lighting was frequently low')));
assert.ok(lowLightSummary.summaryFeedback.some(f => f.includes('positioning the camera at eye level')));
assert.ok(lowLightSummary.summaryFeedback.some(f => f.includes('Upper-body landmarks were only partially visible')));
console.log('✓ Test 4 Passed: Low-light, framing, and upper-body coaching feedback verified.');

console.log('\nALL 4 COMPUTER-VISION AGGREGATOR TESTS PASSED CLEANLY!');
