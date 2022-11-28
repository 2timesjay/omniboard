import { Object3D, Event} from "three";
import { GridCoordinate } from "../../model/space";
import { ChainableAnimate, ChainableSteadyAnimation } from "../../view/animation";
import { _EntityDisplay, ILocatable, IPathable, _EntityDisplay3D } from "../../view/display";
import { IView2D, HitRect2D } from "../../view/rendering";
import { IView3D } from "../../view/rendering_three";
import { Box, Player } from "./climber_state";


class _PlayerDisplay extends _EntityDisplay3D implements ILocatable, IPathable {
    constructor(
        player: Player, 
    ) {
        super(player, {x: 0, y: 0, z: 0.6});
    }

    // TODO: Re-add alpha.
    render(view: IView3D, clr: string): THREE.Object3D {
        return super.render(view, 'darkblue')
    }

    alt_render(view: IView3D, clr: string): THREE.Object3D {
        return this.render(view, 'lightblue');
    }
}

// export class PlayerDisplay extends Animate(_PlayerDisplay, BaseAnimation) {};
export class PlayerDisplay extends ChainableAnimate(_PlayerDisplay, ChainableSteadyAnimation) {};

class _BoxDisplay extends _EntityDisplay3D implements ILocatable, IPathable {
    constructor(
        box: Box, 
    ) {
        super(box, {x: 0, y: 0, z: 0.6});
    }

    // TODO: Re-add alpha.
    render(view: IView3D, clr: string): THREE.Object3D {
        return super.render(view, 'brown')
    }

    alt_render(view: IView3D, clr: string): THREE.Object3D {
        return this.render(view, 'lightbrown');
    }
}

// export class BoxDisplay extends Animate(_BoxDisplay, BaseAnimation) {};
export class BoxDisplay extends ChainableAnimate(_BoxDisplay, ChainableSteadyAnimation) {};