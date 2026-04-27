# Hand-maintained Nix flake for PromptNotes dev shell + reproducible build.
# (旧コメントにあった src/generated/sprint_53/nixos/flake-generator.ts は失われており、
# このファイルが現在の真実。CoDD で設計書を更新する場合は併せて手で追従する。)
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
          gsettings-desktop-schemas
          gdk-pixbuf
          librsvg
          libayatana-appindicator
          xdotool
        ];

        # GSettings schema dirs required by GTK FileChooser at runtime
        # (cargo tauri dev は wrapGAppsHook を通らないので XDG_DATA_DIRS だけでは
        # 子プロセスへ伝搬しないことがあるため GSETTINGS_SCHEMA_DIR で直接指定する)
        gsettingsSchemaDir = pkgs.lib.concatStringsSep ":" [
          "${pkgs.gtk3}/share/gsettings-schemas/${pkgs.gtk3.name}/glib-2.0/schemas"
          "${pkgs.gsettings-desktop-schemas}/share/gsettings-schemas/${pkgs.gsettings-desktop-schemas.name}/glib-2.0/schemas"
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

        tauri-driver = pkgs.rustPlatform.buildRustPackage rec {
          pname = "tauri-driver";
          version = "2.0.5";
          src = pkgs.fetchFromGitHub {
            owner = "tauri-apps";
            repo = "tauri";
            rev = "tauri-driver-v${version}";
            hash = "sha256-6QTFq7v1BmBJ4KNPkek02VQQdaSIMpcuYk/aC/hQu/o=";
          };
          cargoHash = "sha256-zeeEvSKACQPzK0B8u1uODP+m2EAlFtk73WwkYp/ggg4=";
          buildAndTestSubdir = "crates/tauri-driver";
          meta = with pkgs.lib; {
            description = "WebDriver server for Tauri applications";
            license = licenses.asl20;
          };
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
          GSETTINGS_SCHEMA_DIR = gsettingsSchemaDir;

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
            # E2E testing: WebKitWebDriver is in webkitgtk_4_1
            pkgs.xvfb-run
            tauri-driver
          ];

          PKG_CONFIG_PATH = "${pkgs.openssl.dev}/lib/pkgconfig:${pkgs.glib.dev}/lib/pkgconfig:${pkgs.webkitgtk_4_1.dev}/lib/pkgconfig";
          WEBKIT_DISABLE_COMPOSITING_MODE = "1";
          GIO_MODULE_DIR = "${pkgs.glib-networking}/lib/gio/modules";
          GSETTINGS_SCHEMA_DIR = gsettingsSchemaDir;

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
