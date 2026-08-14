import { AddStep, Context, Scene, SceneEnter, SceneLeave } from 'nestjs-vk';
import { IStepContext } from '@vk-io/scenes';

import { BestSceneContextState } from 'src/interfaces/best-scene-context-state';

// import { Context } from '../../interfaces/context.interface';

@Scene('BEST_SCEN')
export class BestScene {
  constructor() {
    console.log('[BestScene] ctr');
  }

  @SceneEnter()
  async onSceneEnter(ctx: IStepContext<BestSceneContextState>) {
    console.log(
      'Wait Enter to scene...',
      '| $groupId:',
      ctx.$groupId,
      '| peerId:',
      ctx.peerId,
      '| senderId:',
      ctx.senderId,
    );

    if (ctx.scene.step.firstTime) {
      ctx['api'].messages
        .setActivity({ type: 'typing', peer_id: ctx.peerId })
        .catch(console.error);
      await new Promise((r) => setTimeout(r, 5e3));
    }

    console.log('Enter to scene');
  }

  @SceneLeave()
  onSceneLeave(ctx: IStepContext<BestSceneContextState>) {
    console.log('Leave from scene', ctx.$groupId, ctx.peerId, ctx.senderId);
    ctx.send('scene done');
  }

  @AddStep(10)
  step10(@Context() context: IStepContext<BestSceneContextState>) {
    if (context.scene.step.firstTime || !context.text) {
      return context.send('any for exit or gg for repeat');
    }

    if (context.text === 'gg') {
      return context.scene.step.go(0);
    }

    return context.scene.step.next();
  }

  @AddStep() // 1
  step1(@Context() context: IStepContext<BestSceneContextState>) {
    if (context.scene.step.firstTime || !context.text) {
      return context.send("What's your name?");
    }

    context.scene.state.firstName = context.text;

    return context.scene.step.next();
  }

  @AddStep() // 2
  step2(@Context() context: IStepContext<BestSceneContextState>) {
    if (context.scene.step.firstTime || !context.text) {
      return context.send('How old are you?');
    }

    if (isNaN(+context.text)) {
      return context.send('Only numeric pls');
    }

    context.scene.state.age = context.text;

    return context.scene.step.next();
  }

  @AddStep() // 3
  async step3(@Context() context: IStepContext<BestSceneContextState>) {
    const { firstName, age } = context.scene.state;

    await context.send(`👤 ${firstName} ${age} ages`);

    return context.scene.step.next(); // Automatic exit, since this is the last scene
  }
}
