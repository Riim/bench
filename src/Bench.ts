import { event, fireEvent } from '@riim/event';
import { commasify, mean, noop, percentile, rme, round } from './utils';

export interface ITaskFnParams {
	iteration: number;
	timeStart: () => void;
	timeEnd: () => void;
}
export type TTaskFn<T> = (params: ITaskFnParams) => T | Promise<T>;
export interface ITask<T> {
	name: string;
	fn: TTaskFn<T>;
	completionTimeMeasurements: Array<number>;
	memoryUsageMeasurements: Array<number>;
}
export type TReturnedValue<T> = [taskName: string, returnedValue: T];
export type TCheckReturnedValues<T> = (values: Array<TReturnedValue<T>>, iteration: number) => void;

export class Bench<T = any> {
	readonly name: string | undefined;
	readonly warmupTime: number;
	readonly warmupIterations: number;
	readonly time: number;
	readonly iterations: number;
	readonly memoryUsage: boolean;
	readonly checkReturnedValues: TCheckReturnedValues<T> | null;

	protected _tasks = new Map<string, ITask<T>>();

	onIterationStart = event();
	onIterationEnd = event();

	constructor({
		name,
		warmupTime = Infinity,
		warmupIterations = Infinity,
		time = Infinity,
		iterations = Infinity,
		memoryUsage = false,
		checkReturnedValues
	}: {
		name?: string;
		warmupTime?: number;
		warmupIterations?: number;
		time?: number;
		iterations?: number;
		memoryUsage?: boolean;
		checkReturnedValues?: TCheckReturnedValues<T>;
	} = {}) {
		this.name = name;
		this.warmupTime = warmupTime;
		this.warmupIterations = warmupIterations;
		this.time = time;
		this.iterations = iterations;
		this.memoryUsage = memoryUsage;
		this.checkReturnedValues = checkReturnedValues ?? null;
	}

	add(name: string, fn: TTaskFn<T>) {
		this._tasks.set(name, {
			name,
			fn,
			completionTimeMeasurements: [],
			memoryUsageMeasurements: []
		});

		return this;
	}

	remove(name: string) {
		this._tasks.delete(name);

		return this;
	}

	async run(options?: {
		warmupTime?: number;
		warmupIterations?: number;
		time?: number;
		iterations?: number;
		memoryUsage?: boolean;
		checkReturnedValues?: TCheckReturnedValues<T>;
	}) {
		let {
			warmupTime = this.warmupTime,
			warmupIterations = this.warmupIterations,
			time = this.time,
			iterations = this.iterations,
			memoryUsage = this.memoryUsage,
			checkReturnedValues = this.checkReturnedValues
		} = options ?? this;

		if (warmupTime < 1) {
			throw RangeError('WarmupTime cannot be less than 1');
		}
		if (warmupIterations < 1) {
			throw RangeError('WarmupIterations cannot be less than 1');
		}
		if (time == Infinity && iterations === Infinity) {
			throw TypeError('Time or iterations is required');
		}
		if (time < 1) {
			throw RangeError('Time cannot be less than 1');
		}
		if (iterations < 1) {
			throw RangeError('Iterations cannot be less than 1');
		}

		let tasks = [...this._tasks.values()];

		for (let task of tasks) {
			task.completionTimeMeasurements.length = 0;
			task.memoryUsageMeasurements.length = 0;
		}

		if (warmupTime != Infinity || warmupIterations != Infinity) {
			let taskFnParams = {
				iteration: -1,
				timeStart: noop,
				timeEnd: noop
			};

			for (let i = 0, startTime = Date.now(); ; i++) {
				taskFnParams.iteration = i;

				fireEvent(this.onIterationStart);

				for (let j = 0, k = tasks.length; j < k; j++) {
					let returnedValue = tasks[j].fn(taskFnParams);

					if (returnedValue instanceof Promise) {
						await returnedValue;
					}
				}

				fireEvent(this.onIterationEnd);

				if (Date.now() - startTime >= warmupTime || i >= warmupIterations) {
					break;
				}
			}
		}

		let taskStartTime: number;
		let taskEndTime: number | undefined;
		let taskFnParams = {
			iteration: -1,

			timeStart: () => {
				taskStartTime = performance.now();
			},

			timeEnd: () => {
				taskEndTime = performance.now();
			}
		};

		for (let i = 0, startTime = Date.now(); ; i++) {
			tasks.sort(() => Math.random() - 0.5);
			taskFnParams.iteration = i;

			let returnedValues = checkReturnedValues ? ([] as Array<TReturnedValue<T>>) : null;

			fireEvent(this.onIterationStart);

			for (let j = 0, m = tasks.length; j < m; j++) {
				let { name, fn, completionTimeMeasurements, memoryUsageMeasurements } = tasks[j];
				let heapUsed: number;

				if (memoryUsage) {
					gc!();
					({ heapUsed } = process.memoryUsage());
				}

				taskStartTime = performance.now();
				taskEndTime = undefined;

				let returnedValue = fn(taskFnParams);

				if (returnedValue instanceof Promise) {
					returnedValue = await returnedValue;
				}

				taskEndTime ??= performance.now();

				if (memoryUsage) {
					memoryUsageMeasurements.push(process.memoryUsage().heapUsed - heapUsed!);
					gc!();
				}

				completionTimeMeasurements.push(taskEndTime - taskStartTime);
				returnedValues?.push([name, returnedValue]);
			}

			checkReturnedValues?.(returnedValues!, i);
			fireEvent(this.onIterationEnd);

			if (Date.now() - startTime >= time || i >= iterations) {
				break;
			}
		}
	}

