import { Platform } from "react-native";

export const BASE_URL = "https://admin-classroom.itats.ac.id/api/v1";
export const API_KEY = "UEjcau8DQBKsg76ySbDdWy5mRyx8vZNJvELhhY7xkhovLpWEfyBd1r4XMXDeGCe4";

export class BaseService {
  public static async request(path: string, options: any = {}) {
    const url = `${BASE_URL}${path}`;

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
        try {
          response = await fetch(url, { ...options, headers });
        } catch (corsError) {
          console.warn("[CORS] Direct fetch failed, trying proxy strategy...");
          const proxyUrl = `https://api.codetabs.com/v1/proxy/?url=${encodeURIComponent(url)}`;
          response = await fetch(proxyUrl, { ...options, headers });
        }
      } else {
        response = await fetch(url, { ...options, headers });
      }

      const json = await response.json();

      if (json.contents) {
        return JSON.parse(json.contents);
      }

      return json;
    } catch (error) {
      console.error(`[API ERROR] ${path}:`, error);
      throw error;
    }
  }

  public static async fetchAll(endpoint: string, params: string = "") {
    let allData: any[] = [];
    let currentPage = 1;
    let lastPage = 1;

    try {
      do {
        const separator = endpoint.includes("?") ? "&" : "?";
        const url = `${endpoint}${separator}${params}${params ? "&" : ""}page=${currentPage}&per_page=500`;
        const json = await this.request(url);

        if (json && json.success) {
          const pageData = json.data?.data || (Array.isArray(json.data) ? json.data : []);

          if (Array.isArray(pageData)) {
            allData = [...allData, ...pageData];
          }

          lastPage = json.data?.last_page || 1;
          console.log(`[API PAGINATION] ${endpoint}: Fetched page ${currentPage}/${lastPage}.`);
        } else {
          break;
        }
        currentPage++;
      } while (currentPage <= lastPage && currentPage <= 500);

      return allData;
    } catch (error) {
      console.error(`[API ERROR] fetchAll failed for ${endpoint}:`, error);
      return allData;
    }
  }
}
