// config/index.js

import configProd from './prod.js'
import configDev from './dev.js'

const config = process.env.NODE_ENV === 'production' ? configProd : configDev
config.isGuestMode = true

export { config }
