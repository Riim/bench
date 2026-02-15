import jstat from 'jstat';

export const noop = () => {};

export function round(
	num: number,
	precision: number | null,
	direction: 'round' | 'floor' | 'ceil' = 'round'
) {
	if (precision === null) {
		return num;
	}

	precision = Math.pow(10, precision);
	num *= precision;

	return (
		(direction == 'round'
			? Math.round(num)
			: direction == 'floor'
				? Math.floor(num)
				: Math.ceil(num)) / precision
	);
}

export function commasify(num: number | string, comma = ',') {
	return num.toString().replace(/(\d)(?=(?:\d{3})+(\.\d*)?(?:\D|$))/g, `$1${comma}`);
}

export function mean(sortedMeasurements: Array<number>) {
	let half = sortedMeasurements.length / 2;

	if (sortedMeasurements.length % 2 == 0) {
		return (sortedMeasurements[half - 1] + sortedMeasurements[half]) / 2;
	}

	return sortedMeasurements[Math.trunc(half)];
}

export function percentile(sortedMeasurements: Array<number>, pct: number) {
	return sortedMeasurements[Math.round((sortedMeasurements.length - 1) * (pct / 100))];
}

export function rme(measurements: Array<number>, meanValue: number) {
	let n = measurements.length;
	let tValue = jstat.studentt.inv(0.975, n - 1);
	let squaredDiffs = measurements.map((val) => Math.pow(val - meanValue, 2));
	let variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / (n - 1);
	let stdDev = Math.sqrt(variance);
	let sem = stdDev / Math.sqrt(n);
	let margin = tValue * sem;

	return (margin / meanValue) * 100;
}
