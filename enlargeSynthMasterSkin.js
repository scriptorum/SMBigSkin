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

console.log("Processing XML");
var xml = fs.readFileSync(sourceXml, "UTF8");

// Replace lead line
xml = xml.replace(/(InterfaceDefinition\s+name\s?=\s?")[^"]+("\s?id\s?=\s?")[^"]+(")/m, function(m, k1, k2, k3)
{
	var str = k1 + targetName + k2 + uuid.v4() + k3;
	return str;
});

// Resize positioning of things
// TODO I might have to actually grab both top and bottom to ensure they are ranged correctly
xml = xml.replace(/((radius|size|left|right|top|bottom)\s?=\s?")(\d+)(")/gmi, function(match, left, attr, value, right)
{
	// switch(k2.toLowerCase()) ... handle font sizes differently?
	// Magnify positioning
	var newVal = value * magnification;

	switch(attr)
	{
		case 'top':
		case 'bottom':
		case 'left':
		case 'right':
		newVal = Math.ceil(newVal);
		break;

		default:
		newVal = Math.floor(newVal);
	}

	var str = left + Math.round(newVal) + right;
	return str;
});

// Save XML
fs.writeFileSync(targetXml, xml, {encoding:"UTF8"});

console.log("Resizing images");

// Find all image tags
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

// TODO
// - NodeJS is overly callbacky. Try promises?