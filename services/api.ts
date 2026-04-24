import { Platform } from "react-native";

const BASE_URL = "https://admin-classroom.itats.ac.id/api/v1";
const API_KEY =
  "2PiwDTM6EIBkei4YH2LxAx0Hk6PzFCb8yefp2iys4GDJCgqOQ1uOwl4q86dy2eXw";

/**
 * REBUILD: Sistem API dengan Header sesuai instruksi user
 */
export const apiService = {
  // Fungsi utama untuk request data
  async request(path: string, options: any = {}) {
    const url = `${BASE_URL}${path}`;

    // Konfigurasi Header sesuai permintaan User
    const headers = {
      "X-API-Key": API_KEY,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    };

    console.log(`[API CALL] Requesting: ${url}`);

    try {
      let response;

      if (Platform.OS === "web") {
        // Pada Web, kita gunakan proxy jika direct fetch gagal karena CORS
        // Namun kita tetap kirim header X-API-Key
        try {
          response = await fetch(url, { ...options, headers });
        } catch (corsError) {
          console.warn("[CORS] Direct fetch failed, trying proxy strategy...");

          // Menggunakan Codetabs Proxy yang mendukung pelemparan header (transparan)
          const proxyUrl = `https://api.codetabs.com/v1/proxy/?url=${encodeURIComponent(url)}`;
          response = await fetch(proxyUrl, { ...options, headers });
        }
      } else {
        // Pada Mobile (Android/iOS), tidak ada masalah CORS
        response = await fetch(url, { ...options, headers });
      }

      const json = await response.json();

      // Jika response dibungkus oleh proxy (seperti AllOrigins /get), bongkar di sini
      if (json.contents) {
        return JSON.parse(json.contents);
      }

      return json;
    } catch (error) {
      console.error(`[API ERROR] ${path}:`, error);
      throw error;
    }
  },

  // LOGIN
  async login(nip: string, password: string) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ nip, password }),
    });
  },

  // Helper untuk mengambil semua halaman dari resource yang ter-paginasi
  async fetchAll(endpoint: string, params: string = "") {
    let allData: any[] = [];
    let currentPage = 1;
    let lastPage = 1;

    try {
      do {
        const separator = endpoint.includes("?") ? "&" : "?";
        // Gunakan per_page yang besar untuk meminimalkan jumlah request
        const url = `${endpoint}${separator}${params}${params ? "&" : ""}page=${currentPage}&per_page=500`;
        const json = await this.request(url);

        if (json && json.success) {
          // Struktur data ITATS biasanya di json.data.data (paginated) atau json.data (array)
          const pageData =
            json.data?.data || (Array.isArray(json.data) ? json.data : []);

          if (Array.isArray(pageData)) {
            allData = [...allData, ...pageData];
          }

          // Update lastPage dari metadata pagination
          lastPage = json.data?.last_page || 1;

          console.log(
            `[API PAGINATION] ${endpoint}: Fetched page ${currentPage}/${lastPage}. Total items so far: ${allData.length}`,
          );
        } else {
          break;
        }
        currentPage++;
      } while (currentPage <= lastPage && currentPage <= 500); // Safety limit 500 halaman (menghindari loop tak terbatas)

      return allData;
    } catch (error) {
      console.error(`[API ERROR] fetchAll failed for ${endpoint}:`, error);
      return allData;
    }
  },

  // DATA RUANGAN
  async getRuang() {
    try {
      const list = await this.fetchAll("/ruang");
      console.log(`[API SUCCESS] Total Rooms Fetched: ${list.length}`);
      return { success: true, data: list };
    } catch (error) {
      return { success: false, data: [], message: "Gagal memuat data ruangan" };
    }
  },

  // DATA JADWAL
  async getJadwal() {
    try {
      // Ambil jadwal sesuai pakid yang diminta user (20252)
      const list = await this.fetchAll("/jadwal", "pakid=20252");
      console.log(`[API SUCCESS] Total Schedules Fetched: ${list.length}`);
      return { success: true, data: list };
    } catch (error) {
      return { success: false, data: [] };
    }
  },

  // DATA DOSEN
  async getDosen() {
    try {
      const list = await this.fetchAll("/dosen");
      return { success: true, data: list };
    } catch (error) {
      return { success: false, data: [] };
    }
  },

  // State lokal dengan sinkronisasi ke Storage (Persistence)
  _localBorrowings: [] as any[],

  // Inisialisasi data dari storage jika di Web
  _initStorage() {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem("local_borrowings");
        if (saved) this._localBorrowings = JSON.parse(saved);
      } catch (e) {
        console.warn("[API] Failed to load from localStorage");
      }
    }
  },

  // DATA PEMINJAMAN DENGAN FILTER TANGGAL
  async getPeminjaman(tanggal?: string) {
    this._initStorage();

    try {
      const queryParam = tanggal ? `tanggal_pinjam=${tanggal}` : "";
      console.log(
        `[API] Fetching peminjaman records for date: ${tanggal || "All"}...`,
      );

      // Ambil data dari API ITATS dengan filter tanggal jika ada
      const list = await this.fetchAll("/peminjaman-ruang", queryParam);

      // Normalisasi data API agar sesuai dengan UI kita
      const normalizedApiData = (Array.isArray(list) ? list : []).map(
        (item: any) => ({
          id: String(item.id_peminjaman_ruang),
          dosen_id: item.dosid_peminjam,
          dosen_name: item.peminjam_dosen?.dosnama || "N/A",
          ruang_id: item.ruangid,
          ruang_name: item.ruang?.ruangket || "N/A",
          tanggal: item.tanggal_pinjam
            ? item.tanggal_pinjam.split("T")[0]
            : "-",
          waktu_pinjam: item.waktu_pinjam
            ? item.waktu_pinjam.split("T")[1]?.substring(0, 5)
            : "-",
          waktu_kembali: item.waktu_kembali
            ? item.waktu_kembali.split("T")[1]?.substring(0, 5)
            : null,
          status: item.waktu_kembali ? "Kembali" : "Dipinjam",
          is_api_data: true,
        }),
      );

      return { success: true, data: normalizedApiData };
    } catch (error) {
      console.error("[API ERROR] getPeminjaman failed:", error);
      return { success: false, data: [] };
    }
  },

  // SIMPAN PEMINJAMAN KE SERVER ITATS
  async savePeminjaman(data: any) {
    try {
      // Pemetaan data ke format API ITATS
      const payload = {
        dosid_peminjam: data.dosen_id,
        ruangid: data.ruang_id,
        // Gabungkan tanggal dan waktu menjadi YYYY-MM-DD HH:mm
        waktu_pinjam: `${data.tanggal} ${data.waktu_pinjam}`,
        dosid_input: "admin-mobile", // ID Admin penginput (Opsional)
      };

      console.log("[API] Saving to ITATS server:", payload);

      const response = await this.request("/peminjaman-ruang", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response && response.success) {
        console.log("[API SUCCESS] Peminjaman disimpan di server.");
        return { success: true, data: response.data };
      }

      return {
        success: false,
        message: response.message || "Gagal menyimpan ke server",
      };
    } catch (error) {
      console.error("[API ERROR] savePeminjaman failed:", error);
      throw error;
    }
  },

  // PENGEMBALIAN KUNCI KE SERVER ITATS
  async updateStatus(id: string, status?: string, waktu_kembali?: string) {
    try {
      console.log(`[API] Returning key for ID: ${id}`);

      const response = await this.request(
        `/peminjaman-ruang/${id}/return-key`,
        {
          method: "POST",
          body: JSON.stringify({
            dosid_input_kembali: "admin-mobile", // Petugas yang menerima kunci
          }),
        },
      );

      if (response && response.success) {
        console.log("[API SUCCESS] Kunci berhasil dikembalikan di server.");
        return { success: true };
      }

      return {
        success: false,
        message: response.message || "Gagal mengembalikan kunci",
      };
    } catch (error) {
      console.error("[API ERROR] updateStatus failed:", error);
      return { success: false };
    }
  },

  // UPDATE DATA PEMINJAMAN KE SERVER ITATS
  async updatePeminjaman(id: string, data: any) {
    try {
      const payload = {
        dosid_peminjam: data.dosen_id,
        ruangid: data.ruang_id,
        waktu_pinjam: `${data.tanggal} ${data.waktu_pinjam}`,
        waktu_kembali: data.waktu_kembali
          ? `${data.tanggal} ${data.waktu_kembali}`
          : null,
        dosid_input_kembali: data.waktu_kembali ? "admin-mobile" : null,
      };

      console.log(`[API] Updating record ${id}:`, payload);

      const response = await this.request(`/peminjaman-ruang/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      return response;
    } catch (error) {
      console.error("[API ERROR] updatePeminjaman failed:", error);
      throw error;
    }
  },
};
