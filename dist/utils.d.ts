export declare const noop: () => void;
export declare function round(num: number, precision: number | null, direction?: 'round' | 'floor' | 'ceil'): number;
export declare function commasify(num: number | string, comma?: string): string;
export declare function mean(sortedMeasurements: Array<number>): number;
export declare function percentile(sortedMeasurements: Array<number>, pct: number): number;
export declare function rme(measurements: Array<number>, meanValue: number): number;
