const express = require('express'); 
const qz = require("qz-tray");
const ws = require('ws')
var rs = require('jsrsasign');
var rsu = require('jsrsasign-util');
const { jsPDF } = require("jspdf"); 
const fs = require('fs');
const multer = require('multer');
const url = require('url');
var bodyParser = require('body-parser');


const app = express(); 
//app.use(express.json())
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: false })) // for form data





const PORT = 3000; 



const upload = multer({
    storage: multer.diskStorage({
        destination: async function (req, file, cb) {
             cb(null, "uploads")
        },
        filename: function (req, file, cb) {
            cb(null, "logo" + ".png");
        }
    })
}).single("logo")



app.post('/upload', upload, async (req, res)=>{ 
    // const fileUrl = __dirname + "/uploads/pdf.pdf";
    // let file = url.pathToFileURL(fileUrl);

    // let config = await qz.configs.create('EPSON TM-T82X-S/A');
    //         await qz.print(config, [{
    //                 type: 'pixel',
    //                 format: 'pdf',
    //                 data: 'http://127.0.0.1:3000/'+ file
    //             }]);

    res.send('hh'); 
 }); 

 app.get('/test', async (req, res)=>{ 
    const fileUrl = __dirname + "/uploads/pdf.pdf";

    let file = url.pathToFileURL(fileUrl);

    console.log(file);

    res.send("Hello");
    

 }); 
 


 app.post('/base64', async (req, res)=>{ 
    

    let config = await qz.configs.create('EPSON TM-T82X-S/A');
            await qz.print(config, [{
                type: 'raw', format: 'command', flavor: 'base64',
                data: req.body.img,
                }]);
   
   res.send("Hello");
    

 }); 
 

app.listen(PORT, '0.0.0.0', async (error) =>{ 
   await connectPrinter();
	if(!error) 
		console.log("Server is Successfully Running, and App is listening on port "+ PORT) 
	else
		console.log("Error occurred, server can't start", error); 
	} 
    
); 

app.get('/', (req, res)=>{ 
    res.status(200); 
    res.send("Welcome to root URL of Server"); 
}); 

app.get('/printers', async (req, res)=>{ 
    var printers = await qz.printers.find();
    res.send({"printers": printers}); 
}); 


app.get('/print', async (req, res)=>{ 
    let config = await qz.configs.create('EPSON TM-T82X-S/A');
    await qz.print(config, [{
            type: 'pixel',
            format: 'html',
            flavor: 'plain',
            data: '<h1>Hello JavaScript!</h1>'
        }]);

    res.send("Wait"); 
}); 


app.post('/printMe', async (req, res)=>{ 
    let msg = req.body.msg;
    let printerName = req.body.printerName;

    let config = await qz.configs.create("EPSON TM-T82X-S/A");
    await qz.print(config, [{
            type: 'raw',
            format: 'html',
            flavor: 'plain',
            data: msg
        }]);

    res.send("Wait"); 
}); 


app.post('/print2', async (req, res)=>{ 
    let msg = req.body.msg;
    let config = await qz.configs.create('Everycom-58-Series');
    await qz.print(config, [{
            type: 'pixel',
            format: 'html',
            flavor: 'plain',
            data: msg
        }]);

    res.send("Wait"); 
}); 


app.post('/print4', async (req, res)=>{ 
   let msg = req.body.msg;
   let printerName = req.body.printerName;
   let config = await qz.configs.create(printerName);
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
}); 

