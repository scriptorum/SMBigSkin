# SMBigSkin
SynthMaster is a "soft-synth" VST instrument. This is a versatile synth, but the supplied skins are a bit small, and it's not easy to reskin. This is a script to enlarge an existing skin by any amount.

##CAVEATS
  - Images may be a little blurry, that's normal. Don't panic.
  - If text labels (that is, not images with text) become too large, you can try supplying a negative value to fontAdjust.
  - There are still some alignment issues due to rounding. This may make some of the seams between layout elements visible.
  - Your SynthMaster skins folder must be have read/write access.
  - You may need to reboot your DAW to see skin changes.
  - Hasn't been tested on PC. Or really, you know, much at all. Caveat Emptor, No Guarantees, Use At Your Own Risk, Etc.
  - There are some skins this might not work on; if your DAW crashes, you win! 

##USAGE
  - Download the two js and json files into a folder. If you have git, you can do this with ```git clone https://github.com/scriptorum/SMBigSkin.git```.
  - Configure your settings in the enlargeSynthMasterSkin.js script.
  - This script requires [NodeJS](https://nodejs.org/en/), so install it if needed. Also install NPM if NodeJS for some wacky reason didn't include it.
  - Install dependency [Graphics Magick](http://www.graphicsmagick.org/). You can install it manually, use homebrew ```brew install graphicsmagick```, or MacPorts ``` port install GraphicsMagick```. Make sure the application is added to your PATH so you can run it from the command line.
  - Install NPM dependencies ```npm install``` This creates a node_modules subfolder
  - Run the script! ```./enlargeSynthMasterSkin.js```. The new folder should magically appear in your SynthMaster skins skinsFolder.

##TIPS
 - There are some skins in there in folders with unhelpful names (New Skin ###). Rename them to match the skin name. The skin name is in the first line of interface.xml in the folder. ```<InterfaceDefinition name="Default Skin-Blue"/>```
