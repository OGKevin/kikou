import React, { createContext, useContext, useRef, ReactNode } from "react";

interface BookCoverContextType {
    coverCache: React.RefObject<Record<number, string>>;
}

const BookCoverContext = createContext<BookCoverContextType | null>(null);

interface BookCoverProviderProps {
    children: ReactNode;
}

export function BookCoverProvider({
    children,
}: BookCoverProviderProps): React.ReactElement {
    const coverCache = useRef<Record<number, string>>({});

    return (
        <BookCoverContext.Provider value={{ coverCache }}>
            {children}
        </BookCoverContext.Provider>
    );
}

export function useBookCoverContext(): BookCoverContextType {
    const context = useContext(BookCoverContext);

    if (!context) {
        throw new Error(
            "useBookCoverContext must be used within BookCoverProvider",
        );
    }

    return context;
}
