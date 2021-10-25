interface Selectable {};

type Stack = (Selectable | Array<Selectable>);

type Increment = (Stack) => Array<Selectable>;

type Options = Array<Selectable>;

declare function getOptions(sel: Selectable): Options;

interface Location {};

type Neighborhood = Array<Location>;

declare function getNeighborhood(loc: Location): Neighborhood;

// For efficient implementation, PreviewMap should _look_ like a Selectable: Stack map,
// but in fact the set of stacks should be stored as a single Tree.
// https://www.typescriptlang.org/docs/handbook/2/mapped-types.html doesn't work
// because it requires a string or number key. So actually Use Maps
// https://stackoverflow.com/questions/30019542/es6-map-in-typescript/30112075#30112075
type PreviewMap = Map<Selectable, Stack>;

declare function getOptionPreviewMap(stack: Stack, incr: Increment): PreviewMap;

declare function bfs(stack: Stack, incr: Increment): Options;

// State Stuff

interface State {};

// Implement as Callable for now
// https://www.typescriptlang.org/docs/handbook/2/functions.html#call-signatures
type Effect = {
    description: string;
    (state: State): State;
};

type Observer = {
    description: string;
    (effect: Effect): Array<Effect>;
};

// Time Stuff: Likely to be refactored.

interface Phase {};

interface TimePoint {};

type Timeline = Array<[TimePoint, Phase]>;
