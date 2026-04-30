import { AuthService } from "./api/AuthService";
import { RoomService } from "./api/RoomService";
import { LecturerService } from "./api/LecturerService";
import { BorrowingService } from "./api/BorrowingService";
import { BaseService } from "./api/BaseService";

/**
 * REBUILD: API Facade
 * Mempertahankan interface lama agar program tidak error, 
 * namun logika di dalamnya sudah dipisah per-class.
 */
export const apiService = {
  // Base Methods
  request: BaseService.request.bind(BaseService),
  fetchAll: BaseService.fetchAll.bind(BaseService),

  // Auth
  login: AuthService.login.bind(AuthService),

  // Ruang & Jadwal
  getRuang: RoomService.getRuang.bind(RoomService),
  getJadwal: RoomService.getJadwal.bind(RoomService),

  // Dosen
  getDosen: LecturerService.getDosen.bind(LecturerService),

  // Peminjaman
  getPeminjaman: BorrowingService.getPeminjaman.bind(BorrowingService),
  savePeminjaman: BorrowingService.savePeminjaman.bind(BorrowingService),
  updateStatus: BorrowingService.updateStatus.bind(BorrowingService),
  updatePeminjaman: BorrowingService.updatePeminjaman.bind(BorrowingService),
};

// Export individual classes for future direct usage
export {
  AuthService,
  RoomService,
  LecturerService,
  BorrowingService,
  BaseService
};
