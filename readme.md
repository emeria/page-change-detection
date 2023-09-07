app.js
- crawls the site recursively
- hashes page content and keeps that has for the next run
- compares the current hash to the previous runs
- takes a screenshot if hash differs

app-with-images
- an older version of app.js
- saves all images from each page

app-image-compare.js (current)
- crawls the site recursively
- takes a screenshot and hashes the binary
- if the hash matches the previous for this page, then delete the screenshot
- if it doesn't match, keep it and update the hash

Current Issues:
* The hash is not working properly because the screenshots are inconsistent with where they start their height at the top of the page. This leads to slightly cropped images that do not compare the same.
