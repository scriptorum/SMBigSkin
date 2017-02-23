# SMBigSkin
[SynthMaster](http://www.synthmaster.com/) is a soft-synth VST instrument. It's a great synth, but the the screen size is a bit small for my liking. Rather than creating a new skin by hand, I wrote a script to resize an existing skin. (Which probably didn't save me any time.) This is a non-destructive resize: a new skin is created at the desired size which you can select from inside the VST.

##INSTALL
Make sure your SynthMaster skins folder is read and writable.  On Windows you might find this folder at`C:\Program Files\KV331 Audio\SynthMaster\Resources\Skins` and on OSX at `/Library/Application Support/KV331 Audio/SynthMaster/Resources/Skins`.

There are some skins in there with unhelpful names (such as *New Skin ###*). You may wish to rename these folder to something more appropriate, such as the name of the skin itself. The skin name is in the first line of *interface.xml* in the folder, e.g.: ```<InterfaceDefinition name="Default Skin-Blue"/>```.

Download the *SMBigSkin.js* and *package.json* files into a folder. If you have git, you can do this with `git clone https://github.com/scriptorum/SMBigSkin.git`.

This script requires [NodeJS](https://nodejs.org/en/), so install it if needed. Also install NPM if NodeJS for some wacky reason didn't include it.

The script also requires [Graphics Magick](http://www.graphicsmagick.org/). You can install it manually, with homebrew (`brew install graphicsmagick`), or MacPorts (`port install GraphicsMagick`). Make sure the application is added to your PATH so you can run it from the command line.

Now you can tell NPM to install the package dependencies. (`npm install`) This will create a *node_modules* subfolder and download some necessary NodeJS packages into it.

##CONFIGURE AND RUN
Configure your settings in the *SMBigSkin.js* script.
  - Set *skinsFolder* to the location of your SynthMaster skins.
  - Set *sourceName* to the name of the folder containing the skin you want to resize. (e.g., `"Default"`).
  - Set *magnification* to your desired scaling amount. (e.g., `1.2` is 120%, or 20% bigger). Less than 1.0 will shrink things, which now that I think of it is completely untested. The enlargement process tends to make images a little blurry, but that's graphics for ya. If you're having a lot of seam issues, a different magnification could help.
  - (Optional) Set *fontAdjust* to `0` if you want text labels to scale evenly with the everything else. Otherwise supply a percentage adjustment. `-0.10`, for instance, will set text labels to 10% less magnification than you specified above.
  - (Optional) It's likely you'll have some alignment issues due to rounding errors. This shows up as visible seams, from the blocking areas bleeding through. There's no great fix for this, but you can to minimize the seams is by recoloring the images. This is simple to do by setting *colorToRemove* to the seam color, and  *replacementColor* to a color that blends better. You can set these to `null` if you don't want this color replacement to occur. Otherwise supply a string with a color name (e.g., `"blue"`) or an HTML color value (e.g., `"#FF8500"`).
  
And now you can run the script (`./SMBigSkin.js` or `npm start`). After it says COMPLETE, the new folder should magically appear in your SynthMaster skins skinsFolder and is ready to test. If you want to enlarge a different skin or create different sizes, just reconfigure and rerun. You can throw any of these generated skin folders into the trash if you don't want them showing up in your SynthMaster Global Skins list any more. Careful not to trash your originals, particularly the Default skin!

You may need to reboot your DAW to see skin changes.

This hasn't been tested on PC. Or really, you know, much at all. Caveat Emptor, No Guarantees, Use At Your Own Risk, Etc.

There are some skins this might not work on; if your DAW crashes, you win! 
