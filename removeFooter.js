//////////////////////////////////////////////////////////////////////////////////////
//
//	AHU3D - A Javascript Module for Parametric Design Tool for Air Handling Units.
//
//
//	    LIMITED TEMPORARY LICENSE FOR DEMO PURPOSES ONLY - EXPIRES 2025/01/01
//
//
//		   NOT AUTHORIZED FOR PRODUCTION DEPLOYENT OR REDISTRIBUTION.
//
//
//				PROPERTY OF COGNITIVE DYNAMICS LTD.
//
//
//				    ALL RIGHTS RESERVED - 2024.
//
//////////////////////////////////////////////////////////////////////////////////////

const fs = require('fs');
const cheerio = require('cheerio');

// Read the HTML file
const index = fs.readFileSync('./docs/index.html', 'utf-8');
const ahu3d = fs.readFileSync('./docs/Ahu3D.html', 'utf-8');

// Load the HTML into cheerio
const $index = cheerio.load(index);
const $ahu3d = cheerio.load(ahu3d);

// Remove the <footer> tag and its contents
$index('footer').remove();
$ahu3d('footer').remove();

// Write the modified HTML back to the file
fs.writeFileSync('./docs/index.html', $index.html());
fs.writeFileSync('./docs/Ahu3D.html', $ahu3d.html());

console.log('Footer removed from index.html');
console.log('Footer removed from Ahu3D.html');
