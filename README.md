# webserial-receipt-printer

This is an library that allows you to print to a receipt printer using WebSerial. This can either be a printer connected using a serial port, or a printer connected in any other way where the driver sets up a virtual serial port for compatiblitity reasons.

### What does this library do?

In order to print a receipt on a receipt printer you need to build the receipt and encode it as in the ESC/POS or StarPRNT language. You can use the [`ThermalPrinterEncoder`](https://github.com/NielsLeenheer/ThermalPrinterEncoder) library for this. You end up with an array of raw bytes that needs to be send to the printer. One way to do that is using this library and WebSerial.

### How to use it?

Load the `webserial-receipt-printer.umd.js` file in the browser and instantiate a `WebSerialReceiptPrinter` object. 

    <script src='webserial-receipt-printer.umd.js'></script>

    <script>

        const receiptPrinter = new WebSerialReceiptPrinter();

    </script>


Or import the `webserial-receipt-printer.esm.js` module:

    import WebSerialReceiptPrinter from 'webserial-receipt-printer.esm.js';

    const receiptPrinter = new WebSerialReceiptPrinter();



### Connect to a receipt printer

The first time you have to manually connect to the receipt printer by calling the `connect()` function. This function must be called as the result of an user action, for example clicking a button. You cannot call this function on page load.

    function handleConnectButtonClick() {
        receiptPrinter.connect();
    }

Subsequent times you can simply call the `reconnect()` function. You have to provide an object with vendor id and product id of the previously connected receipt printer in order to find the correct printer and connect to it again. If there is more than one device with the same vendor id and product id it won't be able to determine which of the two devices was previously used. So it will not reconnect. You can get the vendor id and product id by listening to the `connected` event and store it for later use. Unfortunately this is only available for USB connected devices. It is recommended to call this button on page load to prevent having to manually connect to a previously connected device.

    receiptPrinter.reconnect(lastUsedDevice);

If there are no receipt printers connected that have been previously connected, or the serial number does not match up, this function will do nothing.

To find out when a receipt printer is connected you can listen for the `connected` event using the `addEventListener()` function.

    receiptPrinter.addEventListener('connected', device => {
        console.log(`Connected to a device with vendorId: ${device.vendorId} and productId: ${device.productId}`);

        /* Store device for reconnecting */
        lastUsedDevice = device;
    });

The callback of the `connected` event is passed an object with the following properties:

-   `vendorId`<br>
    The USB vendor ID or null when it is not available.
-   `productId`<br>
    The USB product ID or null when it is not available.


### Printing receipts

When you want to print a receipt, you can call the `print()` function with an array, or a typed array with bytes. The data must be properly encoded for the printer. 

For example:

    /* Encode the receipt */

    let encoder = new ThermalPrinterEncoder({
        language:  'esc-pos'',
        codepageMapping: 'epson''
    });

    let data = encoder
        .initialize()
        .text('The quick brown fox jumps over the lazy dog')
        .newline()
        .qrcode('https://nielsleenheer.com')
        .encode();

    /* Print the receipt */

    receiptPrinter.print(data);


### License

MIT

