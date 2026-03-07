// Timeline Visual PNG Export

export async function captureTimelineAsPNG(
  element: HTMLElement,
  scale = 2
): Promise<Blob> {
  const { default: html2canvas } = await import("html2canvas");

  const bgColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--background")
    .trim();

  const canvas = await html2canvas(element, {
    scale,
    backgroundColor: bgColor ? `hsl(${bgColor})` : "#09090b",
    logging: false,
    useCORS: true,
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      "image/png"
    );
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
