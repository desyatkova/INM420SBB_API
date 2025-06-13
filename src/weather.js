import {WeatherAPIClient} from './weatherApiClient.js';

export class WeatherApp {
    constructor() {
        this.searchTimeout = null;
        this.apiClient = new WeatherAPIClient('b50b7dd62c45433c91601915250706');
        this.init();
    }

    async init() {
        try {
            this.initializeElements();
            this.attachEventListeners();
        } catch (error) {
            console.error('Failed to initialize WeatherApp:', error);
            setTimeout(() => this.init(), 100);
        }
    }

    initializeElements() {
        this.citySearch = document.getElementById('citySearch');
        this.cityDropdown = document.getElementById('cityDropdown');
        this.weatherDate = document.getElementById('weatherDate');
        this.clearBtn = document.getElementById('clearBtn');
        this.searchBtn = document.getElementById('searchWeatherBtn');
        this.weatherResults = document.getElementById('weatherResults');
        this.weatherTemplate = document.getElementById('weatherResultTemplate');

        if (!this.citySearch || !this.cityDropdown || !this.weatherDate || !this.clearBtn || !this.searchBtn || !this.weatherResults || !this.weatherTemplate) {
            throw new Error('One or more required elements not found');
        }

        if (!this.weatherDate.value) {
            this.clearBtn.classList.add('invisible');
        }
    }

