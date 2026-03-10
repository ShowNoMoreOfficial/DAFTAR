// ─── Types ───────────────────────────────────────────────

export interface TimeSeriesPoint {
  /** ISO date string or epoch timestamp */
  timestamp: string | number;
  /** Volume/count at this point */
  volume: number;
}

export interface AnomalyResult {
  /** Whether the latest data point is anomalous */
  isAnomaly: boolean;
  /** Z-score of the latest data point */
  zScore: number;
  /** Percentage spike above the mean */
  spikePercentage: number;
  /** The threshold Z-score used for detection */
  threshold: number;
  /** Statistical summary of the input data */
  stats: {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
    latest: number;
    dataPoints: number;
  };
  /** Severity classification based on Z-score magnitude */
  severity: "none" | "mild" | "moderate" | "severe" | "extreme";
}

// ─── Constants ───────────────────────────────────────────

// Z-score threshold for anomaly detection.
// 2.0 standard deviations catches ~2.3% tail events.
const DEFAULT_Z_THRESHOLD = 2.0;

// Minimum data points required for meaningful statistics.
// With fewer than 3, standard deviation is unreliable.
const MIN_DATA_POINTS = 3;

// Floor for standard deviation to avoid division-by-zero
// when all values are identical.
const STDDEV_FLOOR = 0.001;

// ─── Core Algorithm ──────────────────────────────────────

/**
 * Detect if the latest data point in a time series constitutes
 * a statistically significant anomaly using Z-score analysis.
 *
 * The algorithm:
 * 1. Compute mean (μ) and standard deviation (σ) of the baseline
 *    (all points except the latest).
 * 2. Calculate Z-score: z = (latest - μ) / σ
 * 3. If |z| > threshold, flag as anomaly.
 *
 * This is deliberately simple and interpretable. For production
 * at scale, consider ARIMA, Prophet, or isolation forests.
 *
 * @param data - Time-series volume data, ordered chronologically.
 *               Expects 7 days of hourly or daily data points.
 * @param zThreshold - Z-score threshold for anomaly (default: 2.0).
 *                     Higher = fewer false positives, lower sensitivity.
 */
export function detectAnomaly(
  data: TimeSeriesPoint[],
  zThreshold = DEFAULT_Z_THRESHOLD
): AnomalyResult {
  if (data.length < MIN_DATA_POINTS) {
    return {
      isAnomaly: false,
      zScore: 0,
      spikePercentage: 0,
      threshold: zThreshold,
      stats: {
        mean: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        latest: data.length > 0 ? data[data.length - 1].volume : 0,
        dataPoints: data.length,
      },
      severity: "none",
    };
  }

  const volumes = data.map((d) => d.volume);
  const latest = volumes[volumes.length - 1];

  // Baseline: all data points except the latest.
  // We exclude the latest so it doesn't inflate the mean/stddev
  // when we're trying to detect if it's abnormal.
  const baseline = volumes.slice(0, -1);

  const mean = computeMean(baseline);
  const stdDev = Math.max(computeStdDev(baseline, mean), STDDEV_FLOOR);

  // Z-score: how many standard deviations from the mean
  const zScore = (latest - mean) / stdDev;

  // Spike percentage relative to the mean
  const spikePercentage =
    mean > 0 ? ((latest - mean) / mean) * 100 : latest > 0 ? 100 : 0;

  // Anomaly: Z-score exceeds threshold (we only care about positive spikes)
  const isAnomaly = zScore > zThreshold;

  // Severity classification
  const severity = classifySeverity(zScore);

  return {
    isAnomaly,
    zScore: round(zScore, 2),
    spikePercentage: round(spikePercentage, 1),
    threshold: zThreshold,
    stats: {
      mean: round(mean, 2),
      stdDev: round(stdDev, 2),
      min: Math.min(...volumes),
      max: Math.max(...volumes),
      latest,
      dataPoints: data.length,
    },
    severity,
  };
}

/**
 * Batch anomaly detection across multiple keywords.
 * Returns only keywords that are flagged as anomalous.
 */
export function detectAnomalies(
  keywordData: Map<string, TimeSeriesPoint[]>,
  zThreshold = DEFAULT_Z_THRESHOLD
): Map<string, AnomalyResult> {
  const anomalies = new Map<string, AnomalyResult>();

  for (const [keyword, data] of keywordData) {
    const result = detectAnomaly(data, zThreshold);
    if (result.isAnomaly) {
      anomalies.set(keyword, result);
    }
  }

  return anomalies;
}

/**
 * Compute a rolling anomaly score over a sliding window.
 * Useful for detecting sustained trends vs. one-off spikes.
 *
 * @param data - Full time series
 * @param windowSize - Number of points in the baseline window
 */
export function rollingAnomalyScores(
  data: TimeSeriesPoint[],
  windowSize = 24 // e.g., 24 hours
): { timestamp: string | number; zScore: number; isAnomaly: boolean }[] {
  const results: {
    timestamp: string | number;
    zScore: number;
    isAnomaly: boolean;
  }[] = [];

  for (let i = windowSize; i < data.length; i++) {
    const window = data.slice(i - windowSize, i);
    const current = data[i];

    const windowVolumes = window.map((d) => d.volume);
    const mean = computeMean(windowVolumes);
    const stdDev = Math.max(
      computeStdDev(windowVolumes, mean),
      STDDEV_FLOOR
    );
    const zScore = (current.volume - mean) / stdDev;

    results.push({
      timestamp: current.timestamp,
      zScore: round(zScore, 2),
      isAnomaly: zScore > DEFAULT_Z_THRESHOLD,
    });
  }

  return results;
}

// ─── Statistical Helpers ─────────────────────────────────

function computeMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function computeStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  // Using sample standard deviation (N-1) for unbiased estimate
  const variance =
    squaredDiffs.reduce((sum, d) => sum + d, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function classifySeverity(
  zScore: number
): AnomalyResult["severity"] {
  const absZ = Math.abs(zScore);
  if (absZ < 2.0) return "none";
  if (absZ < 2.5) return "mild";
  if (absZ < 3.0) return "moderate";
  if (absZ < 4.0) return "severe";
  return "extreme";
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