app.get("/esc", async (req,res) => {
    var config = qz.configs.create("EPSON TM-T82X-S/A");



    
var data = [
   { type: 'raw', format: 'image', flavor: 'file', data: 'https://via.placeholder.com/120x120&text=image1', options: { language: "ESCPOS", dotDensity: 'double' } },
  
   '\x1B' + '\x40',          // init
   '\x1B' + '\x61' + '\x31', // center align
   'Canastota, NY  13032' + '\x0A',
   '\x0A',                   // line break
   'http://qz.io' + '\x0A',     // text and line break
   '\x0A',                   // line break
   '\x0A',                   // line break
   'May 18, 2016 10:30 AM' + '\x0A',
   '\x0A',                   // line break
   '\x0A',                   // line break    
   '\x0A',
   'Transaction # 123456 Register: 3' + '\x0A',
   '\x0A',
   '\x0A',
   '\x0A',
   '\x1B' + '\x61' + '\x30', // left align
   'Baklava (Qty 4)       9.00' + '\x1B' + '\x74' + '\x13' + '\xAA', //print special char symbol after numeric
   '\x0A',
   'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' + '\x0A',       
   '\x1B' + '\x45' + '\x0D', // bold on
   'Here\'s some bold text!',
   '\x1B' + '\x45' + '\x0A', // bold off
   '\x0A' + '\x0A',
   '\x1B' + '\x61' + '\x32', // right align
   '\x1B' + '\x21' + '\x30', // em mode on
   'DRINK ME',
   '\x1B' + '\x21' + '\x0A' + '\x1B' + '\x45' + '\x0A', // em mode off
   '\x0A' + '\x0A',
   '\x1B' + '\x61' + '\x30', // left align
   '------------------------------------------' + '\x0A',
   '\x1B' + '\x4D' + '\x31', // small text
   'EAT ME' + '\x0A',
   '\x1B' + '\x4D' + '\x30', // normal text
   '------------------------------------------' + '\x0A',
   'normal text',
   '\x1B' + '\x61' + '\x30', // left align
   '\x0A' + '\x0A' + '\x0A' + '\x0A' + '\x0A' + '\x0A' + '\x0A',
   '\x1B' + '\x69',          // cut paper (old syntax)
// '\x1D' + '\x56'  + '\x00' // full cut (new syntax)
// '\x1D' + '\x56'  + '\x30' // full cut (new syntax)
// '\x1D' + '\x56'  + '\x01' // partial cut (new syntax)
// '\x1D' + '\x56'  + '\x31' // partial cut (new syntax)
   '\x10' + '\x14' + '\x01' + '\x00' + '\x05',  // Generate Pulse to kick-out cash drawer**
                                                // **for legacy drawer cable CD-005A.  Research before using.
// Star TSP100-series kick-out ONLY
// '\x1B' + '\x70' + '\x00' /* drawer 1 */ + '\xC8' + '\xC8' + '\x1B' + '\x1F' + '\x70' + '\x03' + '\x00',
// '\x1B' + '\x70' + '\x01' /* drawer 2 */ + '\xC8' + '\xC8' + '\x1B' + '\x1F' + '\x70' + '\x03' + '\x00',
   ];
let  imgB= `
  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
 `

 b = {
    type: 'raw', format: 'command', flavor: 'base64',
    data: imgB, options: { language: "ESCPOS", dotDensity: 'double' }
}

img = { type: 'raw', format: 'image', flavor: 'file', data: 'http://127.0.0.1:3000/file', options: { language: "ESCPOS", dotDensity: 'double' } };

txt1 =  '\x1B' + '\x4D' + '\x30', // normal text
txt2 = '------------------------------------------' + '\x0A',
text3 ='normal text',
paperCut =    '\x1B' + '\x69',          // cut paper (old syntax)
qz.print(config, [
    img,
    '\x1B' + '\x4D' + '\x30',
    'normal text',
   '\x1B' + '\x61' + '\x30', // left align
   '\x0A' + '\x0A' + '\x0A' + '\x0A' + '\x0A' + '\x0A' + '\x0A',
   '\x1B' + '\x69', 
    '\x10' + '\x14' + '\x01' + '\x00' + '\x05',
]).catch(function(e) { console.error(e); });

res.send("Hello");
});


app.post('/pdf', async (req, res) => {

// Default export is a4 paper, portrait, using millimeters for units
const doc = new jsPDF();

doc.text("Hello world!", 10, 10);
//doc.save("a4.pdf"); 

var data =fs.readFileSync('./a4.pdf');


let config = await qz.configs.create('EPSON TM-T82X-S/A');

await qz.print(config, [doc]);

res.send("Wait"); 

});


