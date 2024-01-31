const express = require('express'); 
const qz = require("qz-tray");
const ws = require('ws')
var rs = require('jsrsasign');
var rsu = require('jsrsasign-util');




const app = express(); 
app.use(express.json())

const PORT = 3000; 

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
    let config = await qz.configs.create('EPSON TM-T82 Receipt');
    await qz.print(config, [{
            type: 'pixel',
            format: 'html',
            flavor: 'plain',
            data: '<h1>Hello JavaScript!</h1>'
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
   let config = await qz.configs.create('Everycom-58-Series');
   await qz.print(config, [msg]);
   

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

      cert = `-----BEGIN CERTIFICATE-----
      MIID/TCCAuWgAwIBAgIUF/A2Eb/OjEs81Hconpazd+XPQVowDQYJKoZIhvcNAQEL
      BQAwgYwxCzAJBgNVBAYTAklOMQwwCgYDVQQIDANERUwxDjAMBgNVBAcMBU5vaWRh
      MRcwFQYDVQQKDA5RdWV1ZWJ1c3RlciBDbzELMAkGA1UECwwCUUIxDDAKBgNVBAMM
      A0RQRDErMCkGCSqGSIb3DQEJARYcaHVzc2Fpbi5tZWhkaUBxdWV1ZWJ1c3Rlci5j
      bzAgFw0yNDAxMzEwNzExMTJaGA8yMDU1MDcyNjA3MTExMlowgYwxCzAJBgNVBAYT
      AklOMQwwCgYDVQQIDANERUwxDjAMBgNVBAcMBU5vaWRhMRcwFQYDVQQKDA5RdWV1
      ZWJ1c3RlciBDbzELMAkGA1UECwwCUUIxDDAKBgNVBAMMA0RQRDErMCkGCSqGSIb3
      DQEJARYcaHVzc2Fpbi5tZWhkaUBxdWV1ZWJ1c3Rlci5jbzCCASIwDQYJKoZIhvcN
      AQEBBQADggEPADCCAQoCggEBAK0P81cXseoUYh69kgPnDEGhdHLcGI+UopRbqDYV
      m2NfORK5uXEWMcLmiYK9VbJmQAEPtQcaEbfvgLgCaIn0lCjPzQiKiOsFjPV7X219
      YxcaQf5AZHVNU8cqMyGDhH5x4V/u8nGDnhMWZzs1MmfaWew3tmjEAyR06R6qpq27
      GXXm1QoTlP/byxQ6XFqnWbS1PSALCI9gckAaXQEVxc4Ykejq+WFn/DoEimj2fs+O
      WrHydRl3vFgoSzPZlS9WulwLsbiCtsMHeOPuxtdKbNqqclQQkxf3a3f1ig1UYQ/P
      CUfZpu1QKMgTkpMtaxSaHoXH0xjF1wx4MMpiWs4OxJZLYnUCAwEAAaNTMFEwHQYD
      VR0OBBYEFHJ4FY13AuYzAC4pY6N8SV37IJahMB8GA1UdIwQYMBaAFHJ4FY13AuYz
      AC4pY6N8SV37IJahMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEB
      AEOeATpA8fFH5HNzQT5ZMgHgv/Ztx18gxy4ai+hFiw0DNYAjqzpAEtaB5zauTRLN
      bTs4iUBRexACjX9A5PKXaGCGNtIfk9S0wtRzaFCUtZxDtJ4Y0eQDwrNZGOdpzrD6
      O6zrAgfnyZKaB9puR7/cP+bEBt2iLN0hhor60x27ZRgl/uOecocpiWpvbQRIj4Et
      UwE6Uy1Eu0Ii3ml1Ma0Esq9MI8vH8FJfwOmptqVsHPQGtCDltVzyz7JAzJ2HvHkd
      Q0Jbf/Xx+PX052nrGh4KzMl4CzmIrMXAejs59yEq1sfAXRBPv1FgEEglP/edIP+y
      fSDq64hAmsWkoW7Et5bOCBo=
      -----END CERTIFICATE-----`
      resolve(cert);
  });


  privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCtD/NXF7HqFGIe
vZID5wxBoXRy3BiPlKKUW6g2FZtjXzkSublxFjHC5omCvVWyZkABD7UHGhG374C4
AmiJ9JQoz80IiojrBYz1e19tfWMXGkH+QGR1TVPHKjMhg4R+ceFf7vJxg54TFmc7
NTJn2lnsN7ZoxAMkdOkeqqatuxl15tUKE5T/28sUOlxap1m0tT0gCwiPYHJAGl0B
FcXOGJHo6vlhZ/w6BIpo9n7Pjlqx8nUZd7xYKEsz2ZUvVrpcC7G4grbDB3jj7sbX
SmzaqnJUEJMX92t39YoNVGEPzwlH2abtUCjIE5KTLWsUmh6Fx9MYxdcMeDDKYlrO
DsSWS2J1AgMBAAECggEAIjlQicVbj3sy8TnTdZacL6FubiV07PX7lcOvduycc1Ea
MAgO8lxtgEnHYVWwbAx49UzGI66l2N5R8fG1+ywlHZIEjb8ZtwJ8vvIEK9qbPS8Z
5F4XD7R4UB9aB7NiwP+jzm0qQEUDPmqUhRquymddl49n8P1sUqoVDNW6CwrATPaC
++GAqJyCKgTzOuH7tCdunzxSOhtfkic2xz4qUFrkVw9h7MMcahF0f2V5c0b6ERCv
j7R4UEKPLgmI17mMmxYFAdhlyIj8eN93igSEtUAZIdldczKbkn7COAhKs1J/ZUR1
CwCZuASjWMv2phxvH0YNd9ZFXAltqxLVFrkDaXGycQKBgQDf2j/7woZNUtk/sDFt
NSHb/LljUV9QM6hZjDcSrVeaPR1AzYx2qr4bBgTvCIFr7xivRMDzgoLBrhIJT6eC
XcokAwtIxqq9Agsos29IkhjdOlJOx+0oJlT+g8qShjRSg4mLryo6nlcJkaJ+enTE
+hhdjStaf4HQFDyrueBozb6HcQKBgQDF6nDFJIVwv2ghDyfdRrM13ckcTti4a6XU
xZhsZKKDyvWHJ0f3LHb9qw0owJkG4Nwj/oUdsAj5N5+ofYVEb0nXyL8+NJAwh6Ki
EPOYl4s4LMy5kEADviRXPHkRE8K/lMkvMuBcozfrDge2iFZSb31pMTNS+txcAqT8
pEUmhqhxRQKBgQC3f/ZxT72+Rwr1zV5HEoYGCn6CLuM+IIqBlZJTyisEsdJ4G8do
Q4EBMAb9V3CYZPBMRMUTGMpNMH9yiIxdLrsUmDY42zp9I96355dy2uhs+XEdSYBc
KEgGN0zongDoHxGyos2wLbpVir+0hHeSPR2aGq4OSnXEd8JgV0fhQb9M0QKBgDL+
guvoyxEP4E6UTxsuekJo0MagciqiYen+t5VGILGAe97E+j/vjwExL4TOix9AlLgZ
fkb18nn0IQkSvmGxov8cVFo8xOIcMIU9hOZONarVsDInvra4KTjo9fC2fLlMJsIo
g7Kaw2+m/8nCOyumWlPeP3Ej/d8fN095K/APRhtZAoGAWRlbonccsSyL9ePf4MQF
msa6WvIMtJ80v6aQ1H/ONI8oez+/4qpHdvaDTBCBEuFNfVkfPQfNqhsq5mZEVgso
PtIY5O1mbUU6eBt6PxjaUzA2KfbaGFPeJbli4UBVrPh4RQlMYzBY6hsX1Sy95hSj
gFIOThducK0k9pDBfUPDU/4=
-----END PRIVATE KEY-----`


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