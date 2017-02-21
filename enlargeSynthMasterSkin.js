#!/usr/bin/env node
//
// Enlarges a SynthMaster skin by the supplied magnification.
// 
// DEPENDENCIES:
// port install GraphicsMagick 		# or brew, or install manually; also add executable to path
// npm install						# loads node dependies into a node_modules subfolder
//
// Configure your options below:

const magnification = 1.5; // 1 = 100%, 1.5 = 150%, 2.0 = 200%
const sourceName = "sT-Tranquil Blue"; // Name of folder containing skin you want to enlarge
const skinsFolder = "/Library/Application Support/KV331 Audio/SynthMaster/Resources/Skins"; // Location of SM skins folder; must have write access!

/////////

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

// I'm not using an XML parser because some of the skins have malformed XML
console.log("Processing XML");
var xml = fs.readFileSync(sourceXml, "UTF8");

var topRegEx = new RegExp(/(top\s*=\s*")([^"]+)(?=")/gmi);
var bottomRegEx = new RegExp(/(bottom\s*=\s*")([^"]+)(?=")/gmi);
var leftRegEx = new RegExp(/(left\s*=\s*")([^"]+)(?=")/gmi);
var rightRegEx = new RegExp(/(right\s*=\s*")([^"]+)(?=")/gmi);
var sizeRegEx = new RegExp(/(size\s*=\s*")([^"]+)(?=")/gmi);
var radiusRegEx = new RegExp(/(right\s*=\s*")([^"]+)(?=")/gmi);

// Process each XML statement from < to >
// This doesn't have to be fast. Chill.
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
	console.log("FOUND tag:" + tag + " attr:" + attributes);

		// If contains radius, magnify and round value
		attributes = attributes.replace(radiusRegEx, function(all, left, value)
		{
			return left + Math.round(value * magnification);
		});

		// If contains size, magnify and floor value
		attributes = attributes.replace(sizeRegEx, function(all, left, value)
		{
			return left + Math.floor(value * magnification);
		});

		// attributes = replacePairedAttr(attributes, topRegEx, bottomRegEx);
		// attributes = replacePairedAttr(attributes, leftRegEx, rightRegEx);

		// function replacePairedAttr(attributes, re1, re2)
		// {
			
		// }

		// If contains top, magnify and round value, then adjust bottom by the rounded old difference
		if(attributes.match(topRegEx))
		{
			var oldTop = 0;
			var newTop = 0;
			attributes = attributes.replace(topRegEx, function(all, left, value)
			{
				console.log("!!! top value:" + value);
				oldTop = parseInt(value);
				newTop = Math.round(value * magnification);
				return left + newTop;
			});
			attributes = attributes.replace(bottomRegEx, function(all, left, value)
			{				
				console.log("*** bottom value:" + value + " oldTop:" + oldTop + " newTop:" + newTop);
				return left + (Math.ceil((value - oldTop) * magnification) + newTop);
			});
		}

		// If contains unpaired bottom, magnify and round value -- don't expect to see this, but just in case
		else attributes = attributes.replace(bottomRegEx, function(all, left, alue)
		{
			return left + Math.round(value * magnification);
		});

		// If contains left, magnify and round value, then adjust right by the rounded old difference
		if(attributes.match(leftRegEx))
		{
			var oldLeft = 0;
			var newLeft = 0;
			attributes = attributes.replace(leftRegEx, function(all, left, value)
			{
				console.log("!!! left value:" + value);
				oldLeft = parseInt(value);
				newLeft = Math.round(value * magnification);
				return left + newLeft;
			});
			attributes = attributes.replace(rightRegEx, function(all, left, value)
			{				
				return left + (Math.ceil((value - oldLeft) * magnification) + newLeft);
			});
		}

		// If contains unpaired right, magnify and round value -- don't expect to see this, but just in case
		else attributes = attributes.replace(rightRegEx, function(all, left, value)
		{
			return left + Math.round(value * magnification);
		});				
	}

	console.log("NEW ATTR:" + attributes);
	return "<" + tag + " " + attributes + ">";
});

// Save XML
fs.writeFileSync(targetXml, xml, {encoding:"UTF8"});

console.log("Resizing images");

// Find all image tags and use them to find all images and govern their magnification method
var waitingFor = 0;
xml = xml.replace(/<Image\s+[^>]+>/gmi, function (tag)
{
	var imageName = tag.match(/name\s*=\s*"([^"]+)"/)[1];
	var count = tag.match(/numberOfImages\s*=\s*"([^"]+)"/i)[1];

	if(imageName == null)
		return;

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
		console.log("New skin complete. No guarantee it works!");
}

function logError(msg)
{
	console.log("###################### ERROR ######################");
	console.log(msg);
}
