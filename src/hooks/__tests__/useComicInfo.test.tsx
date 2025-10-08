import { renderHook } from "@testing-library/react";
import { ArchiveProvider } from "@/contexts/ArchiveContext";
import { useComicInfo } from "@/hooks/useComicInfo";
import React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUseArchiveContext = jest.fn() as any;

jest.mock("@/contexts/ArchiveContext", () => ({
  useArchiveContext: () => mockUseArchiveContext(),
  ArchiveProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const mockArchiveResult = {
  image_files: ["page1.jpg", "page2.jpg"],
  comic_info: {
    Pages: [
      { Image: 0, Type: "Story", DoublePage: false, Bookmark: "" },
      { Image: 1, Type: "Story", DoublePage: true, Bookmark: "fav" },
    ],
  },
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <ArchiveProvider path="/tmp/test.cbz">{children}</ArchiveProvider>;
}

describe("useComicInfo", () => {
  it("parses comicInfo and returns correct parsedComicInfo", () => {
    mockUseArchiveContext.mockReturnValue({
      result: mockArchiveResult,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useComicInfo(), { wrapper });

    expect(Object.keys(result.current.parsedComicInfo)).toEqual([
      "page1.jpg",
      "page2.jpg",
    ]);
    expect(result.current.parsedComicInfo["page2.jpg"].DoublePage).toBe(true);
    expect(result.current.parsedComicInfo["page2.jpg"].Bookmark).toBe("fav");
  });

  it("parses comicInfo with @ attributes and object Pages", () => {
    const complexResult = {
      image_files: [
        "0000_cover.jpeg",
        "page_000.jpg",
        "page_001.jpg",
        "page_002.jpg",
        "page_003.jpg",
        "page_004.jpg",
        "page_005.jpg",
        "page_006.jpg",
        "page_007.jpg",
        "page_008.jpg",
      ],
      comic_info: {
        Title: "Spy X Family, Vol. 4",
        Series: "Spy X Family",
        Number: "4.0",
        Summary:
          "The Forgers look into adding a dog to their family, but this is no easy task—especially when Twilight has to simultaneously foil an assassination plot against a foreign minister! The perpetrators plan to use trained dogs for the attack, but Twilight gets some unexpected help to stop these terrorists. -- VIZ Media",
        Year: 2021,
        Month: 3,
        Day: 1,
        Writer: "Tatsuya Endo",
        Publisher: "VIZ Media",
        Tags: "Comics & Graphic Novels, Manga, General, Action & Adventure, Humorous, Supernatural, Crime & Mystery",
        PageCount: 193,
        LanguageISO: "en",
        Pages: {
          Page: [
            {
              "@Image": 0,
              "@Type": "FrontCover",
              "@Bookmark": "Cover",
            },
            {
              "@Image": 7,
              "@Type": "Story",
              "@Bookmark": "Table Of Contents",
            },
            {
              "@Image": 8,
              "@Type": "Story",
              "@Bookmark": "MISSION 1888",
            },
            {
              "@Image": 34,
              "@Type": "Story",
              "@Bookmark": "MISSION 19",
            },
            {
              "@Image": 56,
              "@Type": "Story",
              "@Bookmark": "MISSION 20",
            },
            {
              "@Image": 78,
              "@Type": "Story",
              "@Bookmark": "MISSION 21",
            },
            {
              "@Image": 110,
              "@Type": "Story",
              "@Bookmark": "MISSION 22",
            },
            {
              "@Image": 138,
              "@Type": "Story",
              "@Bookmark": "MISSION 23",
            },
            {
              "@Image": 162,
              "@Type": "Story",
              "@Bookmark": "SHORT MISSION 1",
            },
            {
              "@Image": 172,
              "@Type": "Story",
              "@Bookmark": "SHORT MISSION 2",
            },
          ],
        },
        GTIN: "9781974726240",
      },
      error: null,
    };

    mockUseArchiveContext.mockReturnValue({
      result: complexResult,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useComicInfo(), { wrapper });

    expect(result.current.parsedComicInfo["0000_cover.jpeg"].Type).toBe(
      "FrontCover",
    );
    expect(result.current.parsedComicInfo["0000_cover.jpeg"].Bookmark).toBe(
      "Cover",
    );
    expect(result.current.parsedComicInfo["page_006.jpg"].Bookmark).toBe(
      "Table Of Contents",
    );
    expect(result.current.parsedComicInfo["page_007.jpg"].Bookmark).toBe(
      "MISSION 1888",
    );
    // Check that pages without info are blank
    expect(result.current.parsedComicInfo["page_000.jpg"].Type).toBe("Unknown");
    expect(result.current.parsedComicInfo["page_000.jpg"].Bookmark).toBe("");
  });
});