    attachEventListeners() {
        this.citySearch.addEventListener('input', (e) => this.handleCitySearch(e.target.value));
        this.citySearch.addEventListener('keypress', (e) => this.handleEnterKey(e));

        this.cityDropdown.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && e.target.hasAttribute('data-city')) {
                e.preventDefault();
                e.stopPropagation();
                this.selectCity(e.target.getAttribute('data-city'));
            }
        });

        this.weatherDate.addEventListener('change', (e) => this.handleDateChange(e));
        this.clearBtn.addEventListener('click', () => this.clearDate());
        this.searchBtn.addEventListener('click', () => this.searchWeather());
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
    }

    async handleCitySearch(searchTerm) {
        clearTimeout(this.searchTimeout);

        if (searchTerm.length < 4) {
            this.cityDropdown.classList.add('hidden');
            return;
        }

        this.cityDropdown.innerHTML = '<li><a class="loading loading-spinner loading-sm">Searching...</a></li>';
        this.cityDropdown.classList.remove('hidden');

        this.searchTimeout = setTimeout(async () => {
            try {
                const cities = await this.fetchCities(searchTerm);
                this.displayCitySuggestions(cities);
            } catch (error) {
                console.error('Error fetching cities:', error);
                this.cityDropdown.innerHTML = '<li><a class="text-error">Error loading cities</a></li>';
            }
        }, 300);
    }

    async fetchCities(searchTerm) {
        try {
            const cities = await this.apiClient.searchCities(searchTerm);
            return cities.map(city => city.fullName);
        } catch (error) {
            console.error('Error fetching cities:', error);
            return [];
        }
    }

    displayCitySuggestions(cities) {
        if (cities.length === 0) {
            this.cityDropdown.innerHTML = '<li><a class="text-base-content/60">No cities found</a></li>';
            return;
        }

        this.cityDropdown.innerHTML = cities.map(city =>
            `<li><a href="#" data-city="${city}">${city}</a></li>`
        ).join('');
    }

    selectCity(cityName) {
        this.citySearch.value = cityName;
        this.cityDropdown.classList.add('hidden');
        this.citySearch.focus();
    }

    handleDateChange(e) {
        const selectedDate = e.target.value;
        console.log('Date changed to:', selectedDate);

        if (selectedDate) {
            this.clearBtn.classList.remove('invisible');
            this.clearBtn.classList.add('visible');
        } else {
            this.clearBtn.classList.remove('visible');
            this.clearBtn.classList.add('invisible');
        }
    }

    clearDate() {
        this.weatherDate.value = '';
        this.clearBtn.classList.remove('visible');
        this.clearBtn.classList.add('invisible');
        this.weatherDate.focus();
    }

    async searchWeather() {
        const city = this.citySearch.value;
        const date = this.weatherDate.value;

        console.log('Searching weather for:', {city, date});

        if (!city) {
            this.showToast('Please enter a city name', 'warning');
            return;
        }

        this.weatherResults.innerHTML = `
      <div class="flex justify-center items-center py-12">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
    `;

        try {
            const weatherData = await this.fetchWeather(city, date);
            console.log('Weather data received:', weatherData);
            this.displayWeatherResults(weatherData);
        } catch (error) {
            console.error('Error fetching weather:', error);
            this.weatherResults.innerHTML = `
        <div class="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Error loading weather data: ${error.message}</span>
        </div>
      `;
        }
    }

    async fetchWeather(city, date) {
        try {
            const currentData = await this.apiClient.getCurrentWeather(city);
            const forecastData = await this.apiClient.getForecast(city, 10);

            if (!date || this.isToday(date)) {
                return this.formatCurrentWeatherResponse(currentData, forecastData);
            } else if (this.isFutureDate(date)) {
                const daysFromToday = this.getDaysFromToday(date);
                console.log('Days from today:', daysFromToday, 'for date:', date);

                if (daysFromToday >= 15 && daysFromToday <= 300) {
                    console.log('Using future API for date:', date);
                    try {
                        const futureData = await this.apiClient.getFutureWeather(city, date);
                        console.log('Future API response:', futureData);
                        const result = this.formatFutureWeatherResponse(futureData, forecastData);
                        console.log('Formatted future weather:', result);
                        return result;
                    } catch (error) {
                        console.error('Future API failed:', error);
                        return {
                            current: {
                                temp: 0,
                                condition: 'Future forecast not available. This feature may require a premium plan.',
                                feelsLike: 0,
                                humidity: 0,
                                windSpeed: 0,
                                uvIndex: 0,
                                high: null,
                                low: null
                            },
                            forecast: this.getSevenDayForecast(forecastData)
                        };
                    }
                } else if (daysFromToday > 300) {
                    return {
                        current: {
                            temp: 0,
                            condition: 'Date is too far in the future (max 300 days)',
                            feelsLike: 0,
                            humidity: 0,
                            windSpeed: 0,
                            uvIndex: 0,
                            high: null,
                            low: null
                        },
                        forecast: this.getSevenDayForecast(forecastData)
                    };
                } else {
                    return this.formatSelectedDateResponse(currentData, forecastData, date);
                }
            } else {
                try {
                    const historicalData = await this.apiClient.getHistoricalWeather(city, date);
                    return this.formatHistoricalResponse(historicalData, forecastData);
                } catch (error) {
                    return this.formatSelectedDateResponse(currentData, forecastData, date);
                }
            }
        } catch (error) {
            console.error('Error fetching weather:', error);
            throw error;
        }
    }

    formatFutureWeatherResponse(futureData, forecastData) {
        console.log('Formatting future weather response:', futureData);

        const weather = futureData.weather;
        const hourlyData = weather.hourly || [];
        const noonHour = hourlyData.length > 12 ? hourlyData[12] : (hourlyData.length > 0 ? hourlyData[Math.floor(hourlyData.length / 2)] : null);

        const result = {
            current: {
                temp: Math.round(weather.avgtemp_f),
                condition: weather.condition,
                feelsLike: Math.round(weather.avgtemp_f),
                humidity: weather.humidity || (noonHour ? noonHour.humidity : 64),
                windSpeed: noonHour ? Math.round(noonHour.wind_mph) : 11,
                uvIndex: weather.uv || 0,
                high: Math.round(weather.maxtemp_f),
                low: Math.round(weather.mintemp_f)
            },
            forecast: this.getSevenDayForecast(forecastData)
        };

        console.log('Formatted result:', result);
        return result;
    }

    formatCurrentWeatherResponse(currentData, forecastData) {
        const todayForecast = forecastData.forecast && forecastData.forecast[0];

        return {
            current: {
                temp: Math.round(currentData.current.temp_f),
                condition: currentData.current.condition,
                feelsLike: Math.round(currentData.current.feelslike_f),
                humidity: currentData.current.humidity,
                windSpeed: Math.round(currentData.current.wind_mph),
                uvIndex: currentData.current.uv,
                high: todayForecast ? Math.round(todayForecast.maxtemp_f) : null,
                low: todayForecast ? Math.round(todayForecast.mintemp_f) : null
            },
            forecast: this.getSevenDayForecast(forecastData)
        };
    }

    formatSelectedDateResponse(currentData, forecastData, targetDate) {
        let weatherData = {
            current: {
                temp: 0,
                condition: 'No data available',
                feelsLike: 0,
                humidity: 0,
                windSpeed: 0,
                uvIndex: 0,
                high: null,
                low: null
            },
            forecast: this.getSevenDayForecast(forecastData)
        };

        if (forecastData.forecast && forecastData.forecast.length > 0) {
            const targetDay = forecastData.forecast.find(day => day.date === targetDate);

            if (targetDay) {
                const noonHour = targetDay.hourly && targetDay.hourly.length > 12 ? targetDay.hourly[12] : (targetDay.hourly && targetDay.hourly[0]);

                weatherData.current = {
                    temp: Math.round(targetDay.avgtemp_f),
                    condition: targetDay.condition,
                    feelsLike: Math.round(targetDay.avgtemp_f),
                    humidity: noonHour ? noonHour.humidity : 65,
                    windSpeed: noonHour ? Math.round(noonHour.wind_mph) : 8,
                    uvIndex: targetDay.uv,
                    high: Math.round(targetDay.maxtemp_f),
                    low: Math.round(targetDay.mintemp_f)
                };
            } else {
                const daysFromToday = this.getDaysFromToday(targetDate);

                console.log('Selected date not in forecast. Days from today:', daysFromToday);

                if (daysFromToday >= 15 && daysFromToday <= 300) {
                    weatherData.current.condition = 'Extended forecast available. Click search to load.';
                } else if (daysFromToday > 300) {
                    weatherData.current.condition = 'Date is too far in the future (max 300 days)';
                } else if (daysFromToday > 3 && daysFromToday < 15) {
                    weatherData.current.condition = `Forecast for day ${daysFromToday} is not available. Your plan includes days 1-3. Extended forecasts (15-300 days) require the future API.`;
                } else {
                    const lastAvailableDate = forecastData.forecast[forecastData.forecast.length - 1].date;
                    const lastAvailableFormatted = this.formatDate(lastAvailableDate);
                    weatherData.current.condition = `Forecast only available up to ${lastAvailableFormatted}`;
                }
            }
        }

        return weatherData;
    }

    formatHistoricalResponse(historicalData, forecastData) {
        return {
            current: {
                temp: Math.round(historicalData.weather.avgtemp_f),
                condition: historicalData.weather.condition,
                feelsLike: Math.round(historicalData.weather.avgtemp_f),
                humidity: historicalData.weather.humidity,
                windSpeed: 0,
                uvIndex: historicalData.weather.uv,
                high: Math.round(historicalData.weather.maxtemp_f),
                low: Math.round(historicalData.weather.mintemp_f)
            },
            forecast: this.getSevenDayForecast(forecastData)
        };
    }

    getSevenDayForecast(forecastData) {
        if (!forecastData.forecast || forecastData.forecast.length === 0) {
            return [];
        }

        const daysToShow = Math.min(forecastData.forecast.length, 7);
        return forecastData.forecast.slice(0, daysToShow).map(day => ({
            day: new Date(day.date).toLocaleDateString('en-US', {weekday: 'short'}),
            date: day.date,
            emoji: this.apiClient.getWeatherEmoji(day.condition),
            high: Math.round(day.maxtemp_f),
            low: Math.round(day.mintemp_f)
        }));
    }

    getWeatherIcon(condition) {
        const conditionLower = condition.toLowerCase();

        if (conditionLower.includes('sun') || conditionLower.includes('clear')) {
            return `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>`;
        } else if (conditionLower.includes('partly cloudy')) {
            return `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16a4 4 0 004 4h5a3 3 0 000-6c0-1.5-.5-3-2-3-1.5 0-2.5 1.5-2.5 3" opacity="0.8" fill="currentColor"/>
      </svg>`;
        } else if (conditionLower.includes('cloudy') || conditionLower.includes('overcast')) {
            return `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>`;
        } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
            return `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 19v2m4-2v2m4-2v2" />
      </svg>`;
        } else if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
            return `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16l-3 5 3-5zm0 0l3-5-3 5z" />
      </svg>`;
        } else if (conditionLower.includes('snow')) {
            return `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 18v1m0-4v1m4 2v1m0-4v1m4 2v1m0-4v1" />
      </svg>`;
        } else if (conditionLower.includes('fog') || conditionLower.includes('mist')) {
            return `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12h16M4 16h16M7 8h10" opacity="0.6"/>
      </svg>`;
        } else {
            return `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>`;
        }
    }

    displayWeatherResults(data) {
        const template = this.weatherTemplate.content.cloneNode(true);
        const selectedDate = this.weatherDate.value;
        const isToday = this.isToday(selectedDate);
        const isFuture = this.isFutureDate(selectedDate);

        if (selectedDate) {
            const formattedDate = this.formatDate(selectedDate);
            template.getElementById('weatherDate').textContent = formattedDate;

            if (isToday) {
                template.getElementById('weatherTitle').textContent = 'Current Weather';
                template.getElementById('detailsTitle').textContent = "Today's Details";
            } else if (isFuture) {
                template.getElementById('weatherTitle').textContent = 'Weather Forecast';
                template.getElementById('detailsTitle').textContent = `${formattedDate} Details`;
            } else {
                template.getElementById('weatherTitle').textContent = 'Historical Weather';
                template.getElementById('detailsTitle').textContent = `${formattedDate} Details`;
            }
        } else {
            template.getElementById('weatherTitle').textContent = 'Current Weather';
            template.getElementById('detailsTitle').textContent = "Today's Details";
        }

        // Update forecast title based on available days
        const forecastDays = data.forecast ? data.forecast.length : 0;
        template.getElementById('forecastTitle').textContent = forecastDays > 0 ? `${forecastDays}-Day Forecast` : 'Forecast';

        const isNoDataAvailable = data.current.temp === 0 && (
            data.current.condition.includes('available') ||
            data.current.condition === 'No data available' ||
            data.current.condition.includes('not available')
        );

        if (isNoDataAvailable) {
            // Show message for dates beyond forecast range or no data
            template.getElementById('temperature').textContent = '--°F';
            template.getElementById('condition').textContent = data.current.condition;
            template.getElementById('feelsLike').textContent = '--°F';
            template.getElementById('humidity').textContent = '--%';
            template.getElementById('windSpeed').textContent = '-- mph';
            template.getElementById('uvIndex').textContent = '--';
            template.getElementById('highLow').textContent = '--°/--°';
            template.getElementById('weatherIcon').innerHTML = this.getWeatherIcon('cloudy');
        } else {
            template.getElementById('temperature').textContent = `${data.current.temp}°F`;
            template.getElementById('condition').textContent = data.current.condition || 'Unknown';
            template.getElementById('feelsLike').textContent = `${data.current.feelsLike}°F`;
            template.getElementById('humidity').textContent = `${data.current.humidity}%`;
            template.getElementById('windSpeed').textContent = `${data.current.windSpeed} mph`;
            template.getElementById('uvIndex').textContent = data.current.uvIndex !== null && data.current.uvIndex !== undefined
                ? `${data.current.uvIndex} (${this.getUVLevel(data.current.uvIndex)})`
                : 'N/A';
            template.getElementById('highLow').textContent = data.current.high !== null && data.current.low !== null
                ? `${data.current.high}°/${data.current.low}°`
                : 'N/A';
            template.getElementById('weatherIcon').innerHTML = this.getWeatherIcon(data.current.condition);
        }

        const forecastList = template.getElementById('forecastList');
        if (data.forecast && data.forecast.length > 0) {
            forecastList.innerHTML = data.forecast.map(day => {
                const isSelected = selectedDate && day.date === selectedDate;
                return `
          <div class="flex items-center text-sm ${isSelected ? 'bg-base-300 rounded-lg px-2 -mx-2' : ''}">
            <span class="w-12">${day.day}</span>
            <span class="w-8 text-center text-lg">${day.emoji}</span>
            <span class="font-medium ml-auto">${day.high}°/${day.low}°</span>
          </div>
        `;
            }).join('');
        } else {
            forecastList.innerHTML = '<div class="text-sm text-base-content/60">No forecast data available</div>';
        }

        this.weatherResults.innerHTML = '';
        this.weatherResults.appendChild(template);
    }

    getUVLevel(uv) {
        if (uv <= 2) return 'Low';
        if (uv <= 5) return 'Moderate';
        if (uv <= 7) return 'High';
        if (uv <= 10) return 'Very High';
        return 'Extreme';
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'toast toast-top toast-center';
        toast.innerHTML = `<div class="alert alert-${type}"><span>${message}</span></div>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    handleEnterKey(e) {
        if (e.key === 'Enter') {
            const firstSuggestion = this.cityDropdown.querySelector('li a[data-city]');

            if (firstSuggestion && !this.cityDropdown.classList.contains('hidden')) {
                firstSuggestion.click();
            } else {
                this.searchWeather();
            }
        }
    }

    handleOutsideClick(e) {
        const label = this.citySearch.closest('label');

        if (!label.contains(e.target) && !this.cityDropdown.contains(e.target)) {
            this.cityDropdown.classList.add('hidden');
        }
    }

    isToday(dateString) {
        if (!dateString) return true;
        const today = new Date();
        const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        const selected = new Date(year, month - 1, day);

        return today.getFullYear() === selected.getFullYear() &&
            today.getMonth() === selected.getMonth() &&
            today.getDate() === selected.getDate();
    }

    isFutureDate(dateString) {
        if (!dateString) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        const selected = new Date(year, month - 1, day);
        selected.setHours(0, 0, 0, 0);

        return selected > today;
    }

    getDaysFromToday(dateString) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        const selected = new Date(year, month - 1, day);
        selected.setHours(0, 0, 0, 0);

        const diffTime = selected - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        console.log('Date calculation:', {
            dateString,
            today: today.toDateString(),
            selected: selected.toDateString(),
            diffDays
        });

        return diffDays;
    }

    formatDate(dateString) {
        const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        const date = new Date(year, month - 1, day); // month is 0-indexed in JavaScript
        const options = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
        return date.toLocaleDateString('en-US', options);
    }
}

let weatherAppInstance = new WeatherApp();

export { weatherAppInstance };