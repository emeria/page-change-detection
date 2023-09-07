const puppeteer = require('puppeteer');
const csv = require('csv-parser');
const fs = require('fs');
const crypto = require('crypto');
const results = [];
const visitedLinks = new Set();


content = "cat";
content2 = "cat2";
content3 = "cat";

console.log(crypto.createHash('sha256').update(content).digest('hex')+'\n');
console.log(crypto.createHash('sha256').update(content2).digest('hex')+'\n');
console.log(crypto.createHash('sha256').update(content3).digest('hex')+'\n'); //should be same as first

console.log('https://www.ptsd.va.gov/apps/aboutface,'+crypto.createHash('sha256').update('https://www.ptsd.va.gov/apps/aboutface').digest('hex')+'\n');
console.log('https://www.ptsd.va.gov/apps/aboutface/what-is-ptsd,'+crypto.createHash('sha256').update('https://www.ptsd.va.gov/apps/aboutface/what-is-ptsd').digest('hex')+'\n');
console.log('https://www.ptsd.va.gov/apps/aboutface/how-does-ptsd-affect-the-people-i-love,'+crypto.createHash('sha256').update('https://www.ptsd.va.gov/apps/aboutface/how-does-ptsd-affect-the-people-i-love').digest('hex')+'\n');
console.log('https://www.ptsd.va.gov/apps/aboutface/what-is-treatment-like,'+crypto.createHash('sha256').update('https://www.ptsd.va.gov/apps/aboutface/what-is-treatment-like').digest('hex')+'\n');
console.log('https://www.ptsd.va.gov/apps/aboutface/how-can-treatment-help-me,'+crypto.createHash('sha256').update('https://www.ptsd.va.gov/apps/aboutface/how-can-treatment-help-me').digest('hex')+'\n');
console.log('https://www.ptsd.va.gov/apps/aboutface/whats-next-step,'+crypto.createHash('sha256').update('https://www.ptsd.va.gov/apps/aboutface/whats-next-step').digest('hex')+'\n');
console.log('https://www.ptsd.va.gov/apps/aboutface/ptsd-therapies,'+crypto.createHash('sha256').update('https://www.ptsd.va.gov/apps/aboutface/ptsd-therapies').digest('hex')+'\n');
console.log('https://www.ptsd.va.gov/apps/aboutface/ptsd-therapies/pe-prolonged-exposure,'+crypto.createHash('sha256').update('https://www.ptsd.va.gov/apps/aboutface/ptsd-therapies/pe-prolonged-exposure').digest('hex')+'\n');
console.log('https://www.ptsd.va.gov/apps/aboutface/ptsd-therapies/cpt-cognitive-processing-therapy,'+crypto.createHash('sha256').update('https://www.ptsd.va.gov/apps/aboutface/ptsd-therapies/cpt-cognitive-processing-therapy').digest('hex')+'\n');
console.log('https://www.ptsd.va.gov/apps/aboutface/ptsd-therapies/emdr-eye-movement-desensitization-and-reprocessing,'+crypto.createHash('sha256').update('https://www.ptsd.va.gov/apps/aboutface/ptsd-therapies/emdr-eye-movement-desensitization-and-reprocessing').digest('hex')+'\n');
console.log('https://www.ptsd.va.gov/apps/aboutface/military-sexual-trauma,'+crypto.createHash('sha256').update('https://www.ptsd.va.gov/apps/aboutface/military-sexual-trauma').digest('hex')+'\n');
console.log('https://www.ptsd.va.gov/apps/aboutface/race-culture-and-ptsd,'+crypto.createHash('sha256').update('https://www.ptsd.va.gov/apps/aboutface/race-culture-and-ptsd').digest('hex')+'\n');
console.log('https://www.ptsd.va.gov/apps/aboutface/resources-for-professionals,'+crypto.createHash('sha256').update('https://www.ptsd.va.gov/apps/aboutface/resources-for-professionals').digest('hex')+'\n');
console.log('https://www.ptsd.va.gov/apps/aboutface/watch-videos,'+crypto.createHash('sha256').update('https://www.ptsd.va.gov/apps/aboutface/watch-videos').digest('hex')+'\n');
console.log('https://www.ptsd.va.gov/apps/aboutface/about-us,'+crypto.createHash('sha256').update('https://www.ptsd.va.gov/apps/aboutface/about-us').digest('hex')+'\n');

/**
 * Results for ptsd.va.gov/apps/aboutface URLs (not content)
 * 
https://www.ptsd.va.gov/apps/aboutface,68375915bcbe6ae01dabd79be220bd96a2a6f9b145545bf1d4c8d95ad5610dbf
https://www.ptsd.va.gov/apps/aboutface/what-is-ptsd,c8f3cac0414c03d4be0f8d8007532fd4f55e18052ebbe1d2f92b814f7ca9bbd4
https://www.ptsd.va.gov/apps/aboutface/how-does-ptsd-affect-the-people-i-love,32b1ccdaa740a00cbccddee5d91a22ba30e8f2a68c8dabc56c3815c45c050ab1
https://www.ptsd.va.gov/apps/aboutface/what-is-treatment-like,d0ae4980442ea9bfa50bb18d4a222ede1f514ea9f6dc84dc832c2b9a0e9b463c
https://www.ptsd.va.gov/apps/aboutface/how-can-treatment-help-me,10bfbc713f96818afee37403401c04da56c4b10fd4ad50d7d37fe0876790040f
https://www.ptsd.va.gov/apps/aboutface/whats-next-step,bde1d15bf361427a3bebf637d66513d65d7deac19379349573258212c949330b
https://www.ptsd.va.gov/apps/aboutface/ptsd-therapies,b39c08aa5c734c4ceaeb81f3b8f2c75b176efd5decb63581190821424d666046
https://www.ptsd.va.gov/apps/aboutface/ptsd-therapies/pe-prolonged-exposure,d8eef6a3206cb2b9754c5a5bdc2746e795782889ad450ec96718cbff9c88c1c5
https://www.ptsd.va.gov/apps/aboutface/ptsd-therapies/cpt-cognitive-processing-therapy,b96b763de4fe1fd5492f12638611e53d3bb8cc3df697867ed46857ad595f9659
https://www.ptsd.va.gov/apps/aboutface/ptsd-therapies/emdr-eye-movement-desensitization-and-reprocessing,48503ac92861b77ab0de94530c54a8c37f09db19b6afd9b2242ce962bcfa6404
https://www.ptsd.va.gov/apps/aboutface/military-sexual-trauma,27c1b054d78c792cd029ddc2aebca3f172a402f5d65dc91548769a43fa525cab
https://www.ptsd.va.gov/apps/aboutface/race-culture-and-ptsd,3657f5e2f77c1946750330506d21970a8b355cd8dc17b273712addb0938c0a50
https://www.ptsd.va.gov/apps/aboutface/resources-for-professionals,e11ce050a02628b0fc788a2abca54c675a5d76c97e17e43de22b7a7f65a298c6
https://www.ptsd.va.gov/apps/aboutface/watch-videos,934e22377827ca67ef0df033ef9bb6e25832a7df44ddcea9c0f8dc486bfd0351
https://www.ptsd.va.gov/apps/aboutface/about-us,64b6c4bf59fdfaabfebe1a7f879eb12c6991ad74a12fc3385f8f2f707520e644
 */