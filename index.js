const fs = require('fs')
const path = require('path')

//  Now we need to read in the file with been fed via the command line
//  We will use the readFileSync method to read in the file.
//  Check to see if the file exists and if it does, read it in.
//  If it does not exist, print an error message.
let file = null
//  If there's no file then we will print an error message and stop
try {
  file = process.argv[2]
} catch (er) {
  console.log('Error: No file specified')
  process.exit(1)
}
//  Get the absolute path to the file, and the name stipping off the extension
const fullPath = path.join(process.cwd(), file)
const pathSplit = fullPath.split('/')
const fileName = pathSplit.pop().split('.')[0]
const dirPath = pathSplit.join('/')

//  Read in the file as the whole SVG
let allSVG = null
if (fs.existsSync(fullPath)) {
  allSVG = fs.readFileSync(fullPath, 'utf-8')
} else {
  console.log(`${file} does not exist`)
  process.exit()
}

// Now we have the svg we need to get to just the lines. Because I created the SVG I know the
// exact format of the output, if I split on double-quote I can pull out all the positions
const allSVGSplit = allSVG.split('"')
let allPointsTXT = null
//  Loop through the array until we get to the 'd=' entry, then we know the points is the next one
for (let i = 0; i < allSVGSplit.length; i++) {
  if (allSVGSplit[i].includes('<path d=')) {
    allPointsTXT = allSVGSplit[i + 1]
    break
  }
}
//  Now split the points on the space character
const allPointsSplit = allPointsTXT.split(' ')
const allPoint = []
//  Loop throught all points in threes and add them to the array
//  also converting things from cm to mm
for (let i = 0; i < allPointsSplit.length; i += 3) {
  console.log(allPointsSplit[i + 2])
  if (allPointsSplit[i + 2]) {
    allPoint.push({
      action: allPointsSplit[i],
      x: parseFloat(allPointsSplit[i + 1]) * 10,
      y: parseFloat(allPointsSplit[i + 2]) * 10
    })
  }
}

//  Now we are going to build up the GCODE
let gcode = 'M3S0\n'
let lastAction = 'M'
//  Loop through all the points and add them to the gcode
for (let i = 0; i < allPoint.length; i++) {
  const thisPoint = allPoint[i]
  if (thisPoint.action !== lastAction) {
    if (thisPoint.action === 'M') {
      gcode += 'M3S0\n'
    } else {
      gcode += 'M3S1000\n'
    }
  }
  lastAction = thisPoint.action
  gcode += `G0X${thisPoint.y}Y${thisPoint.x}\n`
}
//  Now move back to the origin
gcode += 'M3S0\n'
gcode += 'G0X0Y0\n'
//  Now write the file out to the same directory as the original file
//  with a new extension
fs.writeFileSync(`${dirPath}/${fileName}.g`, gcode, 'utf-8')