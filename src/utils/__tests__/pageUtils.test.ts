import { findFileName } from "../pageUtils";

describe("findFileName", () => {
  const imageFiles = [
    "0000_cover.jpeg",
    "0001.JPG",
    "0002.png",
    "page_003.jpg",
    "page-004.png",
    "0005.JPG",
    "0070.jpg",
  ];

  it("should find file by filename when useFileName is true and match exists", () => {
    const result = findFileName("3", true, imageFiles);

    expect(result).toBe("page_003.jpg");
  });

  it("should find file by filename with dash when useFileName is true", () => {
    const result = findFileName("4", true, imageFiles);

    expect(result).toBe("page-004.png");
  });

  it("should return undefined when useFileName is true and no match", () => {
    const result = findFileName("10", true, imageFiles);

    expect(result).toBeUndefined();
  });

  it("should find file by index when useFileName is false and index is valid", () => {
    const result = findFileName("1", false, imageFiles);

    expect(result).toBe("0000_cover.jpeg");
  });

  it("should find file by index for higher numbers", () => {
    const result = findFileName("6", false, imageFiles);

    expect(result).toBe("0005.JPG");
  });

  it("should find file 0070.jpg", () => {
    const result = findFileName("70", true, imageFiles);

    expect(result).toBe("0070.jpg");
  });

  it("should return undefined when useFileName is false and index is out of bounds", () => {
    const result = findFileName("10", false, imageFiles);

    expect(result).toBeUndefined();
  });

  it("should return undefined when useFileName is false and pageNum is not a number", () => {
    const result = findFileName("abc", false, imageFiles);

    expect(result).toBeUndefined();
  });

  it("should return undefined when useFileName is false and pageNum is 0", () => {
    const result = findFileName("0", false, imageFiles);

    expect(result).toBeUndefined();
  });
});
