const express = require('express');
const qz = require("qz-tray");
const ws = require('ws')
var bodyParser = require('body-parser');
const fs = require('fs');
var rs = require('jsrsasign');


const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: false }))


const PORT = 3000;

app.get('/', (req, res) => {
    res.status(200);
    res.send("QB Printer Service Running..");
});

app.get('/logo', (req, res) => {
    res.sendFile(__dirname + "/logo/logo.png");
});

app.get('/printers', async (req, res) => {
    var printers = await qz.printers.find();
    res.send({ "printers": printers });
});


app.post('/testPrint', async (req, res) => {
    let msg = req.body.msg;
    let printerName = req.body.printerName;
    let config = await qz.configs.create(printerName);

    console.info(req.body);

    await qz.print(config, [
        //'\x1B' + '\x40',
        msg,
        '\x0A',
        '\x0A',
        '\x0A',
        '\x0A',
        '\x0A',
        '\x1D' + '\x56' + '\x00'
    ]);


    res.send("Wait");
});


app.post("/generic", async (req, res) => {
    let init = '\x1B' + '\x40'; //init
    let centerLine = '\x1B' + '\x61' + '\x31'; // center align
    let lineBreak = '\x0A';
    let leftAlign = '\x1B' + '\x61' + '\x30';// left align
    let boldOn = '\x1B' + '\x45' + '\x0D'; // bold on
    let boldOf = '\x1B' + '\x45' + '\x0A'; // bold off
    let rightAlign = '\x1B' + '\x61' + '\x32'; // right align
    let emModeOn = '\x1B' + '\x21' + '\x30'; // em mode on
    let emModeOff = '\x1B' + '\x21' + '\x0A' + '\x1B' + '\x45' + '\x0A'; // em mode off
    let smallText = '\x1B' + '\x4D' + '\x31'; // small text 
    let normalText = '\x1B' + '\x4D' + '\x30'; // normal text
    let oldCutPaper = '\x1B' + '\x69';         // cut paper (old syntax)
    let fullCut1 = '\x1D' + '\x56' + '\x00'; // full cut (new syntax)
    let fullCut2 = '\x1D' + '\x56' + '\x30'; // full cut (new syntax)
    let partialCut1 = '\x1D' + '\x56' + '\x01'; // partial cut (new syntax)
    let partialCut2 = '\x1D' + '\x56' + '\x31'; // partial cut (new syntax)
    let paperKickOut = '\x10' + '\x14' + '\x01' + '\x00' + '\x05';  // Generate Pulse to kick-out cash drawer**

    let printData = req.body;

    console.info(`PrinterName: ${printData.printerName}`);
    console.info(printData);


    let sections = printData.sections;

    let finalData = [
        init,
        lineBreak,
        lineBreak,
        lineBreak,
        fullCut1
    ]

    let insertIndex = 1;
    let line = printData.divider;

    sections.forEach((section) => {
        let dataType = section.dataType;

        if (dataType == "TEXT") {

            let text = section.data;

            //ALIGN
            if (section.align == "CENTER") {
                let oldText = text;
                text = centerLine;
                text += oldText
            }
            else if (section.align == "LEFT") {
                let oldText = text;
                text = leftAlign;
                text += oldText
            }
            else if (section.align == "RIGHT") {
                let oldText = text;
                text = rightAlign;
                text += oldText
            }
            //BOLD
            if (section.bold) {
                let oldText = text;
                text = boldOn;
                text += oldText;
                text += boldOf;
            }
            //TEXT TYPE
            if (section.textType == "EMMODE") {
                let oldText = text;
                text = emModeOn;
                text += oldText;
                text += emModeOff;
            }
            else if (section.textType = "NORMAL") {
                let oldText = text;
                text = normalText;
                text += oldText;
            }
            else if (section.textType = "SMALL") {
                let oldText = text;
                text = smallText;
                text += oldText;
            }

            finalData.insert(insertIndex++, text);
        }

        if (dataType == "QR") {
            let qr = section.data;
            qrCodeData = qrCode(qr);
            if (qrCodeData != null) {
                qrCodeData.forEach((e) => {
                    finalData.insert(insertIndex++, e)
                })
                // finalData.insert(insertIndex++, lineBreak);
            }
        }

        if (dataType == "BARCODE") {
            let barcode = section.data;
           // finalData.insert(insertIndex++, centerLine);
            finalData.insert(insertIndex++, getBarcode(barcode))
        }

        if (section.divider) {
            finalData.insert(insertIndex++, lineBreak);
            finalData.insert(insertIndex++, line);
        }
        let limit = section.lineBreak;
        for (var i = 0; i < limit; i++) {
            finalData.insert(insertIndex++, lineBreak);
        }


    });

    let sectionLength = finalData.length - 4;

    showLogo = printData.logoInfo.showLogo && printData.logoInfo.imageUrl != null;
    isLogoBottom = printData.logoInfo.isBottom;
    if (showLogo) {
        logoPosition = 1
        if (printData.logoInfo.isBottom) {
            logoPosition = sectionLength;
        }

        imagePrint = {
            type: 'raw',
            format: 'image',
            flavor: 'file',
            data: printData.logoInfo.imageUrl, //'https://s3.ap-south-1.amazonaws.com/qbstore/chain2024/10000_843159282_1716532886.webp',
            options: { language: "ESCPOS", dotDensity: 'double' }
        }

        if (!printData.logoInfo.isBottom) {
            finalData.insert(logoPosition++, centerLine);
        }

        finalData.insert(logoPosition, imagePrint);
    }

    sectionLength = finalData.length - 4;
    showQr = printData.qrInfo.showQR;
    isQrBottom = printData.qrInfo.isBottom;
    if (showQr) {
        // qrPos = showLogo && !printData.logoInfo.isBottom ? logoPosition + 1 : 1;
        // if (printData.qrInfo.isBottom) {
        //     qrPos = showLogo && printData.logoInfo.isBottom  ? logoPosition+1: sectionLength + 1;
        // }
        qrPos = 1;
        if (printData.qrInfo.isBottom) {
            qrPos = sectionLength;
        }
        if (showLogo && isQrBottom == isLogoBottom) {
            qrPos++
        }

        qrCodeData = qrCode(printData.qrInfo.qr);
        if (qrCodeData != null) {
            qrCodeData.forEach((e) => {
                finalData.insert(qrPos++, e)
            })
            finalData.insert(qrPos++, lineBreak);
        }
    }

    sectionLength = finalData.length - 4;

    showBarcode = printData.barcodeInfo.showBarcode;
    isBarcodeBottom = printData.barcodeInfo.isBottom;
    if (showBarcode) {
        barcodePos = 1;
        if (isBarcodeBottom) {
            barcodePos = sectionLength;
        }

        if (showLogo && isBarcodeBottom == isLogoBottom) {
            barcodePos++;
        }
        if (showQr && isBarcodeBottom == isQrBottom) {
            barcodePos++;
        }


        finalData.insert(barcodePos++, centerLine);
        finalData.insert(barcodePos++, getBarcode(printData.barcodeInfo.barcode))
        finalData.insert(barcodePos++, lineBreak);
    }

    sectionLength = finalData.length - 4;

    footers= printData.footers

    if (footers) {
        footerIndex = sectionLength;
        finalData.insert(footerIndex++, lineBreak);
        footers.forEach((footer) => {
            finalData.insert(footerIndex++, footer)
            finalData.insert(footerIndex++, lineBreak);
        })
    }
    
    var config = await qz.configs.create(printData.printerName);

    qz.print(config, finalData);

    res.json({
        status: true,
        message: printData.printerName,
    })
    // return res.send("ERROR" +sectionLength);

})




