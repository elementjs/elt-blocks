
import {Displayer, Observable, instanciate_verb} from 'elt'


export type BlockDefinition = () => Node | undefined | null


export interface BlockInstanciator<B extends Block> {
  new (b: BlockDefinition): B

}


export class Block {

  parent: Block | undefined

  static define<B extends Block>(this: BlockInstanciator<B>, def: BlockDefinition) {
    return new this(def)
  }

  constructor(public def: BlockDefinition) { }

  render(): Node | undefined | null {
    return this.def()
  }

}


export class BlockDisplayer extends Displayer {
  constructor(public app: App, public block: BlockInstanciator<Block>) {

    super(app.o_current_screen.tf(screen => {
      if (!screen)
      return null

      var b = screen.blocks.get(block)
      return b
    }).tf((b, prev_block) => {
      if (!b) return null
      return b.render()
    }))

  }
}


export class Screen {

  blocks: Map<BlockInstanciator<Block>, Block>

  extend(...blocks: Block[]) {
    var s = new Screen(...blocks)

    this.blocks.forEach((block, inst) => {
      var new_block = s.blocks.get(inst)
      if (new_block) {
        new_block.parent = block
      } else {
        // Add the missing block from the child
        s.blocks.set(inst, block)
      }
    })

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

  protected screens: {[name: string]: Screen} = {}
  o_current_screen: Observable<Screen | null> = new Observable(null)

  register(screen_name: string, screen: Screen) {
    this.screens[screen_name] = screen
  }

  setScreenName(name: string) {
    if (!this.screens[name])
      throw new Error(`no such screen "${name}"`)
    this.o_current_screen.set(this.screens[name])
  }

  setScreen(screen: Screen) {
    this.o_current_screen.set(screen)
  }

  displayBlock(block: BlockInstanciator<Block>) {
    return instanciate_verb(new BlockDisplayer(this, block))
  }

}
