# Omniboard
An Engine

# Compile 
tsc --lib es2018 .\src\index.ts

.\src\index.ts -p [ tsify --noImplicitAny --target es6 ] > bundle.js

# Run

node app