	protected _formatMeasurements({
		verbose = false,
		memoryUsage = false
	}: {
		verbose?: boolean;
		memoryUsage?: boolean;
	} = {}) {
		return [...this._tasks.values()]
			.reduce(
				(measurements, task) => {
					let taskMeasurements = memoryUsage
						? task.memoryUsageMeasurements
						: task.completionTimeMeasurements;
					let sortedTaskMeasurements = taskMeasurements.slice().sort((a, b) => a - b);
					let sum = 0;

					for (let i = 0, l = sortedTaskMeasurements.length; i < l; i++) {
						sum += sortedTaskMeasurements[i];
					}

					let meanValue = mean(sortedTaskMeasurements);

					measurements.push([
						task.name,
						memoryUsage
							? {
									min: sortedTaskMeasurements[0],
									max: sortedTaskMeasurements.at(-1)!,
									mean: meanValue
								}
							: verbose
								? {
										hz: (taskMeasurements.length / sum) * 1000,
										min: sortedTaskMeasurements[0],
										max: sortedTaskMeasurements.at(-1)!,
										mean: meanValue,
										avg: sum / taskMeasurements.length,
										p80: percentile(sortedTaskMeasurements, 80),
										p95: percentile(sortedTaskMeasurements, 95),
										p99: percentile(sortedTaskMeasurements, 99),
										p999: percentile(sortedTaskMeasurements, 99.9),
										rme: rme(sortedTaskMeasurements, meanValue)
									}
								: {
										mean: meanValue,
										rme: rme(sortedTaskMeasurements, meanValue)
									}
					]);

					return measurements;
				},
				[] as Array<
					[
						taskName: string,
						taskMeasurements: {
							hz?: number;
							min?: number;
							max?: number;
							mean: number;
							avg?: number;
							p80?: number;
							p95?: number;
							p99?: number;
							p999?: number;
							rme?: number;
						}
					]
				>
			)
			.sort(([, { mean: a }], [, { mean: b }]) => a - b);
	}

	table({ verbose = true }: { verbose?: boolean } = {}) {
		let formattedMeasurements = this._formatMeasurements({ verbose });
		let fastestMean = formattedMeasurements[0][1].mean;

		return formattedMeasurements.reduce(
			(tabularData, [name, { hz, min, max, mean, avg, p80, p95, p99, p999, rme }]) => {
				tabularData[name] = {
					pos: +((fastestMean / mean) * 100).toFixed(0),
					...(verbose
						? {
								hz: commasify(Math.round(hz!)),
								min: round(min!, 4),
								max: round(max!, 4),
								mean: round(mean, 4),
								avg: round(avg!, 4),
								p80: round(p80!, 4),
								p95: round(p95!, 4),
								p99: round(p99!, 4),
								p999: round(p999!, 4)
							}
						: {
								mean: round(mean, 6)
							}),
					rme: `±${round(rme!, 2)}%`
				};

				return tabularData;
			},
			{} as Record<string, Record<string, any>>
		);
	}

	memoryUsageTable() {
		let formattedMeasurements = this._formatMeasurements({ memoryUsage: true });
		let fastestMean = formattedMeasurements[0][1].mean;

		return formattedMeasurements.reduce(
			(tabularData, [name, { min, max, mean }]) => {
				tabularData[name] = {
					pos: +((fastestMean / mean) * 100).toFixed(0),
					min: round(min!, 4),
					max: round(max!, 4),
					mean: round(mean, 4)
				};

				return tabularData;
			},
			{} as Record<string, Record<string, any>>
		);
	}
}
