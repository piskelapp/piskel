# Piskel CLI

Wraps the Piskel pixel editing application to enable similar export options via the command line.

## Installation

Option 1: Globally install Piskel
```
npm install -g https://github.com/piskelapp/piskel/tarball/master
```

Option 2: Clone and install Piskel normally and then run npm link inside the installation root

## Usage

**Export provided .piskel file as a png sprite sheet using app defaults**
```
piskel-cli snow-monster.piskel
```

**Export scaled sprite sheet**
```
piskel-cli snow-monster.piskel --scale 5
```

**Export scaled to specific (single frame) width value**
```
piskel-cli snow-monster.piskel --scaledWidth 435
```

**Export scaled to specific (single frame) height value**
```
piskel-cli snow-monster.piskel --scaledHeight 435
```

**Export sprite sheet as a single column**
```
piskel-cli snow-monster.piskel --columns 1
```

**Export sprite sheet as a single row**
```
piskel-cli snow-monster.piskel --rows 1
```

**Export a single frame (0 is first frame)**
```
piskel-cli snow-monster.piskel --frame 3
```

**Export a second file containing the data-uri for the exported png**
```
piskel-cli snow-monster.piskel --dataUri
```

**Export cropped**
```
piskel-cli snow-monster.piskel --crop
```

**Custom output path and/or filename**
```
piskel-cli snow-monster.piskel --dest ./output-folder/snah-monstah.png
```