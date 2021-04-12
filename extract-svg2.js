//basically the exact same thing as the other extractor except for the other type of svg icons in their code

const xml = require('xml')
const fs = require('fs');
const { count } = require('console');
var crypto = require('crypto');

// -- Constants --

//Patterns
const pattern = /o\("svg",.*?\)\)\)*/g //Detects the svg functions
const replacer = /void .,/g //Removes unnecesary stuff
const jsonPattern = /\{(?:[^{}]|())*\}/g
const nameData = /o\("svg",.*?\)\)\)*}.\.displayName="([A-z]*)"/g

//Default Export Color
const color = 'B9BBBE'

//Load JSON storage file into variable
var storage = fs.readFileSync('data.json', 'utf-8')
var jsonstorage = JSON.parse(storage)

// --           --

//some default values so that we dont get errors
const f = 0
const n = 0
const a = 0
//const d = 0
const c = 0
const p = 0
const i = 0
const v = 0
const l = 0
const m = 0
const y = 0
const z = 0
const g = 0
const h = 0
const e = 0
const E = 0
const _ = 0
const u = 0
const s = 0
const d = 0

//like createElement on extract-svg, except it combines both into one
function o(type, contents) {
  const args = Object.values(arguments).splice(1, arguments.length)
  if (type == "svg") {
    svg = [
      {
        svg: [
          {
            _attr: { xmlns: "http://www.w3.org/2000/svg", viewBox: args[0].viewBox ?? "0 0 24 24" }
          },
        ]
      }
    ]
    const loop = Object.values(arguments).splice(2, arguments.length)
    if (!loop.every(({data}) => data.length ?? data.d)) return;

    loop.forEach(function (elem) {
      //special case for groups
      if (elem.type == "g") {
        pusher = {}
        pusher.g = []
        elem.data.forEach(function (grouped) {
          subPusher = {}
          subPusher[grouped.type] = {}
          subPusher[grouped.type]._attr = grouped.data
          subPusher[grouped.type]._attr.fill = color
          subPusher[grouped.type]._attr.style = "fill:#B9BBBE"
          if (subPusher[grouped.type]._attr.className) {
            delete subPusher[grouped.type]._attr.className
          }
          pusher.g.push(subPusher)
        })
        svg[0].svg.push(pusher)
      } else {
        pusher = {}
        pusher[elem.type] = {}
        pusher[elem.type]._attr = elem.data
        pusher[elem.type]._attr.fill = color
        pusher[elem.type]._attr.style = "fill:#B9BBBE"
        if (pusher[elem.type]._attr.className) {
          delete pusher[elem.type]._attr.className
        }
        svg[0].svg.push(pusher)
      }
    })
    return xml(svg, true)
  } else {
    if (type == "g") {
      return { type, data: Object.values(arguments).splice(3, arguments.length) }
    }
    return { type, data: contents }
  }
}

//cleanUpElement | removes some unnecesary stuff from the extracted functions
function cleanUpElement(string) {
  cleaned = string.replace(/void .,/g, '')
  return cleaned;
}

//getVector | init conversion for a converted function
function getVector(str) {
  const evaluate = cleanUpElement(str)
  const evaluated = eval(evaluate)
  return evaluated
}

//extract | main function that starts all the stuff
module.exports = async function () {
  const data = fs.readFileSync('data.js.txt', 'utf-8');
  const matches = data.match(pattern)
  const names = data.match(nameData)
  counter = 0
  success = 0
  let newSaves = 0;
  matches.forEach(function (asset) {
    try {
      logAsset = asset
      svgComponent = getVector(asset)
      hash = crypto.createHash('md5').update(svgComponent).digest('hex');
      fileName = names[counter].replace(nameData, "$1")
      hash = `${fileName}_(${hash})`
      if (!fs.existsSync(`./out.svg/${hash}.svg`)) {
        fs.writeFileSync(`./out.svg/${hash}.svg`, svgComponent);
      }
      hash = crypto.createHash('md5').update(svgComponent).digest('hex');
      if (!jsonstorage.assets.svg['2'].includes(hash)) {
        jsonstorage.assets.svg['2'].push(hash)
        newSaves++
      }
      counter++
      success++
    } catch (e) {
      if (e.message == 'missing ) after argument list') {
        try { //Retry with extra ) to fix some of them, my regex is shit
          svgComponent = getVector(asset + ')')
          hash = crypto.createHash('md5').update(svgComponent).digest('hex');
          if (!fs.existsSync(`./out.svg/${hash}.svg`)) {
            fs.writeFileSync(`./out.svg/${hash}.svg`, svgComponent);
          }
          if (!jsonstorage.assets.svg['2'].includes(hash)) {
            jsonstorage.assets.svg['2'].push(hash)
            newSaves++
          }
          counter++
          success++
        } catch (e) {

        }
      }
    }
  })
  console.log(`Saved ${jsonstorage.assets.svg['2'].length} out of ${matches.length} detected vector graphics.`)
  if (newSaves !== 0) {
    console.log(`Saved \x1b[36m${newSaves}\x1b[0m new assets.`)
    fs.writeFileSync('data.json', JSON.stringify(jsonstorage, null, 2), 'utf8') //Store version
  }
}