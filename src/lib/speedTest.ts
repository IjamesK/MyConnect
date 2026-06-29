export type SpeedQuality = "normal" | "slow" | "poor";

export type SpeedTestResult = {
  downloadMbps: number;
  uploadMbps: number;
  latencyMs: number;
  connectedDevices: number;
  quality: SpeedQuality;
  testedAt: string;
  source: "browser_prototype";
};

function round(value: number) {
  return Math.round(value * 10) / 10;
}

export function classifySpeed(downloadMbps: number, uploadMbps: number, connectedDevices: number): SpeedQuality {
  const perDeviceDownload = downloadMbps / Math.max(connectedDevices, 1);

  if (downloadMbps < 5 || uploadMbps < 2 || perDeviceDownload < 2) {
    return "poor";
  }

  if (downloadMbps < 15 || uploadMbps < 5 || perDeviceDownload < 5) {
    return "slow";
  }

  return "normal";
}

export function qualityLabel(quality: SpeedQuality) {
  if (quality === "normal") return "Within normal range";
  if (quality === "slow") return "Below expected range";
  return "Poor connection quality";
}

export async function runBrowserSpeedTest(connectedDevices: number): Promise<SpeedTestResult> {
  const start = performance.now();

  try {
    await fetch(`/icon.svg?speedTest=${Date.now()}`, { cache: "no-store" });
  } catch {
    // Keep the prototype usable even when the tiny asset request fails.
  }

  const latencyMs = Math.max(12, Math.round(performance.now() - start));

  // Prototype estimate: good enough for demo and ticket structuring.
  // Production version should replace this with an approved speed-test provider/API.
  const congestionPenalty = Math.max(connectedDevices - 1, 0) * 1.8;
  const latencyPenalty = latencyMs > 80 ? (latencyMs - 80) / 12 : 0;
  const baseDownload = 38 - congestionPenalty - latencyPenalty;
  const baseUpload = 16 - congestionPenalty / 2 - latencyPenalty / 2;

  const downloadMbps = round(Math.max(2.5, Math.min(80, baseDownload)));
  const uploadMbps = round(Math.max(1.2, Math.min(35, baseUpload)));
  const quality = classifySpeed(downloadMbps, uploadMbps, connectedDevices);

  return {
    downloadMbps,
    uploadMbps,
    latencyMs,
    connectedDevices,
    quality,
    testedAt: new Date().toISOString(),
    source: "browser_prototype",
  };
}
