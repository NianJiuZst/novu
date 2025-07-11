export enum VariableFrom {
  // variable coming from bubble menu (e.g. 'showIf')
  BUBBLE = 'bubble-variable',
  // variable coming from repeat block 'each' input
  REPEAT_EACH_KEY = 'repeat-variable',
  // all the other variables
  CONTENT = 'content-variable',
  // variables inside Button component
  BUTTON = 'button-variable',
}