app.post('/print3', async (req, res)=>{ 

   const billingStoreName = "Billing Name";
   const billingStoreAddress = "A10, Pegasus Tower, Noida";
   const billingUser = "Syed"
    const maxWidth = 78 * 1.0464028110535053;
    const width = 70 * 1.0464028110535053;
    const orderID = "ORD1234567"
    const orderCreationTimeLocal = "24/01/2024"
    const quantity = 2;
    const MRP = 200;
    const itemSales = 201

    let x = `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thermal Receipt</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            margin: 20px;
        }

        .receipt {
            text-align: center;
            border: 1px solid #000;
            padding: 10px;
        }

        .item {
            text-align: left;
        }

        .total {
            font-weight: bold;
        }
    </style>
</head>
<body>

    <div class="receipt">
        <h2>Receipt</h2>
        <p>Date: 2024-01-24 12:34 PM</p>

        <div class="item">
            <p>Item 1<span style="float: right;">$10.00</span></p>
        </div>

        <div class="item">
            <p>Item 2<span style="float: right;">$15.00</span></p>
        </div>

        <div class="item">
            <p>Item 3<span style="float: right;">$8.50</span></p>
        </div>

        <hr>

        <div class="total">
            <p>Total<span style="float: right;">$33.50</span></p>
        </div>

        <p>Thank you for your purchase!</p>
    </div>

</body>
</html>

    `

    let y = `
    10000
 10000
 10000
 Sector 68
 A - 4
 Noida
 Uttar Pradesh
 Pincode: 201301
Contact No.: 8233788108
Email: priyanka@queuebuster.co
--------------------------------
Invoice
--------------------------------

Bill No.: OR1017320240124-18
Bill Time: 24-01-2024 18:51:14
Print Time: 24-01-2024 18:53:15
User(ID): gro
Order Type: Takeaway
--------------------------------
# Item            Qty   Amount
--------------------------------
1.munch it        1 P   110.00
  crunch                    
  MRP: 110.00
  HSN/SAC Code: 1236
  Barcode: 6152110063315
   Taxable Val           107.32 
   SGST                    2.68 
   Item Total            110.00 

--------------------------------
1 Items(1 Qty)          107.32 
Rounding                  0.00 
Total Amount            110.00 
--------------------------------
Tax           Taxable Amt Tax Value
--------------------------------
SGST              107.32   2.68
--------------------------------
Payment Mode: Cash( INR )
Paid Amount              110.00 
Tendered Amount       ₹  110.00 
Tendered Currency           INR 
Tendered Currency           1.0 
 CF                             
--------------------------------


Halo
--------------------------------

    
    `

    let rct = JSON.stringify(req.body.rct);
   
    let config = await qz.configs.create('Everycom-58-Series');
    await qz.print(config, [y]);

    res.send(rct); 
}); 







