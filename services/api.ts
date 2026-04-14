const BASE_URL = 'https://admin-classroom.itats.ac.id/api/v1';
const API_KEY = '2PiwDTM6EIBkei4YH2LxAx0Hk6PzFCb8yefp2iys4GDJCgqOQ1uOwl4q86dy2eXw';

const headers = {
  'X-API-Key': API_KEY,
  'Content-Type': 'application/json',
};

export const apiService = {
  getDosen: async (perPage = 50) => {
    try {
      const response = await fetch(`${BASE_URL}/dosen?per_page=${perPage}`, { headers });
      return await response.json();
    } catch (error) {
      console.error('Fetch Dosen Error:', error);
      throw error;
    }
  },

  getJadwal: async (perPage = 500) => {
    try {
      // Kita tambahkan parameter pakid=20252 (jika API backend mendukung)
      // untuk pengamanan ganda, kita filter juga secara lokal
      const response = await fetch(`${BASE_URL}/jadwal?per_page=${perPage}&pakid=20252`, { headers });
      const data = await response.json();
      
      let schedules = data.data?.data || data.data || [];
      if (Array.isArray(schedules)) {
          const activeSchedules = schedules.filter((s: any) => String(s.pakid) === "20252");
          if (data.data?.data) {
              data.data.data = activeSchedules;
          } else if (data.data) {
              data.data = activeSchedules;
          }
      }
      return data;
    } catch (error) {
      console.error('Fetch Jadwal Error:', error);
      throw error;
    }
  },

  getRuang: async (perPage = 500) => {
    try {
      const response = await fetch(`${BASE_URL}/ruang?per_page=${perPage}`, { headers });
      const data = await response.json();
      
      // Filter out inactive rooms globally so it applies to all screens
      let rooms = data.data?.data || data.data || [];
      if (Array.isArray(rooms)) {
        const activeRooms = rooms.filter((r: any) => r.ruangstatus === true || r.ruangstatus === 1 || String(r.ruangstatus) === "1" || String(r.status) === "active");
        
        if (data.data?.data) {
          data.data.data = activeRooms;
        } else if (data.data) {
          data.data = activeRooms;
        }
      }
      
      return data;
    } catch (error) {
      console.error('Fetch Ruang Error:', error);
      throw error;
    }
  },
};
