import { Platform } from "react-native";
import { BaseService } from "./BaseService";
import { storage } from "@/utils/storage";

export class BorrowingService extends BaseService {
  private static _localBorrowings: any[] = [];

  private static async _getLoggedInAdminId() {
    try {
      const savedUser = await storage.getItem("user_data");
      if (savedUser) {
        const user = JSON.parse(savedUser);
        // Prioritaskan dosid (untuk admin), nip, atau name
        return user.dosid || user.nip || user.name || user.id;
      }
    } catch (e) {
      console.warn("[API] Gagal mengambil user_data dari storage");
    }
    return null;
  }

  static async getPeminjaman(tanggal?: string) {
    try {
      const queryParam = tanggal ? `tanggal_pinjam=${tanggal}` : "";
      const list = await this.fetchAll("/peminjaman-ruang", queryParam);

      const normalizedApiData = (Array.isArray(list) ? list : []).map((item: any) => ({
        id: String(item.id_peminjaman_ruang),
        dosen_id: item.dosid_peminjam,
        dosen_name: item.peminjam_dosen?.dosnama || "N/A",
        ruang_id: item.ruangid,
        ruang_name: item.ruang?.ruangket || "N/A",
        tanggal: item.tanggal_pinjam ? item.tanggal_pinjam.split("T")[0] : "-",
        waktu_pinjam: item.waktu_pinjam ? item.waktu_pinjam.split("T")[1]?.substring(0, 5) : "-",
        waktu_kembali: item.waktu_kembali ? item.waktu_kembali.split("T")[1]?.substring(0, 5) : null,
        status: item.waktu_kembali ? "Kembali" : "Dipinjam",
        is_api_data: true,
      }));

      return { success: true, data: normalizedApiData };
    } catch (error) {
      return { success: false, data: [] };
    }
  }

  static async savePeminjaman(data: any) {
    const adminId = data.admin_id || await this._getLoggedInAdminId();
    try {
      const payload = {
        dosid_peminjam: data.dosen_id,
        ruangid: data.ruang_id,
        waktu_pinjam: `${data.tanggal} ${data.waktu_pinjam}`,
        dosid_input: adminId,
      };

      const response = await this.request("/peminjaman-ruang", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response && response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message || "Gagal menyimpan ke server" };
    } catch (error) {
      throw error;
    }
  }

  static async updateStatus(id: string, status?: string, waktu_kembali?: string) {
    const adminId = await this._getLoggedInAdminId();
    try {
      const response = await this.request(`/peminjaman-ruang/${id}/return-key`, {
        method: "POST",
        body: JSON.stringify({ dosid_input_kembali: adminId }),
      });

      if (response && response.success) {
        return { success: true };
      }
      return { success: false, message: response.message || "Gagal mengembalikan kunci" };
    } catch (error) {
      return { success: false };
    }
  }

  static async updatePeminjaman(id: string, data: any) {
    const adminId = await this._getLoggedInAdminId();
    try {
      const payload = {
        dosid_peminjam: data.dosen_id,
        ruangid: data.ruang_id,
        waktu_pinjam: `${data.tanggal} ${data.waktu_pinjam}`,
        waktu_kembali: data.waktu_kembali ? `${data.tanggal} ${data.waktu_kembali}` : null,
        dosid_input_kembali: data.waktu_kembali ? adminId : null,
      };

      return await this.request(`/peminjaman-ruang/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      throw error;
    }
  }
}
