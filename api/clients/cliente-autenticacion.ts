import type { ApiResult, LoginResponse } from "../models/documento";
import { ApiTransport } from "./transporte-api";

export class AuthClient {
  constructor(private readonly transport: ApiTransport) {}

  isAuthenticated(): boolean {
    return this.transport.hasToken();
  }

  async login(email: string, password: string): Promise<ApiResult<LoginResponse>> {
    const result = await this.transport.send<LoginResponse>("POST", "/api/auth/login", {
      body: { email, password },
      authorize: false,
      evidenceBody: { email, password: "[redacted]" }
    });
    if (result.status === 200 && result.body) this.transport.setToken(result.body.token);
    return result;
  }
}
