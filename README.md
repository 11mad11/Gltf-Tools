# Installation

## Nix and direnv
```
sh <(curl -L https://nixos.org/nix/install) --no-daemon
source ~/.profile`
nix-env -iA direnv
echo "eval \"\$(direnv hook bash)\"" >> ~/.profile
source ~/.profile
```

## Repo
```
cd <project folder>
git clone https://github.com/11mad11/Gltf-Tools.git
cd Gltf-Tools/packages/server
npm i
```

# Run
```
cd <project folder>/Gltf-Tools/packages/server
npm run serve
```

# Update
```
cd <project folder>/Gltf-Tools
git reset --hard origin/master
cd packages/server
npm i
```