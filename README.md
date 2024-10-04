# WebSerialReceiptPrinter

This is an library that allows you to print to a receipt printer using WebSerial. This can either be a printer connected using a serial port, or a printer connected in any other way where the driver sets up a virtual serial port for compatiblitity reasons.

<br>

[![npm](https://img.shields.io/npm/v/@point-of-sale/webserial-receipt-printer)](https://www.npmjs.com/@point-of-sale/webserial-receipt-printer)
![GitHub License](https://img.shields.io/github/license/NielsLeenheer/WebSerialReceiptPrinter)


> This library is part of [@point-of-sale](https://point-of-sale.dev), a collection of libraries for interfacing browsers and Node with Point of Sale devices such as receipt printers, barcode scanners and customer facing displays.

<br>

## What does this library do?

In order to print a receipt on a receipt printer you need to build the receipt and encode it as in the ESC/POS or StarPRNT language. You can use the [`ReceiptPrinterEncoder`](https://github.com/NielsLeenheer/ReceiptPrinterEncoder) library for this. You end up with an array of raw bytes that needs to be send to the printer. One way to do that is using this library and WebSerial.

<br>

## How to use it?

Load the `webserial-receipt-printer.umd.js` file from the `dist` directory in the browser and instantiate a `WebSerialReceiptPrinter` object. 

```html
<script src='webserial-receipt-printer.umd.js'></script>

<script>

    const receiptPrinter = new WebSerialReceiptPrinter();

</script>
```

Or import the `webserial-receipt-printer.esm.js` module:

```js
import WebSerialReceiptPrinter from 'webserial-receipt-printer.esm.js';

const receiptPrinter = new WebSerialReceiptPrinter();
```

<br>

## Configuration

When you create the `WebSerialReceiptPrinter` object you can specify a number of options to help with the library with connecting to the device. 

### Serial port settings

Many devices that use serial ports can be configured to use different speeds and settings like databits, stopbits and parity and flow control. Sometimes these settings are hardcoded, sometimes they can be configured by DIP switches or other means. See the manual of your device for more information about how your device is configured and match the settings of your device with the properties below:

- `baudRate`<br>
    Number that indicates the speed, defaults to `9600`.
- `bufferSize`<br>
    Size of the read and write buffers, defaults to `255`.
- `dataBits`<br>
    Number of data bits per frame, either `7` or `8`, defaults to `8`.
- `flowControl`<br>
    The flow control type, either `none`, or `hardware`, defaults to `none`.
- `parity`<br>
    The parity mode, either `none`, `even` or `odd`. The default value is `none`.
- `stopBits`<br>
    The number of stop bits at the end of the frame. Can be either `1` or `2` and defaults to `1`.

For example, to set a baud rate of `9600`:

```js
const receiptPrinter = new WebSerialReceiptPrinter({ 
    baudRate: 9600
});
```

<br>

## Connect to a receipt printer

The first time you have to manually connect to the receipt printer by calling the `connect()` function. This function must be called as the result of an user action, for example clicking a button. You cannot call this function on page load.

```js
function handleConnectButtonClick() {
    receiptPrinter.connect();
}
```

Subsequent times you can simply call the `reconnect()` function. You have to provide an object with vendor id and product id of the previously connected receipt printer in order to find the correct printer and connect to it again. If there is more than one device with the same vendor id and product id it won't be able to determine which of the two devices was previously used. So it will not reconnect. You can get the vendor id and product id by listening to the `connected` event and store it for later use. Unfortunately this is only available for USB connected devices. It is recommended to call this button on page load to prevent having to manually connect to a previously connected device.

```js
receiptPrinter.reconnect(lastUsedDevice);
```

If there are no receipt printers connected that have been previously connected, or the serial number does not match up, this function will do nothing.

To find out when a receipt printer is connected you can listen for the `connected` event using the `addEventListener()` function.

```js
receiptPrinter.addEventListener('connected', device => {
    console.log(`Connected to a device with vendorId: ${device.vendorId} and productId: ${device.productId}`);

    /* Store device for reconnecting */
    lastUsedDevice = device;
});
```

The callback of the `connected` event is passed an object with the following properties:

-   `type`<br>
    Type of the connection that is used, in this case it is always `serial`.
-   `vendorId`<br>
    The USB vendor ID or null when it is not available.
-   `productId`<br>
    The USB product ID or null when it is not available.

<br>

## Commands

Once connected you can use the following command to print receipts.

### Printing receipts

When you want to print a receipt, you can call the `print()` function with an array, or a typed array with bytes. The data must be properly encoded for the printer. 

For example:

```js
/* Encode the receipt */

let encoder = new ReceiptPrinterEncoder({
    language:  'esc-pos',
    codepageMapping: 'epson'
});

let data = encoder
    .initialize()
    .text('The quick brown fox jumps over the lazy dog')
    .newline()
    .qrcode('https://nielsleenheer.com')
    .encode();

/* Print the receipt */

receiptPrinter.print(data);
```

<br>

-----

<br>

This library has been created by Niels Leenheer under the [MIT license](LICENSE). Feel free to use it in your products. The  development of this library is sponsored by Salonhub.

<a href="https://salohub.nl"><img src="https://salonhub.nl/assets/images/salonhub.svg" width=140></a>
