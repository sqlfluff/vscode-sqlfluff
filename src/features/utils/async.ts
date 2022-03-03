/* eslint-disable @typescript-eslint/ban-ts-comment */
export interface ITask<T> {
	(): T;
}

/**
 * A helper to prevent accumulation of sequential async tasks.
 */
export class Throttler<T> {
	private activePromise!: Promise<T>;
	private queuedPromise!: Promise<T>;
	private queuedPromiseFactory!: ITask<Promise<T>>;

	public queue(promiseFactory: ITask<Promise<T>>): Promise<T> {
		if (this.activePromise) {
			this.queuedPromiseFactory = promiseFactory;

			if (!this.queuedPromise) {
				const onComplete = () => {
					// @ts-ignore
					this.queuedPromise = null;

					const result = this.queue(this.queuedPromiseFactory);
					// @ts-ignore
					this.queuedPromiseFactory = null;

					return result;
				};

				this.queuedPromise = new Promise<T>((resolve, reject) => {
					this.activePromise.then(onComplete, onComplete).then(resolve);
				});
			}

			return new Promise<T>((resolve, reject) => {
				this.queuedPromise.then(resolve, reject);
			});
		}

		this.activePromise = promiseFactory();

		return new Promise<T>((resolve, reject) => {
			this.activePromise.then((result: T) => {
				// @ts-ignore
				this.activePromise = null;
				resolve(result);
			}, (err: any) => {
				// @ts-ignore
				this.activePromise = null;
				reject(err);
			});
		});
	}
}

/**
 * A helper to delay execution of a task that is being requested often.
 */
export class Delayer<T> {
	public defaultDelay: number;
	private timeout!: number;
	private completionPromise!: Promise<T>;
	private onResolve!: (value: T | Thenable<T>) => void;
	private task!: ITask<T>;

	constructor(defaultDelay: number) {
		this.defaultDelay = defaultDelay;
	}

	public trigger(task: ITask<T>, delay: number = this.defaultDelay): Promise<T> {
		this.task = task;
		this.cancelTimeout();

		if (!this.completionPromise) {
			this.completionPromise = new Promise<T>((resolve, reject) => {
				this.onResolve = resolve;
			}).then(() => {
				// @ts-ignore
				this.completionPromise = null;
				// @ts-ignore
				this.onResolve = null;

				const result = this.task();
				// @ts-ignore
				this.task = null;

				return result;
			});
		}

		// @ts-ignore
		this.timeout = setTimeout(() => {
			// @ts-ignore
			this.timeout = null;
			// @ts-ignore
			this.onResolve(null);
		}, delay);

		return this.completionPromise;
	}

	public isTriggered(): boolean {
		return this.timeout !== null;
	}

	public cancel(): void {
		this.cancelTimeout();

		if (this.completionPromise) {
			// @ts-ignore
			this.completionPromise = null;
		}
	}

	private cancelTimeout(): void {
		if (this.timeout !== null) {
			// @ts-ignore
			clearTimeout(this.timeout);
			// @ts-ignore
			this.timeout = null;
		}
	}
}

/**
 * A helper to delay execution of a task that is being requested often, while
 * preventing accumulation of consecutive executions, while the task runs.
 */
export class ThrottledDelayer<T> extends Delayer<Promise<T>> {
	private throttler: Throttler<T>;

	constructor(defaultDelay: number) {
		super(defaultDelay);

		this.throttler = new Throttler();
	}

	public trigger(promiseFactory: ITask<Promise<T>>, delay?: number): Promise<Promise<T>> {
		// @ts-ignore
		return super.trigger(() => { return this.throttler.queue(promiseFactory); }, delay);
	}
}
