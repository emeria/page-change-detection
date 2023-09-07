const puppeteer = require('puppeteer');
const csv = require('csv-parser');
const fs = require('fs');
const crypto = require('crypto');
const url = require('url');

const historicalCrawlResults = [];
const visitedLinks = new Set();
const logOutputPath = 'log.txt';

// Function to calculate the hash of a string using SHA-256 algorithm
const calculateHash = (content) => {
  return crypto.createHash('sha256').update(content).digest('hex');
};

// Function to save the data to the CSV log file
/**
 * TO DO: There is an issue that the hash is being taken on the content for each page, 
 * but sometimes a link to a different page is used that is really the same page. 
 * This different comes from unseen thing such as hidden conditionals for expanded 
 * or collapsed menu items
 */
const saveToCSV = () => {
  const writableStream = fs.createWriteStream('crawl_results.csv');
  writableStream.write('url,hash,date\n');

  // Write each record to the CSV file
  fs.appendFileSync(logOutputPath, 'Writing csv...'+'\n');
  historicalCrawlResults.forEach((record) => {
    if (record.url !== undefined) {
      fs.appendFileSync(logOutputPath, "Writing: " + record.url+'\n');
      writableStream.write(`${record.url},${record.hash},${record.date}\n`);
    } else {
      fs.appendFileSync(logOutputPath, "Undefined" + record+'\n');
    }
  });
  writableStream.end();
};

// Function to crawl the site and take screenshots
const crawlPage = async (page, url) => {
  await page.goto(url);

  //Without setting viewport to full scrollheight, we don't get a full page image
  const pageHeight = await page.evaluate(() => {
    return document.body.scrollHeight
  })

  await page.setViewport({
    width: 1920,
    height: pageHeight
  })

  await page.evaluate((_) => {
    document.getElementsByTagName('body')[0].style.transition = 'none'; //disable transitions
    window.scrollBy({ //scroll to the bottom of the page
      top: 800,
      behavior: "smooth",
    });
  });

  // Get the page content (as an html string)
  const content = await page.content();

  fs.appendFileSync(logOutputPath, 'Hashing for: ' + url+'\n');
  // Calculate the hash of the page content
  const hash = calculateHash(content);
  fs.appendFileSync(logOutputPath, 'Hash is: ' + hash + '\n');


  //debug only
  contentFile = url.replace(/[<>:"/\\|?*]+/g, '_')+ "_"+ hash + '.txt';

  fs.writeFile(contentFile, hash + '\n' + content, (err) => {
    if (err) {
      console.error('An error occurred:', err);
    } else {
      fs.appendFileSync(logOutputPath, 'File written successfully!'+'\n');
    }
  });

  //find the index of the existing record for this URL in our historical crawl data
  const existingRecordIndex = historicalCrawlResults.findIndex((record) => record.url == url);
  const historicalRecord = historicalCrawlResults[existingRecordIndex];
  fs.appendFileSync(logOutputPath, "index " + existingRecordIndex + " " + historicalRecord.url + " " + historicalRecord.hash+'\n');

  //if the URL is already in our historical crawl data, 
  if (existingRecordIndex > -1) { //if the URL is already in our historical crawl data
    fs.appendFileSync(logOutputPath, "history-"+historicalRecord.url + " " + historicalRecord.hash+ " "+ url + " " + hash+'\n');
    if (historicalRecord.hash === hash) { //if the hash is the same, no changes have been made
      fs.appendFileSync(logOutputPath, `No changes detected for ${url}. Skipping...`+'\n');
      return;
    } else { //debug only
      fs.appendFileSync(logOutputPath, typeof (historicalRecord.hash) + " " + historicalRecord.hash + " " + typeof (hash) + " " + hash+'\n');


      fs.appendFileSync(logOutputPath, `Changes detected for ${url}. Taking a new screenshot...`+'\n');
      // Take a new screenshot
      await page.screenshot({ path: `screenshots/` + currentRunDate + `/${url.replace(/\W+/g, '-')}.png`, fullpage: true });

      // Update the hash and date in the existing record
      historicalRecord.hash = hash;
      historicalRecord.date = new Date().toISOString();
    }
  } else {
    fs.appendFileSync(logOutputPath, `New URL found: ${url}. Taking a screenshot...`+'\n');
    // Take a new screenshot
    await page.screenshot({ path: `screenshots/` + currentRunDate + `/${url.replace(/\W+/g, '-')}.png`, fullpage: true });

    // Add a new record to the results array
    historicalCrawlResults.push({
      url: url,
      hash: hash,
      date: new Date().toISOString(),
    });
  }

  visitedLinks.add(url);
};

// Function to remove the query string from the URL
function removeQueryString(inputUrl) {
  let parsedUrl = url.parse(inputUrl);
  newUrl = parsedUrl.protocol + "//" + parsedUrl.hostname + parsedUrl.pathname;
  newUrl = newUrl.replace(/\/$/, ""); //remove trailing slash
  return newUrl;
}

// Recursive function to crawl the site
const crawlSite = async (page, url) => {

  url = removeQueryString(url);

  // Check if the URL has already been visited during the current run
  if (visitedLinks.has(url)) {
   // fs.appendFileSync(logOutputPath, `URL already visited: ${url}. Skipping...`+'\n');
    return;
  }

  await crawlPage(page, url);

  // Get all the links on the page
  const links = await page.$$eval('a', (elements) =>
    elements.map((el) => el.href)
  );

  //remove duplicates
  const uniqueLinks = links.filter((value, index, self) => {
      return self.indexOf(value) === index;
  });

  for (let link of uniqueLinks) {
    if (link.startsWith(url)) {
      if (visitedLinks.has(removeQueryString(link))) {
       // fs.appendFileSync(logOutputPath, `URL already crawled: ${link}. Skipping...`+'\n');
        continue;
      }
      await crawlSite(page, link);
    }
  }
};

// Main function
(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  // calculate the current date and time for folder path
  currentRunDate = new Date().toISOString().replace(/:/g, "-");
  currentRunPath = `./screenshots/` + currentRunDate;

  fs.appendFileSync(logOutputPath, 'Starting at '+currentRunDate+' for '+ currentRunPath+'\n');

  // Read existing data from the CSV file, if it exists
  if (fs.existsSync('crawl_results.csv')) {
    fs.createReadStream('crawl_results.csv')
      .pipe(csv())
      .on('data', (row) => { // Read each row into an array
        historicalCrawlResults.push(row);
        // visitedLinks.add(row.url);
        fs.appendFileSync(logOutputPath, row.url + '_' + row.hash+'\n');
      })
      .on('end', () => {
        fs.appendFileSync(logOutputPath, 'Existing data loaded from crawl_results.csv'+'\n');
      });
  }

  // Create a new directory for the current run
  fs.mkdir(currentRunPath, (error) => {
    if (error) {
      fs.appendFileSync(logOutputPath, error+'\n');
    } else {
      fs.appendFileSync(logOutputPath, "New Directory created successfully for " + currentRunPath+'\n');
    }
  });

  // Start crawling the site
  await crawlSite(page, 'https://www.ptsd.va.gov/apps/aboutface/');

  // Save the updated data to the CSV file
  saveToCSV();

  fs.appendFileSync(logOutputPath, 'Finished at '+currentRunDate+'\n\n');
  await browser.close();
})();