async function connectPrinter() {

   qz.security.setCertificatePromise(function (resolve, reject) {
    cer = `
    -----BEGIN CERTIFICATE-----
MIIECzCCAvOgAwIBAgIGAY3BPyGUMA0GCSqGSIb3DQEBCwUAMIGiMQswCQYDVQQG
EwJVUzELMAkGA1UECAwCTlkxEjAQBgNVBAcMCUNhbmFzdG90YTEbMBkGA1UECgwS
UVogSW5kdXN0cmllcywgTExDMRswGQYDVQQLDBJRWiBJbmR1c3RyaWVzLCBMTEMx
HDAaBgkqhkiG9w0BCQEWDXN1cHBvcnRAcXouaW8xGjAYBgNVBAMMEVFaIFRyYXkg
RGVtbyBDZXJ0MB4XDTI0MDIxODEyMDIzNloXDTQ0MDIxODEyMDIzNlowgaIxCzAJ
BgNVBAYTAlVTMQswCQYDVQQIDAJOWTESMBAGA1UEBwwJQ2FuYXN0b3RhMRswGQYD
VQQKDBJRWiBJbmR1c3RyaWVzLCBMTEMxGzAZBgNVBAsMElFaIEluZHVzdHJpZXMs
IExMQzEcMBoGCSqGSIb3DQEJARYNc3VwcG9ydEBxei5pbzEaMBgGA1UEAwwRUVog
VHJheSBEZW1vIENlcnQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCv
aLgni9YYWSG7/gpOzCgXhyBZdR61y3w/dQvb5ahj3Pr0IvvTmWOEPsi25vK/RnLI
LIgtrnslBcuiWqVgEImWAUym+yWRjnoiPWQVr/gwv9hGw1z7TdrZJtdvfwJG9JJ3
Id8tPNIHJO7rgSYPkt5kesLmEZNdx6o8lA6LXXfIerWzWia0A2EU0NqmMGqS6MhC
9zTbM+snXUbIeqd9PTM1y7bo58dx5I7mszZm2aCHO+SHZS6LIF7IRO9YVt8kO1qc
Ng+S793tCQ3dhM00kRl//FoeBpOuNRCTjlKgWAo+dfXb6b2LGUCJ3uXZOUhRyzXv
Xh2/qKx6FjFhFRnkPYUjAgMBAAGjRTBDMBIGA1UdEwEB/wQIMAYBAf8CAQEwDgYD
VR0PAQH/BAQDAgEGMB0GA1UdDgQWBBS8aNlycysaCnBSodfKB5TDwdcNQzANBgkq
hkiG9w0BAQsFAAOCAQEAevCCB9ndj4qbr3EVIsfPww17S82koyOUBAVZ8BLvtKwG
d88mDFdURgRKFniD2/BG910UPJgzg5y1PQ7lQQ7cBkC+PfLkYGd7ZORhqvxYQk/w
OiMyInFU19bSYuPNm2dwt4uCpwY38G+IVj0VAOBtZEMJP6HG394uVPCXi40zvnrr
C0WEwLOMV5PbdxcuZRyIcfwNaksIjDM9h402UzNFEZJVVShuBHRsmnL27pRW/GqV
2phjAKmBPuDSll9UzZwjWjocHvx4sgIXh6OCywEUARazjkcmJOztmCAUo/ld5foL
kk1P4fi88OWRJYdh9AzJgMQHRw9naAF4nEbbSxQSFQ==
-----END CERTIFICATE-----

    `
    resolve(cer);
  });


  privateKey = `
  -----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCvaLgni9YYWSG7
/gpOzCgXhyBZdR61y3w/dQvb5ahj3Pr0IvvTmWOEPsi25vK/RnLILIgtrnslBcui
WqVgEImWAUym+yWRjnoiPWQVr/gwv9hGw1z7TdrZJtdvfwJG9JJ3Id8tPNIHJO7r
gSYPkt5kesLmEZNdx6o8lA6LXXfIerWzWia0A2EU0NqmMGqS6MhC9zTbM+snXUbI
eqd9PTM1y7bo58dx5I7mszZm2aCHO+SHZS6LIF7IRO9YVt8kO1qcNg+S793tCQ3d
hM00kRl//FoeBpOuNRCTjlKgWAo+dfXb6b2LGUCJ3uXZOUhRyzXvXh2/qKx6FjFh
FRnkPYUjAgMBAAECggEABtFFSwraejLIprOudzaPHlmlo7nIxPG7iq8uvqVelexf
opUo1XtiN0sbZk8emIQ7739vltrvtVYpfni9xw3i0xOKL6PrkgyIFFmaJg+jT/28
1wST0hP0vA466aigOt1u7eDBTv2h/3Nrh81gCyiUVTJs7cqOwDfY7CbS/o6rmlKT
YT8XcPKbwbKxaLQ2uUGR6xTvJ5opPYAU3C8XtACLQ4WZ/hv13z1wX35Hwyrwkevx
4HOHcIuwX86e4k63IswvfmdId7x7ozmPJ+nyQSv2nWIIZfTfxL6JDO/87QX2VZjH
b3pkbuF/vfVz0EJz0rLUgHirycwlxia/Wm4EOc2pCQKBgQDtNAkErkEcyvaHFhD3
PLJqpKmtBbK9NpDbDfOb+0fNk/0tCDfa1hIGgKVSc5nkJqUqHHxOBZuwRasRMVHv
6Kbbk85NdP2RZ92tKj67Qt2S9jYIolkcsA1uvByTmddrBtdOqCRl9OAs34QUkVhN
s2UTnN5XGSEP2C8IjOtmxJkdqwKBgQC9TxyIplNS0GHcoIaxJk89V2U+E8kFo5zc
766axC65dl6CRLoLJEZ8cgyO5UrIvIgTLEWRvF0bpBYJrYRUK7fpSjlny6wcEr4o
p8XCkVixCIMNj3MQ8+gIrS24BcKIg6O1Zc46mPXLPWwtY1K5aPuHlUQ8IDrE/PlZ
p+MlqnMOaQKBgG0dCaT4j4UyLBNZ6DYC2sPJuS+ZNm5polrR4ST4g0Ai+kxzwlXN
MX+CQApcmQblbAaiEeBGHicI9Tc0a8+jQtYw+K6SyW3QzJ0ymKbFjG1lCtgP7lQO
/C7bI34WP4zBGdvZ5txrt4+MxhI8BdXAVxedin2gVqAWPxR81nBwsUp/AoGANF64
VA0/K7+98tztpgAlF6EfvuaWS9sRQAWGVgZDrsbSKlN87Cwi27ZpRvajk5ikRDmR
HVnwn/7qoc7AttBJVl5UNySe/j0pIfIXwVWYJZFnP88ZU+1FmXDfHvNo938DQOFj
Bc7e4FSjooLBlc03GDDw6Xk5CNm62VSagAcBQVECgYArTh0Cz/EAM8uOgx/lP2zb
Giav9U5DckZ3UAC5g7NuWg2xhqEJOb3KsjyhzyTmhICjcUbmCTNfYa4HZxBGPhDR
DlC8rZ3hyS9VuxdFA6pti13okz7iw/bf+pMHZzl0PAJ3BO7ktyanJA1YJUIJbuON
IdjG3FL1vd9uNtdMnvLb2g==
-----END PRIVATE KEY-----
  `


qz.security.setSignatureAlgorithm("SHA512"); // Since 2.1
qz.security.setSignaturePromise(function(toSign) {
    return function(resolve, reject) {
        try {
            var pk = rs.KEYUTIL.getKey(privateKey);
            var sig = new rs.KJUR.crypto.Signature({"alg": "SHA512withRSA"});  // Use "SHA1withRSA" for QZ Tray 2.0 and older
            sig.init(pk); 
            sig.updateString(toSign);
            var hex = sig.sign();
         //   console.log("DEBUG: \n\n" + rs.stob64(rs.hextorstr(hex)));
            resolve(rs.stob64(rs.hextorstr(hex)));
        } catch (err) {
            console.error(err);
            reject(err);
        }
    };
});

// qz.security.setSignaturePromise(function (toSign) {
//    return function (resolve, reject) {
//        try {
         
//            var pk = new rs.RSAKey();
//            pk.readPrivateKeyFromPEMString(strip(privateKey));
//            var hex = pk.signString(toSign, 'sha1');
//            console.log("DEBUG: \n\n" + stob64(hextorstr(hex)));
//            resolve(stob64(hextorstr(hex)));
//        } catch (err) {
//            console.error(err);
//            reject(err);
//        }
//    };
// });
    
    qz.api.setWebSocketType(ws)
    config = {
         host: 'localhost', 
         usingSecure: false,
         retries: 5, 
         delay: 1 
    };
    await qz.websocket.connect(config);
}


