import EventEmitter from "./event-emitter.js";

class ReceiptPrinter {}

class WebSerialReceiptPrinter extends ReceiptPrinter {

	#emitter;

	#options = {};
	#port = null;
	#reader = null;
	#queue = [];
	#state = {
		running:	false,
		closing:	false
	}

	constructor(options) {
		super();
		
		this.#emitter = new EventEmitter();

		this.#options =	Object.assign({
			baudRate:		9600,
			bufferSize:		255,
			dataBits:		8,
			flowControl:	'none',
			parity:			'none',
			stopBits:		1
		}, options);

		navigator.serial.addEventListener('disconnect', event => {
			if (this.#port == event.target) {
				this.#emitter.emit('disconnected');
			}
		});
	}

	async connect() {
		try {
			let port = await navigator.serial.requestPort();
			
			if (port) {
				await this.#open(port);
			}
		}
		catch(error) {
			console.log('Could not connect! ' + error);
		}
	}

	async reconnect(previousPort) {
		if (!previousPort.vendorId || !previousPort.productId) {
			return;
		}

		let ports = await navigator.serial.getPorts();

		let matches = ports.filter(port => {
			let info = port.getInfo();
			return info.usbVendorId == previousPort.vendorId && info.usbProductId == previousPort.productId;
		})

		if (matches.length == 1) {
			await this.#open(matches[0]);
		}
	}

	async #open(port) {
		this.#port = port;
		this.#state.closing = false;

		await this.#port.open(this.#options);

		let info = this.#port.getInfo();
		
		this.#emitter.emit('connected', {
			type:				'serial',
			vendorId: 			info.usbVendorId || null,
			productId: 			info.usbProductId || null,
			language: 			null,
			codepageMapping:	null
		});
	}

	async disconnect() {
		if (!this.#port) {
			return;
		}

		this.#state.closing = true;
		this.#reader.cancel();

		await this.#reader.closed;
		await this.#port.close();

		this.#port = null;

		this.#emitter.emit('disconnected');
	}

	async listen() {
		this.#read();
		return true;
	}

	async #read() {
		while (this.#port.readable && this.#state.closing === false) {
            this.#reader = this.#port.readable.getReader();

			try {
				while (true) {
                    const { value, done } = await this.#reader.read();

					if (done) {
						break;
					}
					if (value) {
						this.#emitter.emit('data', value);
					}
				}
			} catch (error) {
			} finally {
				this.#reader.releaseLock();
			}
		}	
	}
	
	async print(command) {
		this.#queue.push(command);
		this.run();
	};

	async run() {
		if (this.#state.closing) {
			return;
		}
		
		if (this.#state.running) {
			return;
		}

		this.#state.running = true;

		const writer = this.#port.writable.getWriter();

		let command;

		while (command = this.#queue.shift()) {
			await writer.write(command);
		}

		writer.releaseLock();

		this.#state.running = false;
	}

	addEventListener(n, f) {
		this.#emitter.on(n, f);
	}
}

export default WebSerialReceiptPrinter;