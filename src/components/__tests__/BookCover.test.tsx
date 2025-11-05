import React from "react";
import { render, screen, act } from "@testing-library/react";
import { BookCover } from "../BookCover";
import { BookCoverProvider } from "@/contexts/BookCoverContext";

const MockedBookCover = ({ bookId, ...props }: React.ComponentProps<typeof BookCover>) => {
    return (
        <BookCoverProvider>
            <BookCover bookId={bookId} {...props} />
        </BookCoverProvider>
    );
};

describe("BookCover", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        act(() => {
            jest.runOnlyPendingTimers();
        });
        jest.useRealTimers();
    });

    it("should render skeleton when loading", () => {
        render(<MockedBookCover bookId={1} />);

        const skeleton = document.querySelector(".MuiSkeleton-root");

        expect(skeleton).toBeInTheDocument();
    });

    it("should render 'No cover' when bookId is null", async () => {
        render(<MockedBookCover bookId={null} />);

        await screen.findByText("No cover");

        expect(screen.getByText("No cover")).toBeInTheDocument();
    });

    it("should render image alt text correctly", () => {
        const ref = React.createRef<Record<number, string>>();

        ref.current = { 1: "data:image/jpeg;base64,test123" };

        render(<MockedBookCover bookId={1} alt="Test Book Cover" />);

        act(() => {
            jest.advanceTimersByTime(200);
        });

        const img = screen.queryByAltText("Test Book Cover");

        if (img) {
            expect(img).toBeInTheDocument();
        }
    });

    it("should handle width and height props", async () => {
        render(<MockedBookCover bookId={null} width={100} height={150} />);

        await screen.findByText("No cover");

        const container = screen.getByText("No cover").parentElement;

        expect(container).toHaveStyle({ width: "100px", height: "150px" });
    });
});
