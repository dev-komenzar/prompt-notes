# This file is generated — see src/generated/sprint_53/nixos/flake-generator.ts
# Run: node -e "require('./src/generated/sprint_53/nixos/flake-generator.js').writeFlakeNix()" to refresh.
{
  description = "A local note-taking app for AI prompts";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, rust-overlay, flake-utils }:
    flake-utils.lib.eachSystem [ "x86_64-linux" "aarch64-linux" ] (system:
      let
        overlays = [ (import rust-overlay) ];
        pkgs = import nixpkgs { inherit system overlays; };

        rustToolchain = pkgs.rust-bin.stable.latest.default.override {
          extensions = [ "rust-src" "rust-analyzer" ];
        };

        tauriSystemDeps = with pkgs; [
          pkg-config
          openssl
          openssl.dev
          webkitgtk_4_1
          gtk3
          glib-networking
          gdk-pixbuf
          librsvg
          libayatana-appindicator
          xdotool
        ];

        # Build the frontend assets (Svelte/Vite) before the Rust build
        frontendAssets = pkgs.buildNpmPackage {
          pname = "promptnotes-frontend";
          version = "0.1.0";
          src = self;
          npmDepsHash = ""; # fill in with nix-prefetch after first npm ci
          buildPhase = ''
            npm run build
          '';
          installPhase = ''
            mkdir -p $out
            cp -r dist $out/
          '';
        };

        promptnotes = pkgs.rustPlatform.buildRustPackage {
          pname = "promptnotes";
          version = "0.1.0";
          src = self;

          cargoLock = {
            lockFile = ./src-tauri/Cargo.lock;
          };

          # Point Tauri to pre-built frontend assets
          TAURI_FRONTEND_BUILD_DIR = "${frontendAssets}/dist";

          nativeBuildInputs = with pkgs; [
            pkg-config
            wrapGAppsHook
            gobject-introspection
          ];

          buildInputs = tauriSystemDeps;

          PKG_CONFIG_PATH = "${pkgs.openssl.dev}/lib/pkgconfig:${pkgs.glib.dev}/lib/pkgconfig:${pkgs.webkitgtk_4_1.dev}/lib/pkgconfig";
          WEBKIT_DISABLE_COMPOSITING_MODE = "1";
          GIO_MODULE_DIR = "${pkgs.glib-networking}/lib/gio/modules";

          buildAndTestSubdir = "src-tauri";

          postInstall = ''
            install -Dm644 \
              src-tauri/icons/128x128.png \
              $out/share/pixmaps/promptnotes.png

            install -Dm644 \
              packaging/linux/promptnotes.desktop \
              $out/share/applications/promptnotes.desktop
          '';

          meta = with pkgs.lib; {
            description = "A local note-taking app for AI prompts";
            homepage = "https://github.com/dev-komenzar/promptnotes";
            license = licenses.mit;
            maintainers = [];
            platforms = [ "x86_64-linux" "aarch64-linux" ];
          };
        };
      in
      {
        packages = {
          default = promptnotes;
          "promptnotes" = promptnotes;
        };

        # Development shell: `nix develop` or `direnv allow`
        devShells.default = pkgs.mkShell {
          buildInputs = tauriSystemDeps ++ [
            rustToolchain
            pkgs.nodejs_20
            pkgs.cargo-tauri
          ];

          PKG_CONFIG_PATH = "${pkgs.openssl.dev}/lib/pkgconfig:${pkgs.glib.dev}/lib/pkgconfig:${pkgs.webkitgtk_4_1.dev}/lib/pkgconfig";
          WEBKIT_DISABLE_COMPOSITING_MODE = "1";
          GIO_MODULE_DIR = "${pkgs.glib-networking}/lib/gio/modules";

          shellHook = ''
            echo "PromptNotes dev shell — run: cargo tauri dev"
          '';
        };

        # `nix run` support
        apps.default = flake-utils.lib.mkApp {
          drv = promptnotes;
          exePath = "/bin/promptnotes";
        };
      }
    );
}
