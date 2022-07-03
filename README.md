# Omniboard
An Engine

# Compile 
~~browserify .\src\index.ts -p [ tsify --noImplicitAny --target es6 ] > ./dist/bundle.js~~
npm run start

# Test
ts-node node_modules/tape/bin/tape .\src\*\*\*.test.ts

# Run
node app

# Lint and Beautify
npx eslint .\src
npm prettier-format

# Other useful commands
tsc --lib es2018 .\src\index.ts
