export enum ControlValuesLevelEnum {
  WORKFLOW_CONTROLS = 'workflow',
  STEP_CONTROLS = 'step',
}

export type VARIABLE_NAMESPACE = 'subscriber' | 'payload' | 'steps';

type RecursiveObject = {
  [key: string]: string | number | boolean | RecursiveObject;
};

export type Variables = Record<VARIABLE_NAMESPACE, RecursiveObject>;
