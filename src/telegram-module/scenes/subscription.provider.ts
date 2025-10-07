import { Scene, SceneEnter } from 'nestjs-telegraf';

@Scene('SUBSCRIPTION_SCENE_ID')
export class SubscriptionProvider {
  @SceneEnter()
  onSceneEnter() {
    return;
  }
}
