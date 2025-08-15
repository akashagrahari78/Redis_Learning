const axios = require('axios')
require('dotenv').config()
const Redis = require('ioredis')

const redis = new Redis({
    port: 6379,
    host: '127.0.0.1'
})

const cityEndPoint = (city) =>
  `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${process.env.WEATHER_API_KEY}`

const getWeather = async (city) => {
    // checking if we have a cached-entry
    let cacheEntry = await redis.get(`weather:${city}`)  
    if (cacheEntry) {
        const parsedData = JSON.parse(cacheEntry)  
        return { ...parsedData, source: 'cache' }
    }

    // fetch from API
    const response = await axios.get(cityEndPoint(city))
    // store in cache
    await redis.set(`weather:${city}`, JSON.stringify(response.data), 'EX', 3600)
    return { ...response.data, source: 'API' }
}

const main = async () => {
    try {
        const city = 'china'
        const t0 = Date.now()
        const weather = await getWeather(city)
        const t1 = Date.now()
        weather.timeDiff = `${t1 - t0}ms`
        console.log(weather)
    } catch (err) {
        console.error('Error fetching weather:', err.message)
    }
}

main()
// process.exit()
