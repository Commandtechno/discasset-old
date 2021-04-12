const superagent = require("superagent")
const fs = require('fs')
const crypto = require('crypto')

//CONSTANTS
const script = /script src="(\/assets\/.{20}\.js)/g //Regex to get all the scripts on the login page
const loaderRegex = /r\.p\+""\+(\{.*\})\[/g //Regex to extract the app scripts from the chunkloader
const jsonFix = /([0-9]*):/g //Regex to fix json from the chunkloader so we can easily parse it
const lottieRegex = /.\.exports=JSON\.parse\('({.*?})'\)/ //extracts lottie data from js file
const canary = 'https://canary.discord.com/login' //Entrypoint to get all the app data from
const assetHost = 'https://canary.discord.com' //Host for assets

let newAssets = [];

function forEachWithCallback(callback) {
  const arrayCopy = this;
  let index = 0;
  const next = () => {
    index++;
    if (arrayCopy.length > 0) {
      callback(arrayCopy.shift(), index, next);
    }
  }
  next();
}

Array.prototype.forEachWithCallback = forEachWithCallback;

module.exports = async function () {
  const storage = fs.readFileSync('data.json') // Read and parse jsonstorage
  var jsonstorage = JSON.parse(storage)
  if (!jsonstorage.assets.lottie) { //Set up the lottie asset array for people that used the previous version
    jsonstorage.assets.lottie = []
  }
  let site;
  try {
    site = await superagent.get(canary) //Fetch login page so we can extract scripts and stylesheet
    const match = script.exec(site.text) //Get all scripts from login page
    scriptData = await superagent.get(`${assetHost}${match[1]}`) //Load master script data, then extract json
    scripts = loaderRegex.exec(scriptData.body) //Extract the required JSON from the response script
    scriptData = scripts[1].toString().replace(jsonFix, "\"$1\":") //Fix the JSON so we can parse it
    scripts = JSON.parse(scriptData) //Parse the data
    let newSaves = 0;
    let scriptssaved = 0
    Object.values(scripts).forEach(async function (scr) { //Try to locate the correct script
      data = await superagent.get(`${assetHost}/assets/${scr}.js`)
      scriptssaved++
      const lottieFile = lottieRegex.exec(data.body)
      if (lottieFile) {
        if (lottieFile[0].includes('markers')) {
          //get the name
          lottiedata = lottieFile[1].replace(/".":"(var .*?);"/g, '"x":""')
          //lottiedata = lottieFile[1]
          const lottieJson = JSON.parse(lottiedata)
          const name = lottieJson.nm
          hash = crypto.createHash('md5').update(JSON.stringify(lottieJson)).digest('hex'); //Get a hash of the file
          fs.writeFileSync(`out.lottie/${name}_(${hash}).json`, JSON.stringify(lottieJson), 'utf8') //Save the lottie file
          if (!jsonstorage.assets.lottie.includes(hash)) {
            jsonstorage.assets.lottie.push(hash)
            newSaves++
            newAssets.push(`${name}_(${hash}).json`)
          }
        }
      }
      if (`${scriptssaved}` == `${Object.values(scripts).length}`) {
        const countData = fs.readFileSync('data.json')
        counting = JSON.parse(countData)
        console.log(`Downloaded ${jsonstorage.assets.lottie.length} lottie assets.`)
        if (newSaves !== 0) {
          console.log(`Saved ${newSaves} new assets.`)
          fs.writeFileSync('data.json', JSON.stringify(jsonstorage, null, 2), 'utf8') //Store version
        }
      }
    })
  } catch (e) {
    console.log('[Error] Failed to download discord data:')
    console.log(e)
  }

}
