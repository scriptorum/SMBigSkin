#!/usr/bin/env node
//
// Enlarges a SynthMaster skin by the supplied magnification.
// 
// CAVEATS:
//   - Images may be a little blurry, that's normal. Don't panic.
//	 - Text labels may become too large to fit, causing maythem, particular in the matrix; 
//	   you can try supplying a negative value to fontAdjust to reduce this issue.
//	 - Fractional magnifications may cause alignment issues; in the case of Tranquil Blue you can see little red lines.
//   - Your SynthMaster skins folder must be have read/write access.
//   - You may need to reboot your DAW to see skin changes.
//   - Hasn't been tested on PC. Or really, you know, much at all. Caveat Emptor, No Guarantees, Use At Your Own Risk, Etc.
//   - There are some skins this might not work on; if your DAW crashes, you win! 
// 
// USAGE:
//   - Configure your settings below.
//   - Install NodeJS. This should also install NPM.
//   - Install the dependencies.
//   - Run the script! The new folder should magically appear in your SynthMaster skins skinsFolder.
//
// DEPENDENCIES:
//   port install GraphicsMagick 		# or brew, or install manually; also add executable to path
//   npm install						# loads node dependies into a node_modules subfolder
//

////// CONFIGURATION //////
const magnification = 1.5; // 1 = 100%, 1.5 = 150%, 2.0 = 200%
const sourceName = "sT-Tranquil Blue"; // Name of folder containing skin you want to enlarge, new folder will be created with the magnification in the name
const skinsFolder = "/Library/Application Support/KV331 Audio/SynthMaster/Resources/Skins"; // Location of SM skins folder
const fontAdjust = -1; // Text is magnified too; this adjusts all font label pitches up (+1 e.g.) or down (-1 e.g.) after magnification
const debug = false;
////// CONFIGURATION //////

const fs = require("fs-extra");
const run = require("child_process").execSync;
const gm = require("gm");
const uuid = require("uuid");

const targetName = sourceName + " " + magnification * 100 + "%"; 
const sourceFolder = skinsFolder + "/" + sourceName;
const targetFolder = skinsFolder + "/" + targetName;
const interfaceName = "interface.xml";
const sourceXml = sourceFolder + "/" + interfaceName;
const targetXml = targetFolder + "/" + interfaceName;

console.log("Ensuring source xml exists");
if(!fs.existsSync(sourceXml))
	throw Error("Cannot locate " + sourceFolder);

console.log("Ensuring target folder exists");
fs.ensureDirSync(targetFolder);

// I'm not using an XML parser because some of the skins have malformed XML which croaks major froggage
console.log("Processing XML");
var xml = fs.readFileSync(sourceXml, "UTF8");

