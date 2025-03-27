**This is a first draft not written by the original software developer!!!**
It contains information that I (the contributor) wish I knew before trying to contribute.

# Adding new tools and transforms
Drawing Tools sit on the left of the GUI and Transformation tools sit on the right. There are X things you need to update when adding a tool or transformation: (I used this commit as a template: a9e22535d65e34f4e9279f1f2748c8cbbc56cbdb )

## For Transforms

1. Create a javascript file for your transform `src/js/tools/transform/<TOOLNAME>.js`
  - (optional) if needed, you can add utility functions for you new transform into `src/js/tools/transform/TransformUtils.js`
2.  Add icon images to src/img/icons/transform . You will need to add two images:
  - A small icon, 46x46, called tool-<TOOLNAME>.png
  - A large icon, 92x92, called tool-<TOOLNAME>@2x.png
2. Edit src/js/controller/TransformationsController.js . Add `new pskl.tools.transform.<TOOLNAME>(),` to   ns.TransformationsController  .
3. Add your transform file to the script list: `src/piskel-script-list.js`
    

## For Tools
Look at transforms, but use "tools" for file paths instead of "transform"