const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const url = require('url');
const https = require('https');
const csv = require('csv-parser');
const crypto = require('crypto');

//let visitedPages = new Set();
let pages = [];
const hash = crypto.createHash('sha256');

const updateRecord = (record, hash) =>{
    record.hash = hash;
    record.date = new Date();
}

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set the URL of the website you want to scrape
    //const websiteUrl = 'http://communicatehealth.com'; // Replace with your target website
    const websiteUrl = 'https://cheatsheet.monster'; //

    fs.createReadStream('pages.csv')
    .pipe(csv())
    .on('data', (row) => {
        pages.push(row);
    })
    .on('end', () => {
        console.log('CSV file successfully loaded into the pages array:', pages);
    });
      
    await processPage(browser, page, websiteUrl);

    await browser.close();

    if (pages.length > 0) {
        const writableStream = fs.createWriteStream('pages.csv');
        writableStream.write(Object.keys(pages[0]).join(',') + '\n');
        pages.forEach((record) => {
            if(record.name === urlToVisit)
                writableStream.write(Object.values(record).join(',') + '\n');
        });
        writableStream.end();
    } else {
        //pages has no content  
        console.log('pages has no content');
    }
});

async function processPage(browser, page, urlToVisit) {

    //content to add
    content = page.content;// +","+"temp123"+","+"date"+"\r\n";
    newHash = crypto.createHash('sha256').update(content).digest('hex');

    //Write to history file
    const recordToUpdate = pages.find((record) => record.name === urlToVisit && record.hash !== newHash);
    const recordNotFound = !(pages.find((record) => record.name === urlToVisit));
    if (recordToUpdate) {
      updateRecord(recordToUpdate, newHash);
      console.log('Record updated:', recordToUpdate);
    } else if (recordNotFound) {
        const newRecord = { name: urlToVisit, hash: newHash, date: new Date() };
        pages.push(newRecord);
        console.log('New record added:', newRecord);
    } else{
        console.log('No change to record');
    }

    // if (pages.length > 0) {
    //     const writableStream = fs.createWriteStream('pages.csv');
    //     writableStream.write(Object.keys(pages[0]).join(',') + '\n');
    //     pages.forEach((record) => {
    //         if(record.name === urlToVisit)
    //             writableStream.write(Object.values(record).join(',') + '\n');
    //     });
    //     writableStream.end();
    // } else {
    //     //pages has no content  
    //     console.log('pages has no content');
    // }

    if (visitedPages.has(urlToVisit)) {
        console.log(urlToVisit + ' has already been visited.');
        return;
    }
    visitedPages.add(urlToVisit);

    console.log(`Visiting ${urlToVisit}`);
    await page.goto(urlToVisit, {waitUntil: 'networkidle0'});

    /*
    Screenshot page content 
    */
    // Sanitize the URL to be a valid filename
    const screenshotName = urlToVisit.replace(/\W/g, '_') + '.png';

    // Take a full page screenshot
    await page.screenshot({path: './screenshots/'+screenshotName, fullPage: true});

    // Extract all the internal links on the page
    const pageLinks = await page.evaluate(() => {
        const hostname = new URL(window.location.href).hostname;
        return Array.from(document.querySelectorAll('a'))
            .map(a => a.href)
            .filter(href => href.startsWith('http') 
                && new URL(href).hostname === hostname 
                && !href.includes('.pdf')
                && !href.includes('/#')
                )
            .filter(href => {
                const pathname = new URL(href).pathname;
                return pathname === '/wehearthealthliteracy/' || !pathname.startsWith('/wehearthealthliteracy/');
            }
            );
    });

    // Visit each link
    for (let i = 0; i < pageLinks.length; i++) {
        await processPage(browser, page, pageLinks[i]);
    }
}

// function downloadImage(imageUrl, savePath){
//     const parsedUrl = url.parse(imageUrl);
//     const imagePath = path.resolve(savePath, path.basename(parsedUrl.pathname));
    
//     https.get(imageUrl, (res) => {
//         const stream = fs.createWriteStream(imagePath);

//         res.pipe(stream);

//         stream.on('finish', () => {
//             stream.close();
//         });
//     });
// }
