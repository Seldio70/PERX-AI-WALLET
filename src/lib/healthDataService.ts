import { Alert, Platform } from "react-native";

export type EmployeeHealthSnapshot = {
  todaySteps: number;
  lastNightSleepHours: number | null;
  connected: boolean;
  lastSyncedAt?: string;
};

const emptySnapshot = (): EmployeeHealthSnapshot => ({
  todaySteps: 0,
  lastNightSleepHours: null,
  connected: false
});

/** Reads step + sleep samples from Apple Health when a native HealthKit module is available. */
async function readNativeHealthSnapshot(): Promise<EmployeeHealthSnapshot | null> {
  if (Platform.OS !== "ios") return null;

  try {
    // Optional native module — only present in a dev/production iOS build with HealthKit configured.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Healthkit = require("@kingstinct/react-native-healthkit") as {
      requestAuthorization?: (read: string[], write: string[]) => Promise<boolean>;
      getMostRecentQuantitySample?: (
        type: string,
        unit: string
      ) => Promise<{ quantity: number; startDate: string; endDate: string } | null>;
      queryQuantitySamples?: (
        type: string,
        unit: string,
        from: Date,
        to: Date
      ) => Promise<Array<{ quantity: number; startDate: string; endDate: string }>>;
    };

    if (!Healthkit.requestAuthorization) return null;

    const granted = await Healthkit.requestAuthorization(
      ["HKQuantityTypeIdentifierStepCount", "HKQuantityTypeIdentifierSleepAnalysis"],
      []
    );
    if (!granted) return { ...emptySnapshot(), connected: false };

    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    let todaySteps = 0;
    if (Healthkit.queryQuantitySamples) {
      const samples = await Healthkit.queryQuantitySamples(
        "HKQuantityTypeIdentifierStepCount",
        "count",
        dayStart,
        now
      );
      todaySteps = (samples ?? []).reduce((sum, sample) => sum + sample.quantity, 0);
    }

    let lastNightSleepHours: number | null = null;
    if (Healthkit.getMostRecentQuantitySample) {
      const sleep = await Healthkit.getMostRecentQuantitySample(
        "HKQuantityTypeIdentifierSleepAnalysis",
        "hr"
      );
      if (sleep?.quantity) lastNightSleepHours = sleep.quantity;
    }

    return {
      todaySteps: Math.round(todaySteps),
      lastNightSleepHours,
      connected: true,
      lastSyncedAt: now.toISOString()
    };
  } catch {
    return null;
  }
}

export async function syncEmployeeHealthData(): Promise<EmployeeHealthSnapshot> {
  const native = await readNativeHealthSnapshot();
  if (native) return native;

  if (Platform.OS === "android") {
    const android = await readAndroidHealthSnapshot();
    if (android) return android;
  }

  return emptySnapshot();
}

async function readAndroidHealthSnapshot(): Promise<EmployeeHealthSnapshot | null> {
  if (Platform.OS !== "android") return null;

  try {
    // Optional Health Connect module in Android dev/production builds.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const HealthConnect = require("react-native-health-connect") as {
      initialize?: () => Promise<boolean>;
      requestPermission?: (permissions: Array<{ accessType: string; recordType: string }>) => Promise<boolean>;
      readRecords?: (
        recordType: string,
        options: { timeRangeFilter: { operator: string; startTime: string; endTime: string } }
      ) => Promise<{ records?: Array<{ count?: number; duration?: string }> }>;
    };

    if (!HealthConnect.initialize || !HealthConnect.readRecords) return null;

    const initialized = await HealthConnect.initialize();
    if (!initialized) return emptySnapshot();

    if (HealthConnect.requestPermission) {
      await HealthConnect.requestPermission([
        { accessType: "read", recordType: "Steps" },
        { accessType: "read", recordType: "SleepSession" }
      ]);
    }

    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const stepsResult = await HealthConnect.readRecords("Steps", {
      timeRangeFilter: {
        operator: "between",
        startTime: dayStart.toISOString(),
        endTime: now.toISOString()
      }
    });

    const todaySteps = (stepsResult.records ?? []).reduce(
      (sum, record) => sum + (record.count ?? 0),
      0
    );

    return {
      todaySteps: Math.round(todaySteps),
      lastNightSleepHours: null,
      connected: true,
      lastSyncedAt: now.toISOString()
    };
  } catch {
    return null;
  }
}

export async function requestAppleHealthAccess(): Promise<EmployeeHealthSnapshot> {
  if (Platform.OS === "android") {
    const android = await readAndroidHealthSnapshot();
    if (android?.connected) return android;
    Alert.alert(
      "Connect Health",
      "Health Connect sync requires the PerX Android build with Health permissions enabled."
    );
    return emptySnapshot();
  }

  if (Platform.OS !== "ios") {
    Alert.alert("Apple Health", "Health sync is available on mobile devices.");
    return emptySnapshot();
  }

  const native = await readNativeHealthSnapshot();
  if (native?.connected) return native;

  Alert.alert(
    "Connect Apple Health",
    "Step and sleep challenges sync from Apple Health. Install the PerX iOS app build with Health permissions enabled, then tap Connect again."
  );
  return emptySnapshot();
}

export function formatSteps(steps: number): string {
  return steps.toLocaleString();
}
