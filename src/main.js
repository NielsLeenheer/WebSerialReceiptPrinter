import EventEmitter from "./event-emitter.js";

class ReceiptPrinter {}

class WebSerialReceiptPrinter extends ReceiptPrinter {

	constructor(options) {
		super();
		
		this._internal = {
			emitter:    new EventEmitter(),
			port:     	null,
			reader:     null,
			profile:	null,
			queue:		[],
			running: 	false,
			closing:	false,
			options:	Object.assign({
				baudRate:		9600,
				bufferSize:		255,
				dataBits:		8,
				flowControl:	'none',
				parity:			'none',
				stopBits:		1
			}, options)
		};

		navigator.serial.addEventListener('disconnect', event => {
			if (this._internal.port == event.target) {
				this._internal.emitter.emit('disconnected');
			}
		});
	}

	async connect() {
		try {
			let port = await navigator.serial.requestPort();
			
			if (port) {
				await this.open(port);
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
			await this.open(matches[0]);
		}
	}

	async open(port) {
		this._internal.port = port;
		this._internal.closing = false;

		await this._internal.port.open(this._internal.options);

		let info = this._internal.port.getInfo();
		
		this._internal.emitter.emit('connected', {
			type:				'serial',
			vendorId: 			info.usbVendorId || null,
			productId: 			info.usbProductId || null,
			language: 			null,
			codepageMapping:	null
		});
	}

	async disconnect() {
		if (!this._internal.port) {
			return;
		}

		this._internal.closing = true;
		this._internal.reader.cancel();

		await this._internal.reader.closed;
		await this._internal.port.close();

		this._internal.port = null;
		this._internal.profile = null;

		this._internal.emitter.emit('disconnected');
	}

	async listen() {
		while (this._internal.port.readable && this._internal.closing === false) {
            this._internal.reader = this._internal.port.readable.getReader();

			try {
				while (true) {
                    const { value, done } = await this._internal.reader.read();

					if (done) {
						break;
					}
					if (value) {
						this._internal.emitter.emit('data', value);
					}
				}
			} catch (error) {
			} finally {
				this._internal.reader.releaseLock();
			}
		}	
	}
	
	async print(command) {
		this._internal.queue.push(command);
		this.run();
	};

	async run() {
		if (this._internal.closing) {
			return;
		}
		
		if (this._internal.running) {
			return;
		}

		this._internal.running = true;

		const writer = this._internal.port.writable.getWriter();

		let command;

		while (command = this._internal.queue.shift()) {
			await writer.write(command);
		}

		writer.releaseLock();

		this._internal.running = false;
	}

	addEventListener(n, f) {
		this._internal.emitter.on(n, f);
	}
}

export default WebSerialReceiptPrinter;