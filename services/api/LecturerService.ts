import { BaseService } from "./BaseService";

export class LecturerService extends BaseService {
  static async getDosen() {
    try {
      const list = await this.fetchAll("/dosen");
      return { success: true, data: list };
    } catch (error) {
      return { success: false, data: [] };
    }
  }
}
