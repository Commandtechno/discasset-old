const superagent = require("superagent")
const fs = require('fs')

if (!fs.existsSync('out.cdn')) fs.mkdirSync('out.cdn')
if (!fs.existsSync('out.cdn/png')) fs.mkdirSync('out.cdn/png')

if (!fs.existsSync('out.css')) fs.mkdirSync('out.css')
if (!fs.existsSync('out.css/png')) fs.mkdirSync('out.css/png')

if (!fs.existsSync('out.svg')) fs.mkdirSync('out.svg')
if (!fs.existsSync('out.svg/png')) fs.mkdirSync('out.svg/png')

if (!fs.existsSync('out.lottie')) fs.mkdirSync('out.lottie')
if (!fs.existsSync('out.lottie/gif')) fs.mkdirSync('out.lottie/gif')

//CONSTANTS
const stylesheet = /stylesheet" href="(.{30}\.css)/g //Regex to get the stylesheet hash/url
const script = /script src="(\/assets\/.{20}\.js)/g //Regex to get all the scripts on the login page
const loaderRegex = /r\.p\+""\+(\{.*\})\[/g //Regex to extract the app scripts from the chunkloader
const jsonFix = /([0-9]*):/g //Regex to fix json from the chunkloader so we can easily parse it
const buildRegex = /GLOBAL_ENV\.RELEASE_CHANNEL,.=null==="(.{40})/g //Regex to get the build hash
const buildIdRegex = /,"([1234567890]{5})"/g //Regex to get the build id
const canary = 'https://canary.discord.com/login' //Entrypoint to get all the app data from
const assetHost = 'https://canary.discord.com' //Host for assets

async function download() {
  console.log('[Download] Starting...')
  const storage = fs.readFileSync('data.json') // Read and parse jsonstorage
  var jsonstorage = JSON.parse(storage)
  let site;
  try {
    site = await superagent.get(canary) //Fetch login page so we can extract scripts and stylesheet
    console.log('[Download] Client Data Fetched. Searching for main script...')
    const match = site.text.match(script) //Get all scripts from login page
    scriptData = await superagent.get(`${assetHost}${match[0].replace(`script src="`, '')}`) //Load master script data, then extract json
    scripts = loaderRegex.exec(scriptData.body) //Extract the required JSON from the response script
    scriptData = scripts[1].toString().replace(jsonFix, "\"$1\":") //Fix the JSON so we can parse it
    scripts = JSON.parse(scriptData) //Parse the data
    //The client script
    clientScript = await superagent.get(`${assetHost}${match[3].replace(`script src="`, '')}`)
    fs.writeFileSync('data.client.txt', clientScript.body, 'utf8') //Save Client
    let mainScript = ""
    Object.values(scripts).forEach(async function (scr) { //Try to locate the correct script
      if (mainScript !== "") {
        return; //we already have the script and dont need to do any more searching
      }
      data = await superagent.get(`${assetHost}/assets/${scr}.js`)
      const buildData = buildRegex.exec(data.body) //Extract the build hash, if this works we have the main script
      const buildId = buildIdRegex.exec(data.body) //Extract the build ID
      if (buildData) {
        mainScript = data.body //This is the main JS file we want/need
        if (jsonstorage.version.buildHash == buildData[1]) { //Check if we already have the latest version
          //We already have the current version, display a message and prompt an exit
          console.log(`[Download] Version ${jsonstorage.version.buildId} (${jsonstorage.version.buildHash}) is already downloaded.`)
          process.exit()
        } else {
          jsonstorage.version.buildHash = buildData[1]
          jsonstorage.version.buildId = buildId[1]
          fs.writeFileSync('data.json', JSON.stringify(jsonstorage, null, 2), 'utf8') //Store version
          console.log(`[Download] Downloading files for build ${jsonstorage.version.buildId} (${jsonstorage.version.buildHash.substr(0, 7)})...`)
          fs.writeFileSync('data.js.txt', mainScript, 'utf8') //Save main script
          console.log('[Download] JavaScript Downloaded.')
          //Stylesheet Download
          const matches = stylesheet.exec(site.text) //Extract stylesheet location
          style = await superagent.get(`${assetHost}${matches[1]}`) //Download Stylesheet
          fs.writeFileSync('data.css.txt', style.text, 'utf8') //Save Stylesheet
          console.log('[Download] Stylesheet Downloaded.')
          //Download should be finished, print a message
          console.log(`[Download] Successfully downloaded files for build ${jsonstorage.version.buildId} (${jsonstorage.version.buildHash}).`)
          process.exit()
        }
      }
    })
  } catch (e) {
    console.log('[Error] Failed to download discord data:')
    console.log(e)
  }
}

(async () => {
  await download()
})();
