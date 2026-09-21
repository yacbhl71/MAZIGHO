import { describe, expect, it } from "vitest";
import { isPayloadTooLargeError, JSON_BODY_LIMIT, URL_ENCODED_BODY_LIMIT } from "./requestLimits";

describe("request body limits", () => {
  it("keeps enough room for the largest base64 accounting document", () => {
    expect(JSON_BODY_LIMIT).toBe("16mb");
    expect(URL_ENCODED_BODY_LIMIT).toBe("1mb");
  });

  it("recognizes Express payload-size errors without swallowing other failures", () => {
    expect(isPayloadTooLargeError({ status: 413, type: "entity.too.large" })).toBe(true);
    expect(isPayloadTooLargeError({ statusCode: 413 })).toBe(true);
    expect(isPayloadTooLargeError({ status: 500 })).toBe(false);
    expect(isPayloadTooLargeError(null)).toBe(false);
  });
});
