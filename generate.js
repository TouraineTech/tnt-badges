require('babel-polyfill');
var brandedQRCode = require('branded-qr-code');
var asciidoctor = require('asciidoctor.js')();
var fs = require('fs');
var path = require('path');

if (!fs.existsSync('out')){
    fs.mkdir('out');
}

const capitalize = (s) => {
    if (typeof s !== 'string') return ''
    return s.toLowerCase()
    .split(' ')
    .map((s) => s.split('-').map((e) => e.charAt(0).toUpperCase() + e.substring(1)).join('-'))
    .join(' ');
  }

var attendees = require("./attendees.json");
var includeContent = "";
for (attendee of attendees){
    let number = attendee["Numéro"];
    let name = attendee["Nom"].toUpperCase();
    let firstName = capitalize(attendee["Prénom"]);
    let company = attendee["Société"];
    let email = attendee["Champ additionnel: Email"];
    let type = attendee["Type"];


    const logoPath = path.resolve(__dirname, `./tnt-logo.png`);
    const dst = path.resolve(__dirname, `./out/${number}.png`);
        brandedQRCode.generate({
            text: `${name} ${firstName}|${company}|${email}`,
            path: logoPath,
            ratio: 2,
            opt: { errorCorrectionLevel: 'H', margin: 0 },
        })
        .then((buf) => {
            fs.writeFileSync(dst, buf, (err) => {
                if (err) {
                    throw err
                }
            });
            let content = `
[grid="none", frame="none",cols="6,2,1"]
|===
a|**${firstName}**

${name} 

${company}
| image:${number}.png[] 
| ${type} __${number}__
|===
    `;
    fs.writeFileSync(`./out/${number}.adoc`, content)
});
    includeContent += `
include::out/${number}.adoc[]
`;
}
    
// Layout for Avery L4737REV-25 27 per page
var html = `
<meta charset="utf-8" /> 
<link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet">
<style>
@media print{
    @page {
        size: 210mm 297mm;
        margin: 1.6cm 0.1cm 1.3cm 0.55cm;
    }
    table{
        page-break-inside: avoid !important;
        page-break-after: avoid !important;
        page-break-before: avoid !important;
    }
    table:nth-of-type(27n){
        page-break-after: always !important;
    }
    body{
        margin:0;
        padding:0;
    }
}
body{
    font-family: "Roboto", sans-serif;
}
table{
    height:2.95cm;
    width: 6.35cm;
    border-spacing: 0;
    border-collapse: collapse;
    /*outline: 1px solid;*/
    position: relative;
    float: left;
    margin-right: 0.25cm;
}
table:nth-of-type(3n){
    margin-right: 0;
}
table img{
    width: 2cm;
    height: 2cm;
}
table td{
    text-align: center;
}
table td p{
    margin: 0;
}
table td:nth-of-type(1){
    width: 5.5cm;
    font-size: 14px;
    line-height: 1.3em;
    padding: 0;
}
table td:nth-of-type(2){
    width:2cm;
    text-align: right;
}
table td:nth-of-type(3){
    width: 0.1cm;
}
table td:nth-of-type(3) p {
    writing-mode: vertical-lr;
    text-transform: uppercase;
    font-size: 12px;
}
table td:nth-of-type(3) p em{
    writing-mode: initial;
    position: absolute;
    bottom: 0.25cm;
    right: 0.65cm;
    font-style: normal;
    font-size: .5em;
}
</style>
` + asciidoctor.convert(includeContent, {safe: 'server', attributes: {showtitle: true, icons: 'font'}});
fs.writeFileSync('./out/index.html', html);