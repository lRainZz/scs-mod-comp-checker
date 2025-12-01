const { PRG_ARGS } = require('./args.js')

const ETS_APP_ID = '227300'
const ATS_APP_ID = '270880'

const { analyseEts } = PRG_ARGS

const GAME_ID     = analyseEts ? ETS_APP_ID : ATS_APP_ID
const GAME_FOLDER = analyseEts ? 'Euro Truck Simulator 2' : 'American Truck Simulator'
const GAME_EXE    = analyseEts ? 'eurotrucks2.exe' : 'amtrucks.exe'

module.exports = {
    GAME_ID,
    GAME_FOLDER,
    GAME_EXE
}