function qrCode(qr) {
    // The dot size of the QR code
    var dots = '\x09';

    // Some proprietary size calculation
    var qrLength = qr.length + 3;
    var size1 = String.fromCharCode(qrLength % 256);
    var size0 = String.fromCharCode(Math.floor(qrLength / 256));

    var data = [
        '\x1B' + '\x61' + '\x31', //Center

        // <!-- BEGIN QR DATA -->
        '\x1D' + '\x28' + '\x6B' + '\x04' + '\x00' + '\x31' + '\x41' + '\x32' + '\x00',    // <Function 165> select the model (model 2 is widely supported)
        '\x1D' + '\x28' + '\x6B' + '\x03' + '\x00' + '\x31' + '\x43' + dots,               // <Function 167> set the size of the module
        '\x1D' + '\x28' + '\x6B' + '\x03' + '\x00' + '\x31' + '\x45' + '\x30',             // <Function 169> select level of error correction (48,49,50,51) printer-dependent
        '\x1D' + '\x28' + '\x6B' + size1 + size0 + '\x31' + '\x50' + '\x30' + qr,          // <Function 080> send your data (testing 123) to the image storage area in the printer
        '\x1D' + '\x28' + '\x6B' + '\x03' + '\x00' + '\x31' + '\x51' + '\x30',              // <Function 081> print the symbol data in the symbol storage area
        '\x1D' + '\x28' + '\x6B' + '\x03' + '\x00' + '\x31' + '\x52' + '\x30',              // <Function 082> Transmit the size information of the symbol data in the symbol storage area
        // <!-- END QR DATA -->
    ];

    return data;
}


function getBarcode(code) {

    //convenience method
    var chr = function (n) { return String.fromCharCode(n); };

    var barcode = '\x1D' + 'h' + chr(80) +   //barcode height
        '\x1D' + 'f' + chr(0) +              //font for printed number
        '\x1D' + 'k' + chr(69) + chr(code.length) + code + chr(0); //code39

    return barcode;
}

async function connectPrinter() {

    const privateKey = fs.readFileSync('private-key.pem', 'utf8');
    const digitalCertificate = fs.readFileSync('digital-certificate.txt', "utf8");

    qz.security.setCertificatePromise(function (resolve, reject) {
        resolve(digitalCertificate);
    });


    qz.security.setSignatureAlgorithm("SHA512");
    qz.security.setSignaturePromise(function (toSign) {
        return function (resolve, reject) {
            try {
                var pk = rs.KEYUTIL.getKey(privateKey);
                var sig = new rs.KJUR.crypto.Signature({ "alg": "SHA512withRSA" });
                sig.init(pk);
                sig.updateString(toSign);
                var hex = sig.sign();
                resolve(rs.stob64(rs.hextorstr(hex)));
            } catch (err) {
                console.error(err);
                reject(err);
            }
        };
    });


    qz.api.setWebSocketType(ws)
    config = {
        host: 'localhost',
        usingSecure: false,
        retries: 5,
        delay: 1
    };
    await qz.websocket.connect(config);
}


app.listen(PORT, '0.0.0.0', async (error) => {
    await connectPrinter();
    if (!error) {
        console.log("Queuebuster || QB Printer Service Running");
        console.warn("Please do not close")
    }

    else
        console.log("Error occurred, server can't start", error);
}

);

Array.prototype.insert = function (index, ...items) {
    this.splice(index, 0, ...items);
};