function strip(key) {
   if (key.indexOf('-----') !== -1) {
       return key.split('-----')[2].replace(/\r?\n|\r/g, '');
   }
}


async function printerCode() {
    qz.websocket.connect().then(() => {
        return qz.printers.find();
    }).then((printers) => {
        console.log(printers);
        let config = qz.configs.create('PDF');
        return qz.print(config, [{
            type: 'pixel',
            format: 'html',
            flavor: 'plain',
            data: '<h1>Hello JavaScript!</h1>'
        }]);
    }).then(() => {
        return qz.websocket.disconnect();
    }).then(() => {
        // process.exit(0);
    }).catch((err) => {
        console.error(err);
        // process.exit(1);
    });
}


app.get('/file', (req, res) => {
   res.sendFile(__dirname + "/uploads/logo.png");
});


app.post('/epos', upload, async (req, res) => {
   
    let printData = JSON.parse(req.body.printData);

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


    var config = await qz.configs.create(printData.printer);

    let headerPrint = centerLine + 
                      printData.header.storeName +
                      lineBreak +
                      printData.header.storeAddress +
                      lineBreak +
                      "Pincode: " + printData.header.pincode +
                      lineBreak +
                      "Contact No.:" + printData.header.contact +
                      lineBreak + 
                      "Email: " + printData.header.email +
                      lineBreak +
                      "VAT Number:" + printData.header.vatNumber +
                      lineBreak + lineBreak + lineBreak;

    let invoicePrint = emModeOn + 
                       printData.invoiceInfo.title +
                       lineBreak +
                       printData.invoiceInfo.subtitle +
                       lineBreak +
                       emModeOff +
                       lineBreak;                   
                      

    let divider = leftAlign +  "------------------------------------------" + lineBreak;


    let billingInfoPrint = leftAlign + 
                           "Bill No.: "  +  printData.billingInfo.billNumber + 
                           lineBreak +
                           "Bill Time: " +  printData.billingInfo.dateTime +
                           lineBreak +
                           "User(ID): " +  printData.billingInfo.billingUser + 
                           lineBreak + lineBreak +
                           "Billing Address: " +  printData.billingInfo.billingAddress +
                           lineBreak + lineBreak;

    //let itemHeaderPrint = "#Item         price        Qty      Amount" + lineBreak;   

    
    let items = alignProductForPrinter2(printData.items, lineBreak)


    let priceDetail = rightAlign + 
                      printAmountDetail(printData.priceDetails) +
                      lineBreak;

    let footer = centerLine + 
                 printData.footer.text + lineBreak + lineBreak;

    let qrCodeData = null;
    if (printData.footer.qr != null) {
        qrCodeData = qrCode(printData.footer.qr)
    }


    
    let hasLogo = req.file ? true: false;;            

    let imagePrint
    if (hasLogo) {
       imagePrint =  { 
        type: 'raw', 
        format: 'image',
         flavor: 'file', 
         data: 'http://localhost:3000/file',
          options: { language: "ESCPOS", dotDensity: 'double' } 
        }
    }


    let finalData= [
        init,
        headerPrint,
        invoicePrint,
        divider,
        billingInfoPrint,
        items,
        divider,
        priceDetail,
        divider,
        footer,
        lineBreak,
        lineBreak,
        lineBreak,
        fullCut1,
       
    ];


    let i = 9;
    if (qrCodeData != null) {
        qrCodeData.forEach((e) => {
            finalData.insert(i++, e)
        })

     }


    if (hasLogo) {
        finalData.unshift(imagePrint);
    }

    qz.print(config,  finalData)
    
    res.send("wait");
})


