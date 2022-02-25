import { IStepContext } from '@vk-io/scenes';
import { Scene, AddStep, Context, SceneEnter, SceneLeave } from '../../../../../dist';
// import { Context } from '../../interfaces/context.interface';

@Scene('BEST_SCEN')
export class BestScene {
  constructor() {
    console.log('[BestScene] ctr');
  }

  @SceneEnter()
  async onSceneEnter() {
    console.log('Wait Enter to scene...');

    await new Promise((r) => setTimeout(r, 5e3));

    console.log('Enter to scene');
  }

  @SceneLeave()
  onSceneLeave() {
    console.log('Leave from scene');
  }

  @AddStep(10)
  step10(@Context() context: IStepContext) {
    if (context.scene.step.firstTime || !context.text) {
      return context.send('any for exit or gg for repeat');
    }

    if (context.text === 'gg') {
      return context.scene.step.go(0);
    }

    return context.scene.step.next();
  }

  @AddStep()
  step1(@Context() context: IStepContext) {
    if (context.scene.step.firstTime || !context.text) {
      return context.send("What's your name?");
    }

    context.scene.state.firstName = context.text;

    return context.scene.step.next();
  }

  @AddStep()
  step2(@Context() context: IStepContext) {
    if (context.scene.step.firstTime || !context.text) {
      return context.send('How old are you?');
    }

    context.scene.state.age = Number(context.text);

    return context.scene.step.next();
  }

  @AddStep()
  async step3(@Context() context: IStepContext) {
    const { firstName, age } = context.scene.state;

    await context.send(`👤 ${firstName} ${age} ages`);

    return context.scene.step.next(); // Automatic exit, since this is the last scene
  }
}
