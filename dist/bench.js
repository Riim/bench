Object.defineProperty(exports, Symbol.toStringTag, {
  value: 'Module'
});
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
      key = keys[i];
      if (!__hasOwnProp.call(to, key) && key !== except) {
        __defProp(to, key, {
          get: (k => from[k]).bind(null, key),
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
      }
    }
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
  value: mod,
  enumerable: true
}) : target, mod));

//#endregion
var _riim_event = require("@riim/event");
var jstat = require("jstat");
jstat = __toESM(jstat);

//#region src/utils.ts
var noop = () => {};
function round(num, precision, direction = "round") {
  if (precision === null) return num;
  precision = Math.pow(10, precision);
  num *= precision;
  return (direction == "round" ? Math.round(num) : direction == "floor" ? Math.floor(num) : Math.ceil(num)) / precision;
}
function commasify(num, comma = ",") {
  return num.toString().replace(/(\d)(?=(?:\d{3})+(\.\d*)?(?:\D|$))/g, `$1${comma}`);
}
function mean(sortedMeasurements) {
  var half = sortedMeasurements.length / 2;
  if (sortedMeasurements.length % 2 == 0) return (sortedMeasurements[half - 1] + sortedMeasurements[half]) / 2;
  return sortedMeasurements[Math.trunc(half)];
}
function percentile(sortedMeasurements, pct) {
  return sortedMeasurements[Math.round((sortedMeasurements.length - 1) * (pct / 100))];
}
function rme(measurements, meanValue) {
  var n = measurements.length;
  var tValue = jstat.default.studentt.inv(.975, n - 1);
  var variance = measurements.map(val => Math.pow(val - meanValue, 2)).reduce((sum, val) => sum + val, 0) / (n - 1);
  return tValue * (Math.sqrt(variance) / Math.sqrt(n)) / meanValue * 100;
}

