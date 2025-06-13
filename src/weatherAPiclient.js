export class WeatherAPIClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.weatherapi.com/v1';
    }

    async searchCities(query) {
        if (!query || query.length < 4) return [];

        try {
            const response = await fetch(
                `${this.baseUrl}/search.json?key=${this.apiKey}&q=${encodeURIComponent(query)}`
            );

            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            const data = await response.json();
            return data.map(city => ({
                id: city.id,
                name: city.name,
                region: city.region,
                country: city.country,
                fullName: `${city.name}, ${city.region ? city.region + ', ' : ''}${city.country}`,
                lat: city.lat,
                lon: city.lon
            }));
        } catch (error) {
            console.error('Error searching cities:', error);
            throw error;
        }
    }

    async getCurrentWeather(location) {
        try {
            const response = await fetch(
                `${this.baseUrl}/current.json?key=${this.apiKey}&q=${encodeURIComponent(location)}&aqi=no`
            );

            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            const data = await response.json();
            return this.formatCurrentWeather(data);
        } catch (error) {
            console.error('Error fetching current weather:', error);
            throw error;
        }
    }

    async getForecast(location, days = 5, date = null) {
        try {
            let url = `${this.baseUrl}/forecast.json?key=${this.apiKey}&q=${encodeURIComponent(location)}&days=${days}&aqi=no&alerts=no`;

            const response = await fetch(url);

            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            const data = await response.json();
            return this.formatForecastData(data);
        } catch (error) {
            console.error('Error fetching forecast:', error);
            throw error;
        }
    }

    async getHistoricalWeather(location, date) {
        try {
            const response = await fetch(
                `${this.baseUrl}/history.json?key=${this.apiKey}&q=${encodeURIComponent(location)}&dt=${date}`
            );

            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            const data = await response.json();
            return this.formatHistoricalData(data);
        } catch (error) {
            console.error('Error fetching historical weather:', error);
            throw error;
        }
    }

    async getFutureWeather(location, date) {
        try {
            console.log('Calling future.json with:', {location, date});

            const response = await fetch(
                `${this.baseUrl}/future.json?key=${this.apiKey}&q=${encodeURIComponent(location)}&dt=${date}`
            );

            console.log('Future API response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Future API error response:', errorText);
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Future API raw response:', data);

            return this.formatFutureData(data);
        } catch (error) {
            console.error('Error fetching future weather:', error);
            throw error;
        }
    }

    formatCurrentWeather(data) {
        return {
            location: {
                name: data.location.name,
                region: data.location.region,
                country: data.location.country,
                localtime: data.location.localtime
            },
            current: {
                temp_f: data.current.temp_f,
                temp_c: data.current.temp_c,
                condition: data.current.condition.text,
                icon: data.current.condition.icon,
                feelslike_f: data.current.feelslike_f,
                feelslike_c: data.current.feelslike_c,
                humidity: data.current.humidity,
                wind_mph: data.current.wind_mph,
                wind_kph: data.current.wind_kph,
                wind_dir: data.current.wind_dir,
                uv: data.current.uv,
                is_day: data.current.is_day
            }
        };
    }

    formatForecastData(data) {
        return {
            location: {
                name: data.location.name,
                region: data.location.region,
                country: data.location.country,
                localtime: data.location.localtime
            },
            current: data.current ? {
                temp_f: data.current.temp_f,
                temp_c: data.current.temp_c,
                condition: data.current.condition.text,
                icon: data.current.condition.icon,
                feelslike_f: data.current.feelslike_f,
                feelslike_c: data.current.feelslike_c,
                humidity: data.current.humidity,
                wind_mph: data.current.wind_mph,
                wind_kph: data.current.wind_kph,
                wind_dir: data.current.wind_dir,
                uv: data.current.uv,
                is_day: data.current.is_day
            } : null,
            forecast: data.forecast.forecastday.map(day => ({
                date: day.date,
                maxtemp_f: day.day.maxtemp_f,
                maxtemp_c: day.day.maxtemp_c,
                mintemp_f: day.day.mintemp_f,
                mintemp_c: day.day.mintemp_c,
                avgtemp_f: day.day.avgtemp_f,
                avgtemp_c: day.day.avgtemp_c,
                condition: day.day.condition.text,
                icon: day.day.condition.icon,
                daily_chance_of_rain: day.day.daily_chance_of_rain,
                daily_chance_of_snow: day.day.daily_chance_of_snow,
                uv: day.day.uv,
                sunrise: day.astro.sunrise,
                sunset: day.astro.sunset,
                hourly: day.hour ? day.hour.map(hour => ({
                    time: hour.time,
                    temp_f: hour.temp_f,
                    temp_c: hour.temp_c,
                    condition: hour.condition.text,
                    icon: hour.condition.icon,
                    chance_of_rain: hour.chance_of_rain,
                    chance_of_snow: hour.chance_of_snow,
                    humidity: hour.humidity,
                    wind_mph: hour.wind_mph
                })) : []
            }))
        };
    }

    formatFutureData(data) {
        const day = data.forecast.forecastday[0];
        return {
            location: {
                name: data.location.name,
                region: data.location.region,
                country: data.location.country
            },
            date: day.date,
            weather: {
                maxtemp_f: day.day.maxtemp_f,
                maxtemp_c: day.day.maxtemp_c,
                mintemp_f: day.day.mintemp_f,
                mintemp_c: day.day.mintemp_c,
                avgtemp_f: day.day.avgtemp_f,
                avgtemp_c: day.day.avgtemp_c,
                condition: day.day.condition.text,
                icon: day.day.condition.icon,
                daily_chance_of_rain: day.day.daily_chance_of_rain || 0,
                daily_chance_of_snow: day.day.daily_chance_of_snow || 0,
                humidity: day.day.avghumidity,
                uv: day.day.uv,
                hourly: day.hour ? day.hour.map(hour => ({
                    time: hour.time,
                    temp_f: hour.temp_f,
                    temp_c: hour.temp_c,
                    condition: hour.condition.text,
                    icon: hour.condition.icon,
                    humidity: hour.humidity,
                    wind_mph: hour.wind_mph
                })) : []
            }
        };
    }

    formatHistoricalData(data) {
        const day = data.forecast.forecastday[0];
        return {
            location: {
                name: data.location.name,
                region: data.location.region,
                country: data.location.country
            },
            date: day.date,
            weather: {
                maxtemp_f: day.day.maxtemp_f,
                maxtemp_c: day.day.maxtemp_c,
                mintemp_f: day.day.mintemp_f,
                mintemp_c: day.day.mintemp_c,
                avgtemp_f: day.day.avgtemp_f,
                avgtemp_c: day.day.avgtemp_c,
                condition: day.day.condition.text,
                icon: day.day.condition.icon,
                humidity: day.day.avghumidity,
                uv: day.day.uv
            }
        };
    }

    getWeatherEmoji(condition) {
        const conditionLower = condition.toLowerCase();

        if (conditionLower.includes('sun') || conditionLower.includes('clear')) return '☀️';
        if (conditionLower.includes('partly cloudy')) return '⛅';
        if (conditionLower.includes('cloudy') || conditionLower.includes('overcast')) return '☁️';
        if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) return '🌧️';
        if (conditionLower.includes('thunder') || conditionLower.includes('storm')) return '⛈️';
        if (conditionLower.includes('snow')) return '❄️';
        if (conditionLower.includes('fog') || conditionLower.includes('mist')) return '🌫️';
        if (conditionLower.includes('wind')) return '💨';

        return '🌤️';
    }
}