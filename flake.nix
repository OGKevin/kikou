{
  description = "Nix flake to build Kikou as a package";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        packages.default = pkgs.rustPlatform.buildRustPackage (finalAttrs: rec {
          pname = "kikou";
          version = "0.1.0";

          src = ./.;

          cargoHash = "sha256-cOhWW/aKr7OQiryk6uyMgRWCXBNwkiLveIqVoDqjlt0=";

          pnpmDeps = pkgs.pnpm.fetchDeps {
            inherit (finalAttrs) pname version src;
            fetcherVersion = 2;
            hash = "sha256-8Jx51yXKl3NkAl8Fec+9XwUtjAqe3KjITUq6GNuYplk=";
          };

          nativeBuildInputs = [
            pkgs.cargo-tauri.hook

            pkgs.nodejs_22
            pkgs.pnpm.configHook

            pkgs.pkg-config
          ]
          ++ pkgs.lib.optionals pkgs.stdenv.hostPlatform.isLinux [ pkgs.wrapGAppsHook4 ];

          buildInputs = pkgs.lib.optionals pkgs.stdenv.hostPlatform.isLinux [
            pkgs.glib-networking
            pkgs.openssl
            pkgs.webkitgtk_4_1
          ];

          cargoRoot = "src-tauri";
          buildAndTestSubdir = cargoRoot;

          # installPhase = ''
          #   mkdir -p $out/bin
          #
          #   ls -l src-tauri
          #   ls -l src-tauri/target
          #   cp src-tauri/target/release/E-Book-Manager $out/bin/
          #   chmod +x $out/bin/E-Book-Manager
          # '';
          # postInstall = '''';

          meta = with pkgs.lib; {
            description = "Kikou";
            license = licenses.mit;
            maintainers = [ maintainers.OGKevin ];
          };
        });
      }
    );
}
