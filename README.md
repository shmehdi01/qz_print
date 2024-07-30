# QZ Printer Service


### Get Printer name

`GET` | `Endpoint` \printers

`Response: `  

```json {
  "printers": [
    "TSC TE310",
    "EPSON TM-T82X-S/A",
    "EPSON TM-T82-S/A"
  ]
}
```

### Test Print

`POST` | `Endpoint` \testPrint 

BODY:
```json
  {
   "printerName": "EPSON",
   "msg": "hello print"
  }
```

### Generic Print

`POST` | `Endpoint` \generic 

BODY:
```json
{
  "printerName": "EPSON TM-T82X-S/A",
  "qrInfo": {
    "qr": "SYED",
    "isBottom": true,
    "showQR": true
  },
  "barcodeInfo": {
    "barcode": "1234",
    "isBottom": true,
    "showBarcode": true
  },
  "logoInfo": {
    "isBottom": false,
    "showLogo": true,
    "imageUrl": "https://s3.ap-south-1.amazonaws.com/qbstore/chain2024/10000_843159282_1716532886.webp"
  },
  "divider": "----------------------------------------",
  "sections": [
    {
      "text": "INVOICE2",
      "align": "CENTER",
      "bold": true,
      "textType": "EMMODE",
      "lineBreak": 2,
      "divider": true
    },
    {
      "text": "3 Items(3 Qty)          2103.42",
      "align": "LEFT",
      "bold": true,
      "textType": "NORMAL",
      "lineBreak": 1,
      "divider": true
    },
    {
      "text": "test",
      "align": "LEFT",
      "bold": false,
      "textType": "NORMAL",
      "lineBreak": 1,
      "divider": true
    },
    {
      "text": "ThankYou",
      "align": "CENTER",
      "bold": false,
      "textType": "SMALL",
      "lineBreak": 1,
      "divider": false
    }
  ]
}
```

