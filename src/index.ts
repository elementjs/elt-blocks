
import {Displayer, Observable} from 'elt'


export type BlockDefinition = (parent: Node | undefined) => Node | undefined


export interface BlockInstanciator<B extends Block> {
  new (b: BlockDefinition): B

}


export class Block {

  parent: Block | undefined
  last_render: Node | undefined

  static define<B extends Block>(this: BlockInstanciator<B>, def: BlockDefinition) {
    return new this(def)
  }

  constructor(public def: BlockDefinition) { }

  render(parent?: Node): Node | undefined {
    if (!parent && this.parent) {
      parent = this.parent.render()
    }

    this.last_render = this.def(parent)
    return this.last_render
  }

}


export class BlockDisplayer extends Displayer {
  constructor(public app: App, public block: BlockInstanciator<Block>) {

    super(app.o_current_screen.tf((screen, prev_screen) => {
      if (!screen)
        return null

      var b = screen.blocks.get(block)
      if (!b) return null

      var sup: Node | undefined
      if (b.parent && prev_screen) {
        var prev_b = prev_screen.blocks.get(block)
        if (prev_b === b.parent) {
          // Reuse the node that was rendered in the previous screen.
          sup = prev_b.last_render
        }
      }

      return b.render(sup)
    }))

  }
}


export class Screen {

  blocks: Map<BlockInstanciator<Block>, Block>

  extend(...blocks: Block[]) {
    var s = new Screen(...blocks)
    for (var b of blocks) {
      b.parent = this.blocks.get(b.constructor as BlockInstanciator<Block>)
    }
    return s
  }

  constructor(...blocks: Block[]) {
    this.blocks = new Map()
    for (var b of blocks) {
      this.blocks.set(b.constructor as BlockInstanciator<Block>, b)
    }
  }

}


/**
 *
 */
export class App {

  o_current_screen: Observable<Screen | null> = new Observable(null)

  setScreen(screen: Screen) {
    this.o_current_screen.set(screen)
  }

  displayBlock(block: BlockInstanciator<Block>) {
    return BlockDisplayer.create(this, block)
  }

}