const { get } = require('https');
const similar = require('similarity');
const mail = require('sendmail')();
const { writeFile } = require('fs');

const URL = 'https://www.jbhifi.co.nz/cameras/all-cameras/';
// const URL = 'https://www.noelleeming.co.nz/shop/photography/digital-cameras/c10066-c10073-p1.html';
const TIMEOUT = 40000;
const DIFFERENCE = 1;
const FROM = 'iam@alvarouribe.cl';
const TO = ['iam@alvarouribe.cl'];

let firstTimer = true;
let base = '';  

function run() {
  get(URL, (res) => {
    let html = ``;
    let today = new Date();
    console.log(`Requesting... ${today}`);
    console.log(`firstTimer: ${firstTimer}`);
          
    if (res.statusCode !== 200) {
      console.error(new Error(`Something went wrong, status ${res.statusCode}`));
      res.resume();
    }
  
    res.setEncoding('utf8');
  
    res.on('data', (chunk) => {
      console.log('chunk',chunk);
      html += chunk;
    });
  
    res.on('end', () => {
      
      const difference = similar(base, html);
      console.log(`difference: ${difference}`);

      if (difference < DIFFERENCE) {
        base = html;
        
        if (!firstTimer) {
          const fileName = `${Date.now()}.html`;

          writeFile(`./logs/${fileName}`, html, (err) => {
            if (err) console.error('Error writing file:', err);
          });
        
          mail({
            from: FROM,
            to: TO,
            subject: 'Scraper = Change Found',
            html: 'Attached file...',
            attachments: [
              {   // utf-8 string as an attachment
                filename: fileName,
                content: html
              }
            ]
          }, (err, reply) => {
            console.error(err && err.stack);
          });
        }
        firstTimer = false;
      }

      setTimeout(() => {
        run();
      }, TIMEOUT);
    });
  
  }).on('error', (err) => {
    console.error(err);
  });
}

run();

console.log('Started.');
