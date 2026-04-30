import { BaseService } from "./BaseService";

export class RoomService extends BaseService {
  static async getRuang() {
    try {
      const list = await this.fetchAll("/ruang");
      return { success: true, data: list };
    } catch (error) {
      return { success: false, data: [], message: "Gagal memuat data ruangan" };
    }
  }

  static async getJadwal() {
    try {
      const list = await this.fetchAll("/jadwal", "pakid=20252");
      return { success: true, data: list };
    } catch (error) {
      return { success: false, data: [] };
    }
  }
}
