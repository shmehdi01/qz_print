const express = require('express');
const qz = require("qz-tray");
const ws = require('ws')
var bodyParser = require('body-parser');
const fs = require('fs');
var rs = require('jsrsasign');
const path = require('path');

// Resolve runtime files (cert/key) relative to the EXE's own folder, not the
// current working directory. When packaged with pkg and launched as a service
// / scheduled task / shortcut, process.cwd() is often NOT the EXE folder, so
// a bare 'private-key.pem' fails with ENOENT. process.execPath points at the
// EXE, so its dirname is where the loose cert files live. In dev (plain node)
// fall back to __dirname.
const APP_DIR = process.pkg ? path.dirname(process.execPath) : __dirname;
function appFile(name) { return path.join(APP_DIR, name); }


const app = express();
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: false }))

// Process-level safety net. pkg bundles Node 18, where an unhandled promise
// rejection terminates the whole process by default. Print routes do
// `await qz.*` / fire-and-forget qz.print without try/catch, so any QZ Tray
// hiccup, offline printer, or malformed request would otherwise CRASH the
// service ("the EXE closes automatically"). Log and stay up instead.
process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection]', (reason && reason.message) || reason);
});
process.on('uncaughtException', (err) => {
    console.error('[uncaughtException]', (err && err.message) || err);
});


const PORT = 3000; 

app.get('/', (req, res)=>{ 
    res.status(200); 
    res.send("QB Printer Service Running.."); 
}); 

app.get('/logo', (req, res) => {
    res.sendFile(__dirname + "/logo/logo.png");
});

app.get('/printers', async (req, res)=>{
    try {
        await ensureConnected();
        var printers = await qz.printers.find();
        res.send({"printers": printers});
    } catch (err) {
        // QZ Tray disconnected -> qz.printers.find() rejects with
        // "Cannot read properties of null (reading 'sendData')". Reconnect
        // above handles the common case; if it still fails, return an empty
        // list with 500 instead of letting it become an unhandledRejection.
        console.error("[/printers] failed:", (err && err.message) || err);
        if (!res.headersSent) res.status(500).send({ printers: [], error: String((err && err.message) || err) });
    }
});


