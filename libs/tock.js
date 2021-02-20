/**
* based on github.com/mrchimp/tock
* itself based on sitepoint.com/creating-accurate-timers-in-javascript/
*/

/**
* Called by Tock internally to determine `source`'s offset from current real time
*/
let delta = (source = 0) => Date.now() - source;

class Tock {
	
	constructor (options) {
		
		let defaults = {
			
			running: false,
			
			timeout: null,
			
			ticksMissed: null,
			
			resolution: 16,

			cycle: false,
			
			time: {
				
				current: 0,
				
				started: 0,
				paused:  0,
				ended:   0,
				
				base:    0
				
			},
			
			duration: 0,
			
			callback () { },
			
			complete () { }
			
		};
		
		Object.assign(this, defaults, options);
		
	}
	
    /**
    * Called every tick for countdown clocks.
    * i.e. once every this.resolution ms
    */
	_tick () {
		
		this.time.current += this.resolution;
		
		if (this.duration - this.time.current < 0) {
			
			this.time.ended = 0;
			this.running = false;
			
			this.callback();
			
			clearTimeout(this.timeout);
			
			this.complete();
			
			return this.cycle && this.restart();
			
		} else {
			
			this.callback();
			
		};
		
		let diff = delta(this.time.started) - this.time.current,
			untilNextInterval = this.resolution - Math.max(diff, 0);
		
		if (untilNextInterval <= 0) {
			
			this.ticksMissed = Math.floor(Math.abs(untilNextInterval) / this.resolution);
			
			this.time.current += this.ticksMissed * this.resolution;
			
			if (this.running) this._tick();
			
		} else if (this.running) {
			
			this.timeout = setTimeout(this._tick.bind(this), untilNextInterval);
			
		};
		
	};
	
    /**
    * Called by Tock internally - use start() instead
    */
	_startCountdown (duration) {
		
		this.duration = duration;
		
		this.time.started = Date.now();
		this.time.current = 0;
		
		this.running = true;
		
		this._tick();
		
	};
	
    /**
    * Reset the clock
    */
	reset () {
		
		if (this.countdown) return false;
		
		this.stop();
		
		this.time.started = this.time.current = 0;
		
	};
	
    /**
    * Restart (stop -> start) the clock
    */
	restart () {
		
		this.stop();
		this.start(this.time.base);
		
	};
	
    /**
    * Start the clock.
    * @param {Various} time Accepts a single "time" argument in ms
    */
	start (time = 1000) {
		
		if (this.running) return false;
		
		this.time.started = this.time.base = time;
		this.time.paused = 0;
		
		this._startCountdown(time);
		
	};
	
    /**
    * Stop the clock and clear the timeout
    */
	stop () {
		
		this.time.paused = this.left();
		
		this.running = false;
		
		clearTimeout(this.timeout);
		
		this.time.ended = this.duration - this.time.current;
		
	};
	
    /**
    * Pause the clock.
    */
	pause () {
		
		if (!this.running) return;
		
		this.time.paused = this.left();
		
		this.stop();
		
	};
	
    /**
    * Unpause the clock.
    */
	unpause () {
		
		if (!this.time.paused) return;
		
		this._startCountdown(this.time.paused)
			
		this.time.paused = 0;
		
	};
	
    /**
    * Get the current clock time in ms.
    * @return {Integer} Number of milliseconds elapsed/remaining
    */
	left () {
		
		if (!this.running) return this.time.paused || this.time.ended;
		
		let now  = delta(this.time.started),
			left = Math.abs(this.duration - now);
			
		return left;
		
	};
	
    /**
    * Remove `value` ms from `this.duration`
    */
	reduce (value) {
		
		this.duration = Math.max(this.duration - value, 0);
		
	};
	
};