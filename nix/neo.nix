{
  lib,
  stdenvNoCC,
  callPackage,
  bun,
  bubblewrap,
  nodejs,
  sysctl,
  makeBinaryWrapper,
  models-dev,
  ripgrep,
  installShellFiles,
  versionCheckHook,
  writableTmpDirAsHomeHook,
  node_modules ? callPackage ./node-modules.nix { },
}:
stdenvNoCC.mkDerivation (finalAttrs: {
  pname = "neo";
  inherit (node_modules) version src;
  inherit node_modules;

  nativeBuildInputs = [
    bun
    nodejs # for patchShebangs node_modules
    installShellFiles
    makeBinaryWrapper
    models-dev
    writableTmpDirAsHomeHook
  ];

  configurePhase = ''
    runHook preConfigure

    cp -R ${finalAttrs.node_modules}/. .
    patchShebangs node_modules
    patchShebangs packages/*/node_modules

    runHook postConfigure
  '';

  env.MODELS_DEV_API_JSON = "${models-dev}/dist/_api.json";
  env.NEO_DISABLE_MODELS_FETCH = true;
  env.NEO_SKIP_BUNDLED_BWRAP = "1";
  env.NEO_VERSION = finalAttrs.version;
  env.NEO_CHANNEL = "local";

  buildPhase = ''
    runHook preBuild

    cd ./packages/opencode
    bun --bun ./script/build.ts --single --skip-install
    bun --bun ./script/schema.ts schema.json

    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall

    install -Dm755 dist/@neocode/cli-*/bin/neo $out/bin/neo
    install -Dm644 schema.json $out/share/neo/schema.json

    wrapProgram $out/bin/neo \
      ${lib.optionalString stdenvNoCC.hostPlatform.isLinux "--set NEO_BWRAP_PATH ${bubblewrap}/bin/bwrap"} \
      --prefix PATH : ${
        lib.makeBinPath (
          [
            ripgrep
          ]
          # bun runs sysctl to detect if running on rosetta2
          ++ lib.optional stdenvNoCC.hostPlatform.isDarwin sysctl
        )
      }

    runHook postInstall
  '';

  postInstall = lib.optionalString (stdenvNoCC.buildPlatform.canExecute stdenvNoCC.hostPlatform) ''
    # trick yargs into also generating zsh completions
    installShellCompletion --cmd neo \
      --bash <($out/bin/neo completion) \
      --zsh <(SHELL=/bin/zsh $out/bin/neo completion)
  '';

  nativeInstallCheckInputs = [
    versionCheckHook
    writableTmpDirAsHomeHook
  ];
  doInstallCheck = true;
  versionCheckKeepEnvironment = [
    "HOME"
    "NEO_DISABLE_MODELS_FETCH"
  ];
  versionCheckProgramArg = "--version";

  passthru = {
    jsonschema = "${placeholder "out"}/share/neo/schema.json";
  };

  meta = {
    description = "AI-powered development tool";
    homepage = "https://neo.khulnasoft.com/";
    license = [ lib.licenses.mit ] ++ lib.optional stdenvNoCC.hostPlatform.isLinux lib.licenses.lgpl2Plus;
    mainProgram = "neo";
    inherit (node_modules.meta) platforms;
  };
})
