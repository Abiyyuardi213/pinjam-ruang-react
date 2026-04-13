const BASE_URL = 'https://admin-classroom.itats.ac.id/api/v1';
const API_KEY = '2PiwDTM6EIBkei4YH2LxAx0Hk6PzFCb8yefp2iys4GDJCgqOQ1uOwl4q86dy2eXw';

const headers = {
  'X-API-Key': API_KEY,
  'Content-Type': 'application/json',
};

export const apiService = {
  getDosen: async () => {
    try {
      const response = await fetch(`${BASE_URL}/dosen`, { headers });
      return await response.json();
    } catch (error) {
      console.error('Fetch Dosen Error:', error);
      throw error;
    }
  },

  getJadwal: async () => {
    try {
      const response = await fetch(`${BASE_URL}/jadwal`, { headers });
      return await response.json();
    } catch (error) {
      console.error('Fetch Jadwal Error:', error);
      throw error;
    }
  },

  getRuang: async () => {
    try {
      const response = await fetch(`${BASE_URL}/ruang`, { headers });
      return await response.json();
    } catch (error) {
      console.error('Fetch Ruang Error:', error);
      throw error;
    }
  },
};