//convenience method
var chr = function(n) { return String.fromCharCode(n); };



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


  function alignProductForPrinter2(products, lineBreak) {
    let divider =  "------------------------------------------" + lineBreak;
    // Header
    let result = ""// "#Item".padEnd(20) + "Price".padEnd(12) + "Qty".padEnd(6) + "Amount\n";
  
    // Find the maximum length for each column
    const maxLengths = {
      name: "Item".length,
      price: "Price".length,
      qty: "Qty".length,
      total: "Amount".length
    };
  
    // Update maxLengths based on product data
    products.forEach(product => {
      Object.keys(product).forEach(key => {
        maxLengths[key] = Math.max(maxLengths[key], product[key].toString().length);
      });
    });

    result +=  divider;
  
    // Format header dynamically
    result = `#${"Item".padEnd(maxLengths.name + 2)}${"Price".padEnd(maxLengths.price + 2)}${"Qty".padEnd(maxLengths.qty + 2)}Amount\n`;
  
    result += divider;
    // Format each product dynamically
    products.forEach(product => {
      result += `#${product.name.padEnd(maxLengths.name + 2)}${product.price.padEnd(maxLengths.price + 2)}${product.qty.padEnd(maxLengths.qty + 2)}${product.total}\n`;
    });
  
    // Return the aligned result
    return result;
  }


  function printAmountDetail(items) {
    let result = '';
  
    // Header
    //result += 'Title'.padEnd(15) + 'Value\n';
    
    items.forEach(item => {
      const formattedItem = `${item.title.padEnd(15)}${item.value.padStart(10)}\n`;
      result += formattedItem;
    });
  
    // Add a line break at the end
    result += '\x0A';
    // Print the result to the console or any other output medium
    return result;
  }

Array.prototype.insert = function ( index, ...items ) {
    this.splice( index, 0, ...items );
};


