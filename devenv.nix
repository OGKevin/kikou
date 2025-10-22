{ pkgs, ... }:
{
  env = {
    RUST_LOG = "debug";
  };

  packages = with pkgs; [
    # Core build tooling
    pkg-config
    gobject-introspection
    cargo-tauri

    # GTK / WebKit stack
    gtk3
    webkitgtk_4_1
    libsoup_3
    glib
    gdk-pixbuf
    pango
    harfbuzz
    cairo
    librsvg
    atk # (still useful; at-spi2-core relies on it)
    at-spi2-core
    openssl

    # Wayland + input
    wayland
    wayland-protocols
    libxkbcommon

    # X11 fallback (optional but good to have)
    xorg.libX11
    xorg.libXcursor
    xorg.libXrandr
    xorg.libXi
    xorg.libXtst

    # D-Bus / desktop integration
    dbus
    xdg-utils
  ];

  languages.rust = {
    enable = true;
    channel = "stable";
    version = "1.86.0";
    components = [
      "clippy"
      "rustfmt"
      "cargo"
      "rustc"
      "rust-analyzer"
      "rust-src"
    ];
  };

  languages.javascript = {
    enable = true;
    pnpm.enable = true;
    npm.enable = true;
  };

  scripts.build-app.exec = "cargo tauri build";
  scripts.dev-app.exec = "cargo tauri dev";
  scripts.create-test-cbz.exec = "cd src-tauri && cargo run --bin create_test_cbz";
  scripts.create-test-missing-comicinfo.exec = "cd src-tauri && cargo run --bin create_test_missing_comicinfo";
  scripts.test-app.exec = "jest && cargo test --manifest-path ./src-tauri/Cargo.toml";

  enterShell = ''
    export XDG_DATA_DIRS=${pkgs.gsettings-desktop-schemas}/share/gsettings-schemas/${pkgs.gsettings-desktop-schemas.name}:${pkgs.gtk3}/share/gsettings-schemas/${pkgs.gtk3.name}:$XDG_DATA_DIRS;
    export GIO_MODULE_DIR="${pkgs.glib-networking}/lib/gio/modules/";
  '';

  enterTest = ''
    eslint src
    pnpm test
    pnpm run build
    cargo test --manifest-path ./src-tauri/Cargo.toml
    cargo check --manifest-path ./src-tauri/Cargo.toml 
    cargo build --manifest-path ./src-tauri/Cargo.toml
    nix build
  '';

  devcontainer.enable = true;

  git-hooks.hooks = {
    rustfmt = {
      enable = true;
      settings = {
        manifest-path = "./src-tauri/Cargo.toml";
      };
    };
    clippy = {
      enable = true;
      settings = {
        extraArgs = "--manifest-path ./src-tauri/Cargo.toml";
      };
    };
    prettier.enable = true;
    # eslint.enable = true;
  };
}
