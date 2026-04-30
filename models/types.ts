export interface Room {
  ruangid: number;
  ruangket: string;
  ruangluas: number;
  ruanglantai: number;
  ruangkapasitas: number;
}

export interface Lecturer {
  dosid: string;
  dosnama: string;
  dosgelar: string;
}

export interface BorrowingRecord {
  id: string;
  dosen_id: string;
  dosen_name: string;
  ruang_id: number;
  ruang_name: string;
  tanggal: string;
  waktu_pinjam: string;
  waktu_kembali: string | null;
  status: 'Dipinjam' | 'Kembali';
  is_api_data?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
