const xml = require('xml')
const fs = require('fs');
var crypto = require('crypto');

// -- Constants --

//Patterns
const pattern = /createElement\("svg".*?(\}|\};).\.displayName/g //Detects createElement functions
const namePattern = /createElement\("svg".*?(?:\}|\};).\.displayName="([A-z]*)"?/g

//Default Export Color
const color = 'B9BBBE'

//Load JSON storage file into variable
var storage = fs.readFileSync('data.json', 'utf-8')
var jsonstorage = JSON.parse(storage)

// --           --

//some default values so that we dont get errors
function f(yea) {
  return 0;
}
const n = 0
const a = 0
const c = 0
const p = 0
const i = 0
const v = 0
const l = {
  default: {
    updateAvailable: 0
  }
}
const m = 0
const y = 0
const o = { default: 0 } //some vectors demand o.default
const z = 0
const g = 0
const h = 0
const e = 0
const E = 0
const _ = 0

//s | Returns JSON for svg parts
function s(type, data) {
  let parsedGroupData = false;
  if (type == "g") { //special case for groups, those act differently
    outType = "g"
    const groupedElements = Object.values(arguments).splice(3, arguments.length)
    returning = []
    returning["_attr"] = data
    groupedElements.forEach(function (group) {
      if (group.data) {
        pusher = {}
        pusher[group.type] = group.data
        parsedGroupData = true
        returning.push(pusher)
      }
    })
  } else { //the data should match, just put it in
    outType = type
    returning = {
      _attr: data
    }
  }
  if (data.transform) {
    returning._attr.transform = data.transform
  }
  fillColor = color
  if (data.style) {
    returning._attr.style = `${data.style};fill:#${color}`
  } else {
    returning._attr.style = `fill:#${color}`
  }
  returning._attr.fill = `${color}`
  if(returning._attr.color){
    returning._attr.color = `${color}`
  }
  if (returning._attr.className) {
    delete returning._attr.className
  }
  return {
    type: outType,
    data: returning
  }
}

//u | Used for ViewBox
function u(one, two) {
  if (one.viewBox) {
    return {
      viewBox: one.viewBox
    }
  } else {
    return {
      viewBox: two.viewBox
    }
  }
}

//d | Same as u, some vectors use this for some reason
function d(one, two) {
  if (one.viewBox) {
    return {
      viewBox: one.viewBox
    }
  } else {
    return {
      viewBox: two.viewBox
    }
  }
}

//createElement | Core Function used to create elements
function createElement(type, dimensions) {
  if (type == "svg") {
    const args = Object.values(arguments).splice(2, arguments.length)
    data = []
    args.forEach(function (coom) { //loop through the arguments and combine them
      pusher = {}
      pusher[coom.type] = coom.data
      data.push(pusher)
    })
    final = buildSvg({ //build the final json and return the xml/svg string
      viewBox: dimensions.viewBox,
      path: data
    })
    return final;
  }
}

//buildSvg | Creates the JSON object required for xml(), combines path data with viewBox
function buildSvg({path, viewBox}) {
  svg = [
    {
      svg: [
        {
          _attr: { xmlns: "http://www.w3.org/2000/svg", viewBox: viewBox ?? "0 0 24 24" }
        }
      ]
    }
  ]

  if(!path.every(elem => elem.path ?? elem.rect ?? elem.ellipse ?? elem.line ?? elem.polygon ?? elem.circle ?? elem.polyline)) return;

  path.forEach(function (elem) {
    svg[0].svg.push(elem)
  })

  return xml(svg, true)
}

//cleanUpElement | removes some unnecesary stuff from the extracted functions
function cleanUpElement(string) {
  cleaned = string.replace(/(,|)\(.,.\.default\)\(.\)(,|)/g, ',')
  return cleaned;
}

//getVector | init conversion for a converted function
function getVector(str) {
  const evaluate = cleanUpElement(str) //Remove some unnecesary stuff
  const evaluated = eval(evaluate) //Evaluate the function
  return evaluated
}

//extract | main function that starts all the stuff
module.exports = async function () {
  const data = fs.readFileSync('data.js.txt', 'utf-8'); //Load the js data
  const matches = data.match(pattern)   // Match patterns to extract
  const names = data.match(namePattern)//  Functions and names
  counter = 0
  success = 0
  loop = 0
  let newSaves = 0;
  matches.forEach(function (asset) {
    loop++
    try {
      convert = asset.replace(/(\}|\};).\.displayName/, '')
      svgComponent = getVector(convert) //get the evaluated function result
      if(!svgComponent) return;
      hash = crypto.createHash('md5').update(svgComponent).digest('hex'); //Get a hash of the vector
      try {
        fileName = names[loop - 1].replace(namePattern, "$1") //Search for the corresponding extracted function with the name
        if (fileName == names[loop - 1]) {
          fileName = hash
        } else {
          fileName = `${fileName}_(${hash})`
        }
      } catch (e) {
        fileName = hash
      }
      if (!fs.existsSync(`./out.svg/${fileName}.svg`)) {
        fs.writeFileSync(`./out.svg/${fileName}.svg`, svgComponent);
      }
      if (!jsonstorage.assets.svg['1'].includes(hash)) {
        jsonstorage.assets.svg['1'].push(hash)
        newSaves++
      }
      counter++
      success++
    } catch (e) {

    }
  })
  console.log(`Saved ${jsonstorage.assets.svg['1'].length} out of ${matches.length} detected vector graphics.`)
  if (newSaves !== 0) {
    console.log(`Saved \x1b[36m${newSaves}\x1b[0m new assets.`)
    fs.writeFileSync('data.json', JSON.stringify(jsonstorage, null, 2), 'utf8') //Store amount of vectors we were able to extract
  }
}