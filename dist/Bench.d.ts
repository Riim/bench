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
export declare class Bench<T = any> {
    readonly name: string | undefined;
    readonly warmupTime: number;
    readonly warmupIterations: number;
    readonly time: number;
    readonly iterations: number;
    readonly memoryUsage: boolean;
    readonly checkReturnedValues: TCheckReturnedValues<T> | null;
    protected _tasks: Map<string, ITask<T>>;
    onIterationStart: import("@riim/event").IUnparametrizedEvent<any>;
    onIterationEnd: import("@riim/event").IUnparametrizedEvent<any>;
    constructor({ name, warmupTime, warmupIterations, time, iterations, memoryUsage, checkReturnedValues }?: {
        name?: string;
        warmupTime?: number;
        warmupIterations?: number;
        time?: number;
        iterations?: number;
        memoryUsage?: boolean;
        checkReturnedValues?: TCheckReturnedValues<T>;
    });
    add(name: string, fn: TTaskFn<T>): this;
    remove(name: string): this;
    run(options?: {
        warmupTime?: number;
        warmupIterations?: number;
        time?: number;
        iterations?: number;
        memoryUsage?: boolean;
        checkReturnedValues?: TCheckReturnedValues<T>;
    }): Promise<void>;
    protected _formatMeasurements({ verbose, memoryUsage }?: {
        verbose?: boolean;
        memoryUsage?: boolean;
    }): [taskName: string, taskMeasurements: {
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
    }][];
    table({ verbose }?: {
        verbose?: boolean;
    }): Record<string, Record<string, any>>;
    memoryUsageTable(): Record<string, Record<string, any>>;
}
