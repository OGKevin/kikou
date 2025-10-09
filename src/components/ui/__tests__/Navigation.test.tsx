import { render, screen, fireEvent } from "@testing-library/react";
import Navigation from "../Navigation";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

describe("Navigation", () => {
  it("renders app title and theme button", () => {
    render(
      <ThemeProvider>
        <NavigationProvider>
          <Navigation />
        </NavigationProvider>
      </ThemeProvider>,
    );
    expect(screen.getByText("Kikou")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Light|Dark/i }),
    ).toBeInTheDocument();
  });

  it("opens drawer when menu button is clicked", () => {
    render(
      <ThemeProvider>
        <NavigationProvider>
          <Navigation />
        </NavigationProvider>
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "☰" }));
    expect(screen.getByRole("presentation")).toBeInTheDocument();
  });
});