var topRegEx = new RegExp(/(top\s*=\s*")([^"]+)(?=")/gmi);
var bottomRegEx = new RegExp(/(bottom\s*=\s*")([^"]+)(?=")/gmi);
var leftRegEx = new RegExp(/(left\s*=\s*")([^"]+)(?=")/gmi);
var rightRegEx = new RegExp(/(right\s*=\s*")([^"]+)(?=")/gmi);
var sizeRegEx = new RegExp(/(size\s*=\s*")([^"]+)(?=")/gmi);
var miscRegEx = new RegExp(/((?:radius|rowHeight)\s*=\s*")([^"]+)(?=")/gmi);

// Process each XML statement from < to >
// This is not fast code. It doesn't have to be. So chill.
xml = xml.replace(/<(\S+)\s+([^>]+)\s*>/gm, function(all, tag, attributes)
{
	// If InterfaceDefinition, set targetName and uuid and stop
	if(tag.toLowerCase() == "interfacedefinition")
	{
		attributes = attributes.replace(/name\s*=\s*"[^"]+"/mi, 'name="' + targetName + '"');
		attributes = attributes.replace(/id\s*=\s*"[^"]+"/mi, 'id="' + uuid.v4() + '"');
	}

	else
	{
		if(debug)
			console.log("FOUND tag:" + tag + " attr:" + attributes);

		// Magnify radius and matrix row height
		attributes = attributes.replace(miscRegEx, function(all, left, value)
		{
			return left + Math.round(value * magnification);
		});

		// Magnify font size
		attributes = attributes.replace(sizeRegEx, function(all, left, value)
		{
			var newSize = Math.floor(value * magnification + fontAdjust);
			return left + newSize;
		});

		// Magnify top and bottom
		attributes = replacePairedAttr(attributes, topRegEx, bottomRegEx);

		// Magnify left and right
		attributes = replacePairedAttr(attributes, leftRegEx, rightRegEx);
	}

	if(debug)
		console.log("NEW ATTR:" + attributes);

	return "<" + tag + " " + attributes + ">";
});

// Save XML
fs.writeFileSync(targetXml, xml, {encoding:"UTF8"});

// Enlarge IMAGES
// Find all image tags in XML
// Use them to identify all images and determine if they are a spritesheet
console.log("Resizing images");
var waitingFor = 0;
xml = xml.replace(/<Image\s+[^>]+>/gmi, function (tag)
{
	var imageName = tag.match(/name\s*=\s*"([^"]+)"/)[1];
	var count = tag.match(/numberOfImages\s*=\s*"([^"]+)"/i)[1];

	if(imageName == null)
		return;

	// Load image
	var imagePath = (sourceFolder + "/" + imageName);//.replace(/ /g, "\\ ");
	var image = gm(imagePath);

	waitingFor++;
	image.size({bufferStream: true}, function(err, value)
	{
		if(err)
		{
			logError(err);
			complete();
			return;
		}

		// Normal file: enlarge image by flat percent increase
		if(count == null || count == 1)
		{
			var width =  Math.ceil(value.width * magnification);
			var height = Math.ceil(value.height * magnification);
			if(debug)
				console.log(" - Enlarging image " + imageName + " to " + width + "x" + height);
			image.resize(width, height, "!");
		}

		// Multi-image file: enlarge image by determining new integer height per cell and multiplying by number of cells
		else
		{
			var oldCellHeight = value.height / count;
			var newCellHeight = Math.ceil( oldCellHeight * magnification);
			var height = Math.ceil(newCellHeight * count);
			var width = Math.ceil(value.width * magnification);

			if(debug)
				console.log(" - Enlarging spritesheet " + imageName + " with " + count + " images to " + width + "x" + height +
					 " (cel height grows from " + oldCellHeight + " to " + newCellHeight + ")");

			image.resize(width, height, "!");
		}

		image.write(targetFolder + "/" + imageName, function(err) { if(err) logError(err); complete(); });
	});	
});

// If hate this, but I hate even more organizing everything into an array and using a third party library to manage callback hell
if(waitingFor > 0)
	console.log("Waiting for processes to finish");

function complete()
{
	if(--waitingFor <= 0)
		console.log("COMPLETE!\nNew skin created:" + targetFolder);
	else if(!debug) 
		process.stdout.write(".");
}

function logError(msg)
{
	console.log("###################### ERROR ######################");
	console.log(msg);
}

// This replaces pairs of top/bottom or left/right attributes in a string.
// The second attribute (bottom/right) is calculated independently, so it's guaranteed to match the image/sprite dimensions.
// Expect regex to have two captures: all (everything to the left of the value) and value (the value between quotes).
// The end quote should be matched but not replaced by using a negative lookahead assertion.
function replacePairedAttr(attributes, firstRegEx, secondRegEx)
{
	// If contains first, magnify and round value, then adjust bottom by the rounded old difference
	if(attributes.match(firstRegEx))
	{
		var oldFirst = 0;
		var newFirst = 0;
		attributes = attributes.replace(firstRegEx, function(all, left, value)
		{
			oldFirst = parseInt(value);
			newFirst = Math.floor(oldFirst * magnification);
			return left + newFirst;
		});
		attributes = attributes.replace(secondRegEx, function(all, left, oldSecond)
		{				
			return left + (Math.ceil((oldSecond - oldFirst) * magnification + newFirst));
		});
	}

	// If contains unpaired second, magnify and round value -- don't expect to see this, but just in case
	else attributes = attributes.replace(secondRegEx, function(all, left, alue)
	{
		return left + Math.floor(value * magnification);
	});

	return attributes;
}