import { BaseService } from "./BaseService";

export class AuthService extends BaseService {
  static async login(name: string, pass: string) {
    return this.request("/admin-melbu", {
      method: "POST",
      body: JSON.stringify({ name, pass }),
    });
  }
}
