// Centralised .env loader — resolves .env relative to the server directory
// so the server works regardless of the working directory it was started from.
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') })