app.get("/android", async (req, res) => {
   let header = `
   10000
   10000
   10000
   Sector 68
   A - 4
   Noida
   Uttar Pradesh
   Pincode: 201301
  Contact No.: 8233788108
  Email: priyanka@queuebuster.co
   `

   let invoice = 'Duplicate(1)Invoice'

   let billing = `
    Bill No.: OR1326720240205-9
    Bill Time: 05-02-2024 17:31:13
    Print Time: 05-02-2024 17:32:12
    User(ID): gro
    Order Type: Takeaway
   `

   let itemHeader = "# Item              Qty   Amount"

   let items = `
   1.munch it          1 P   110.00
  crunch                      
  MRP: 110.00
  HSN/SAC Code: 1236
  Barcode: 6152110063315
   Taxable Val           107.32 
   SGST                    2.68 
   Item Total            110.00 

2.MTN               1 P  1020.00
  MRP: 110.00
  HSN/SAC Code: 1244
  Barcode: 6154000006129
   Taxable Val           995.12 
   SGST                   24.88 
   Item Total           1269.02 

3.Peak Refil        1 P  1026.00
  Powdered                    
  Milk 400g                   
  MRP: 116.00
  HSN/SAC Code: 1250
  Barcode: 30085000007496
   Taxable Val          1000.98 
   SGST                   25.02 
   Item Total           1276.20 

   `

   let bottom = `
    3 Items(3 Qty)          2103.42 
    test                     199.61 
    Product                  199.61 
    Productabs               100.00 
    Rounding                  -0.22 
    Total Amount            2655.00 
    --------------------------------
    Tax    Taxable Amt      Tax Value
    --------------------------------
    SGST      2103.42          52.58
    --------------------------------
   `


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


    var config = await qz.configs.create('EPSON TM-T82X-S/A');

    qz.print(config, [
        init,
        centerLine,
        header,
        lineBreak,
        emModeOn,
        invoice,
        emModeOff,
        lineBreak,
        leftAlign,
        billing,
        lineBreak,
        boldOn,
        itemHeader,
        boldOf,
        lineBreak,
        items,
        lineBreak,
        bottom,
        lineBreak,
        lineBreak,
        lineBreak,
        fullCut1,

    ])

});



app.post("/android2",upload, async (req, res) => {

    let printData = JSON.parse(req.body.printData);


    let header = printData.header;
 
    let invoice = printData.receiptHeading;
 
    let billing = printData.billingInfo;
 
    let itemHeader = printData.itemHeader;
 
    let items = printData.newPrintReceipt;
   
 
    let bottom = printData.amountDetail;

    let line = printData.line    
 
 
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
 
 
     var config = await qz.configs.create('EPSON TM-T82X-S/A');
 
     let finalData = [
        init,
        centerLine,
        header,
        lineBreak,
        line,
        emModeOn,
        invoice,
        emModeOff,
        line,
        lineBreak,
        leftAlign,
        billing,
        lineBreak,
        line,
        boldOn,
        itemHeader,
        boldOf,
        line,
        lineBreak,
        items,
        line,
        lineBreak,
        bottom,
        centerLine,
        lineBreak,
        lineBreak,
        lineBreak,
        fullCut1,
    ];

    showLogo = printData.logoInfo.showLogo
    if (showLogo) {
        logoPosition = 2
        if (printData.logoInfo.isBottom) {
            logoPosition = 24
        }

        imagePrint =  { 
            type: 'raw', 
            format: 'image',
             flavor: 'file', 
             data: 'http://localhost:3000/file',
              options: { language: "ESCPOS", dotDensity: 'double' } 
        }

        finalData.insert(logoPosition, imagePrint);
    }

    showQr = printData.qrInfo.showQR;
    if (showQr) {
        qrPos = showLogo ? 3 : 2;
        if (printData.qrInfo.isBottom) {
            qrPos = showLogo ? 25: 24;
        }

        qrCodeData = qrCode(printData.qrInfo.qr);
        if (qrCodeData != null) {
            qrCodeData.forEach((e) => {
                finalData.insert(qrPos++, e)
            })

        }
    }
    

     qz.print(config, finalData)
 
 });



 app.post("/generic", upload, async (req,res) => {
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

    let printData = JSON.parse(req.body.printData);


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

    showLogo = printData.logoInfo.showLogo
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
             data: 'http://localhost:3000/file',
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

    var config = await qz.configs.create(printData.printerName);
    qz.print(config, finalData);


    return res.send("L" +sectionLength);



 })



 app.get("/barcode", async (req, res) => {
    //barcode data
    var code = "1234";

    // //convenience method
    // var chr = function(n) { return String.fromCharCode(n); };

    // var barcode = '\x1D' + 'h' + chr(80) +   //barcode height
    //     '\x1D' + 'f' + chr(0) +              //font for printed number
    //     '\x1D' + 'k' + chr(69) + chr(code.length) + code + chr(0); //code39

     var config = qz.configs.create("EPSON TM-T82X-S/A");
     qz.print(config, [getBarcode(code)]);

    res.send("h,m")
 })

 

 function getBarcode(code) {

       //convenience method
       var chr = function(n) { return String.fromCharCode(n); };

       var barcode = '\x1D' + 'h' + chr(80) +   //barcode height
           '\x1D' + 'f' + chr(0) +              //font for printed number
           '\x1D' + 'k' + chr(69) + chr(code.length) + code + chr(0); //code39

       return barcode;    
 }