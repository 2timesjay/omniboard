interface Selectable {};

type ContextStack = (Selectable | Array<Selectable>);

// Hole here: Increment has no state, so a bfs must 
// specify a fixed depth or globally control stopping.
type Increment = (stack: ContextStack) => Array<Selectable>;

type Options = Array<Selectable>;

declare function getOptions(sel: Selectable): Options;

// For efficient implementation, PreviewMap should _look_ like a Selectable: ContextStack map,
// but in fact the set of stacks should be stored as a single Tree.
// https://www.typescriptlang.org/docs/handbook/2/mapped-types.html doesn't work
// because it requires a string or number key. So actually Use Maps
// https://stackoverflow.com/questions/30019542/es6-map-in-typescript/30112075#30112075
type PreviewMap = Map<Selectable, ContextStack>;

declare function getOptionPreviewMap(stack: ContextStack, incr: Increment): PreviewMap;

declare function bfs(stack: ContextStack, incr: Increment): Options;

declare function bfsPreviewable(stack: ContextStack, incr: Increment): PreviewMap;

// State Stuff

interface State {};

// Implement as Callable for now
// https://www.typescriptlang.org/docs/handbook/2/functions.html#call-signatures
type Effect = {
    description: string;
    pre_effect: Observer;
    post_effect: Observer;
    (state: State): State;
};

type Observer = {
    description: string;
    (effect: Effect, state: State): Array<Effect>;
};

type EffectStack = Array<Effect>; // Replace Array with a custom Stack datastructure?

// Input Stuff

type OptionsGenerator = (args: any[]) => Options; // ...args?

type PreviewableOptionsGenerator = (args: any[]) => PreviewMap; // ...args?

interface InputAcquisition {
    getAcquisitionSequence: (stack: ContextStack) => Array<OptionsGenerator>;
    acquireInputs: (acquisition_sequence: Array<OptionsGenerator>) => ContextStack;
};

type EffectGenerator = (stack: ContextStack) => Effect

// Time Stuff: Likely to be refactored.

interface Phase {};

interface TimePoint {};

type Timeline = Array<[TimePoint, Phase]>;

// Space Stuff

interface AbstractLocation {};

interface AbstractDiscreteLocation extends AbstractLocation {};

export interface AbstractGridLocation extends AbstractDiscreteLocation {};

interface AbstractSpace {};

interface AbstractDiscreteSpace extends AbstractSpace {};

export interface AbstractGridSpace extends AbstractSpace {};

// export declare function getNeighborhood(rel_ne: RelativeNeighborhood, loc: GridLocation): Neighborhood;

// Card Stuff

interface Card {};

interface Hand {
    cards: Array<Card>;
}

interface Deck {
    cards: Array<Card>;
    draw: () => Card; // Draw
    shuffle: () => void; // Shuffle
};