/** The banner table stores one public media URL. Video is inferred only from a
 * conventional MP4 suffix; unknown URLs continue to be rendered as images. */
export function isCarouselVideoUrl(url: string | null | undefined) {
  return Boolean(url && /\.mp4(?:$|[?#])/i.test(url));
}
