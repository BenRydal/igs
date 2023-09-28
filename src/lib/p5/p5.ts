import { writable, get } from 'svelte/store';
import type { Writable } from 'svelte/store';

import {
  SetPathData,
} from '../../lib';
import type { User } from '../../models/user';

type P5InstanceType = any;

export const P5Store: Writable<P5InstanceType | null> = writable(null);

let p5Instance: P5InstanceType | null = null;

// Subscription to the P5Store
P5Store.subscribe((value: P5InstanceType | null) => {
  p5Instance = value;
});

export const visualizeData = (users: User[]): void => {
  if (!p5Instance) {
    console.log('p5Instance is not available in visualizeData()');
    return;
  }

  const floorPlanImg = p5Instance.floorPlan.getImg();
  if (floorPlanImg != null) {
    p5Instance.floorPlan.setFloorPlan(p5Instance.gui.fpContainer.getContainer());
    if (p5Instance.arrayIsLoaded(users)) {
      const setPathData = new SetPathData(p5Instance, p5Instance.core.codeList);
      if (p5Instance.arrayIsLoaded(users)) {
        setPathData.setMovementAndConversation(users);
      }
    }
  }

  p5Instance.videoController.updateDisplay();
};
