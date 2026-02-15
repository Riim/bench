import { Bench } from '../src';

const arr = Array.from({ length: 1000 }, (_, idx) => idx + 1);
let item: number;

const bench = new Bench({ time: 1000 });

bench
	.add('by index with l-var', () => {
		for (let i = 0, l = arr.length; i < l; i++) {
			item = arr[i];
		}
	})
	.add('by index without l-var', () => {
		for (let i = 0; i < arr.length; i++) {
			item = arr[i];
		}
	})
	.add('by index without l-var 2', () => {
		for (let i = 0; i != arr.length; i++) {
			item = arr[i];
		}
	})
	.add('by index from end', () => {
		for (let i = arr.length; i != 0; ) {
			item = arr[--i];
		}
	})
	.add('by index from end 2', () => {
		for (let i = arr.length - 1; i >= 0; i--) {
			item = arr[i];
		}
	})
	.add('of operator', () => {
		for (let item_ of arr) {
			item = item_;
		}
	})
	.add('Array#forEach()', () => {
		arr.forEach((item_) => {
			item = item_;
		});
	});

(async () => {
	await bench.run();

	// ┌──────────────────────────┬─────┬──────────┬──────────┐
	// │ (index)                  │ pos │ mean     │ rme      │
	// ├──────────────────────────┼─────┼──────────┼──────────┤
	// │ by index with l-var      │ 100 │ 0.001055 │ '±0.52%' │
	// │ by index without l-var   │ 100 │ 0.001057 │ '±1.22%' │
	// │ Array#forEach()          │ 87  │ 0.001217 │ '±1.74%' │
	// │ by index without l-var 2 │ 72  │ 0.001458 │ '±0.4%'  │
	// │ by index from end 2      │ 72  │ 0.001461 │ '±0.3%'  │
	// │ of operator              │ 68  │ 0.001544 │ '±0.37%' │
	// │ by index from end        │ 58  │ 0.001833 │ '±0.42%' │
	// └──────────────────────────┴─────┴──────────┴──────────┘
	console.table(bench.table({ verbose: false }));

	await bench.run({ memoryUsage: true });

	// ┌──────────────────────────┬─────┬─────┬──────┬──────┐
	// │ (index)                  │ pos │ min │ max  │ mean │
	// ├──────────────────────────┼─────┼─────┼──────┼──────┤
	// │ by index with l-var      │ 100 │ 448 │ 600  │ 448  │
	// │ by index without l-var   │ 100 │ 448 │ 3880 │ 448  │
	// │ by index without l-var 2 │ 100 │ 448 │ 3848 │ 448  │
	// │ by index from end        │ 100 │ 448 │ 3848 │ 448  │
	// │ by index from end 2      │ 100 │ 448 │ 3848 │ 448  │
	// │ of operator              │ 100 │ 448 │ 4080 │ 448  │
	// │ Array#forEach()          │ 89  │ 504 │ 4032 │ 504  │
	// └──────────────────────────┴─────┴─────┴──────┴──────┘
	console.table(bench.memoryUsageTable());
})();