//#endregion
//#region src/Bench.ts
var Bench = class {
  name;
  warmupTime;
  warmupIterations;
  time;
  iterations;
  memoryUsage;
  checkReturnedValues;
  _tasks = /* @__PURE__ */new Map();
  onIterationStart = (0, _riim_event.event)();
  onIterationEnd = (0, _riim_event.event)();
  constructor({
    name,
    warmupTime = Infinity,
    warmupIterations = Infinity,
    time = Infinity,
    iterations = Infinity,
    memoryUsage = false,
    checkReturnedValues
  } = {}) {
    this.name = name;
    this.warmupTime = warmupTime;
    this.warmupIterations = warmupIterations;
    this.time = time;
    this.iterations = iterations;
    this.memoryUsage = memoryUsage;
    this.checkReturnedValues = checkReturnedValues ?? null;
  }
  add(name, fn) {
    this._tasks.set(name, {
      name,
      fn,
      completionTimeMeasurements: [],
      memoryUsageMeasurements: []
    });
    return this;
  }
  remove(name) {
    this._tasks.delete(name);
    return this;
  }
  async run(options) {
    var {
      warmupTime = this.warmupTime,
      warmupIterations = this.warmupIterations,
      time = this.time,
      iterations = this.iterations,
      memoryUsage = this.memoryUsage,
      checkReturnedValues = this.checkReturnedValues
    } = options ?? this;
    if (warmupTime < 1) throw RangeError("WarmupTime cannot be less than 1");
    if (warmupIterations < 1) throw RangeError("WarmupIterations cannot be less than 1");
    if (time == Infinity && iterations === Infinity) throw TypeError("Time or iterations is required");
    if (time < 1) throw RangeError("Time cannot be less than 1");
    if (iterations < 1) throw RangeError("Iterations cannot be less than 1");
    var tasks = [...this._tasks.values()];
    for (var task of tasks) {
      task.completionTimeMeasurements.length = 0;
      task.memoryUsageMeasurements.length = 0;
    }
    if (warmupTime != Infinity || warmupIterations != Infinity) {
      var _taskFnParams = {
        iteration: -1,
        timeStart: noop,
        timeEnd: noop
      };
      for (var i = 0, startTime = Date.now();; i++) {
        _taskFnParams.iteration = i;
        (0, _riim_event.fireEvent)(this.onIterationStart);
        for (var j = 0, k = tasks.length; j < k; j++) {
          var returnedValue = tasks[j].fn(_taskFnParams);
          if (returnedValue instanceof Promise) await returnedValue;
        }
        (0, _riim_event.fireEvent)(this.onIterationEnd);
        if (Date.now() - startTime >= warmupTime || i >= warmupIterations) break;
      }
    }
    var taskStartTime;
    var taskEndTime;
    var taskFnParams = {
      iteration: -1,
      timeStart: () => {
        taskStartTime = performance.now();
      },
      timeEnd: () => {
        taskEndTime = performance.now();
      }
    };
    for (var _i = 0, _startTime = Date.now();; _i++) {
      tasks.sort(() => Math.random() - .5);
      taskFnParams.iteration = _i;
      var returnedValues = checkReturnedValues ? [] : null;
      (0, _riim_event.fireEvent)(this.onIterationStart);
      for (var _j = 0, m = tasks.length; _j < m; _j++) {
        var {
          name,
          fn,
          completionTimeMeasurements,
          memoryUsageMeasurements
        } = tasks[_j];
        var heapUsed = void 0;
        if (memoryUsage) {
          gc();
          ({
            heapUsed
          } = process.memoryUsage());
        }
        taskStartTime = performance.now();
        taskEndTime = void 0;
        var _returnedValue = fn(taskFnParams);
        if (_returnedValue instanceof Promise) _returnedValue = await _returnedValue;
        taskEndTime ??= performance.now();
        if (memoryUsage) {
          memoryUsageMeasurements.push(process.memoryUsage().heapUsed - heapUsed);
          gc();
        }
        completionTimeMeasurements.push(taskEndTime - taskStartTime);
        returnedValues?.push([name, _returnedValue]);
      }
      checkReturnedValues?.(returnedValues, _i);
      (0, _riim_event.fireEvent)(this.onIterationEnd);
      if (Date.now() - _startTime >= time || _i >= iterations) break;
    }
  }
  _formatMeasurements({
    verbose = false,
    memoryUsage = false
  } = {}) {
    return [...this._tasks.values()].reduce((measurements, task) => {
      var taskMeasurements = memoryUsage ? task.memoryUsageMeasurements : task.completionTimeMeasurements;
      var sortedTaskMeasurements = taskMeasurements.slice().sort((a, b) => a - b);
      var sum = 0;
      for (var i = 0, l = sortedTaskMeasurements.length; i < l; i++) sum += sortedTaskMeasurements[i];
      var meanValue = mean(sortedTaskMeasurements);
      measurements.push([task.name, memoryUsage ? {
        min: sortedTaskMeasurements[0],
        max: sortedTaskMeasurements.at(-1),
        mean: meanValue
      } : verbose ? {
        hz: taskMeasurements.length / sum * 1e3,
        min: sortedTaskMeasurements[0],
        max: sortedTaskMeasurements.at(-1),
        mean: meanValue,
        avg: sum / taskMeasurements.length,
        p80: percentile(sortedTaskMeasurements, 80),
        p95: percentile(sortedTaskMeasurements, 95),
        p99: percentile(sortedTaskMeasurements, 99),
        p999: percentile(sortedTaskMeasurements, 99.9),
        rme: rme(sortedTaskMeasurements, meanValue)
      } : {
        mean: meanValue,
        rme: rme(sortedTaskMeasurements, meanValue)
      }]);
      return measurements;
    }, []).sort(([, {
      mean: a
    }], [, {
      mean: b
    }]) => a - b);
  }
  table({
    verbose = true
  } = {}) {
    var formattedMeasurements = this._formatMeasurements({
      verbose
    });
    var fastestMean = formattedMeasurements[0][1].mean;
    return formattedMeasurements.reduce((tabularData, [name, {
      hz,
      min,
      max,
      mean,
      avg,
      p80,
      p95,
      p99,
      p999,
      rme
    }]) => {
      tabularData[name] = {
        pos: +(fastestMean / mean * 100).toFixed(0),
        ...(verbose ? {
          hz: commasify(Math.round(hz)),
          min: round(min, 4),
          max: round(max, 4),
          mean: round(mean, 4),
          avg: round(avg, 4),
          p80: round(p80, 4),
          p95: round(p95, 4),
          p99: round(p99, 4),
          p999: round(p999, 4)
        } : {
          mean: round(mean, 6)
        }),
        rme: `±${round(rme, 2)}%`
      };
      return tabularData;
    }, {});
  }
  memoryUsageTable() {
    var formattedMeasurements = this._formatMeasurements({
      memoryUsage: true
    });
    var fastestMean = formattedMeasurements[0][1].mean;
    return formattedMeasurements.reduce((tabularData, [name, {
      min,
      max,
      mean
    }]) => {
      tabularData[name] = {
        pos: +(fastestMean / mean * 100).toFixed(0),
        min: round(min, 4),
        max: round(max, 4),
        mean: round(mean, 4)
      };
      return tabularData;
    }, {});
  }
};

//#endregion
exports.Bench = Bench;