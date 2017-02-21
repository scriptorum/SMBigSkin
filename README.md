# enlargeSynthMasterSkin
Enlarges a SynthMaster skin by the supplied magnification.

##CAVEATS
  - Images may be a little blurry, that's normal. Don't panic.
  - Text labels may become too large to fit, causing maythem, particular in the matrix; you can try supplying a negative value to fontAdjust to reduce this issue.
  - Fractional magnifications may cause alignment issues; in the case of Tranquil Blue you can see little red lines.
  - Your SynthMaster skins folder must be have read/write access.
  - You may need to reboot your DAW to see skin changes.
  - Hasn't been tested on PC. Or really, you know, much at all. Caveat Emptor, No Guarantees, Use At Your Own Risk, Etc.
  - There are some skins this might not work on; if your DAW crashes, you win! 

##USAGE
  - Download the two js and json files into a folder.
  - Configure your settings in the enlargeSynthMasterSkin.js script.
  - This script requires NodeJS, so install it if needed. Also install NPM if NodeJS for some wacky reason didn't include it.
  - Install the dependencies shown below.
  - Run the script! The new folder should magically appear in your SynthMaster skins skinsFolder.

##DEPENDENCIES
```code  
  port install GraphicsMagick 		# or brew, or install manually; also add executable to path
  npm install						# loads node dependies into a node_modules subfolder
```
