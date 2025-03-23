import axios from 'axios';

export class GooglePlacesService {
  private apiKey: string;

  constructor(options: { apiKey: string }) {
    this.apiKey = options.apiKey;
  }

  async fetchPlaces(params: { latitude: number; longitude: number; query: string; radius?: number; }) {
    const { latitude, longitude, query, radius = 2000 } = params;
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
        params: {
          query,
          location: `${latitude},${longitude}`,
          radius,
          key: this.apiKey,
        },
      });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching places:', error);
      throw error;
    }
  }
}
