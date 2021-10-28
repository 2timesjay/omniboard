# Omniboard
An Engine

# Compile 
tsc --lib es2018 .\src\index.ts

.\src\index.ts -p [ tsify --noImplicitAny --target es6 ] > ./dist/bundle.js

# Test
node node_modules/tape/bin/tape math.test.ts

# Run
node app