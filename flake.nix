{
  description = "FuckingNode Package";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = { self, nixpkgs }:
  let
    linux_arm = "aarch64-linux";
    linux_x86 = "x86_64-linux";
    pname = "fuckingnode";
    version = "3.2.1";

    pkgs_arm = import nixpkgs {
      system = linux_arm;
    };

    pkgs_x86 = import nixpkgs {
      system = linux_x86;
    };

  in {
    packages = {
      ${linux_x86} = {
        default = pkgs_x86.stdenv.mkDerivation {
          inherit pname version;

          src = pkgs_x86.fetchurl {
            url = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-linux64";
            sha256 = "0ajrgpwa1dgvhp5nwq2rr9hk1mwjqpidfyhac8j8hh0xx84hpi8i";
          };

          phases = [ "installPhase" "fixupPhase" ];

          nativeBuildInputs = [ pkgs_x86.makeWrapper ];

          installPhase = ''
            mkdir -p $out
            mkdir $out/bin
            cp $src $out/bin/fuckingnode
          '';

          fixupPhase = ''
            chmod +w $out/bin/fuckingnode
            chmod +x $out/bin/fuckingnode
          '';

          meta = {
            mainProgram = "fuckingnode";
          };
        };
      };

      ${linux_arm} = {
        default = pkgs_arm.stdenv.mkDerivation {
          inherit pname version;

          src = pkgs_arm.fetchurl {
            url = "https://github.com/FuckingNode/FuckingNode/releases/download/${version}/FuckingNode-linux_arm";
            sha256 = "1mkf1kbbd1f5llsm610msfgjzwp8hnbihb2wl4aj8mfdgrwfrsch";
          };

          phases = [ "installPhase" "fixupPhase" ];

          nativeBuildInputs = [ pkgs_arm.makeWrapper ];

          installPhase = ''
            mkdir -p $out
            mkdir $out/bin
            cp $src $out/bin/fuckingnode
          '';

          fixupPhase = ''
            chmod +w $out/bin/fuckingnode
            chmod +x $out/bin/fuckingnode
          '';

          meta = {
            mainProgram = "fuckingnode";
          };
        };
      };
    };

    app = {
      ${linux_x86} = {
        default = {
          type = "app";
          program = "${self.packages.${linux_x86}.default}/bin/fuckingnode";
        };
      };
      ${linux_arm} = {
        default = {
          type = "app";
          program = "${self.packages.${linux_arm}.default}/bin/fuckingnode";
        };
      };
    };

    devShell = {
      ${linux_x86} = pkgs_x86.mkShell {
        buildInputs = [
          pkgs_x86.deno
        ];
      };
      ${linux_arm} = pkgs_arm.mkShell {
        buildInputs = [
          pkgs_arm.deno
        ];
      };
    };
  };
}