app.post('/testPrint', async (req, res)=>{
  try {
    let msg = req.body.msg;
    let printerName = req.body.printerName;
    await ensureConnected();
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
     '\x1D' + '\x56'  + '\x00'
 ]);


    res.send("Wait");
  } catch (err) {
    console.error("[/testPrint] failed:", (err && err.message) || err);
    if (!res.headersSent) res.status(500).send({ status: false, error: String((err && err.message) || err) });
  }
 });


 app.post("/generic", async (req,res) => {
    let init = '\x1B' + '\x40'; //init
    let centerLine = '\x1B' + '\x61' + '\x31'; // center align
    let lineBreak = '\x0A';
    let leftAlign = '\x1B' + '\x61' + '\x30';// left align
    let boldOn =  '\x1B' + '\x45' + '\x0D'; // bold on
    let boldOf = '\x1B' + '\x45' + '\x0A'; // bold off
    let rightAlign = '\x1B' + '\x61' + '\x32'; // right align
    let emModeOn=  '\x1B' + '\x21' + '\x30'; // em mode on
    let emModeOff = '\x1B' + '\x21' + '\x0A' + '\x1B' + '\x45' + '\x0A'; // em mode off
    let smallText = '\x1B' + '\x4D' + '\x31'; // small text 
    let normalText=  '\x1B' + '\x4D' + '\x30'; // normal text
    let oldCutPaper= '\x1B' + '\x69';         // cut paper (old syntax)
    let fullCut1 = '\x1D' + '\x56'  + '\x00'; // full cut (new syntax)
    let fullCut2 = '\x1D' + '\x56'  + '\x30'; // full cut (new syntax)
    let partialCut1 = '\x1D' + '\x56'  + '\x01'; // partial cut (new syntax)
    let partialCut2 = '\x1D' + '\x56'  + '\x31'; // partial cut (new syntax)
    let paperKickOut =    '\x10' + '\x14' + '\x01' + '\x00' + '\x05';  // Generate Pulse to kick-out cash drawer**

    try {

    let printData = req.body;

    console.info(`PrinterName: ${printData.printerName}`);
    console.info(printData.logoInfo);


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

    sections.forEach((section)=> {
        let text = section.text;
    
        //ALIGN
        if (section.align == "CENTER") {
            let oldText= text;
            text = centerLine;
            text+=oldText
        }
        else if (section.align == "LEFT") {
            let oldText= text;
            text = leftAlign;
            text+=oldText
        }
        else if (section.align == "RIGHT") {
            let oldText= text;
            text = rightAlign;
            text+=oldText
        }
        //BOLD
        if (section.bold) {
            let oldText = text;
            text = boldOn;
            text+=oldText;
            text+=boldOf;
        }
         //TEXT TYPE
        if (section.textType == "EMMODE") {
            let oldText = text;
            text = emModeOn;
            text+=oldText;
            text+=emModeOff;
        }
        else if (section.textType = "NORMAL") {
            let oldText = text;
            text = normalText;
            text+=oldText;
        }
        else if (section.textType = "SMALL") {
            let oldText = text;
            text = smallText;
            text+=oldText;
        }

        finalData.insert(insertIndex++, text);
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

        imagePrint =  { 
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

    await ensureConnected();
    var config = await qz.configs.create(printData.printerName);

    await qz.print(config, finalData);

    res.json({
        status: true,
        message: printData.printerName,
    })

    } catch (err) {
        // Previously a QZ-disconnect / offline-printer / bad-request here threw
        // an unhandled rejection and crashed the whole service. Log it and
        // return HTTP 500 so the Android app surfaces a "Printer not responding"
        // message instead of silently losing the receipt.
        console.error("[/generic] print failed:", (err && err.message) || err);
        if (!res.headersSent) {
            return res.status(500).json({ status: false, error: String((err && err.message) || err) });
        }
    }

 })




function qrCode(qr) {
    // The dot size of the QR code
    var dots = '\x09';
    
    // Some proprietary size calculation
    var qrLength = qr.length + 3;
    var size1 =  String.fromCharCode(qrLength % 256);
    var size0 = String.fromCharCode(Math.floor(qrLength / 256));
    
    var data = [ 
        '\x1B' + '\x61' + '\x31', //Center
    
       // <!-- BEGIN QR DATA -->
       '\x1D' + '\x28' + '\x6B' + '\x04' + '\x00' + '\x31' + '\x41' + '\x32' + '\x00',    // <Function 165> select the model (model 2 is widely supported)
       '\x1D' + '\x28' + '\x6B' + '\x03' + '\x00' + '\x31' + '\x43' + dots,               // <Function 167> set the size of the module
       '\x1D' + '\x28' + '\x6B' + '\x03' + '\x00' + '\x31' + '\x45' + '\x30',             // <Function 169> select level of error correction (48,49,50,51) printer-dependent
       '\x1D' + '\x28' + '\x6B' + size1 + size0 + '\x31' + '\x50' + '\x30' + qr,          // <Function 080> send your data (testing 123) to the image storage area in the printer
       '\x1D' + '\x28' + '\x6B' + '\x03' + '\x00' + '\x31' + '\x51' +'\x30',              // <Function 081> print the symbol data in the symbol storage area
       '\x1D' + '\x28' + '\x6B' + '\x03' + '\x00' + '\x31' + '\x52' +'\x30',              // <Function 082> Transmit the size information of the symbol data in the symbol storage area
       // <!-- END QR DATA -->
       ];
    
       return data;
    }
    

function getBarcode(code) {

        //convenience method
        var chr = function(n) { return String.fromCharCode(n); };
 
        var barcode = '\x1D' + 'h' + chr(80) +   //barcode height
            '\x1D' + 'f' + chr(0) +              //font for printed number
            '\x1D' + 'k' + chr(69) + chr(code.length) + code + chr(0); //code39
 
        return barcode;    
}

async function connectPrinter() {

    const privateKey = fs.readFileSync(appFile('private-key.pem'), 'utf8');
    const digitalCertificate = fs.readFileSync(appFile('digital-certificate.txt'), "utf8");

   qz.security.setCertificatePromise(function (resolve, reject) {
    resolve(digitalCertificate);
   });


    qz.security.setSignatureAlgorithm("SHA512"); 
    qz.security.setSignaturePromise(function(toSign) {
        return function(resolve, reject) {
            try {
                var pk = rs.KEYUTIL.getKey(privateKey);
                var sig = new rs.KJUR.crypto.Signature({"alg": "SHA512withRSA"});
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

// Lazily (re)connect to QZ Tray. The original code connected once at startup
// and never recovered if QZ Tray restarted or the socket dropped ("QZ Tray
// stops working"). Call this before every print so a dropped connection
// self-heals on the next job instead of failing forever.
async function ensureConnected() {
    try {
        if (qz.websocket.isActive && qz.websocket.isActive()) return;
    } catch (e) {
        // isActive can throw before the first connect — fall through to connect.
    }
    await connectPrinter();
}


app.listen(PORT, '0.0.0.0', async (error) =>{
     if(!error)
         {
             console.log("Queuebuster || QB Printer Service Running");
             console.warn("Please do not close")
         }

     else {
         console.log("Error occurred, server can't start", error);
         return;
     }
     // Connect to QZ Tray, but never let a failed connect crash startup — if
     // QZ Tray isn't running yet, the HTTP server still comes up and each
     // print lazily (re)connects via ensureConnected().
     try {
         await connectPrinter();
         console.log("Connected to QZ Tray");
     } catch (e) {
         console.error("Initial QZ Tray connect failed; will retry on demand:", (e && e.message) || e);
     }
     }

 );

Array.prototype.insert = function ( index, ...items ) {
    this.splice( index, 0, ...items );
};
