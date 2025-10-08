export const findFileName = (
  pageNum: string,
  useFileName: boolean,
  imageFiles: string[],
): string | undefined => {
  if (useFileName) {
    const regex = new RegExp(`(page[_-]?)?0*${pageNum}\\.[a-zA-Z0-9]+$`, "i");

    return imageFiles.find((f) => regex.test(f));
  }

  const pageIndex = parseInt(pageNum) - 1; // Convert to 0-based index

  if (pageIndex >= 0 && pageIndex < imageFiles.length) {
    return imageFiles[pageIndex];
  }

  return undefined;
};
