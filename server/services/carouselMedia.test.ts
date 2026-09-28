import { describe, expect, it } from "vitest";
import { isCarouselVideoUrl } from "../../shared/carouselMedia";

describe("carousel media classification", () => {
  it("recognizes only conventional MP4 media URLs as video slides", () => {
    expect(isCarouselVideoUrl("https://cdn.example.test/atelier.mp4")).toBe(true);
    expect(isCarouselVideoUrl("https://cdn.example.test/atelier.mp4?v=1")).toBe(true);
    expect(isCarouselVideoUrl("https://cdn.example.test/atelier.webp")).toBe(false);
    expect(isCarouselVideoUrl("https://cdn.example.test/video.mp4-preview.jpg")).toBe(false);
  });
});
