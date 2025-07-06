import {
  PixelLabClient,
  Client,
  AuthenticationError,
  ValidationError,
} from "../src/index";
import { settings } from "../src/settings";

describe("PixelLabClient", () => {
  test("should create client from env file", () => {
    const client = PixelLabClient.fromEnvFile(".env.development.secrets");
    expect(client).toBeInstanceOf(PixelLabClient);
  });

  test("should create client with custom secret", () => {
    const client = new PixelLabClient("test-secret");
    expect(client).toBeInstanceOf(PixelLabClient);
  });

  test("should set correct headers", () => {
    const client = new PixelLabClient("test-secret");
    const headers = client.headers();

    expect(headers["Authorization"]).toBe("Bearer test-secret");
  });

  test("should export Client alias", () => {
    expect(Client).toBe(PixelLabClient);
  });

  test("should handle invalid credentials error", async () => {
    const config = settings(".env.development.secrets");
    const client = new PixelLabClient("invalid-secret", config.baseUrl);

    await expect(client.getBalance()).rejects.toThrow(AuthenticationError);
  });
});
